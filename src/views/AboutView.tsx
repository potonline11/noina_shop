/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Users, Gem, Heart, CheckCircle2, UserCheck, Star } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      
      {/* 1. Header Hero Panel */}
      <section className="text-center max-w-2xl mx-auto space-y-3 pt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
          เกี่ยวกับพวกเรา “Noinashop”
        </h1>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          จุดเริ่มต้นของธุรกิจจำหน่ายโทรศัพท์มือถือและอุปกรณ์ไอทีมือสองคัดเกรดพรีเมียม สู่การสร้างนวัตกรรมเครือข่ายความสุขด้วยระบบสหกรณ์เครือข่ายสมาชิก NLM
        </p>
        <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full mt-4" />
      </section>

      {/* 2. Visual Story and Description */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 font-sans">ความเป็นมาและวิสัยทัศน์ของเรา</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ร้าน <strong>Noinashop</strong> เริ่มต้นขึ้นจากความตั้งใจที่จะส่งมอบเทคโนโลยีที่คุ้มค่าสูงสุดแก่ลูกค้าทุกท่าน เรามองเห็นว่าโทรศัพท์มือถือและโน๊ตบุ๊คในยุคปัจจุบันมีราคาสูงขึ้นอย่างรวดเร็ว ในขณะที่อุปกรณ์ไอทีมือสองสภาพนางฟ้า 95-99% สามารถประหยัดเงินในกระเป๋าได้ถึง 40-60% 
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            เราจึงคัดสรรอุปกรณ์มือสองคุณภาพสูง นำมาผ่านกระบวนการตรวจสอบคุณภาพและความปลอดภัยด้วยระบบ QC 24 รายการ ก่อนจะส่งมอบด้วยการบริการและใบรับประกันอย่างเป็นทางการ เพื่อสร้างมาตรฐานใหม่ให้กับตลาดสินค้าไอทีมือสองในประเทศไทย
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            และเพื่อตอบแทนลูกค้าและสร้างโอกาสสร้างรายได้ที่มั่นคง เราจึงออกแบบระบบการตลาดเครือข่าย <strong>NLM (Network Marketing)</strong> ขึ้นมาเพื่อกระจายผลประโยชน์ โบนัสการจับคู่ และค่าแนะนำ คืนกลับสู่สังคมผู้ใช้และสมาชิกสหกรณ์ทุกคนอย่างแท้จริง
          </p>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md bg-slate-100">
          <img 
            referrerPolicy="no-referrer"
            src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80" 
            alt="Noinashop Office" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 3. QC Standards Showcase */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg font-bold text-slate-800 font-sans">มาตรฐานคุณภาพระดับพรีเมียม 24 ขั้นตอน</h3>
          <p className="text-xs text-slate-500 mt-1">สินค้าไอทีมือสองทุกชิ้นผ่านการทดสอบแบบละเอียดด้วยทีมช่างมืออาชีพ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'เช็คสุขภาพแบตเตอรี่', desc: 'แบตเตอรี่แท้ ประสิทธิภาพต้องไม่ต่ำกว่า 80%-85% เสมอ', icon: CheckCircle2 },
            { title: 'ตรวจสอบหน้าจอสัมผัส', desc: 'หน้าจอสีสันสดใส ไร้จุดเดดพิกเซล (Dead Pixel) ทัชสกรีนไหลลื่น', icon: Star },
            { title: 'ทดสอบกล้องหน้า-หลัง', desc: 'ทดสอบโฟกัส ระบบกันสั่น ลำโพง และไมโครโฟนสำหรับการโทร', icon: Gem },
            { title: 'ใบรับประกันสินค้า 90 วัน', desc: 'ทุกชิ้นที่ซื้อจาก Noinashop มั่นใจด้วยใบรับประกันและการเคลมฟรี', icon: Shield },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              <div className="w-9 h-9 bg-white text-indigo-600 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm mb-3">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MLM Core values */}
      <section className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 sm:p-10 rounded-3xl shadow-lg">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">NLM Core Values</span>
            <h3 className="text-lg md:text-xl font-bold font-sans">คุณค่าหลักที่ขับเคลื่อนระบบเครือข่ายสมาชิก NLM</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">1. ความโปร่งใสสูงสุด</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ทุกยอดซื้อ ทุกคะแนน BV และทุกลำดับดาวน์ไลน์สายงานซ้าย-ขวา สามารถตรวจสอบย้อนหลังได้เรียลไทม์ผ่านระบบหลังบ้านของท่าน
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">2. การเติบโตร่วมกัน</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ไม่มีการเอาเปรียบสมาชิก คะแนนทีมซ้ายและทีมขวาจะถูกคำนวณแบบจับคู่ ช่วยเหลือกันแบบไบนารีทั้งแม่ทีมและดาวน์ไลน์
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">3. สังคมสหกรณ์ไอที</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                เราตั้งเป้าสร้างชุมชนแลกเปลี่ยน ซ่อมบำรุง และแบ่งปันสิทธิประโยชน์อุปกรณ์ไอทีราคาประหยัด เพื่อลดปัญหาขยะอิเล็กทรอนิกส์
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
