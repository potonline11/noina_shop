/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Database, Link, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet, Eye, Code, Save, Mail, Copy, Check, Sparkles, Download, Share2, ExternalLink, Layers, Tag, Globe, ShoppingBag } from 'lucide-react';
import { parseCSV, DEMO_SPREADSHEET_DATA, DEMO_FACEBOOK_SPREADSHEET_DATA, FACEBOOK_CATALOG_HEADER, DEFAULT_SHEET_URL, getCleanSheetUrl, parseSheetData, stripHtml } from '../utils/sheetParser';

interface GoogleSheetSyncProps {
  onSyncComplete: (products: Product[]) => void;
  currentProductsCount: number;
}

export default function GoogleSheetSync({ onSyncComplete, currentProductsCount }: GoogleSheetSyncProps) {
  // Product CSV sync states
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('noina_sheet_url') || DEFAULT_SHEET_URL;
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);

  // Format selection tab: 'facebook' (recommended for both FB & Noinashop) or 'simple'
  const [formatTab, setFormatTab] = useState<'facebook' | 'simple'>('facebook');
  const [copiedFbHeader, setCopiedFbHeader] = useState(false);
  const [copiedFbFeedUrl, setCopiedFbFeedUrl] = useState(false);
  const [downloadingFbTemplate, setDownloadingFbTemplate] = useState(false);

  // Webhook integration states
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('noina_order_webhook_url') || '';
  });

  // Logo image URL state
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('noina_logo_url') || '';
  });
  const [logoSaveStatus, setLogoSaveStatus] = useState<string>('');
  const [copiedCleanCsv, setCopiedCleanCsv] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fbFeedUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/facebook-feed.csv` : 'https://www.noinashop.business/api/facebook-feed.csv';

  const handleCopyFbHeader = async () => {
    try {
      // Use tab characters so pasting directly into Google Sheets splits across columns A, B, C... automatically
      const tabSeparatedHeader = FACEBOOK_CATALOG_HEADER.split(',').join('\t');
      await navigator.clipboard.writeText(tabSeparatedHeader);
      setCopiedFbHeader(true);
      setTimeout(() => setCopiedFbHeader(false), 3000);
    } catch (e) {
      console.error('Failed to copy Facebook header:', e);
    }
  };

  const handleCopyFbFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(fbFeedUrl);
      setCopiedFbFeedUrl(true);
      setTimeout(() => setCopiedFbFeedUrl(false), 3000);
    } catch (e) {
      console.error('Failed to copy Facebook feed URL:', e);
    }
  };

  const handleDownloadFbTemplate = async () => {
    try {
      setDownloadingFbTemplate(true);
      const res = await fetch('/api/facebook-template.csv');
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'noinashop_facebook_catalog_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Failed to download Facebook template:', e);
    } finally {
      setDownloadingFbTemplate(false);
    }
  };

  const handleCopyCleanCsv = async () => {
    try {
      const res = await fetch('/api/export-clean-csv');
      const csvText = await res.text();
      await navigator.clipboard.writeText(csvText.replace(/^\uFEFF/, ''));
      setCopiedCleanCsv(true);
      setTimeout(() => setCopiedCleanCsv(false), 3000);
    } catch (e) {
      console.error('Failed to copy clean CSV:', e);
    }
  };

  const handleDownloadCleanCsv = async () => {
    try {
      setDownloadingCsv(true);
      const res = await fetch('/api/export-clean-csv');
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'google_sheet_products_clean.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Failed to download clean CSV:', e);
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Fetch configuration on mount to ensure server configuration is in sync
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/products-store');
        if (res.ok) {
          const data = await res.json();
          if (data.webhookUrl) {
            setWebhookUrl(data.webhookUrl);
            localStorage.setItem('noina_order_webhook_url', data.webhookUrl);
          }
          if (data.sheetUrl) {
            setSheetUrl(data.sheetUrl);
            localStorage.setItem('noina_sheet_url', data.sheetUrl);
          }
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            localStorage.setItem('noina_logo_url', data.logoUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load products-store config:', err);
      }
    };
    fetchConfig();
  }, []);
  const [webhookSaveStatus, setWebhookSaveStatus] = useState<string>('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; trace?: any[] } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [expandCode, setExpandCode] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  // Helper to check if a URL is likely truncated
  const getUrlWarning = (url: string) => {
    if (!url) return null;
    let clean = url.trim().replace(/^['"<>[\]\s]+|['"<>[\]\s]+$/g, '');
    clean = clean.replace(/\.+\s*$/, '');
    
    // Check if there are dots suggesting ellipsis
    if (clean.includes('...')) {
      return '⚠️ ตรวจพบอักษรจุดไข่ปลา (...) ในลิงก์! สิ่งนี้เกิดจากการคัดลอกจากหน้าจอที่แสดงไม่ครบถ้วนจาก Google โปรดคัดลอก "รหัสการทำให้ใช้งานได้" (Deployment ID) หรือลิงก์เต็มรูปแบบจริง ๆ มาวางใหม่';
    }
    
    // Extract ID
    let id = '';
    const sIndex = clean.indexOf('/s/');
    if (sIndex !== -1) {
      const remaining = clean.substring(sIndex + 3);
      const match = remaining.match(/^([a-zA-Z0-9_\-]+)/);
      if (match) {
        id = match[1];
      }
    } else if (/^AKfy[a-zA-Z0-9_\-]+/i.test(clean)) {
      const match = clean.match(/^(AKfy[a-zA-Z0-9_\-]+)/i);
      if (match) {
        id = match[1];
      }
    }
    
    if (id) {
      if (id.length < 60) {
        return `⚠️ รหัส Deployment ID ที่ตรวจพบสั้นเกินไป (ยาวเพียง ${id.length} ตัวอักษร แทนที่จะเป็นอย่างน้อย 65 ตัวอักษร) โปรดตรวจสอบว่าท่านคัดลอกรหัสที่ถูกต้องและสมบูรณ์มาจาก Google Apps Script และวางใหม่ (หลีกเลี่ยงการคัดลอกแบบย่อที่มีจุดไข่ปลา)`;
      }
    } else {
      return '⚠️ รูปแบบลิงก์ไม่ถูกต้อง: ไม่พบรหัส Deployment ID (ที่ขึ้นต้นด้วย AKfy) ในลิงก์ โปรดตรวจสอบการคัดลอกลิงก์ Web App (ที่ได้จากการ Deploy ใน Google Apps Script) หรือรหัส Deployment ID มาวางใหม่';
    }
    
    return null;
  };

  // Super robust sanitizer for Google Apps Script Webhook URL
  const superSanitizeWebhookUrl = (url: string): string => {
    if (!url) return '';
    let clean = url.trim().replace(/^['"<>[\]\s]+|['"<>[\]\s]+$/g, '');
    clean = clean.replace(/\.+\s*$/, '');
    
    // 1. Try to extract Deployment ID (starts with AKfy)
    let id = '';
    
    // Check if it's a URL with /s/
    const sIndex = clean.indexOf('/s/');
    if (sIndex !== -1) {
      const remaining = clean.substring(sIndex + 3);
      const match = remaining.match(/^([a-zA-Z0-9_\-]+)/);
      if (match) {
        id = match[1];
      }
    } else {
      // Check if the string itself starts with or contains AKfy
      const akfyIndex = clean.search(/AKfy/i);
      if (akfyIndex !== -1) {
        const remaining = clean.substring(akfyIndex);
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
    
    // Fallback if no Deployment ID found
    // Fix typos in domain name
    clean = clean.replace(/[a-zA-Z]*ript\.google\.com/gi, 'script.google.com');
    
    // Fix any duplicate protocol stacking
    clean = clean.replace(/https?:\/\/https?:\/+/gi, 'https://');
    clean = clean.replace(/https?:\/\/https?:\/\//gi, 'https://');
    
    // Fix incomplete protocol formats:
    if (/^https?:\/+(?!\/)/i.test(clean)) {
      clean = clean.replace(/^(https?):\/+/i, '$1://');
    } else if (/^https?\/+/i.test(clean)) {
      clean = clean.replace(/^(https?)\/+/i, '$1://');
    } else if (/^https?:[a-zA-Z0-9]/i.test(clean)) {
      clean = clean.replace(/^(https?):/i, '$1://');
    }
    
    // If it has no protocol at all, prepend https://
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    
    // Ensure duplicate slashes after protocol are fixed
    clean = clean.replace(/^(https?:\/\/)\/+/i, '$1');
    
    // Ensure it ends with /exec for script.google.com
    if (clean.includes('script.google.com')) {
      let baseUrl = clean;
      let queryParams = '';
      const queryIndex = clean.indexOf('?');
      if (queryIndex !== -1) {
        baseUrl = clean.substring(0, queryIndex);
        queryParams = clean.substring(queryIndex);
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
      clean = baseUrl + queryParams;
    }
    
    return clean;
  };

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(appsScriptCode)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
    } catch (err) {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    if (codeRef.current) {
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch (err) {
        console.warn('DOM copy failed', err);
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = appsScriptCode;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาคลิกปุ่ม 'เลือกโค้ดทั้งหมด (Select All)' ด้านล่าง แล้วกด Ctrl+C ด้วยตนเอง");
      }
    } catch (err) {
      console.error('Fallback copy textarea failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleSelectAll = () => {
    if (codeRef.current) {
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    setPreviewProducts([]);

    try {
      let products: Product[] = [];

      // 1. Try server-side sync first (bypasses browser CORS restrictions completely)
      try {
        const srvRes = await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl })
        });
        if (srvRes.ok) {
          const srvData = await srvRes.json();
          if (srvData.success && srvData.products && srvData.products.length > 0) {
            products = srvData.products;
          }
        }
      } catch (srvErr) {
        console.warn('Server-side sync failed, trying client-side fetch...', srvErr);
      }

      // 2. Fallback to client-side fetch if needed
      if (products.length === 0) {
        const cleanUrl = getCleanSheetUrl(sheetUrl);
        const response = await fetch(cleanUrl);
        if (!response.ok) {
          throw new Error('ไม่สามารถเข้าถึงลิงก์ Google Sheet นี้ได้ โปรดตรวจสอบความถูกต้องและการเผยแพร่');
        }

        const text = await response.text();
        products = parseSheetData(text);
      }

      if (products.length === 0) {
        throw new Error('ไม่พบข้อมูลสินค้าที่ถูกต้องในไฟล์ โปรดตรวจสอบว่ามีแถวหัวข้อ (Header) เช่น Title, Description, Price, BV');
      }

      localStorage.setItem('noina_sheet_url', sheetUrl);
      setPreviewProducts(products);
      onSyncComplete(products);

      // Save the sheetUrl and synced products to backend store so they persist globally
      try {
        await fetch('/api/products-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl, products })
        });
      } catch (srvErr) {
        console.error('Failed to sync sheet data to server:', srvErr);
      }

      setStatus({
        type: 'success',
        message: `ดึงข้อมูลจาก Google Sheet สำเร็จ! ค้นพบและนำเข้าสินค้าใหม่ทั้งหมด ${products.length} รายการ และบันทึกข้อมูลลงเซิร์ฟเวอร์เรียบร้อย`
      });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล โปรดตรวจสอบลิงก์ CSV ของคุณอีกครั้ง'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize webhook URL using the super-robust sanitizer
    const cleanWebhook = superSanitizeWebhookUrl(webhookUrl);
    
    setWebhookUrl(cleanWebhook);
    localStorage.setItem('noina_order_webhook_url', cleanWebhook);
    setWebhookSaveStatus('กำลังบันทึกข้อมูลลงระบบเซิร์ฟเวอร์...');
    
    try {
      const response = await fetch('/api/products-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cleanWebhook })
      });
      if (response.ok) {
        setWebhookSaveStatus('บันทึก Webhook URL ลงเซิร์ฟเวอร์และบราวเซอร์เรียบร้อยแล้ว!');
      } else {
        setWebhookSaveStatus('บันทึกเรียบร้อยแล้ว (เว็บบราวเซอร์)');
      }
    } catch (err) {
      console.error('Failed to sync webhook URL to server:', err);
      setWebhookSaveStatus('บันทึกในบราวเซอร์สำเร็จ แต่ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
    
    setTimeout(() => setWebhookSaveStatus(''), 4000);
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanLogo = logoUrl.trim();
    setLogoUrl(cleanLogo);
    localStorage.setItem('noina_logo_url', cleanLogo);
    setLogoSaveStatus('กำลังบันทึกข้อมูล...');
    
    try {
      const response = await fetch('/api/products-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: cleanLogo })
      });
      if (response.ok) {
        setLogoSaveStatus('บันทึกโลโก้ร้านลงเซิร์ฟเวอร์เรียบร้อยแล้ว!');
        // Trigger a simple custom event so other components know the logo has been updated instantly
        window.dispatchEvent(new Event('logoUpdated'));
      } else {
        setLogoSaveStatus('บันทึกเรียบร้อยแล้ว (บราวเซอร์)');
      }
    } catch (err) {
      console.error('Failed to sync logo URL to server:', err);
      setLogoSaveStatus('บันทึกในบราวเซอร์สำเร็จ แต่ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
    
    setTimeout(() => setLogoSaveStatus(''), 4000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: '❌ กรุณากรอก Webhook URL ก่อนเริ่มต้นทดสอบเชื่อมต่อ' });
      return;
    }
    
    // Sanitize webhook URL using the super-robust sanitizer
    const cleanWebhook = superSanitizeWebhookUrl(webhookUrl);
    
    setTestingWebhook(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/webhook-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: cleanWebhook,
          type: 'registration',
          id: 'TEST_NS999',
          name: 'ผู้ทดสอบระบบ (Test Connection)',
          email: 'test@example.com',
          phone: '081-111-1111',
          password: 'TestPassword123',
          sponsorId: 'NS001',
          parentUserId: 'NS001',
          position: 'left',
          rank: 'Bronze',
          dateJoined: new Date().toISOString().split('T')[0]
        })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { success: false, message: text };
      }
      
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: '✓ เชื่อมต่อกับ Google Apps Script สำเร็จ 100%! สคริปต์ของท่านทำงานได้ดีและตอบกลับถูกต้อง ข้อมูลการทดสอบถูกนำเข้า Google Sheet แล้ว',
          trace: data.trace
        });
      } else {
        let displayMessage = data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        const lowerMsg = displayMessage.toLowerCase();
        
        if (lowerMsg.includes('not_found') || lowerMsg.includes('could not be found') || lowerMsg.includes('page not found') || response.status === 404) {
          displayMessage = '❌ ไม่พบหน้าสคริปต์ Google Apps Script (HTTP 404 Not Found)\n\n' +
            'สาเหตุที่เป็นไปได้สูงที่สุด:\n' +
            '1. บั๊กการล็อกอินหลายบัญชีของ Google: หากท่านล็อกอิน Google หลายตัวพร้อมกันในเบราว์เซอร์ตอนกด Deploy ระบบมักจะสร้าง Deployment ID ที่ใช้งานไม่ได้\n' +
            '   👉 วิธีแก้ไข: โปรดเปิด "หน้าต่างไม่ระบุตัวตน" (Incognito Window) -> ล็อกอินเข้าบัญชี admin@noinashop.business บัญชีเดียวเท่านั้น -> เข้าหน้าแก้ไขสคริปต์ -> กด Deploy > New deployment ใหม่ จากนั้นนำลิงก์ที่ลงท้ายด้วย /exec ตัวใหม่มาบันทึกและทดสอบอีกครั้ง\n\n' +
            '2. เลือกการ Deployment ผิดประเภท: ตรวจสอบว่าท่านเลือกชนิดเป็น "เว็บแอป" (Web App) หรือไม่ (ไม่ใช่ไลบรารีหรือ API)\n' +
            '   👉 วิธีแก้ไข: ตรวจสอบขั้นตอนการ Deploy ในคู่มือด้านล่าง โดยตั้งค่า "การเข้าถึงเป็น: ทุกคน (Anyone)" และ "ทำงานในฐานะ: ฉัน (admin@noinashop.business)" เสมอ';
        } else if (lowerMsg.includes('unauthorized') || lowerMsg.includes('forbidden') || response.status === 401 || response.status === 403) {
          displayMessage = '🔒 ติดสิทธิความปลอดภัยของ Google: โปรดแก้ไขสิทธิผู้มีสิทธิเข้าถึง Web App ใน Google Apps Script โดยตั้งค่า Who has access เป็น "Anyone" (ทุกคน) แล้วกด Deploy > New deployment ใหม่ จากนั้นนำลิงก์ /exec ใหม่มาบันทึกในระบบ';
        } else if (displayMessage.includes('<!DOCTYPE') || displayMessage.includes('<html')) {
          displayMessage = '⚠️ สคริปต์ตอบกลับเป็นหน้าเว็บ HTML แทนที่จะเป็นข้อมูลผลลัพธ์สำเร็จ! สิ่งนี้มักเกิดจากโค้ด doPost ใน Apps Script มีข้อผิดพลาด หรือตั้งค่าการ Deployment เป็น Web App ไม่ถูกต้อง';
        }
        
        setTestResult({
          success: false,
          message: displayMessage,
          trace: data.trace
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: '❌ ล้มเหลว: ' + (err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ proxy ได้'),
        trace: err.trace || []
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (err) {}
    
    if (!ss) {
      var sheetId = data.sheetId || "1UL93q_PpKGlZocvcD6ShLwbDJP-nU1emB5-hvQOLT_A";
      try {
        ss = SpreadsheetApp.openById(sheetId);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          success: false,
          message: "ไม่สามารถเปิดไฟล์ Google Sheet ด้วย ID: " + sheetId + " ได้ โปรดตรวจสอบว่าได้แชร์สิทธิ์เข้าถึงให้ทุกคนที่มีลิงก์เข้าถึงได้ หรือเปิดสิทธิ์แล้ว: " + err.toString() 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // ตรวจสอบว่าเป็นข้อมูลการสมัครสมาชิกใหม่ หรือข้อมูลการสั่งซื้อสินค้า
    if (data.type === "registration" || (data.password !== undefined && data.items === undefined)) {
      // 1. จัดการข้อมูลการสมัครสมาชิกใหม่ (NLM Registration)
      var sheet = ss.getSheetByName("Members");
      if (!sheet) {
        try {
          sheet = ss.insertSheet("Members");
        } catch (e) {
          sheet = ss.getSheets()[0]; // fallback to first sheet if insert fails
        }
      }
      
      // ตั้งค่าหัวข้อในแถวที่ 1 หากชีตยังว่างอยู่
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Member ID", "Date Joined", "Full Name", "Email Address", 
          "Phone Number", "Password", "Sponsor ID", "Parent ID", 
          "Binary Position", "Membership Rank"
        ]);
      }
      
      sheet.appendRow([
        data.id || "",
        data.dateJoined || new Date().toISOString().split('T')[0],
        data.name || "",
        data.email || "",
        data.phone || "",
        data.password || "",
        data.sponsorId || "",
        data.parentUserId || "",
        data.position === "left" ? "ซ้าย (Left Downline)" : "ขวา (Right Downline)",
        data.rank || "Bronze"
      ]);
      
      // ส่งเมลยินดีต้อนรับสมาชิกใหม่พร้อมข้อมูลสำหรับเข้าใช้งานทันที!
      var mailStatus = "No email address provided";
      if (data.email) {
        try {
          var subject = "ยินดีต้อนรับสมาชิกใหม่ Noinashop NLM - รหัสสมาชิก " + (data.id || "");
          var body = "เรียนคุณ " + (data.name || "") + ",\\n\\n" +
                     "ยินดีต้อนรับเข้าสู่ครอบครัว Noinashop NLM (Noina Line Marketing) เครือข่ายไอทีมือสองพรีเมียม!\\n" +
                     "ระบบได้ลงทะเบียนบัญชีผู้ใช้งานของคุณเข้าสู่ผังองค์กรแบบ Binary เรียบร้อยแล้ว\\n\\n" +
                     "--------------------------------------------------\\n" +
                     " 🔑 ข้อมูลบัญชีสมาชิกของคุณสำหรับเข้าใช้งาน\\n" +
                     "--------------------------------------------------\\n" +
                     "● รหัสสมาชิก (Member ID): " + (data.id || "") + "\\n" +
                     "● อีเมลสำหรับล็อกอิน: " + (data.email || "") + "\\n" +
                     "● รหัสผ่านเข้าใช้ (Password): " + (data.password || "") + "\\n" +
                     "● ผู้แนะนำตรง (Sponsor ID): " + (data.sponsorId || "") + "\\n" +
                     "● ผู้จัดวางในสายงาน (Parent ID): " + (data.parentUserId || "") + "\\n" +
                     "● ฝั่งสายงาน (Position): " + (data.position === "left" ? "ทีมงานฝั่งซ้าย" : "ทีมงานฝั่งขวา") + "\\n" +
                     "● ระดับสมาชิกเริ่มต้น (Rank): " + (data.rank || "Bronze") + "\\n\\n" +
                     "--------------------------------------------------\\n" +
                     " 🚀 ลิงก์ร้านค้าและลิงก์แนะนำขยายงานของคุณ\\n" +
                     "--------------------------------------------------\\n" +
                     "คัดลอกลิงก์ด้านล่างส่งต่อเพื่อขยายสายงานเครือข่ายของคุณเพื่อสะสมคะแนน BV รับคอมมิชชันแนะนำตรง 100%:\\n" +
                     "https://NoinashopNLM.com/?sponsor=" + (data.id || "") + "\\n\\n" +
                     "คุณสามารถนำรหัสสมาชิก หรือ อีเมลด้านบน ร่วมกับรหัสผ่านของคุณ เพื่อล็อกอินเข้าสู่ระบบสมาชิกหลังบ้านเพื่อตรวจสอบสถิติคะแนนสะสม โบนัสจับคู่จ่าย และแผนภาพต้นไม้สายงานได้ทันที!\\n\\n" +
                     "ขอแสดงความนับถืออย่างสูง,\\nทีมงาน Noinashop Support\\nสายด่วนผู้บริหาร คุณไวพจน์ โสมภา 081-160-1092";
                     
          MailApp.sendEmail(data.email, subject, body);
          mailStatus = "ส่งเมลยินดีต้อนรับเรียบร้อยแล้ว";
        } catch (mailError) {
          mailStatus = "ส่งเมลไม่สำเร็จ: " + mailError.toString() + " (แต่วางข้อมูลลงสเปรดชีตสำเร็จแล้ว)";
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        success: true,
        message: "บันทึกรายชื่อสมาชิกใหม่เรียบร้อย! " + mailStatus 
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      // 2. จัดการข้อมูลคำสั่งซื้อสินค้า (Order Logic)
      var sheet = ss.getSheetByName("Orders");
      if (!sheet) {
        try {
          sheet = ss.insertSheet("Orders");
        } catch (e) {
          sheet = ss.getSheets()[0]; // fallback
        }
      }
      
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Order ID", "Date Ordered", "Customer Name", "Phone", "Email", 
          "Address", "Items Ordered", "Total BV", "Subtotal", "Shipping Fee", 
          "COD Fee", "Total Amount", "Payment Method", "Slip URL"
        ]);
      }
      
      var orderId = data.orderId || "";
      var customerName = data.name || data.customerName || "";
      var customerPhone = data.phone || data.customerPhone || "";
      var customerEmail = data.email || data.customerEmail || "";
      var customerAddress = data.address || data.customerAddress || "";
      
      var itemsStr = "";
      if (data.items && Array.isArray(data.items)) {
        itemsStr = data.items.map(function(item) {
          var prodName = item.name || (item.product && item.product.name) || "สินค้าไอที";
          return prodName + " (" + item.quantity + " ชิ้น)";
        }).join(", ");
      } else {
        itemsStr = "ไม่ได้ระบุรายการสินค้า";
      }
      
      var totalBV = data.totalBV || 0;
      var subtotal = data.subtotal || 0;
      if (subtotal === 0 && data.totalAmount) {
        subtotal = data.totalAmount - (data.shippingFee || 50) - (data.codFee || 0);
      }
      var shippingFee = data.shippingFee !== undefined ? data.shippingFee : 50;
      var codFee = data.codFee || 0;
      var totalAmount = data.totalAmount || (subtotal + shippingFee + codFee);
      
      // เพิ่มแถวข้อมูลการสั่งซื้อ
      sheet.appendRow([
        orderId,
        new Date().toLocaleString("th-TH"),
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        itemsStr,
        totalBV,
        subtotal,
        shippingFee,
        codFee,
        totalAmount,
        data.paymentMethod === "cod" ? "เก็บเงินปลายทาง" : "เงินสด / โอนพร้อมเพย์ ไวพจน์",
        data.slipUrl || ""
      ]);
      
      // ส่งอีเมลตอบกลับออเดอร์ถึงผู้รับทันทีตามที่ลูกค้าระบุไว้!
      var mailStatus = "No email address provided";
      if (customerEmail) {
        try {
          var subject = "ยืนยันคำสั่งซื้อ Noinashop MLM ออเดอร์ #" + orderId;
          var body = "เรียนคุณ " + customerName + ",\\n\\n" +
                     "ขอขอบพระคุณสำหรับการสั่งซื้อสินค้าไอทีมือสองกับ Noinashop ทางเราได้รับยอดจดและเริ่มแพ็คของเรียบร้อย\\n\\n" +
                     "--------------------------------------------------\\n" +
                     " รายละเอียดใบสั่งซื้อออเดอร์ #" + orderId + "\\n" +
                     "--------------------------------------------------\\n" +
                     "● สินค้าที่สั่งซื้อ: " + itemsStr + "\\n" +
                     "● ยอดสะสมคะแนน: +" + totalBV + " BV (คะแนนไหลเข้าสู่สายงานคุณ)\\n" +
                     "● ค่าจัดส่งพัสดุด่วน: " + shippingFee + " บาท\\n" +
                     "● ยอดสุทธิทั้งสิ้น: " + totalAmount.toLocaleString() + " บาท\\n" +
                     "● วิธีการชำระเงิน: " + (data.paymentMethod === "cod" ? "เก็บเงินปลายทาง (ชาร์จเพิ่ม 3%)" : "โอนเงินเข้าบัญชีพร้อมเพย์ คุณไวพจน์ โสมภา 081-160-1092") + "\\n" +
                     "● ที่อยู่สำหรับการจัดส่ง: " + customerAddress + "\\n\\n" +
                     "--------------------------------------------------\\n" +
                     " 🔑 ข้อมูลสมาชิกและรหัสผู้แนะนำ MLM ของคุณ\\n" +
                     "--------------------------------------------------\\n" +
                     "● รหัสแนะนำส่วนตัวของคุณ: " + (data.sponsorCode || data.memberId || "") + "\\n" +
                     "โปรดเก็บรหัสนี้ส่งต่อให้สมาชิกใหม่ใช้ลงทะเบียนต่อผังไบนารีด้านซ้าย/ขวา เพื่อรับโบนัสคอมมิชชันทีมสูงสุด 20% !\\n\\n" +
                     "ขอแสดงความนับถืออย่างสูง,\\nทีมงาน Noinashop Support\\nสายด่วน 081-160-1092";
                        
          MailApp.sendEmail(customerEmail, subject, body);
          mailStatus = "ส่งเมลออเดอร์สำเร็จแล้ว";
        } catch (mailError) {
          mailStatus = "ส่งเมลออเดอร์ล้มเหลว: " + mailError.toString() + " (แต่วางข้อมูลลงสเปรดชีตสำเร็จแล้ว)";
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        success: true,
        message: "บันทึกข้อมูลใบสั่งซื้อสินค้าเรียบร้อย! " + mailStatus 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      success: false, 
      message: "เกิดข้อผิดพลาดภายในสคริปต์: " + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: PRODUCTS INVENTORY SYNC */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-slate-800">ระบบดึงข้อมูลสินค้าจาก Google Sheets</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                  Facebook & Noina Shop Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                รองรับฟอร์แมตมาตรฐาน Facebook Catalog (Meta Commerce Manager) ลงครั้งเดียวขึ้นทั้ง Noinashop และ Facebook Shop
              </p>
            </div>
          </div>

          {/* Format Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormatTab('facebook')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                formatTab === 'facebook'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              ฟอร์แมต Facebook Catalog (แนะนำ)
            </button>
            <button
              type="button"
              onClick={() => setFormatTab('simple')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                formatTab === 'simple'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              แบบดั้งเดิม (Simple)
            </button>
          </div>
        </div>

        {/* Tab 1: Facebook Catalog Format Guide (Recommended) */}
        {formatTab === 'facebook' ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-slate-700 text-xs shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-xs sm:text-sm">
                      จัด Google Sheet ให้ตรงกับ Facebook Catalog เพื่อให้ข้อมูลไปโชว์ทั้ง 2 ฝั่ง
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      เมื่อใช้หัวตารางและโครงสร้างตามมาตรฐาน Meta Commerce Manager ข้อมูลสินค้าใน Google Sheet จะดึงเข้าเว็บ Noina Shop พร้อมคำนวณคะแนน BV และสามารถนำลิงก์เดียวกันไปใช้เป็น Data Feed ใน Facebook Shop ได้ทันที!
                    </p>
                  </div>
                </div>

                {/* Action Buttons for Facebook */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyFbHeader}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    title="คัดลอกแถวหัวตารางไปวางในแถวที่ 1 ของ Google Sheet"
                  >
                    {copiedFbHeader ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                    {copiedFbHeader ? 'คัดลอกหัวตารางแล้ว!' : 'คัดลอกหัวตาราง Facebook'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadFbTemplate}
                    disabled={downloadingFbTemplate}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    {downloadingFbTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    ดาวน์โหลดแม่แบบ (.csv)
                  </button>
                </div>
              </div>

              {/* Facebook Column Header Chips */}
              <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-blue-100 space-y-2">
                <span className="block text-[11px] font-bold text-slate-800">
                  📋 แถวหัวตารางที่ต้องมีใน Google Sheet (แถวที่ 1):
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">id (รหัสสินค้า)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">title (ชื่อสินค้า)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">description (รายละเอียด)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">availability (in stock / out of stock)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">condition (new / refurbished / used)</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-md">price (ราคา เช่น 99.00 THB)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">link (ลิงก์เว็บ)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">image_link (ลิงก์รูปหลัก)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">brand (ยี่ห้อ)</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold rounded-md">item_group_id (รหัสกลุ่มตัวเลือก)</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold rounded-md">size (ขนาด/วัตต์)</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold rounded-md">color (สี/แสง)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">additional_image_link (รูปเสริม)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">sale_price (ราคาโปร)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">inventory (จำนวนสต็อก)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">product_type (หมวดหมู่ร้าน)</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-md">custom_label_0 (คะแนน BV)</span>
                </div>
              </div>

              {/* Key Features Breakdown for Facebook */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    การรวมตัวเลือก (Variants)
                  </span>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    สินค้าที่มีหลายขนาด (เช่น 20W และ 25W หรือ 2x4 และ 4x4) ให้ลงแยกแถวกัน โดยใส่ <code className="bg-purple-50 text-purple-700 px-1 py-0.2 rounded font-mono">item_group_id</code> เหมือนกัน และใส่ขนาดในช่อง <code className="bg-purple-50 text-purple-700 px-1 py-0.2 rounded font-mono">size</code> ระบบจะรวมเป็นการ์ดเดียวกันที่มีปุ่มให้เลือกขนาดพร้อมราคาที่ตรงกันทันที!
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    คะแนนธุรกิจ BV (Noina Shop)
                  </span>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    ใส่คะแนน BV ในช่อง <code className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded font-mono">custom_label_0</code> เช่น <code className="text-slate-800">14 BV</code> หรือ <code className="text-slate-800">14</code> (หรือใส่คอลัมน์ <code className="text-slate-800 font-mono">bv</code> ตรงๆ) ทั้งสองฝั่งจะอ่านได้ถูกต้อง 100%
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    รูปแบบราคาและรูปภาพ
                  </span>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    ในช่อง <code className="bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded font-mono">price</code> ใส่ได้ทั้ง <code className="text-slate-800">99.00 THB</code> หรือ <code className="text-slate-800">99 THB</code> ส่วนรูปหลักใส่ใน <code className="text-slate-800 font-mono">image_link</code> และรูปเสริมใส่ใน <code className="text-slate-800 font-mono">additional_image_link</code> คั่นด้วยจุลภาค
                  </p>
                </div>
              </div>

              {/* Sample Data Table Preview */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700">ตัวอย่างข้อมูลจริงใน Google Sheet (ตามมาตรฐาน Facebook Catalog):</span>
                  <span className="text-[10px] text-slate-500">เลื่อนแนวนอนเพื่อดูคอลัมน์ทั้งหมด</span>
                </div>
                <div className="overflow-x-auto text-[10px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
                        <th className="p-2 border-r">id</th>
                        <th className="p-2 border-r">item_group_id</th>
                        <th className="p-2 border-r">title</th>
                        <th className="p-2 border-r">size</th>
                        <th className="p-2 border-r">price</th>
                        <th className="p-2 border-r">availability</th>
                        <th className="p-2 border-r">custom_label_0 (BV)</th>
                        <th className="p-2">image_link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 whitespace-nowrap text-slate-600 font-mono">
                      <tr className="hover:bg-blue-50/40">
                        <td className="p-2 font-bold text-blue-700 border-r">DAI-A95-20W</td>
                        <td className="p-2 text-purple-700 font-bold border-r">GRP-DAI-A95</td>
                        <td className="p-2 text-slate-800 font-sans border-r">DAI_ICHI หลอดไฟ LED A95 Bulb</td>
                        <td className="p-2 font-bold text-purple-800 border-r">20W</td>
                        <td className="p-2 text-emerald-700 font-bold border-r">139.00 THB</td>
                        <td className="p-2 text-emerald-600 border-r">in stock</td>
                        <td className="p-2 text-amber-700 font-bold border-r">14 BV</td>
                        <td className="p-2 truncate max-w-xs text-slate-400 font-sans">https://.../ee0604a2...jpg</td>
                      </tr>
                      <tr className="hover:bg-blue-50/40">
                        <td className="p-2 font-bold text-blue-700 border-r">DAI-A95-25W</td>
                        <td className="p-2 text-purple-700 font-bold border-r">GRP-DAI-A95</td>
                        <td className="p-2 text-slate-800 font-sans border-r">DAI_ICHI หลอดไฟ LED A95 Bulb</td>
                        <td className="p-2 font-bold text-purple-800 border-r">25W</td>
                        <td className="p-2 text-emerald-700 font-bold border-r">259.00 THB</td>
                        <td className="p-2 text-emerald-600 border-r">in stock</td>
                        <td className="p-2 text-amber-700 font-bold border-r">26 BV</td>
                        <td className="p-2 truncate max-w-xs text-slate-400 font-sans">https://.../ee0604a2...jpg</td>
                      </tr>
                      <tr className="hover:bg-blue-50/40 bg-slate-50/50">
                        <td className="p-2 font-bold text-blue-700 border-r">LEK-BLK-2X4</td>
                        <td className="p-2 text-purple-700 font-bold border-r">GRP-LEK-BLK</td>
                        <td className="p-2 text-slate-800 font-sans border-r">บล็อกยางพร้อมเต้ารับกราวด์คู่ LeKise</td>
                        <td className="p-2 font-bold text-purple-800 border-r">2 x 4</td>
                        <td className="p-2 text-emerald-700 font-bold border-r">189.00 THB</td>
                        <td className="p-2 text-emerald-600 border-r">in stock</td>
                        <td className="p-2 text-amber-700 font-bold border-r">18.9 BV</td>
                        <td className="p-2 truncate max-w-xs text-slate-400 font-sans">https://.../3ef32740...jpg</td>
                      </tr>
                      <tr className="hover:bg-blue-50/40 bg-slate-50/50">
                        <td className="p-2 font-bold text-blue-700 border-r">LEK-BLK-4X4</td>
                        <td className="p-2 text-purple-700 font-bold border-r">GRP-LEK-BLK</td>
                        <td className="p-2 text-slate-800 font-sans border-r">บล็อกยางพร้อมเต้ารับกราวด์คู่ LeKise</td>
                        <td className="p-2 font-bold text-purple-800 border-r">4 x 4</td>
                        <td className="p-2 text-emerald-700 font-bold border-r">239.00 THB</td>
                        <td className="p-2 text-emerald-600 border-r">in stock</td>
                        <td className="p-2 text-amber-700 font-bold border-r">23.9 BV</td>
                        <td className="p-2 truncate max-w-xs text-slate-400 font-sans">https://.../3ef32740...jpg</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step by step to publish and connect */}
              <div className="pt-2 border-t border-blue-200/60">
                <span className="block font-bold text-slate-800 mb-2">📌 ขั้นตอนการเชื่อมต่อ Google Sheet เข้ากับ Noina Shop และ Facebook Commerce Manager:</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                  <li>เปิด Google Sheet ของคุณ และคัดลอกแถวหัวตารางด้านบนไปวางที่แถวที่ 1</li>
                  <li>กรอกรายการสินค้าของคุณ (ระบุราคาพร้อม <code className="font-mono text-emerald-700">THB</code> และหากมีหลายขนาดให้ใส่ <code className="font-mono text-purple-700">item_group_id</code> เหมือนกัน)</li>
                  <li>ใน Google Sheet ไปที่เมนู <strong>ไฟล์ (File)</strong> &gt; <strong>แชร์ (Share)</strong> &gt; <strong>เผยแพร่ทางเว็บ (Publish to web)</strong> &gt; เลือกประเภทเป็น <strong>ค่าที่คั่นด้วยจุลภาค (.csv)</strong> แล้วกด "เผยแพร่"</li>
                  <li>คัดลอกลิงก์ที่ได้มาวางในช่อง <strong>"ลิงก์ Google Sheet"</strong> ด้านล่างนี้ แล้วกดปุ่ม <strong>"ดึงข้อมูล"</strong> เพื่ออัปเดตเว็บ Noina Shop</li>
                  <li>นำลิงก์เดียวกัน (หรือกดปุ่มคัดลอก Live Feed ด้านล่าง) ไปวางใน <strong>Facebook Commerce Manager</strong> &gt; <strong>Catalog (แคตตาล็อก)</strong> &gt; <strong>Data Sources (แหล่งข้อมูล)</strong> &gt; <strong>Data Feed</strong> สินค้าจะซิงก์ไปแสดงบน Facebook Shop ทันที!</li>
                </ol>
              </div>

              {/* Live Facebook Catalog Feed URL Card */}
              <div className="p-3 bg-white/90 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold text-slate-800">
                      ลิงก์ Live Facebook Feed URL ของร้านคุณ (ส่งให้ Facebook Commerce Manager ได้โดยตรง):
                    </span>
                    <span className="block text-[10px] text-blue-600 truncate font-mono">
                      {fbFeedUrl}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFbFeedUrl}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedFbFeedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFbFeedUrl ? 'คัดลอก Feed URL แล้ว!' : 'คัดลอก Feed URL'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Simple Format Guide (Legacy) */
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-1">
              <Database className="w-4 h-4 text-emerald-600" />
              วิธีการจัดเตรียม Google Sheet แบบดั้งเดิม (Simple Format):
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
              <li>สร้าง Google Sheet และใส่แถวหัวข้อแรก (แถวที่ 1) ดังนี้: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">Name, Description, Price, BV, Image, Category, Brand, Condition, Stock, Options</code></li>
              <li>คอลัมน์ <strong>Category</strong>: สามารถระบุหมวดหมู่ เช่น <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">เครื่องใช้ไฟฟ้า</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">อุปกรณ์ส่องสว่าง</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">smartphone</code> เป็นต้น</li>
              <li>คอลัมน์ <strong>Options</strong>: ใส่ตัวเลือกคั่นด้วยจุลภาค เช่น <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">20W:139:14, 25W:259:26</code> หรือ <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">2 x 4, 4 x 4</code></li>
              <li>ไปที่เมนู <strong>ไฟล์ (File)</strong> &gt; <strong>แชร์ (Share)</strong> &gt; <strong>เผยแพร่ทางเว็บ (Publish to web)</strong> &gt; เลือก <strong>.csv</strong> จากนั้นกดปุ่ม "เผยแพร่"</li>
              <li>คัดลอกลิงก์ที่ได้ มาวางในช่องกรอกด้านล่างเพื่อทำการดึงข้อมูล</li>
            </ol>
          </div>
        )}

        {/* Sync Form */}
        <form onSubmit={handleSync} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-slate-400" />
              ลิงก์ Google Sheet เว็บแบบ CSV (.csv) หรือลิงก์ Google Sheets สาธารณะ
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="วางลิงก์ Google Sheet แบบ CSV (.csv) ที่แชร์ต่อสาธารณะแล้ว"
                className="flex-grow px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                ดึงข้อมูลสินค้า
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {status.type !== 'idle' && (
            <div className={`p-4 rounded-xl text-xs flex gap-2 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{status.message}</span>
            </div>
          )}
        </form>

        {/* Clean CSV Download / Quick Copy */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">Google Sheet / CSV ฉบับแก้ไขเรียบร้อย (คลีนและพร้อมใช้งาน)</p>
              <p className="text-[11px] text-indigo-700">ตัดแถวว่าง จัดระเบียบตัวเลือก และคำนวณคะแนน BV ให้อัตโนมัติ สามารถดาวน์โหลดไปเปิดใน Excel หรือ Google Sheets ได้ทันที</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCleanCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              {copiedCleanCsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCleanCsv ? 'คัดลอกแล้ว!' : 'คัดลอกข้อมูล'}
            </button>
            <button
              type="button"
              onClick={handleDownloadCleanCsv}
              disabled={downloadingCsv}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              {downloadingCsv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {/* Sync Preview Panel */}
        {previewProducts.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="font-semibold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              พรีวิวสินค้าที่ดึงมา ({previewProducts.length} รายการ)
            </h4>
            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
              {previewProducts.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-slate-50 border border-slate-100 rounded-lg p-2.5 hover:bg-slate-100 transition">
                  <img referrerPolicy="no-referrer" src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-white border border-slate-200" />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{p.name}</h5>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] uppercase font-bold shrink-0">{p.category}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{stripHtml(p.description)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-xs font-bold text-slate-800">{p.price.toLocaleString()} ฿</span>
                    <span className="block text-[10px] font-medium text-indigo-600 font-mono">+{p.bv} BV</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: NEW REQUIREMENT - GOOGLE SHEET ORDER WEBHOOK & AUTOMATED EMAIL SCRIPT */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800">ระบบบันทึกออเดอร์ & ส่งอีเมลยืนยันอัตโนมัติ (Google Sheets)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">เชื่อมต่อใบสั่งซื้อจากทางหน้าเว็บ ยิงข้อมูลเข้าชีต และส่งอีเมลหาลูกค้าทันทีเมื่อกดซื้อสินค้าสำเร็จ</p>
          </div>
        </div>

        {/* Empathy & Alternative Solution Banner for Admin */}
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-100/80 rounded-2xl p-4 md:p-5 text-slate-700 text-xs shadow-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-indigo-900 text-xs sm:text-sm">💡 เหนื่อยกับการดีพลอยสคริปต์ Google Apps Script หรือติดปัญหา 404 ใช่ไหม? มีวิธีที่ง่ายกว่านั้น 100%!</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                เนื่องจากปัญหาระบบของ Google (Multi-Account Login Bug) ทำให้บ่อยครั้งที่การ Deploy สคริปต์ Web App เกิดข้อผิดพลาดและส่งเมลหรือเขียนข้อมูลไม่เข้า ซึ่งเป็นปัญหาที่พบบ่อยระดับโลก... <strong>เราเตรียมทางเลือกใหม่ที่เป็นระบบอัตโนมัติและเสถียรที่สุดมาให้คุณแล้ว:</strong>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[10px] md:text-[11px]">
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/50 space-y-1">
              <span className="block font-bold text-slate-800">📊 บันทึกลงเซิร์ฟเวอร์เรียลไทม์</span>
              <p className="text-slate-500 text-[10px]">ข้อมูลสมาชิก ออเดอร์ และสายงาน จะถูกเซฟลงระบบ Noina Shop โดยตรง ไม่ต้องตั้งค่า Webhook ใดๆ</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/50 space-y-1">
              <span className="block font-bold text-slate-800">📥 ดาวน์โหลด Excel ได้ใน 1 คลิก</span>
              <p className="text-slate-500 text-[10px]">ในแท็บ "ข้อมูลสมาชิก" และ "รายการสั่งซื้อ" จะมีปุ่มดาวน์โหลดไฟล์ Excel/CSV นำไปวางใน Google Sheets ได้เลย</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/50 space-y-1">
              <span className="block font-bold text-indigo-700">💬 ส่งแจ้งเตือน LINE / อีเมล</span>
              <p className="text-slate-500 text-[10px]">มีปุ่ม "ส่งใบเสร็จทาง LINE" และ "ส่งเมล" กดส่งหาลูกค้าได้ทันทีจากหน้าเว็บ สวยงาม สะดวกสบาย ไร้ปัญหาเชื่อมต่อ!</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center italic pt-1">
            * หากขี้เกียจดีพลอย Apps Script คุณสามารถข้ามขั้นตอนกรอก Webhook ด้านล่างนี้ไปได้เลย และใช้ระบบออฟไลน์/อัจฉริยะในการบริหารร้าน Noina Shop ได้อย่างสมบูรณ์แบบร้อยเปอร์เซ็นต์!
          </p>
        </div>

        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ลิงก์ Webhook URL ของระบบ Google Apps Script (สำหรับรับข้อมูลจัดเก็บและสั่งส่งเมล์)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={webhookUrl}
                onChange={(e) => {
                  let val = e.target.value;
                  const trimmed = val.trim();
                  
                  // If it contains "ript.google.com" or "https:" typos, or is a long pasted string (length > 20) with standard patterns,
                  // we sanitize it instantly to provide real-time correction.
                  if (
                    trimmed.includes('ript.google') || 
                    trimmed.includes('https://https') || 
                    trimmed.includes('https:/s') || 
                    trimmed.includes('https//s') ||
                    (trimmed.length > 20 && !trimmed.includes(' ') && (trimmed.includes('script.google') || /^AKfy/.test(trimmed)))
                  ) {
                    val = superSanitizeWebhookUrl(val);
                  } else if (/^AKfy[a-zA-Z0-9_\-]{50,80}$/.test(trimmed)) {
                    val = `https://script.google.com/macros/s/${trimmed}/exec`;
                  }
                  setWebhookUrl(val);
                }}
                onBlur={(e) => {
                  if (e.target.value) {
                    setWebhookUrl(superSanitizeWebhookUrl(e.target.value));
                  }
                }}
                placeholder="วาง Web App URL หรือวางรหัส Deployment ID ได้เลยที่นี่"
                className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึก URL
              </button>
            </div>
            {webhookSaveStatus && (
              <p className="text-[11px] text-emerald-600 font-bold mt-1.5">✓ {webhookSaveStatus}</p>
            )}

            {getUrlWarning(webhookUrl) && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed font-medium">
                <span className="font-bold block mb-1">💡 ตรวจพบความผิดปกติของลิงก์:</span>
                {getUrlWarning(webhookUrl)}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 border border-slate-200 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${testingWebhook ? 'animate-spin' : ''}`} />
                {testingWebhook ? 'กำลังทดสอบเชื่อมต่อ...' : '⚡ ทดสอบการเชื่อมต่อ (Test Webhook)'}
              </button>
            </div>

            {testResult && (
              <div className="space-y-3 mt-3">
                <div className={`p-3.5 rounded-xl text-xs border leading-relaxed ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResult.message}
                </div>

                {testResult.trace && testResult.trace.length > 0 && (
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-[10.5px] leading-relaxed space-y-1.5 overflow-x-auto shadow-inner border border-slate-800">
                    <div className="text-slate-400 font-sans font-bold border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between items-center">
                      <span className="flex items-center gap-1.5">🕵️ รายละเอียดขั้นตอนการเชื่อมต่อ (Request Trace Logs)</span>
                      <span className="text-[9px] bg-indigo-900/60 border border-indigo-700 px-1.5 py-0.5 rounded text-indigo-300 font-bold uppercase tracking-wider">Technical Log</span>
                    </div>
                    {testResult.trace.map((step: any, index: number) => (
                      <div key={index} className="space-y-0.5 pb-1 border-b border-slate-800/40 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <span className={step.status === 200 || step.status === 302 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            [Step {step.step}] {step.method}
                          </span>
                          <span className={step.status === 200 || step.status === 302 ? 'text-emerald-300 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-900' : 'text-rose-300 bg-rose-950/60 px-1 py-0.2 rounded border border-rose-900'}>
                            {step.status || 'Failed'} {step.statusText || ''}
                          </span>
                        </div>
                        <div className="text-slate-400 break-all pl-3 text-[10px]">
                          URL: <span className="text-sky-300 select-all font-mono">{step.url}</span>
                        </div>
                        {step.redirectUrl && (
                          <div className="text-amber-400 break-all pl-3 text-[10px]">
                            ➡️ Redirect to: <span className="text-amber-300 font-mono">{step.redirectUrl}</span>
                          </div>
                        )}
                        {step.error && (
                          <div className="text-rose-400 pl-3 text-[10px] font-bold">
                            ⚠️ Error: {step.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!testResult.success && (testResult.message.includes('404') || testResult.message.includes('ไม่พบหน้า')) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h5 className="font-bold text-amber-950 text-[13px]">📍 คู่มือแก้ไขปัญหาข้อผิดพลาด 404 (ด่วนที่สุดใน 1 นาที)</h5>
                    </div>
                    <p className="leading-relaxed text-[11.5px]">
                      สาเหตุหลักที่ขึ้น <strong>404 Not Found</strong> เกิดจากระบบของ Google มองไม่เห็น Deployment ID ที่ส่งไป (สคริปต์ยังไม่ได้ถูกทำเป็น Web App อย่างถูกต้อง หรือสิทธิ์จำกัดไว้เฉพาะตัวเอง) โปรดทำตามขั้นตอนนี้เพื่อเปิดสิทธิ์และแก้ไขให้ใช้งานได้ทันทีครับ:
                    </p>
                    <div className="space-y-2.5 pl-1">
                      <div className="flex gap-2 text-[11.5px] leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="font-bold text-amber-950">ต้องทำการ "Deploy" (การทำให้ใช้งานได้จริง) ใหม่ทุกครั้ง</p>
                          <p className="text-amber-800 text-[11px]">หากมีการแก้ไขสคริปต์หรือเพิ่งแปะโค้ดเป็นครั้งแรก ท่านต้องกดปุ่ม <strong>Deploy &gt; New deployment (การทำให้ใช้งานได้ใหม่)</strong> เสมอครับ (การกดเซฟแผ่นดิสก์เฉยๆ จะไม่มีผลต่อลิงก์เว็บ)</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[11.5px] leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="font-bold text-amber-950">ตรวจสอบ "ประเภท" ของการ Deploy (ต้องเลือก "เว็บแอป")</p>
                          <p className="text-amber-800 text-[11px]">ในหน้าต่าง New deployment ให้คลิกรูป <strong>ฟันเฟือง (Gear)</strong> ถัดจากหัวข้อ "เลือกประเภท (Select type)" แล้วเลือก <strong>"เว็บแอป" (Web App)</strong> <span className="text-rose-700 font-semibold">(สำคัญมาก! หากไม่ได้เลือกเป็นเว็บแอป Google จะตอบกลับเป็น 404)</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[11.5px] leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="font-bold text-amber-950">ตั้งค่าสิทธิ์ผู้เข้าถึงให้เป็น "ทุกคน" (Anyone)</p>
                          <ul className="list-disc pl-4 mt-1 text-amber-800 text-[11px] space-y-0.5">
                            <li><strong>Execute as (เรียกใช้ในฐานะ):</strong> เลือกเป็น <span className="font-semibold text-amber-950">"Me" (ฉัน - admin@noinashop.business)</span></li>
                            <li><strong>Who has access (ผู้มีสิทธิ์เข้าถึง):</strong> ต้องเปลี่ยนจาก "Only myself" เป็น <strong className="text-rose-700 font-bold">"Anyone" (ทุกคน)</strong></li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[11.5px] leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">4</span>
                        <div>
                          <p className="font-bold text-amber-950">กดปุ่ม Deploy และยืนยันสิทธิ์ความปลอดภัย (Authorize Access)</p>
                          <p className="text-amber-800 text-[11px]">หลังกด Deploy จะมีปุ่มสีฟ้าคำว่า <strong>"Authorize Access"</strong> ให้คลิกแล้วล็อกอินบัญชี Google ของท่าน จากนั้นเลือก <strong>"Advanced" (ขั้นสูง) &gt; "Go to... (unsafe)" &gt; "Allow" (อนุญาต)</strong> เพื่ออนุญาตให้สคริปต์ทำงานและส่งเมลได้</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[11.5px] leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">5</span>
                        <div>
                          <p className="font-bold text-amber-950">คัดลอกลิงก์ Web App ลิงก์ที่ลงท้ายด้วย "/exec" มาวาง</p>
                          <p className="text-amber-800 text-[11px]">คัดลอก URL สี่เหลี่ยมสีน้ำเงินด้านล่างสุดของหน้าจอสำเร็จ สังเกตว่าจะลงท้ายด้วย <code>/exec</code> เสมอ แล้วนำมาวางในช่อง บันทึก URL ด้านบนนี้ แล้วทดสอบใหม่อีกครั้งครับ!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Logo Configuration Section */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-800">ตั้งค่าโลโก้ร้าน (Logo Shop Settings)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">วางลิงก์รูปภาพโลโก้ร้านที่คุณต้องการนำมาแสดงผลแทนไอคอนโทรศัพท์ของระบบ</p>
            </div>
          </div>

          <form onSubmit={handleSaveLogo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ที่อยู่อินเทอร์เน็ตของไฟล์รูปโลโก้ (Logo Image URL)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="ตัวอย่างเช่น: https://example.com/logo.png หรือ ลิงก์รูปภาพอัปโหลดอื่นๆ"
                  className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกโลโก้
                </button>
              </div>
              {logoSaveStatus && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1.5">✓ {logoSaveStatus}</p>
              )}
              
              {logoUrl && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500">ตัวอย่างโลโก้:</div>
                  <img 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/noinalogo/100/100';
                    }}
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-slate-400 italic">หากภาพไม่ขึ้น โปรดตรวจสอบว่าลิงก์รูปภาพเป็นสาธารณะจริงและถูกต้อง</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Code Guide button */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 flex items-center gap-1">
              <Code className="w-4 h-4 text-indigo-600" />
              ชุดสคริปต์ Google Apps Script (สำเร็จรูปพร้อมส่งเมลยืนยัน):
            </h4>
            <button
              type="button"
              onClick={() => setShowScriptCode(!showScriptCode)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-2.5 py-1 rounded-lg bg-white shadow-sm"
            >
              {showScriptCode ? 'ซ่อนชุดโค้ด' : 'แสดงชุดโค้ด'}
            </button>
          </div>
          
          <p className="text-[11px] leading-relaxed text-slate-500">
            เพียงนำสคริปต์นี้ไปแปะในหน้า <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong> ของสเปรดชีตของคุณ จากนั้นกด <strong>การใช้งานได้จริง (Deploy) &gt; จัดการการใช้งานแบบใหม่ (New deployment)</strong> เลือกประเภทเป็น <strong>เว็บแอป (Web App)</strong> ตั้งค่าให้ "ทุกคนเข้าถึงได้ (Anyone)" แล้วนำลิงก์ที่ได้มาบันทึกข้างต้น!
          </p>

          {showScriptCode && (
            <div className="space-y-4">
              {/* CRITICAL WARNING BANNER FOR syntax error line 19 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-[11px] text-amber-800 leading-relaxed shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 text-xs">⚠️ แก้ไขปัญหา: เกิดข้อผิดพลาด SyntaxError: Unexpected end of input บรรทัด 19 ใน Google Apps Script</p>
                  <p>สาเหตุหลักเกิดจากการที่ท่านลากคลุมคัดลอกโค้ดไปได้ไม่ครบถ้วน (โค้ดจริงมีทั้งหมด 150 กว่าบรรทัด แต่คัดลอกไปได้เพียง 19 บรรทัดแรกเท่านั้น เนื่องจากติดกรอบขนาดหน้าต่างเลื่อน)</p>
                  <p className="font-semibold text-indigo-900 mt-2">ขั้นตอนการแก้ไขให้ใช้งานได้ทันที:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 text-indigo-950 font-medium">
                    <li>คลิกที่ปุ่ม <strong className="underline">"คัดลอกโค้ดทั้งหมด (Copy All)"</strong> สีน้ำเงินด้านล่างนี้ (ระบบจะดึงโค้ดทุกบรรทัดให้ทันที)</li>
                    <li>หรือคลิกที่ปุ่ม <strong className="underline">"ขยายเต็มจอ"</strong> แล้วคลิก <strong className="underline">"เลือกโค้ดทั้งหมด"</strong> เพื่อให้ระบบไฮไลท์คลุมดำโค้ดทั้งหมด 100% แล้วกดคัดลอกเอง</li>
                    <li>ในหน้าเว็บ Google Apps Script (รหัส.gs) ให้กด <strong className="underline">Ctrl + A (หรือ Cmd + A บน Mac) เพื่อคลุมดำทั้งหมด ของเก่าที่ค้างอยู่ในหน้าต่าง แล้วกดปุ่ม Delete ลบออกให้หมดเกลี้ยงจนเป็นหน้าว่างเปล่า</strong></li>
                    <li>กดวาง (Paste / Ctrl + V) โค้ดทั้งหมดที่คัดลอกมาลงไปแทนที่ จากนั้นกดปุ่ม <strong className="underline">บันทึก (รูปแผ่นดิสก์)</strong> และทำตามขั้นตอน Deploy ใหม่ได้เลยครับ!</li>
                    <li><strong>สำคัญมาก:</strong> ในการใช้ครั้งแรก Google Apps Script จะขึ้นหน้าต่างถามสิทธิ์ส่งเมล (Authorization Required) ให้กดยอมรับและยินยอมการเข้าถึงสิทธิ์อีเมลด้วยนะครับ</li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold leading-relaxed">
                  💡 คำแนะนำ: แนะนำให้ลบโค้ดเดิมในเว็บ Google Apps Script ออกทั้งหมดให้เกลี้ยงก่อนวาง เพื่อป้องกันโค้ดทับซ้อนกัน
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      คัดลอกสำเร็จ!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      คัดลอกโค้ดทั้งหมด (Copy All)
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre 
                  ref={codeRef}
                  className={`bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-[10px] leading-relaxed font-mono select-all transition-all duration-300 ${
                    expandCode ? 'max-h-none' : 'max-h-[350px]'
                  }`}
                >
                  {appsScriptCode}
                </pre>
                
                {/* Expand & Select All Controls */}
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700 transition shadow-sm"
                  >
                    เลือกโค้ดทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandCode(!expandCode)}
                    className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700 transition shadow-sm"
                  >
                    {expandCode ? 'ย่อหน้าต่าง' : 'ขยายเต็มจอ'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                *สคริปต์ด้านบนรองรับระบบจัดส่งเมลด้วย `MailApp.sendEmail` ของ Google Workspace ทำให้ลูกค้าได้รับใบเสร็จยืนยันทันที!
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
