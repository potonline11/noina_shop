/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(process.cwd(), 'products_store.json');

// Helper functions for parsing Google Sheets CSV on the server
function getCleanSheetUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  }
  return trimmed;
}

function parseCSVLine(line: string, separator: string): string[] {
  const cells = [];
  let currentCell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
  return cells;
}

function parseCSV(text: string): any[] {
  if (!text) return [];
  
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length === 0) return [];

  // Determine separator from first line
  const firstLine = lines[0] || '';
  const separator = firstLine.includes('\t') ? '\t' : ',';

  // Find headers
  const headerCells = parseCSVLine(firstLine, separator);
  const colMap: { [key: string]: number } = {};
  
  headerCells.forEach((cell, idx) => {
    const clean = cell.toLowerCase().trim().replace(/[^a-z]/g, '');
    if (clean.includes('title') || clean.includes('name')) colMap['name'] = idx;
    else if (clean.includes('description') || clean.includes('desc')) colMap['description'] = idx;
    else if (clean.includes('price')) colMap['price'] = idx;
    else if (clean.includes('bv')) colMap['bv'] = idx;
    else if (clean.includes('image') || clean.includes('img')) colMap['image'] = idx;
    else if (clean.includes('category')) colMap['category'] = idx;
    else if (clean.includes('brand')) colMap['brand'] = idx;
    else if (clean.includes('condition') || clean.includes('quality')) colMap['condition'] = idx;
    else if (clean.includes('stock')) colMap['stock'] = idx;
  });

  // Fallback defaults
  if (colMap['name'] === undefined) colMap['name'] = 0;
  if (colMap['description'] === undefined) colMap['description'] = 1;
  if (colMap['price'] === undefined) colMap['price'] = 2;
  if (colMap['bv'] === undefined) colMap['bv'] = 3;
  if (colMap['image'] === undefined) colMap['image'] = 4;
  if (colMap['category'] === undefined) colMap['category'] = 5;
  if (colMap['brand'] === undefined) colMap['brand'] = 6;
  if (colMap['condition'] === undefined) colMap['condition'] = 7;
  if (colMap['stock'] === undefined) colMap['stock'] = 8;

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = parseCSVLine(line, separator);
    if (cells.length === 0) continue;
    if (cells.every(c => !c)) continue;

    const name = cells[colMap['name']] || '';
    if (!name || name.toLowerCase() === 'title' || name.toLowerCase() === 'name') continue;

    const priceVal = cells[colMap['price']] ? parseFloat(cells[colMap['price']].replace(/[^0-9.]/g, '')) : 0;
    const bvVal = cells[colMap['bv']] ? parseFloat(cells[colMap['bv']].replace(/[^0-9.]/g, '')) : Math.round(priceVal * 0.1);

    results.push({
      id: `sheet-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
      name: name,
      description: cells[colMap['description']] || 'สินค้าดึงข้อมูลจาก Google Sheet สำเร็จ',
      price: isNaN(priceVal) ? 0 : priceVal,
      bv: isNaN(bvVal) ? 0 : bvVal,
      image: cells[colMap['image']] || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
      category: (cells[colMap['category']] || 'accessory').toLowerCase(),
      brand: cells[colMap['brand']] || 'แบรนด์มือสอง',
      condition: cells[colMap['condition']] || '95% สภาพดี',
      stock: cells[colMap['stock']] ? parseInt(cells[colMap['stock']].replace(/[^0-9]/g, '')) || 5 : 5,
      source: 'googlesheet'
    });
  }
  return results;
}

async function readStore() {
  try {
    const data = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      sheetUrl: parsed.sheetUrl || '',
      webhookUrl: parsed.webhookUrl || '',
      products: parsed.products || [],
      members: parsed.members || []
    };
  } catch (error) {
    return { sheetUrl: '', webhookUrl: '', products: [], members: [] };
  }
}

async function writeStore(data: any) {
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // API Route: AI Support Chatbot using @google/genai
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [], products = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'กรุณาระบุข้อความ' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Error: GEMINI_API_KEY is not defined in environment variables.');
        return res.status(500).json({ 
          error: 'ระบบยังไม่ได้ตั้งค่าคีย์สำหรับการใช้งาน AI (GEMINI_API_KEY Missing). โปรดเข้าไปตั้งค่าในแผงควบคุม Secrets ของ AI Studio' 
        });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare products catalog for Gemini context
      const productsContext = products.map((p: any) => {
        return `- ID: ${p.id || 'N/A'}\n  ชื่อ: ${p.name}\n  แบรนด์: ${p.brand || 'N/A'}\n  หมวดหมู่: ${p.category || 'N/A'}\n  ราคา: ${p.price.toLocaleString()} บาท\n  คะแนนสะสม: +${p.bv} BV\n  สภาพ: ${p.condition || 'มือสองสภาพดี'}\n  รายละเอียด: ${p.description || ''}`;
      }).join('\n\n');

      // System instruction setting up the Noinashop NLM business rules, ranks, and catalog
      const systemInstruction = `คุณคือ "Noina AI Support" ผู้ช่วยแชทอัจฉริยะระบบเครือข่าย NLM (Noina Line Marketing) สำหรับร้าน Noinashop ซึ่งเป็นร้านขายโทรศัพท์มือถือ โน๊ตบุ๊ค และอุปกรณ์ไอทีมือสองคัดเกรดพรีเมียม

ภารกิจของคุณคือช่วยเหลือลูกค้าใน 2 ด้านหลัก:
1. แนะนำสินค้าโทรศัพท์มือถือ โน๊ตบุ๊ค และแท็บเล็ตมือสองที่อยู่ภายในร้าน พร้อมชูจุดเด่นเรื่องราคาและคะแนนสะสม BV (คะแนนธุรกิจ)
2. อธิบายและคำนวณแผนปันผลเครือข่าย NLM (Noina Line Marketing) อย่างโปร่งใสและเข้าใจง่ายที่สุด

---
ข้อมูลและกฎของระบบเครือข่าย NLM (Noina Line Marketing):
- เจ้าของร้านและผู้ก่อตั้งคือ: คุณไวพจน์ โสมภา (เบอร์โทร 081-160-1092)
- ช่องทางรับโอนเงินชำระค่าสินค้า (พร้อมเพย์): คุณไวพจน์ โสมภา 081-160-1092

- โครงสร้างสายงาน: เป็นแบบไบนารี (Binary System) วางติดตัวได้สูงสุด 2 สายงานคือ ทีมฝั่งซ้าย (Left Downline) และทีมฝั่งขวา (Right Downline) คนที่ 3 เป็นต้นไปต้องโยน (Spillover) ลงไปข้างล่าง

- 3 ช่องทางหลักสร้างรายได้:
  1) โบนัสค่าแนะนำตรง (Sponsor Bonus): รับโบนัสเงินสด 100% ของคะแนน BV จากยอดการซื้อของสมาชิกที่เราแนะนำตรง เช่น ถ้าดาวน์ไลน์แนะนำตรงซื้อเครื่อง 1,000 BV เราได้ 1,000 บาททันที!
  2) โบนัสจับคู่จ่ายสายงาน (Binary Matching Bonus): คำนวณเป็นสัปดาห์ คิดโบนัสเป็นเปอร์เซ็นต์ (40% - 60% ตามตำแหน่งของคุณ) ของคะแนนฝั่งที่น้อยกว่า (Weak Side / ข้างอ่อน) ส่วนคะแนนฝั่งแข็ง (Strong Side / ข้างแข็ง) ที่เหลือจากการจับคู่ จะไม่มีการล้างทิ้ง แต่จะถูกสะสมยกยอดไปคำนวณต่อในสัปดาห์ถัดไป
  3) โบนัสผู้บริหารองค์กร (Leadership Matching / Pool Bonus): สิทธิพิเศษสำหรับตำแหน่งระดับ Gold ขึ้นไป ได้รับส่วนแบ่งปันผลจากยอดขาย All Sale ทั่วโลกของบริษัท 2% - 5% (Gold 2%, Platinum 3%, Diamond 5%)

- ตำแหน่งทางธุรกิจ (Membership Ranks) และเงื่อนไขคะแนนสะสมส่วนตัว (Personal Accumulated BV):
  * Bronze: สะสม 0 BV (สมัครสมาชิกทั่วไปฟรีก็เป็นระดับนี้ทันที) -> รับสิทธิ์โบนัสแนะนำ 100% | จับคู่ขาล่าง 40%
  * Silver: สะสมครบ 1,500 BV จากการช็อปสินค้า -> รับสิทธิ์โบนัสแนะนำ 100% | จับคู่ขาล่าง 50% | โบนัสแมทชิ่งรายได้ทีมงาน 1 ชั้น
  * Gold: สะสมครบ 3,000 BV จากการช็อปสินค้า -> รับสิทธิ์โบนัสแนะนำ 100% | จับคู่ขาล่าง 60% | แมทชิ่ง 2 ชั้น | ยอดแชร์ All Sale ทั่วระบบ 2%
  * Platinum: สะสมครบ 6,000 BV จากการช็อปสินค้า -> รับสิทธิ์โบนัสแนะนำ 100% | จับคู่ขาล่าง 60% | แมทชิ่ง 3 ชั้น | ยอดแชร์ All Sale ทั่วระบบ 3%
  * Diamond: สะสมครบ 12,000 BV จากการช็อปสินค้า -> รับสิทธิ์โบนัสแนะนำ 100% | จับคู่ขาล่าง 60% | แมทชิ่ง 4 ชั้น | ยอดแชร์ All Sale ทั่วระบบ 5%

---
นี่คือรายการสินค้าไอทีมือสองปัจจุบันที่วางขายในร้าน Noinashop (พร้อมราคาและคะแนน BV):
${productsContext || 'ขณะนี้ไม่มีสินค้าในคลังสินค้าชั่วคราว โปรดแนะนำสินค้าในตัวเลือกเริ่มต้น'}

---
แนวทางการตอบแชทของ "Noina AI Support":
- พูดคุยด้วยน้ำเสียงกระตือรือร้น เป็นกันเอง สุภาพ มีหางเสียง "ครับ/ค่ะ" เสมอ และยึดหลักความจริงตามข้อมูลสเป็ค ราคา และคะแนน BV
- เมื่อแนะนำสินค้า ให้ระบุราคาและคะแนน BV เสมอ เพื่อจูงใจเรื่องรายได้ และอธิบายว่า "เมื่อซื้อสินค้านี้ ท่านจะได้คะแนน BV เข้าระบบผังสายงานทันที"
- ช่วยตอบข้อสงสัยหรือยกตัวอย่างคำนวณโบนัสให้ผู้ใช้เห็นภาพอย่างชัดเจน
- หากลูกค้าสนใจ ให้ชวนสมัครสมาชิกเพื่อจับจองพื้นที่ต้นสายและแชร์ลิงก์สร้างรายได้แบบ Passive Income!`;

      // Map chat history to match Gemini's structure
      // Format: { role: 'user' | 'model', parts: [{ text: string }] }
      const contents = [
        ...history.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];

      // Invoke Gemini API using recommended SDK and model
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || 'ขออภัยครับ ระบบประมวลผลคำตอบขัดข้องชั่วคราว';

      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error('Gemini Chat API Error:', error);
      return res.status(500).json({ 
        error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI โปรดลองใหม่อีกครั้ง' 
      });
    }
  });

  // Server-side cache variables for Google Sheets syncing
  let cachedSheetProducts: any[] = [];
  let lastFetchTime = 0;
  const CACHE_TTL = 10000; // 10 seconds cache TTL

  // Products store GET and POST routes for persistent Google Sheet data and Webhook URL
  app.get('/api/products-store', async (req, res) => {
    try {
      const store = await readStore();
      const now = Date.now();
      
      const targetSheetUrl = 'https://docs.google.com/spreadsheets/d/1UL93q_PpKGlZocvcD6ShLwbDJP-nU1emB5-hvQOLT_A/edit?usp=sharing';
      
      // Always enforce the user's specific Google Sheet URL if not set or if it points to an example
      if (!store.sheetUrl || store.sheetUrl.includes('_example') || !store.sheetUrl.startsWith('http')) {
        store.sheetUrl = targetSheetUrl;
        await writeStore(store);
      }
      
      if (store.sheetUrl && store.sheetUrl.startsWith('http')) {
        // If cache expired, or cached products are empty, fetch fresh from Google Sheets on the server
        if (now - lastFetchTime > CACHE_TTL || cachedSheetProducts.length === 0) {
          try {
            const cleanUrl = getCleanSheetUrl(store.sheetUrl);
            console.log(`Server-fetching Google Sheet automatically: ${cleanUrl}`);
            const fetchRes = await fetch(cleanUrl);
            if (fetchRes.ok) {
              const text = await fetchRes.text();
              const freshProducts = parseCSV(text);
              if (freshProducts && freshProducts.length > 0) {
                cachedSheetProducts = freshProducts;
                lastFetchTime = now;
                
                // Persist the latest fetched products inside the database cache so Gemini AI has instant access
                store.products = freshProducts;
                await writeStore(store);
                console.log(`Successfully auto-fetched and parsed ${freshProducts.length} products from Google Sheet`);
              }
            } else {
              console.warn(`Google Sheet fetch responded with status: ${fetchRes.status}`);
            }
          } catch (fetchErr) {
            console.error('Server auto-fetch Google Sheet failed, falling back to cached products:', fetchErr);
          }
        }
        
        // If we successfully fetched or have cached data, override stored products
        if (cachedSheetProducts.length > 0) {
          store.products = cachedSheetProducts;
        }
      }
      
      res.json(store);
    } catch (error: any) {
      console.error('Failed to read products-store:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/products-store', async (req, res) => {
    try {
      const { sheetUrl, webhookUrl, products, members } = req.body;
      const store = await readStore();
      if (sheetUrl !== undefined) store.sheetUrl = sheetUrl;
      if (webhookUrl !== undefined) store.webhookUrl = sanitizeWebhookUrl(webhookUrl);
      if (products !== undefined) store.products = products;
      if (members !== undefined) store.members = members;
      await writeStore(store);
      res.json({ success: true, store });
    } catch (error: any) {
      console.error('Failed to write products-store:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to sanitize Google Apps Script Webhook URL and ensure it has /exec
  function sanitizeWebhookUrl(url: string): string {
    if (!url) return '';
    // Trim spaces and remove any leading/trailing single/double quotes, angle brackets, brackets, or dots
    let cleanUrl = url.trim().replace(/^['"<>[\]\s]+|['"<>[\]\s]+$/g, '');
    cleanUrl = cleanUrl.replace(/\.+\s*$/, '');
    
    // 1. Try to extract Deployment ID (starts with AKfy)
    let id = '';
    
    // Check if it's a URL with /s/
    const sIndex = cleanUrl.indexOf('/s/');
    if (sIndex !== -1) {
      const remaining = cleanUrl.substring(sIndex + 3);
      const match = remaining.match(/^([a-zA-Z0-9_\-]+)/);
      if (match) {
        id = match[1];
      }
    } else {
      // Check if the string itself starts with or contains AKfy
      const akfyIndex = cleanUrl.search(/AKfy/i);
      if (akfyIndex !== -1) {
        const remaining = cleanUrl.substring(akfyIndex);
        const match = remaining.match(/^([a-zA-Z0-9_\-]+)/);
        if (match) {
          id = match[1];
        }
      }
    }
    
    // 2. If we found a valid Deployment ID (length >= 50), reconstruct the URL perfectly
    if (id && id.length >= 50) {
      return `https://script.google.com/macros/s/${id}/exec`;
    }
    
    if (cleanUrl) {
      // Fix typos in domain name (using a robust pattern so that we don't turn script.google.com into scscript.google.com)
      cleanUrl = cleanUrl.replace(/[a-zA-Z]*ript\.google\.com/gi, 'script.google.com');
      
      // Fix any duplicate protocol stacking (e.g., https://https:/, https://http://, etc.)
      cleanUrl = cleanUrl.replace(/https?:\/\/https?:\/+/gi, 'https://');
      cleanUrl = cleanUrl.replace(/https?:\/\/https?:\/\//gi, 'https://');
      
      // Fix incomplete protocol formats:
      if (/^https?:\/+(?!\/)/i.test(cleanUrl)) {
        cleanUrl = cleanUrl.replace(/^(https?):\/+/i, '$1://');
      } else if (/^https?\/+/i.test(cleanUrl)) {
        cleanUrl = cleanUrl.replace(/^(https?)\/+/i, '$1://');
      } else if (/^https?:[a-zA-Z0-9]/i.test(cleanUrl)) {
        cleanUrl = cleanUrl.replace(/^(https?):/i, '$1://');
      }
      
      // If it has no protocol at all (e.g. starts with script.google.com or macros/s/...), prepend https://
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Ensure any duplicate slashes after protocol are fixed
      cleanUrl = cleanUrl.replace(/^(https?:\/\/)\/+/i, '$1');
      
      // Ensure it ends with /exec if it's a script.google.com link
      if (cleanUrl.includes('script.google.com')) {
        let baseUrl = cleanUrl;
        let queryParams = '';
        const queryIndex = cleanUrl.indexOf('?');
        if (queryIndex !== -1) {
          baseUrl = cleanUrl.substring(0, queryIndex);
          queryParams = cleanUrl.substring(queryIndex);
        }
        
        if (baseUrl.includes('/macros/s/')) {
          const parts = baseUrl.split('/macros/s/');
          if (parts.length === 2) {
            const idAndSuffix = parts[1];
            const idMatch = idAndSuffix.match(/^([a-zA-Z0-9_\-]+)/);
            if (idMatch) {
              baseUrl = `https://script.google.com/macros/s/${idMatch[1]}/exec`;
            }
          }
        } else if (!baseUrl.endsWith('/exec')) {
          baseUrl = baseUrl.replace(/\/+$/, '');
          if (!baseUrl.endsWith('/exec')) {
            baseUrl = baseUrl + '/exec';
          }
        }
        cleanUrl = baseUrl + queryParams;
      }
    }
    return cleanUrl;
  }

  // Robust fetch implementation to handle Google Apps Script 301/302 redirects properly in Node.js.
  // Standard undici fetch can preserve payload headers (like Content-Type and Content-Length) 
  // on redirected GET requests, which causes Google's server to reject the call.
  async function fetchWithRedirects(url: string, options: any, maxRedirects = 5, trace: any[] = []): Promise<Response> {
    let currentUrl = url;
    let currentOptions = { ...options };
    
    for (let i = 0; i < maxRedirects; i++) {
      const step: any = {
        step: i + 1,
        url: currentUrl,
        method: currentOptions.method || 'GET',
      };
      trace.push(step);
      
      try {
        const res = await fetch(currentUrl, {
          ...currentOptions,
          redirect: 'manual' // Manually intercept redirects
        });
        
        step.status = res.status;
        step.statusText = res.statusText;
        
        const isRedirect = [301, 302, 303, 307, 308].includes(res.status);
        if (isRedirect) {
          const location = res.headers.get('location');
          step.redirectUrl = location;
          if (!location) {
            return res;
          }
          
          // Resolve target URL
          currentUrl = new URL(location, currentUrl).toString();
          
          // Standard HTTP redirect behavior:
          // 301, 302, and 303 redirect requests switch POST to GET and drop payload.
          // Google Apps Script Web Apps (macros) return 302 Found, and the redirected request
          // to script.googleusercontent.com must be a GET request and drop payload/body headers.
          if ([301, 302, 303].includes(res.status)) {
            currentOptions.method = 'GET';
            delete currentOptions.body;
            if (currentOptions.headers) {
              const cleanHeaders = { ...currentOptions.headers };
              // Crucial: Delete payload-related headers to prevent 404 or bad request on googleusercontent.com
              delete cleanHeaders['content-type'];
              delete cleanHeaders['Content-Type'];
              delete cleanHeaders['content-length'];
              delete cleanHeaders['Content-Length'];
              currentOptions.headers = cleanHeaders;
            }
          }
          continue;
        }
        return res;
      } catch (err: any) {
        step.error = err.message;
        throw err;
      }
    }
    throw new Error('Too many redirects');
  }

  // Proxy endpoint to trigger Google Apps Script from server-side (Bypasses CORS & works across all devices)
  app.post('/api/webhook-proxy', async (req, res) => {
    try {
      const store = await readStore();
      const bodyWebhookUrl = req.body.webhookUrl;
      
      // Prioritize the client-provided webhook URL (from the input field) if present,
      // which is essential for testing a new URL before saving it.
      // Otherwise, fall back to the saved server-side webhook URL.
      const rawWebhookUrl = bodyWebhookUrl || store.webhookUrl;
      
      // Validation: Check if they accidentally put a Google Sheet link in the Webhook field
      if (rawWebhookUrl && (rawWebhookUrl.includes('docs.google.com/spreadsheets') || rawWebhookUrl.includes('spreadsheets/d/'))) {
        return res.json({
          success: false,
          status: 400,
          message: '❌ คุณใส่ลิงก์ Google Sheets ผิดช่อง! ช่องนี้สำหรับใส่ลิงก์ "Google Apps Script Web App" (ที่ลงท้ายด้วย /exec) เพื่อส่งข้อมูลและส่งเมล โปรดล็อกอินรหัสผู้ดูแลระบบ NS001 แล้วนำลิงก์ Web App สีน้ำเงินที่ได้จากขั้นตอนการ Deploy ใน Google Sheets มาใส่แทน'
        });
      }

      const webhookUrl = sanitizeWebhookUrl(rawWebhookUrl);
      
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        console.warn('Webhook proxy: No webhook URL set in products_store.json on the server.');
        return res.json({ 
          success: false, 
          message: '⚠️ ยังไม่ได้ตั้งค่า Google Apps Script Webhook URL ในระบบหลังบ้านผู้ดูแลระบบ โปรดเข้าสู่ระบบผู้ดูแลระบบด้วยรหัส NS001 แล้วกรอกข้อมูลในแท็บ Google Sheets เพื่อให้สามารถบันทึกสายงานและส่งอีเมลแจ้งเตือนได้' 
        });
      }

      console.log(`[Webhook Proxy] Forwarding ${req.body.type || 'unknown'} payload to: ${webhookUrl}`);
      
      // Remove webhookUrl from body before forwarding to Apps Script
      const forwardBody = { ...req.body };
      delete forwardBody.webhookUrl;
      
      // Use the server-configured sheetId as the primary source of truth to avoid stale client localStorage.
      if (store.sheetUrl) {
        const match = store.sheetUrl.match(/\/d\/([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
          forwardBody.sheetId = match[1];
          console.log(`[Webhook Proxy] Using server-configured sheetId: ${forwardBody.sheetId}`);
        }
      }
      
      const trace: any[] = [];
      const response = await fetchWithRedirects(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(forwardBody)
      }, 5, trace);

      const responseText = await response.text();
      console.log(`[Webhook Proxy] Google Apps Script replied with Status: ${response.status}`, responseText);

      // Check if the response contains typical Google Apps Script errors
      const lowerResponse = responseText.trim().toLowerCase();
      const isHtml = lowerResponse.startsWith('<!doctype') || lowerResponse.startsWith('<html') || lowerResponse.includes('<html>') || lowerResponse.includes('<body');
      const isNotFound = response.status === 404 || 
                         (isHtml && (
                           lowerResponse.includes('not_found') || 
                           lowerResponse.includes('not found') || 
                           lowerResponse.includes('could not be found') ||
                           lowerResponse.includes('page not found') ||
                           lowerResponse.includes('the page could not be found')
                         ));
      const isAuthError = isHtml && (
                            lowerResponse.includes('google accounts') || 
                            lowerResponse.includes('sign in') || 
                            lowerResponse.includes('login') || 
                            lowerResponse.includes('servicelogin')
                          );

      if (isNotFound) {
        console.warn('[Webhook Proxy] Google Apps Script returned a 404 NOT_FOUND error.');
        return res.json({
          success: false,
          status: 404,
          message: '❌ ไม่พบหน้าสคริปต์ Google Apps Script (HTTP 404 NOT_FOUND): ลิงก์ที่แอดมินกรอกในระบบไม่ถูกต้อง หรือ Deployment ID ไม่มีอยู่จริงในระบบ Google โปรดตรวจสอบว่าคัดลอก Web App URL (ลงท้ายด้วย /exec) มาอย่างถูกต้องครบถ้วนและอัปเดตบนระบบแล้วจริงๆ',
          trace
        });
      }

      if (isAuthError || (isHtml && (responseText.includes('Sign in') || responseText.includes('Accounts')))) {
        console.warn('[Webhook Proxy] Google Apps Script returned a Google login/authentication screen.');
        return res.json({
          success: false,
          status: 401,
          message: '🔒 ไม่สามารถเข้าถึงสคริปต์ได้เนื่องจากติดสิทธิความปลอดภัย of Google: โปรดแก้ไขสิทธิผู้มีสิทธิเข้าถึง Web App ใน Google Apps Script โดยตั้งค่า Who has access เป็น "Anyone" (ทุกคน) แล้วกด Deploy > New deployment ใหม่ จากนั้นนำลิงก์ /exec ใหม่มาบันทึกในระบบหลังบ้านอีกครั้ง',
          trace
        });
      }

      if (isHtml) {
        console.warn('[Webhook Proxy] Google Apps Script returned HTML instead of JSON.');
        return res.json({
          success: false,
          status: response.status,
          message: '⚠️ สคริปต์ Google Apps Script ตอบกลับเป็นหน้าเว็บ HTML แทนที่จะเป็นข้อมูลผลลัพธ์สำเร็จ! สิ่งนี้มักเกิดจากการเขียนโค้ด doPost ใน Apps Script มีข้อผิดพลาด หรือตั้งค่าการ Deployment ไม่ถูกต้อง',
          data: responseText.substring(0, 300),
          trace
        });
      }

      // Try parsing JSON if possible
      let parsedData = null;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON
      }

      const isSuccess = response.ok && (!parsedData || parsedData.status === 'success' || parsedData.success !== false);

      if (!isSuccess) {
        return res.json({
          success: false,
          status: response.status,
          message: parsedData?.message || `❌ สคริปต์แจ้งข้อผิดพลาด: ${responseText.substring(0, 200)}`,
          data: parsedData || responseText,
          trace
        });
      }

      return res.json({
        success: true,
        status: response.status,
        message: parsedData?.message || '✅ บันทึกข้อมูลและแจ้งเตือนผ่าน Google Sheets เรียบร้อยแล้ว!',
        data: parsedData || responseText,
        trace
      });
    } catch (error: any) {
      console.error('[Webhook Proxy] Error forwarding payload:', error);
      return res.status(500).json({
        success: false,
        message: `❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ Google: ${error.message || 'การเชื่อมต่อถูกปฏิเสธ'}`,
        trace: (error as any).trace || []
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Vite development middleware vs Static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen exclusively on Port 3000 and 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
