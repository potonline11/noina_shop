/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Target, Zap, ShieldAlert, ArrowRight, HelpCircle, CheckCircle } from 'lucide-react';
import { MARKETING_PLAN_STEPS, MEMBERSHIP_RANKS } from '../data/mockData';

export default function MarketingView() {
  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      
      {/* 1. Header Banner */}
      <section className="text-center max-w-2xl mx-auto space-y-3 pt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
          แผนธุรกิจและการสร้างรายได้ NLM
        </h1>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          โอกาสทองของการสร้างเงินปันผลที่ยั่งยืนผ่านการร่วมแชร์ ร่วมแนะนำสินค้าโทรศัพท์โน๊ตบุ๊คมือสองคัดเกรดพรีเมียมจาก Noinashop 
        </p>
        <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full mt-4" />
      </section>

      {/* 2. Core Commissions Panels */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-sm font-extrabold uppercase text-indigo-600 tracking-wider">3 ช่องทางหลักสร้างรายได้</h3>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 mt-1">แผนปันผลตอบแทนที่คุ้มค่าที่สุด</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MARKETING_PLAN_STEPS.map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <h4 className="text-xs md:text-sm font-bold text-slate-800">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
              
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-slate-600">
                <strong className="block text-indigo-800 mb-0.5">ตัวอย่างคำนวณ:</strong>
                {step.example}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Membership Ranks Slider/Table */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="max-w-xl mx-auto text-center space-y-2 mb-8">
          <h3 className="text-lg font-bold text-slate-800 font-sans">ตำแหน่งทางธุรกิจ (Membership Ranks)</h3>
          <p className="text-xs text-slate-500">สะสมคะแนน BV จากยอดการซื้อส่วนตัวเพื่อเลื่อนตำแหน่งและรับสิทธิ์เพิ่มอัตราเปอร์เซ็นต์โบนัสปันผลที่สูงขึ้น</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px]">
                <th className="py-3 px-4 rounded-l-xl">ระดับตำแหน่ง</th>
                <th className="py-3 px-4">เงื่อนไขคะแนนสะสม (BV)</th>
                <th className="py-3 px-4 rounded-r-xl">สิทธิประโยชน์และโบนัสที่จะได้รับ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MEMBERSHIP_RANKS.map((rank, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${rank.name === 'Diamond' ? 'bg-cyan-500' : rank.name === 'Platinum' ? 'bg-purple-500' : rank.name === 'Gold' ? 'bg-amber-500' : rank.name === 'Silver' ? 'bg-slate-400' : 'bg-orange-400'}`} />
                    {rank.name}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600 font-mono">
                    {rank.minBV === 0 ? 'สมัครสมาชิกสำเร็จ' : `${rank.minBV.toLocaleString()} BV`}
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-medium">
                    {rank.benefit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Interactive Matching Explanation Diagram */}
      <section className="bg-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_35%)]" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Binary Matching System</span>
            <h3 className="text-lg md:text-xl font-bold font-sans">เข้าใจโบนัสจับคู่จ่ายสายงานใน 1 นาที</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <p className="leading-relaxed">
                ในฐานะสมาชิกระบบไบนารี ท่านจะมีทีมงานอยู่สองฝั่ง คือ <strong>ทีมงานฝั่งซ้าย (Left Downline)</strong> และ <strong>ทีมงานฝั่งขวา (Right Downline)</strong>
              </p>
              <div className="flex gap-2.5 items-start">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>ทีมยอดขาน้อยกว่า (Weak Side):</strong> คะแนน BV ทั้งหมดสะสมจากยอดซื้อของทุกคนในฝั่งนี้ จะถูกใช้มาคูณ % โบนัสตามตำแหน่งของคุณ (สูงสุด 60%) เพื่อคิดเป็นเงินปันผลรายสัปดาห์
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>ทีมยอดขาสูงกว่า (Strong Side):</strong> คะแนนฝั่งนี้ที่ถูกจับคู่ออกไปแล้ว คะแนนส่วนต่างที่เหลืออยู่จะไม่หายไปไหน แต่จะถูกยกสะสมไปใช้คำนวณปันผลต่อในสัปดาห์ถัดไปโดยไม่มีการล้างทิ้ง!
                </p>
              </div>
            </div>

            {/* Visual Mini Mock Diagram */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 border-b border-slate-700 pb-2 text-center">ตัวอย่างผังคำนวณโบนัส</h4>
              
              <div className="flex justify-between items-center text-center">
                <div className="bg-slate-700 p-2.5 rounded-lg border border-emerald-500/30 w-5/12">
                  <span className="block text-[9px] text-slate-400">ฝั่งซ้าย (Weak Side)</span>
                  <span className="text-xs font-bold text-emerald-400">10,000 BV</span>
                </div>
                <div className="text-slate-500 text-xs font-bold">VS</div>
                <div className="bg-slate-700 p-2.5 rounded-lg border border-indigo-500/30 w-5/12">
                  <span className="block text-[9px] text-slate-400">ฝั่งขวา (Strong Side)</span>
                  <span className="text-xs font-bold text-indigo-400">15,000 BV</span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-3 text-center border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 block">ปันผลบาลานซ์ (คิดที่ Gold 60%)</span>
                <span className="text-sm font-extrabold text-indigo-300">10,000 BV x 60% = 6,000 บาท</span>
                <span className="text-[9px] text-slate-400 block mt-1">เหลือคะแนนฝั่งแข็งสะสมต่อไปอีก 5,000 BV</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
