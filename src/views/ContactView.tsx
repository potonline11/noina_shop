/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle, Smartphone, Clock } from 'lucide-react';

export default function ContactView() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      
      {/* 1. Page Header */}
      <section className="text-center max-w-xl mx-auto space-y-2 pt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
          ติดต่อร้าน Noinashop
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          หากท่านมีข้อสงสัยเกี่ยวกับสินค้าไอทีมือสอง คุณภาพสินค้า ระบบคะแนน BV หรือการสมัครสายงานเครือข่าย NLM ทีมงานผู้เชี่ยวชาญพร้อมดูแลท่านตลอดเวลา
        </p>
      </section>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left: Contact Info details (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">ข้อมูลช่องทางติดต่อ</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start text-xs text-slate-600">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-slate-800 mb-0.5">ที่อยู่ร้าน (หน้าร้าน)</span>
                  <span className="leading-relaxed">128/12 หมู่4 ต.กรอกสมบูรณ์ ศรีมหาโพธิ ปราจีนบุรี 25140</span>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs text-slate-600">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-slate-800 mb-0.5">เบอร์โทรศัพท์ติดต่อ</span>
                  <span className="leading-relaxed">081-160-1092</span>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs text-slate-600">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-slate-800 mb-0.5">อีเมลติดต่อฝ่ายขาย</span>
                  <span className="leading-relaxed">admin@noinashop.business</span>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs text-slate-600">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-slate-800 mb-0.5">เวลาเปิดทำการ</span>
                  <span className="leading-relaxed">เปิดทำการทุกวัน: เวลา 09.00 น. - 20.00 น. (หยุดทำการวันหยุดนักขัตฤกษ์หลัก)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-indigo-50 to-indigo-100 rounded-2xl p-5 border border-indigo-200">
            <h4 className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-700" />
              ต้องการประเมินราคารับซื้อเครื่อง?
            </h4>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              สำหรับสมาชิก Noinashop ที่ต้องการนำโทรศัพท์มือถือ โน๊ตบุ๊คเครื่องเก่า มาเทิร์นหรือขายแลกเป็นคะแนนสะสม BV พิเศษ สามารถแอดไลน์ @Noinashop เพื่อส่งรูปประเมินราคาได้ฟรีทันที!
            </p>
          </div>
        </div>

        {/* Right: Contact Form Panel (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">ส่งข้อความหาผู้ให้บริการ</h3>
          
          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-emerald-800 text-sm">ส่งข้อมูลสำเร็จ!</h4>
              <p className="text-xs text-emerald-600 leading-relaxed max-w-sm mx-auto">
                ขอบพระคุณสำหรับข้อความของคุณ ทีมงานผู้ดูแลระบบ Noinashop จะทำการติดต่อกลับทางที่อยู่อีเมล หรือเบอร์โทรศัพท์ของคุณโดยเร็วที่สุด
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อ-นามสกุลของคุณ</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="เช่น สมชาย ใจมั่น"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="เช่น 082-345-6789"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">อีเมลแอดเดรส</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="เช่น customer@gmail.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เรื่องที่ต้องการสอบถาม</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="เช่น ปรึกษาคะแนนสายงาน, แนะนำสมาชิกใหม่"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">รายละเอียดข้อความ</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="เขียนข้อความหรือคำถามของคุณได้ที่นี่..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
              >
                <Send className="w-3.5 h-3.5" />
                ส่งข้อความติดต่อกลับ
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
