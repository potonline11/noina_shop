import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body;
    
    // ตั้งค่า URL ของ Google Apps Script ตัวล่าสุดของฝั่ง Gmail ส่วนตัวคุณ (มี /exec แล้ว)
    const GOOGLE_SCRIPT_URL = "https://google.com";

    try {
      // 1. ส่งข้อมูลทะลุไปบันทึกที่ Google Sheet ฝั่ง Gmail (ระบบใน Sheets จะแยกแท็บ Members/Orders ให้เองอัตโนมัติ)
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (sheetErr) {
        console.error("Google Sheet Save Error:", sheetErr);
      }

      // 2. ตั้งค่าระบบส่งอีเมลผ่าน SMTP ของ Google Workspace ของร้านคุณ
      const transporter = nodemailer.createTransport({
        host: '://gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER, // ดึงจากค่าที่ตั้งไว้บน Vercel
          pass: process.env.EMAIL_PASS  // ดึงรหัสแอป 16 หลักจาก Vercel
        },
      });

      // 🚨 ตรวจสอบประเภทข้อมูล: หากเป็นข้อมูลการสั่งซื้อสินค้า (Order)
      if (data.type === "order" || data.items !== undefined || data.totalPrice !== undefined || data.products !== undefined) {
        const customerName = data.customerName || data.fullName || "ลูกค้า Noinashop";
        const targetEmail = data.email || data.emailAddress || "";
        
        if (targetEmail) {
          const mailOptions = {
            from: `"Noinashop Orders" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: 'ยืนยันคำสั่งซื้อสินค้าเรียบร้อยแล้ว - Noinashop',
            html: `
              <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10B981;">ขอบคุณสำหรับคำสั่งซื้อของคุณครับ 🛒</h2>
                <p>สวัสดีคุณ <b>${customerName}</b>,</p>
                <p>ระบบได้รับคำสั่งซื้อสินค้าของคุณเรียบร้อยแล้ว ขณะนี้กำลังอยู่ระหว่างการตรวจสอบข้อมูล</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 13px; color: #666;">คุณสามารถตรวจสอบสถานะการจัดส่งได้ผ่านเมนูประวัติการสั่งซื้อบนหน้าเว็บไซต์ครับ</p>
              </div>
            `,
          };
          await transporter.sendMail(mailOptions);
        }
        return res.status(200).json({ success: true, message: 'บันทึกออเดอร์และส่งเมลสำเร็จ' });
      } 
      
      // 🚨 หากไม่ใช่ข้อมูลซื้อสินค้า แสดงว่าเป็นข้อมูลสมัครสมาชิกใหม่ (Registration)
      else {
        const customerName = data.fullName || data.name || "สมาชิกใหม่";
        const targetEmail = data.emailAddress || data.email || "";

        if (targetEmail) {
          const mailOptions = {
            from: `"Noinashop NLM" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: 'ยินดีต้อนรับสู่ Noinashop NLM - ลงทะเบียนสมาชิกสำเร็จ 🎉',
            html: `
              <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4F46E5;">ยินดีต้อนรับสู่ครอบครัว Noinashop NLM 🎉</h2>
                <p>สวัสดีคุณ <b>${customerName}</b>,</p>
                <p>ระบบได้ทำการลงทะเบียนและบันทึกข้อมูลสมาชิกของคุณเรียบร้อยแล้วครับ</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 13px; color: #666;">ยินดีต้อนรับเข้าสู่เครือข่าย NLM อีกครั้งครับ</p>
              </div>
            `,
          };
          await transporter.sendMail(mailOptions);
        }
        return res.status(200).json({ success: true, message: 'ลงทะเบียนและส่งอีเมลสำเร็จ' });
      }

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
