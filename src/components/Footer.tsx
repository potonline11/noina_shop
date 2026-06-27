/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs md:text-sm pt-12 pb-8 border-t border-slate-800" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: Brand details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-sans font-bold text-lg text-white tracking-tight">Noinashop</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              ร้านจำหน่ายโทรศัพท์มือถือ โน๊ตบุ๊ค แท็บเล็ต และอุปกรณ์เสริมไอทีมือสอง สภาพดีเยี่ยม คัดเกรดเอ คุณภาพคุ้มราคา พร้อมขับเคลื่อนด้วยระบบเครือข่ายสมาชิก NLM อย่างมั่นคงและยั่งยืน
            </p>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">บริการและเมนู</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-indigo-400 transition text-left">หน้าแรก</button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-indigo-400 transition text-left">เกี่ยวกับร้าน Noinashop</button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-indigo-400 transition text-left">สินค้าและคะแนน BV</button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketing')} className="hover:text-indigo-400 transition text-left">แผนธุรกิจและการตลาด NLM</button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-indigo-400 transition text-left">สมัครสมาชิกเข้าร่วมเครือข่าย</button>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">ความมั่นใจและความปลอดภัย</h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>การรับประกันสินค้ามือสองสูงสุด 90 วัน</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                สินค้าไอทีมือสองทุกประเภทผ่านการทดสอบและสแกนประสิทธิภาพมากกว่า 24 รายการโดยช่างผู้เชี่ยวชาญก่อนขึ้นชั้นวางขาย มั่นใจได้ในคุณภาพระดับนางฟ้า
              </p>
            </div>
          </div>

          {/* Column 4: Contact info */}
          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">ติดต่อเรา</h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>123/45 ซอยสุขุมวิท 22 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>081-234-5678 (ฝ่ายบริการลูกค้า)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>contact@noinashop.com</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="border-t border-slate-800 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <p>© 2026 Noinashop. ระบบเครือข่าย NLM สงวนลิขสิทธิ์ตามกฎหมาย</p>
          <p className="flex items-center gap-1">
            สร้างสรรค์อย่างพิถีพิถันเพื่อคนไทยด้วยความภูมิใจ
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
