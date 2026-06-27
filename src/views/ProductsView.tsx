/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Member } from '../types';
import { Search, ShoppingCart, Info, CheckCircle, Smartphone, Laptop, Tablet, Layers } from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  currentUser: Member | null;
  onPurchase: (product: Product, quantity: number) => void;
}

export default function ProductsView({ products, currentUser, onPurchase }: ProductsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Category labels with icons
  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers },
    { id: 'smartphone', label: 'โทรศัพท์มือถือ', icon: Smartphone },
    { id: 'notebook', label: 'โน๊ตบุ๊ค', icon: Laptop },
    { id: 'tablet', label: 'แท็บเล็ต', icon: Tablet },
    { id: 'accessory', label: 'อุปกรณ์เสริม', icon: Info },
  ];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenPurchaseModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPurchaseSuccess(null);
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;
    
    onPurchase(selectedProduct, quantity);
    
    setPurchaseSuccess(`สั่งซื้อสำเร็จ! บันทึกคำสั่งซื้อและทำการอัปโหลดคะแนน ${selectedProduct.bv * quantity} BV เข้าสู่ผังสายงานของคุณ เรียบร้อยแล้ว`);
    setTimeout(() => {
      setSelectedProduct(null);
      setPurchaseSuccess(null);
    }, 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Title & Intro */}
      <section className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
          รายการสินค้าและคะแนน BV
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          เลือกซื้อสินค้าไอทีมือสองคัดเกรดดีเยี่ยม พร้อมรับคะแนนสะสม BV (Business Volume) เข้ากระเป๋าส่วนตัวเพื่อใช้ปันผลโบนัสตามสายงาน NLM
        </p>
      </section>

      {/* Filters: Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือแบรนด์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400 font-semibold">ไม่พบสินค้าในหมวดหมู่นี้หรือคำค้นหานี้</p>
          <p className="text-xs text-slate-400 mt-1">ท่านสามารถซิงก์ข้อมูลเพิ่มเติมจาก Google Sheet ในเมนูผู้ดูแลระบบได้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Product Top Image Section */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img 
                  referrerPolicy="no-referrer"
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white font-bold text-[9px] px-2 py-0.8 rounded-full">
                  {product.condition}
                </span>
                <span className="absolute bottom-2.5 right-2.5 bg-indigo-600 text-white font-extrabold font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-sm">
                  +{product.bv} BV
                </span>
                {product.source === 'googlesheet' && (
                  <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                    Google Sheet
                  </span>
                )}
              </div>

              {/* Product Body */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-4 bg-white">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">{product.brand}</span>
                  <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">{product.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{product.description}</p>
                </div>

                {/* Buy Section */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none">ราคามือสอง</span>
                    <span className="text-sm font-extrabold text-slate-800">{product.price.toLocaleString()} ฿</span>
                  </div>
                  
                  <button
                    onClick={() => handleOpenPurchaseModal(product)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    สั่งซื้อสินค้า
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Purchase Modal / Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative">
            
            {/* Header image */}
            <div className="relative aspect-video bg-slate-100">
              <img referrerPolicy="no-referrer" src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/50 hover:bg-slate-950/70 text-white flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-white">
              <div>
                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] uppercase font-bold tracking-wider mb-1.5">
                  {selectedProduct.brand} | {selectedProduct.category}
                </span>
                <h3 className="text-sm md:text-base font-extrabold text-slate-800">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedProduct.description}</p>
              </div>

              {/* Product specifications summary */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">สภาพสินค้ามือสอง:</span>
                  <span className="font-bold text-slate-700">{selectedProduct.condition}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ยอดคะแนนธุรกิจ:</span>
                  <span className="font-extrabold text-indigo-600 font-mono">+{selectedProduct.bv} BV / ชิ้น</span>
                </div>
              </div>

              {/* Purchase Action Panel */}
              {purchaseSuccess ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{purchaseSuccess}</span>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">ระบุจำนวนการสั่งซื้อ:</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold transition"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-bold font-mono text-slate-800">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(prev => Math.min(selectedProduct.stock, prev + 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-slate-100 pt-3.5 flex justify-between items-end bg-white">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ยอดรวมคะแนนธุรกิจ</span>
                      <span className="text-sm font-bold text-indigo-600 font-mono">{(selectedProduct.bv * quantity).toLocaleString()} BV</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">ราคาสุทธิ</span>
                      <span className="text-base font-extrabold text-slate-800">{(selectedProduct.price * quantity).toLocaleString()} ฿</span>
                    </div>
                  </div>

                  {/* Authentication guard warning */}
                  {!currentUser ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[11px] leading-relaxed flex gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">หมายเหตุสำคัญ:</span> คุณยังไม่ได้ล็อกอินเข้าระบบสมาชิก หากสั่งซื้อตอนนี้จะไม่ได้รับการสะสมคะแนน BV เข้าสู่สายงาน
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl text-[11px] leading-relaxed flex gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        ล็อกอินเข้าบัญชี <span className="font-bold text-indigo-900">{currentUser.name} ({currentUser.id})</span> คะแนน BV จะอัปเดตเข้าฝั่งสายงานหลังทำรายการสำเร็จ
                      </div>
                    </div>
                  )}

                  {/* Confirm Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition text-center"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md shadow-indigo-100"
                    >
                      ยืนยันการสั่งสั่งซื้อ
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
