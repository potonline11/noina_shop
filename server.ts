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

async function readStore() {
  try {
    const data = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { sheetUrl: '', webhookUrl: '', products: [] };
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

  // Products store GET and POST routes for persistent Google Sheet data and Webhook URL
  app.get('/api/products-store', async (req, res) => {
    try {
      const store = await readStore();
      res.json(store);
    } catch (error: any) {
      console.error('Failed to read products-store:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/products-store', async (req, res) => {
    try {
      const { sheetUrl, webhookUrl, products } = req.body;
      const store = await readStore();
      if (sheetUrl !== undefined) store.sheetUrl = sheetUrl;
      if (webhookUrl !== undefined) store.webhookUrl = webhookUrl;
      if (products !== undefined) store.products = products;
      await writeStore(store);
      res.json({ success: true, store });
    } catch (error: any) {
      console.error('Failed to write products-store:', error);
      res.status(500).json({ error: error.message });
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
