/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../types';
import { ArrowRight, Shield, RefreshCw, Sparkles, Users, Award, Smartphone, Laptop, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  featuredProducts: Product[];
  onProductClick?: (product: Product) => void;
}

export default function HomeView({ onNavigate, featuredProducts, onProductClick }: HomeViewProps) {
  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      
      {/* 1. Hero Showcase Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-12 md:p-16 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Noinashop: IT Second-Hand Network</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans tracking-tight leading-tight">
            ร้านไอทีมือสองคัดเกรดพรีเมียม <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-cyan-200">
              สร้างรายได้เสริมด้วยระบบเครือข่าย NLM
            </span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            ช้อปสมาร์ทโฟน โน๊ตบุ๊ค แท็บเล็ต สภาพนางฟ้า ในราคาสุดประหยัด มั่นใจได้ด้วยระบบสแกนสภาพ 24 ขั้นตอนและใบรับประกันสูงสุด 90 วัน พิเศษสุด! ทุกชิ้นมีคะแนน BV นำไปคำนวณเงินปันผลและรายได้ตามสายงานธุรกิจเครือข่ายสหกรณ์ NLM ได้ทันที
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
            <button 
              onClick={() => onNavigate('products')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              เลือกซื้อสินค้าและดูคะแนน BV
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onNavigate('marketing')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2"
            >
              ศึกษาแผนสร้างรายได้ NLM
            </button>
          </div>
        </div>
      </section>

      {/* 2. Key Advantages Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">คุณภาพคัดเกรด 95%+ สภาพนางฟ้า</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            สินค้ามือสองทุกชิ้นผ่านการตรวจสอบการทำความสะอาด ตรวจเช็คแบตเตอรี่ หน้าจอ และระบบภายในอย่างละเอียด 24 ขั้นตอน พร้อมรับประกันสินค้า 3 เดือนเต็ม
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <RefreshCw className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">ระบบคะแนนสะสม BV (Business Volume)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            ทุกการซื้อหรือการแนะนำสมาชิกสั่งซื้อโทรศัพท์และโน๊ตบุ๊ค จะสะสมคะแนนเป็น BV เพื่อใช้ปันผลคืนให้แก่คุณในฐานะสมาชิกตามรอบสัปดาห์
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">เครือข่ายธุรกิจ NLM ที่ยั่งยืน</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            แผนการตลาดไบนารีที่จัดวางดาวน์ไลน์สายงานซ้ายและขวาได้อย่างอิสระ รับโบนัสจับคู่บาลานซ์ โบนัสแนะนำและโบนัสตำแหน่งอย่างโปร่งใส ไร้การหมกเม็ด
          </p>
        </div>
      </section>

      {/* 3. Featured Categories Segment */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-sans">หมวดหมู่สินค้าไอทีมือสองยอดฮิต</h2>
          <p className="text-xs text-slate-500">รวมสินค้าขายดีและสินค้านำเข้ามาใหม่ที่มีคะแนนจัดเต็มสำหรับสมาชิก</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'smartphone', label: 'สมาร์ทโฟนมือสอง', count: 'iPhone, Samsung, OPPO', icon: Smartphone, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
            { id: 'notebook', label: 'โน๊ตบุ๊คใช้งาน/เล่นเกม', count: 'MacBook, Dell, Asus, HP', icon: Laptop, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { id: 'tablet', label: 'แท็บเล็ตเพื่อการศึกษา', count: 'iPad, Galaxy Tab', icon: Layers, color: 'bg-amber-50 text-amber-600 border-amber-100' },
            { id: 'accessory', label: 'อุปกรณ์เสริม & ลำโพง', count: 'AirPods, หูฟังบลูทูธ', icon: Award, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          ].map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => onNavigate('products')}
              className="border border-slate-100 hover:border-indigo-200 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer text-center group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border ${cat.color} group-hover:scale-105 transition`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-0.5">{cat.label}</h4>
              <p className="text-[10px] text-slate-400">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Highlighted Products Preview */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 font-sans">สินค้าแนะนำ คะแนน BV สูงสุดสัปดาห์นี้</h2>
            <p className="text-xs text-slate-500 mt-1">ช้อปสินค้าคุณภาพดีเยี่ยม พร้อมรับคะแนนสะสมเข้ากระเป๋าและทีมงานของท่าน</p>
          </div>
          <button 
            onClick={() => onNavigate('products')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 shrink-0"
          >
            ดูสินค้าทั้งหมด
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredProducts.slice(0, 3).map((product) => (
            <div 
              key={product.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => {
                if (onProductClick) onProductClick(product);
                else onNavigate('products');
              }}
            >
              {/* Product Image */}
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img referrerPolicy="no-referrer" src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <span className="absolute top-2.5 left-2.5 bg-slate-900/85 text-white font-bold text-[9px] px-2 py-0.8 rounded-full">
                  {product.condition}
                </span>
                <span className="absolute bottom-2.5 right-2.5 bg-indigo-600 text-white font-extrabold font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-sm">
                  +{product.bv} BV
                </span>
              </div>

              {/* Product details */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3.5 bg-white">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block mb-1">{product.brand}</span>
                  <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">{product.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none">ราคามือสองพิเศษ</span>
                    <span className="text-sm font-bold text-slate-800">{product.price.toLocaleString()} ฿</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                    ดูรายละเอียด
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MLM Marketing / Registration Call to Action */}
      <section className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg shadow-indigo-900/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_35%)]" />
        <div className="space-y-2 relative z-10">
          <h3 className="text-lg md:text-xl font-bold font-sans">พร้อมเริ่มต้นธุรกิจเครือข่าย NLM กับ Noinashop แล้วหรือยัง?</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            สมัครสมาชิกฟรีวันนี้! เข้าถึงระบบแนะนำ ลิงก์ขยายงาน แผนผังสายงาน และโปรแกรมคำนวณปันผลอัตโนมัติ เริ่มแนะแนะบอกต่อสิ่งดีๆ พร้อมรับรายได้สะสมไร้ขีดจำกัด
          </p>
        </div>
        <div className="flex gap-3 relative z-10 w-full sm:w-auto shrink-0">
          <button 
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto bg-white text-indigo-900 font-bold text-xs sm:text-sm px-5.5 py-3 rounded-xl hover:bg-slate-100 transition shadow-md shrink-0 text-center"
          >
            สมัครสมาชิกฟรี
          </button>
          <button 
            onClick={() => onNavigate('marketing')}
            className="w-full sm:w-auto bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 font-bold text-xs sm:text-sm px-5.5 py-3 rounded-xl hover:bg-indigo-500/30 transition shrink-0 text-center"
          >
            อ่านแผนรายได้
          </button>
        </div>
      </section>

    </div>
  );
}
