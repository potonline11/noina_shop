import React, { useState } from 'react';

export default function App() {
  // 1. ตัวแปรเก็บข้อมูลที่ลูกค้าพิมพ์กรอกในฟอร์มหน้าเว็บจริง
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('คอร์สเรียนออนไลน์ VIP - 1 เดือน');
  const [price, setPrice] = useState(490);
  const [loading, setLoading] = useState(false);

  // 2. ฟังก์ชันยิงส่งข้อมูลข้ามไปหา Serverless API (/api/order.ts)
  const handleRegisterOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('กรุณากรอกชื่อและอีเมลให้ครบถ้วนก่อนลงทะเบียนครับ');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          orderDetails: `🎁 รายการลงทะเบียน: ${product}`,
          totalPrice: price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('🎉 ลงทะเบียนสั่งซื้อสำเร็จ! ระบบได้บันทึกเข้า Google Sheets และส่งอีเมลคอนเฟิร์มเรียบร้อยแล้วครับ');
        // เคลียร์ค่าในฟอร์มเมื่อสำเร็จ
        setName('');
        setEmail('');
      } else {
        alert('❌ ระบบหลังบ้านแจ้งข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อระบบลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  // 3. หน้าตา HTML/JSX แสดงผลฟอร์มกรอกข้อมูลบนหน้าเว็บตัวใหม่
  return (
    <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', fontFamily: 'sans-serif', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#0070f3', marginTop: 0, marginBottom: '10px' }}>📝 ฟอร์มลงทะเบียนสั่งซื้อ</h2>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '25px' }}>กรอกข้อมูลด้านล่างเพื่อบันทึกประวัติออเดอร์และรับอีเมลยืนยัน</p>

      <form onSubmit={handleRegisterOrder}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>👤 ชื่อ-นามสกุล:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="เช่น สมชาย รักดี"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>✉️ อีเมลสำหรับรับคำยืนยัน:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="เช่น customer@gmail.com"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '20px', padding: '12px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>📦 สินค้าที่เลือก: <strong>{product}</strong></p>
          <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', color: '#0070f3' }}>ยอดเงินสุทธิ: {price} บาท</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
        >
          {loading ? 'กำลังประมวลผล โปรดรอสักครู่...' : '🚀 ยืนยันการลงทะเบียนสั่งซื้อ'}
        </button>
      </form>
    </div>
  );
}
