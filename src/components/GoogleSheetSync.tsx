/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Database, Link, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet, Eye, Code, Save, Mail, Copy, Check } from 'lucide-react';
import { parseCSV, DEMO_SPREADSHEET_DATA, DEFAULT_SHEET_URL, getCleanSheetUrl, parseSheetData, stripHtml } from '../utils/sheetParser';

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

  // Webhook integration states
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('noina_order_webhook_url') || '';
  });

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
        }
      } catch (err) {
        console.error('Failed to load products-store config:', err);
      }
    };
    fetchConfig();
  }, []);
  const [webhookSaveStatus, setWebhookSaveStatus] = useState<string>('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [expandCode, setExpandCode] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  // Helper to check if a URL is likely truncated
  const getUrlWarning = (url: string) => {
    if (!url) return null;
    let clean = url.trim().replace(/^['"<>[\]\s]+|['"<>[\]\s]+$/g, '');
    clean = clean.replace(/\.+\s*$/, '');
    
    // If it's a raw deployment ID, check if its length is less than 73
    if (/^AKfy[a-zA-Z0-9_\-]{50,80}$/.test(clean)) {
      if (clean.length < 73) {
        return `⚠️ รหัส Deployment ID ที่กรอกสั้นเกินไป (ยาวเพียง ${clean.length} ตัวอักษร แทนที่จะเป็นอย่างน้อย 74 ตัวอักษร) โปรดคลิกปุ่ม "คัดลอก" (Copy) จากระบบ Google Apps Script เพื่อคัดลอกรหัสที่ถูกต้องและสมบูรณ์มาวางใหม่`;
      }
      return null;
    }
    
    if (clean.includes('...')) {
      return '⚠️ ตรวจพบอักษรจุดไข่ปลา (...) ในลิงก์! สิ่งนี้เกิดจากการคัดลอกจากหน้าจอที่แสดงไม่ครบถ้วนจาก Google โปรดคัดลอก "รหัสการทำให้ใช้งานได้" (Deployment ID) มาวางในช่องนี้แทนได้เลย ระบบจะแปลงเป็นลิงก์ที่ถูกต้องให้ท่านทันที';
    }
    
    // Try to extract ID from URL
    const match = clean.match(/\/s\/([a-zA-Z0-9_\-]+)/);
    if (match) {
      const id = match[1];
      if (id.length < 73) {
        return `⚠️ ตรวจพบลิงก์ถูกตัดตัวอักษรท้าย (รหัส ID ในลิงก์ยาวเพียง ${id.length} ตัวอักษร แทนที่จะเป็นอย่างน้อย 74 ตัวอักษร)! สิ่งนี้เกิดจากการคัดลอกลิงก์แบบย่อที่มีจุดไข่ปลา (...) ซ่อนอยู่ โปรดกดปุ่ม "คัดลอก" ตรง "รหัสการทำให้ใช้งานได้" (Deployment ID) ใน Google Apps Script มาวางแทนได้เลย ระบบจะแปลงเป็นลิงก์ที่ทำงานได้ 100%`;
      }
    }
    
    return null;
  };

  // Super robust sanitizer for Google Apps Script Webhook URL
  const superSanitizeWebhookUrl = (url: string): string => {
    if (!url) return '';
    let clean = url.trim().replace(/^['"<>[\]\s]+|['"<>[\]\s]+$/g, '');
    clean = clean.replace(/\.+\s*$/, '');
    
    // 1. Auto-convert raw Deployment ID to full Web App URL
    if (/^AKfy[a-zA-Z0-9_\-]{50,80}$/.test(clean)) {
      return `https://script.google.com/macros/s/${clean}/exec`;
    }
    
    // 2. Fix typos in domain name (using a robust pattern so that we don't turn script.google.com into scscript.google.com)
    clean = clean.replace(/[a-zA-Z]*ript\.google\.com/gi, 'script.google.com');
    
    // 3. Fix any duplicate protocol stacking (e.g., https://https:/, https://http://, etc.)
    clean = clean.replace(/https?:\/\/https?:\/+/gi, 'https://');
    clean = clean.replace(/https?:\/\/https?:\/\//gi, 'https://');
    
    // 4. Fix incomplete protocol formats:
    if (/^https?:\/+(?!\/)/i.test(clean)) {
      clean = clean.replace(/^(https?):\/+/i, '$1://');
    } else if (/^https?\/+/i.test(clean)) {
      clean = clean.replace(/^(https?)\/+/i, '$1://');
    } else if (/^https?:[a-zA-Z0-9]/i.test(clean)) {
      clean = clean.replace(/^(https?):/i, '$1://');
    }
    
    // 5. If it has no protocol at all, prepend https://
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    
    // 6. Ensure duplicate slashes after protocol are fixed
    clean = clean.replace(/^(https?:\/\/)\/+/i, '$1');
    
    // 7. Ensure it ends with /exec for script.google.com
    if (clean.includes('script.google.com')) {
      let baseUrl = clean;
      let queryParams = '';
      const queryIndex = clean.indexOf('?');
      if (queryIndex !== -1) {
        baseUrl = clean.substring(0, queryIndex);
        queryParams = clean.substring(queryIndex);
      }
      
      if (!baseUrl.endsWith('/exec')) {
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
      const cleanUrl = getCleanSheetUrl(sheetUrl);
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error('ไม่สามารถเข้าถึงลิงก์ Google Sheet นี้ได้ โปรดตรวจสอบความถูกต้องและการเผยแพร่');
      }

      const text = await response.text();
      const products = parseSheetData(text);

      if (products.length === 0) {
        throw new Error('ไม่พบข้อมูลสินค้าที่ถูกต้องในไฟล์ โปรดตรวจสอบว่ามีแถวหัวข้อ (Header) เช่น Title, Description, Price, BV');
      }

      localStorage.setItem('noina_sheet_url', sheetUrl);
      setPreviewProducts(products);
      onSyncComplete(products);
      setStatus({
        type: 'success',
        message: `ดึงข้อมูลจาก Google Sheet สำเร็จ! ค้นพบและนำเข้าสินค้าใหม่ทั้งหมด ${products.length} รายการ`
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
          message: '✓ เชื่อมต่อกับ Google Apps Script สำเร็จ 100%! สคริปต์ของท่านทำงานได้ดีและตอบกลับถูกต้อง ข้อมูลการทดสอบถูกนำเข้า Google Sheet แล้ว'
        });
      } else {
        let displayMessage = data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        const lowerMsg = displayMessage.toLowerCase();
        
        if (lowerMsg.includes('not_found') || lowerMsg.includes('could not be found') || lowerMsg.includes('page not found') || response.status === 404) {
          displayMessage = '❌ ไม่พบหน้าสคริปต์ Google Apps Script (HTTP 404 NOT FOUND): ลิงก์ที่กรอกไม่ถูกต้อง หรือ Deployment ID ไม่มีอยู่จริงในระบบ Google โปรดตรวจสอบว่าท่านคัดลอก Web App URL (ลงท้ายด้วย /exec) มาวางอย่างถูกต้องครบถ้วน และได้กด "บันทึก URL" เรียบร้อยแล้ว';
        } else if (lowerMsg.includes('unauthorized') || lowerMsg.includes('forbidden') || response.status === 401 || response.status === 403) {
          displayMessage = '🔒 ติดสิทธิความปลอดภัยของ Google: โปรดแก้ไขสิทธิผู้มีสิทธิเข้าถึง Web App ใน Google Apps Script โดยตั้งค่า Who has access เป็น "Anyone" (ทุกคน) แล้วกด Deploy > New deployment ใหม่ จากนั้นนำลิงก์ /exec ใหม่มาบันทึกในระบบ';
        } else if (displayMessage.includes('<!DOCTYPE') || displayMessage.includes('<html')) {
          displayMessage = '⚠️ สคริปต์ตอบกลับเป็นหน้าเว็บ HTML แทนที่จะเป็นข้อมูลผลลัพธ์สำเร็จ! สิ่งนี้มักเกิดจากโค้ด doPost ใน Apps Script มีข้อผิดพลาด หรือตั้งค่าการ Deployment เป็น Web App ไม่ถูกต้อง';
        }
        
        setTestResult({
          success: false,
          message: displayMessage
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: '❌ ล้มเหลว: ' + (err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ proxy ได้')
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800">ระบบดึงข้อมูลสินค้าจาก Google Sheets</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">อัปเดตและซิงก์ข้อมูลสินค้าของร้าน Noinashop แบบเรียลไทม์ได้ทันที</p>
          </div>
        </div>

        {/* Instructions Guide */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Database className="w-4 h-4 text-emerald-600" />
            วิธีการจัดเตรียม Google Sheet เพื่อเผยแพร่สินค้า:
          </h4>
          <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
            <li>สร้าง Google Sheet และใส่แถวหัวข้อแรก (แถวที่ 1) ดังนี้: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">Title, Description, Price, BV, Image, Category, Brand, Condition, Stock</code></li>
            <li>กรอกข้อมูลสินค้ามือสอง (Category รองรับ: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">smartphone</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">notebook</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">accessory</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">tablet</code>)</li>
            <li>ไปที่เมนู <strong>ไฟล์ (File)</strong> &gt; <strong>แชร์ (Share)</strong> &gt; <strong>เผยแพร่ทางเว็บ (Publish to web)</strong></li>
            <li>เลือกประเภทข้อมูลเป็น <strong>ค่าที่คั่นด้วยจุลภาค (.csv)</strong> จากนั้นกดปุ่ม "เผยแพร่"</li>
            <li>คัดลอกลิงก์ที่ได้ มาวางในช่องกรอกด้านล่างเพื่อทำการดึงข้อมูล</li>
          </ol>
        </div>

        {/* Sync Form */}
        <form onSubmit={handleSync} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-slate-400" />
              ลิงก์ Google Sheet เว็บแบบ CSV (.csv)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrl}
                disabled
                className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                ดึงข้อมูล
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
              <div className={`mt-3 p-3.5 rounded-xl text-xs border leading-relaxed ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>
        </form>

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
