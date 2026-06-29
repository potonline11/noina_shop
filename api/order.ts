import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // บังคับให้ระบบรองรับเฉพาะการยิงคำสั่งรูปแบบ POST (ส่งข้อมูลออเดอร์) เท่านั้น
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // 1. แกะข้อมูลดิบของออเดอร์ที่ถูกส่งมาจากหน้าบ้าน (Frontend)
  const { customerName, customerEmail, orderDetails, totalPrice } = request.body;

  if (!customerName || !customerEmail || !orderDetails) {
    return response.status(400).json({ error: 'กรุณากรอกข้อมูลลูกค้าและออเดอร์ให้ครบถ้วน' });
  }

  try {
    // 2. ดึงคีย์ลับความปลอดภัยเชื่อมต่อเข้ากับ Google Sheets ใบใหม่ของคุณอัตโนมัติ
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://googleapis.com'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    
    // ดึงข้อมูลแท็บแผ่นงานที่ชื่อ 'Orders' (หรือแท็บแรกสุดของ Sheets ใบใหม่)
    const sheet = doc.sheetsByTitle['Orders'] || doc.sheetsByIndex[0];

    // พิมพ์ข้อมูลออเดอร์หยอดลงแถวใหม่ใน Google Sheets ทันที
    await sheet.addRow({
      'วันที่': new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      'ชื่อลูกค้า': customerName,
      'อีเมล': customerEmail,
      'รายการสินค้า': orderDetails,
      'ราคารวม': totalPrice,
      'สถานะ': 'รอยืนยันออเดอร์',
    });

    // 3. สั่งยิงคำสั่งส่งอีเมลใบเสร็จ/คำยืนยันไปหาลูกค้าผ่านระบบ Resend
    const emailResponse = await fetch('https://resend.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Potnueng Shop <onboarding@resend.dev>', // สิทธิ์ทดสอบเริ่มต้นบนคลาวด์ฟรี
        to: customerEmail,
        subject: `🛒 ยืนยันการสั่งซื้อและประวัติออเดอร์ของคุณ - คุณ ${customerName}`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0070f3; margin-top: 0;">ขอบคุณสำหรับการสั่งซื้อครับ 🎉</h2>
            <p>สวัสดีคุณ <strong>${customerName}</strong> ระบบร้านค้าได้รับการยืนยันออเดอร์ของคุณเรียบร้อยแล้ว และได้ทำการบันทึกลงฐานข้อมูลตารางถาวรแล้วครับ</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <h4 style="margin-bottom: 8px; color: #555;">📋 รายละเอียดรายการสินค้า:</h4>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0070f3; border-radius: 4px; white-space: pre-line; font-size: 14px; line-height: 1.6;">
              ${orderDetails}
            </div>
            <p style="font-size: 16px; font-weight: bold; margin-top: 15px;">ยอดรวมสุทธิ: <span style="color: #0070f3;">${totalPrice} บาท</span></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">* ข้อความจดหมายฉบับนี้ส่งโดยระบบเซิร์ฟเวอร์อัตโนมัติจากเว็บบอร์ดหลังบ้านพจน์หนึ่งช็อปบน Vercel</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('ระบบเพิ่มแถวบนตารางชีตสำเร็จ แต่การยิงส่งอีเมลขัดข้อง');
    }

    // คืนค่าความสำเร็จกลับไปให้ปุ่มกดฝั่งหน้าบ้าน
    return response.status(200).json({ success: true, message: 'บันทึกออเดอร์และส่งเมล์เรียบร้อย!' });

  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
