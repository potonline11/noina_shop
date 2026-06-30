/**
 * Vercel Serverless Function: Register Member & Send Welcome Email via Google Workspace SMTP
 * File Path in GitHub: /api/register.js
 * 
 * This serverless function runs on Vercel Node.js environment.
 * It does two main things:
 * 1. Forwards member registration details to Google Sheets Web App (Apps Script) Webhook.
 * 2. Sends a beautiful welcome email to the newly registered member via Google Workspace SMTP.
 */

import nodemailer from 'nodemailer';

// Helper function to handle redirects for Google Apps Script Web Apps (macros/s/...)
async function forwardToGoogleSheets(url, payload) {
  let currentUrl = url;
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload),
    redirect: 'manual' // Handle manually to strip payload-related headers on 302 redirects
  };

  const maxRedirects = 5;
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await fetch(currentUrl, options);
      const isRedirect = [301, 302, 303, 307, 308].includes(response.status);

      if (isRedirect) {
        const location = response.headers.get('location');
        if (!location) {
          return response;
        }
        // Resolve next URL
        currentUrl = new URL(location, currentUrl).toString();

        // Standard HTTP redirect behavior for 301/302/303: switch POST to GET and drop payload
        if ([301, 302, 303].includes(response.status)) {
          options.method = 'GET';
          delete options.body;
          if (options.headers) {
            const cleanHeaders = { ...options.headers };
            delete cleanHeaders['content-type'];
            delete cleanHeaders['Content-Type'];
            delete cleanHeaders['content-length'];
            delete cleanHeaders['Content-Length'];
            options.headers = cleanHeaders;
          }
        }
        continue;
      }
      return response;
    } catch (err) {
      throw new Error(`Google Sheets Webhook connection failed: ${err.message}`);
    }
  }
  throw new Error('Too many redirects when forwarding to Google Sheets');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const {
    webhookUrl,
    sheetId,
    id,
    name,
    email,
    phone,
    password,
    sponsorId,
    parentUserId,
    position,
    rank,
    dateJoined
  } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({
      success: false,
      message: '❌ ข้อมูลไม่ครบถ้วน: กรุณาระบุรหัสสมาชิก ชื่อ และอีเมลของลูกค้า'
    });
  }

  let sheetSaved = false;
  let sheetMessage = '';

  // 1. Forward the data to Google Sheets Webhook
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      console.log(`Forwarding member registration (${id}) to Google Sheet:`, webhookUrl);
      const sheetResponse = await forwardToGoogleSheets(webhookUrl, {
        type: 'registration',
        sheetId,
        id,
        name,
        email,
        phone,
        password,
        sponsorId,
        parentUserId,
        position,
        rank,
        dateJoined
      });

      const responseText = await sheetResponse.text();
      console.log(`Google Sheets Webhook replied with status ${sheetResponse.status}:`, responseText);

      if (sheetResponse.ok && !responseText.includes('<!DOCTYPE') && !responseText.includes('<html')) {
        try {
          const parsed = JSON.parse(responseText);
          sheetSaved = parsed.status === 'success' || parsed.success !== false;
          sheetMessage = parsed.message || 'บันทึกข้อมูลลง Google Sheet สำเร็จ';
        } catch (e) {
          sheetSaved = true;
          sheetMessage = 'บันทึกข้อมูลลง Google Sheet เรียบร้อยแล้ว (การตอบกลับไม่ใช่ JSON)';
        }
      } else {
        sheetSaved = true; // Still treat as saved to allow SMTP to send, but record issue
        sheetMessage = 'ส่งข้อมูลไปสคริปต์ Google Sheet สำเร็จ แต่ Google ตอบกลับมาเป็นหน้าเว็บ HTML (โปรดตรวจสอบการ Deploy ใน Apps Script)';
      }
    } catch (sheetError) {
      console.error('Google Sheets forwarding error:', sheetError);
      sheetMessage = `ไม่สามารถเชื่อมต่อกับ Google Sheet: ${sheetError.message}`;
    }
  } else {
    sheetMessage = '⚠️ ไม่พบลิงก์ Google Sheets Webhook (ข้ามขั้นตอนการบันทึกในสเปรดชีต)';
  }

  // 2. Send email via Google Workspace SMTP
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (!smtpUser || !smtpPass) {
    console.warn('SMTP credentials are not configured in Vercel/environment variables.');
    return res.status(200).json({
      success: true,
      googleSheet: { saved: sheetSaved, message: sheetMessage },
      email: {
        sent: false,
        message: '⚠️ ระบบไม่ได้ตั้งค่า SMTP_USER หรือ SMTP_PASS ใน Environment Variables จึงข้ามการส่งอีเมลยืนยันอัตโนมัติ'
      }
    });
  }

  try {
    // Configure transporter using SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const isLeft = position === 'left';
    const positionText = isLeft ? 'สายงานฝั่งซ้าย (Left Downline)' : 'สายงานฝั่งขวา (Right Downline)';

    // Construct a gorgeous HTML welcome email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ยินดีต้อนรับสมาชิกใหม่ Noinashop NLM</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 30px 25px;
            color: #334155;
            line-height: 1.6;
          }
          .welcome-msg {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
          }
          .credential-card {
            background-color: #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
          }
          .credential-title {
            font-size: 14px;
            font-weight: 700;
            color: #4f46e5;
            margin-top: 0;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .credential-row:last-child {
            margin-bottom: 0;
          }
          .label {
            font-weight: 600;
            color: #64748b;
          }
          .value {
            font-weight: 700;
            color: #0f172a;
            font-family: 'Courier New', Courier, monospace;
          }
          .highlight {
            color: #10b981;
            font-weight: 800;
          }
          .button-container {
            text-align: center;
            margin: 30px 0 15px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-weight: 700;
            border-radius: 10px;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NOINASHOP NLM</h1>
            <p>ระบบเครือข่ายร้านไอทีมือสองคัดเกรดคุณภาพพรีเมียม</p>
          </div>
          <div class="content">
            <div class="welcome-msg">สวัสดีคุณ ${name},</div>
            <p>ยินดีต้อนรับท่านเข้าสู่ครอบครัวธุรกิจ <strong>Noinashop NLM (Noina Line Marketing)</strong> เป็นผู้จัดจำหน่ายโทรศัพท์มือถือ โน๊ตบุ๊ค อุปกรณ์เสริมไอทีมือสองคัดเกรดพรีเมียม พร้อมระบบรับปันผลและคำนวณสายงานแบบ Binary อัตโนมัติ!</p>
            
            <p>บัญชีผู้ใช้ของคุณได้รับการอนุมัติและจัดวางสายงานลงสู่ระบบต้นสายเป็นที่เรียบร้อย โดยมีรายละเอียดการเข้าสู่ระบบและสายงานดังต่อไปนี้:</p>
            
            <div class="credential-card">
              <div class="credential-title">🔑 ข้อมูลประจำตัวของคุณ (Your Credentials)</div>
              
              <div class="credential-row">
                <span class="label">รหัสสมาชิก (Member ID):</span>
                <span class="value highlight">${id}</span>
              </div>
              
              <div class="credential-row">
                <span class="label">อีเมลสำหรับล็อกอิน:</span>
                <span class="value">${email}</span>
              </div>
              
              <div class="credential-row">
                <span class="label">รหัสผ่าน (Password):</span>
                <span class="value">${password}</span>
              </div>
              
              <div class="credential-row">
                <span class="label">ระดับตำแหน่งเริ่มต้น:</span>
                <span class="value" style="color: #d97706; font-weight: 800;">${rank || 'Bronze'}</span>
              </div>
            </div>

            <div class="credential-card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
              <div class="credential-title" style="color: #16a34a;">👥 ข้อมูลผู้แนะนำและสายงาน</div>
              
              <div class="credential-row">
                <span class="label">ผู้แนะนำตรง (Sponsor):</span>
                <span class="value">${sponsorId}</span>
              </div>
              
              <div class="credential-row">
                <span class="label">จัดวางอยู่ภายใต้ (Parent):</span>
                <span class="value">${parentUserId}</span>
              </div>
              
              <div class="credential-row">
                <span class="label">ตำแหน่งในสายงาน:</span>
                <span class="value" style="color: #16a34a;">${positionText}</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
              🔗 <strong>ลิงก์ขยายสายงานและแนะนำสินค้าของคุณ:</strong><br>
              <a href="https://noina-shop.vercel.app/?sponsor=${id}" target="_blank" style="color: #4f46e5; font-weight: bold; word-break: break-all;">
                https://noina-shop.vercel.app/?sponsor=${id}
              </a>
              <br><em>(เมื่อผู้ใช้สมัครสมาชิกหรือซื้อสินค้าผ่านลิงก์นี้ คะแนน BV จะไหลขึ้นผังส่วนตัวของคุณโดยตรงสะสมรับรายได้ปันผลจับคู่!)</em>
            </p>

            <div class="button-container">
              <a href="https://noina-shop.vercel.app/" class="btn" target="_blank">
                ล็อกอินเข้าสู่ระบบหลังบ้านสมาชิก
              </a>
            </div>
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 25px;">
              หากมีข้อสงสัยหรือติดขัดปัญหาระบบหลังบ้าน สมาชิกสามารถติดต่อแอดมิน คุณไวพจน์ โสมภา ได้ที่เบอร์โทรศัพท์ <strong>081-160-1092</strong> ตลอด 24 ชั่วโมง
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Noina Shop. All rights reserved.</p>
            <p>อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติของ <a href="https://noina-shop.vercel.app" target="_blank">Noina Shop</a> จากสิทธิการตั้งค่า Google Workspace <strong>admin@noinashop.business</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send welcome email
    const mailOptions = {
      from: `"Noina Shop NLM" <${smtpUser}>`,
      to: email,
      subject: `ยินดีต้อนรับคุณ ${name} สู่ระบบ Noinashop NLM - รหัสสมาชิก ${id}`,
      html: htmlContent
    };

    console.log(`Sending Welcome Email to ${email} using admin@noinashop.business...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: '✅ บันทึกข้อมูลสมาชิกเรียบร้อย และระบบได้ส่งอีเมลต้อนรับผ่าน Google Workspace สำเร็จแล้ว!',
      googleSheet: { saved: sheetSaved, message: sheetMessage },
      email: { sent: true, messageId: info.messageId }
    });
  } catch (emailError) {
    console.error('SMTP sending error:', emailError);
    return res.status(200).json({
      success: true,
      message: `✅ บันทึกข้อมูลสำเร็จแล้ว แต่ระบบอีเมลขัดข้อง: ${emailError.message}`,
      googleSheet: { saved: sheetSaved, message: sheetMessage },
      email: { sent: false, error: emailError.message }
    });
  }
}
