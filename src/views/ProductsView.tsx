/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Member } from '../types';
import { 
  Search, 
  ShoppingCart, 
  Info, 
  CheckCircle, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Layers,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Check,
  ArrowLeft,
  Upload,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { stripHtml } from '../utils/sheetParser';

interface ProductsViewProps {
  products: Product[];
  currentUser: Member | null;
  onPurchase: (product: Product, quantity: number, registrationDetails?: any) => void;
}

export default function ProductsView({ products, currentUser, onPurchase }: ProductsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Checkout and Registration States
  const [checkoutStep, setCheckoutStep] = useState<'quantity' | 'register' | 'payment_slip' | 'success'>('quantity');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cod'>('cash');
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [generatedOrderId, setGeneratedOrderId] = useState<string>('');
  const [generatedSponsorCode, setGeneratedSponsorCode] = useState<string>('');

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
    setCheckoutStep('quantity');
    setFirstName(currentUser ? currentUser.name.split(' ')[0] || '' : '');
    setLastName(currentUser ? currentUser.name.split(' ').slice(1).join(' ') || '' : '');
    setPhone(currentUser ? currentUser.phone || '' : '');
    setEmail(currentUser ? currentUser.email || '' : '');
    setAddress('');
    setPaymentMethod('cash');
    setSlipFile(null);
    setIsVerifying(false);
    setScanProgress(0);
    setVerificationResult('idle');
    setGeneratedOrderId(`ORD-${Date.now().toString().slice(-4)}`);
    setGeneratedSponsorCode(currentUser ? currentUser.id : `NS${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;
    
    // Call the parent state purchase simulation
    onPurchase(selectedProduct, quantity, {
      firstName,
      lastName,
      phone,
      email,
      address,
      paymentMethod,
      slipUrl: slipFile || (paymentMethod === 'cod' ? 'COD' : '')
    });
    
    setCheckoutStep('success');
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file.name);
      startSlipVerification();
    }
  };

  const handleDropSlip = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSlipFile(file.name);
      startSlipVerification();
    }
  };

  const startSlipVerification = () => {
    setIsVerifying(true);
    setScanProgress(0);
    setVerificationResult('scanning');
    
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setScanProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsVerifying(false);
        setVerificationResult('success');
      }
    }, 150);
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
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{stripHtml(product.description)}</p>
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

      {/* Detailed Purchase Modal / Dialog / Multi-Step Wizard */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative">
            
            {/* Header image (hide in success screen to make email mockup focus) */}
            {checkoutStep !== 'success' && (
              <div className="relative aspect-video bg-slate-100">
                <img referrerPolicy="no-referrer" src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/50 hover:bg-slate-950/70 text-white flex items-center justify-center text-sm font-bold transition"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Step indicator rail */}
            <div className="px-6 pt-5 pb-2 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${checkoutStep === 'quantity' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>1</span>
                  <span className="text-[11px] font-bold text-slate-700">ระบุจำนวน</span>
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${checkoutStep === 'register' ? 'bg-indigo-600 text-white' : checkoutStep === 'payment_slip' || checkoutStep === 'success' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>2</span>
                  <span className="text-[11px] font-bold text-slate-700">ลงทะเบียน</span>
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${checkoutStep === 'payment_slip' ? 'bg-indigo-600 text-white' : checkoutStep === 'success' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>3</span>
                  <span className="text-[11px] font-bold text-slate-700">ชำระเงิน</span>
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${checkoutStep === 'success' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>4</span>
                  <span className="text-[11px] font-bold text-slate-700">สำเร็จ</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-white">
              
              {/* STEP 1: QUANTITY SELECTOR */}
              {checkoutStep === 'quantity' && (
                <div className="space-y-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] uppercase font-bold tracking-wider mb-1.5">
                      {selectedProduct.brand} | {selectedProduct.category}
                    </span>
                    <h3 className="text-sm md:text-base font-extrabold text-slate-800">{selectedProduct.name}</h3>
                    <div 
                      className="text-xs text-slate-500 mt-1.5 leading-relaxed product-description-html"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                    />
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

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition text-center"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => setCheckoutStep('register')}
                        className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md shadow-indigo-100"
                      >
                        ยืนยันการสั่งสั่งซื้อ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: REGISTRATION FORM */}
              {checkoutStep === 'register' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <button 
                      onClick={() => setCheckoutStep('quantity')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-xs font-bold text-slate-800">ข้อมูลการลงทะเบียนและจัดส่งสินค้า</h4>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">ชื่อจริง *</label>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            placeholder="ป้อนชื่อจริง"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800"
                          />
                          <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">นามสกุล *</label>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            placeholder="ป้อนนามสกุล"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800"
                          />
                          <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">เบอร์โทรศัพท์ *</label>
                        <div className="relative">
                          <input 
                            type="tel"
                            required
                            placeholder="เช่น 0811601092"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800"
                          />
                          <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">อีเมล์สำหรับจัดส่งรหัสแนะนำ *</label>
                        <div className="relative">
                          <input 
                            type="email"
                            required
                            placeholder="เช่น name@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800"
                          />
                          <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ที่อยู่จัดส่งโดยละเอียด *</label>
                      <div className="relative">
                        <textarea 
                          required
                          rows={2.5}
                          placeholder="ระบุบ้านเลขที่ ถนน ซอย ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800 resize-none"
                        />
                        <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Payment Selector */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-slate-700 font-bold">เลือกวิธีการชำระเงิน *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <CreditCard className={`w-4 h-4 ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {paymentMethod === 'cash' && <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">✓</span>}
                          </div>
                          <div className="mt-2 text-left">
                            <span className="block font-extrabold text-[11px]">เงินสด / โอนธนาคาร</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">ไม่มีค่าธรรมเนียมเพิ่มเติม</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-1">
                              <span className="bg-indigo-100 text-indigo-700 text-[8px] px-1 rounded uppercase font-extrabold">COD</span>
                            </div>
                            {paymentMethod === 'cod' && <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">✓</span>}
                          </div>
                          <div className="mt-2 text-left">
                            <span className="block font-extrabold text-[11px]">เก็บเงินปลายทาง</span>
                            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">ชาร์จเพิ่ม 3% โดยระบบ</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pricing feedback below billing type */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ยอดสินค้า ({quantity} ชิ้น)</span>
                      <span className="font-bold text-slate-700">{(selectedProduct.price * quantity).toLocaleString()} ฿</span>
                    </div>
                    {paymentMethod === 'cod' && (
                      <div className="text-right">
                        <span className="text-[10px] text-amber-600 font-semibold block">ค่าบริการปลายทาง 3%</span>
                        <span className="font-extrabold text-amber-600">+{Math.round(selectedProduct.price * quantity * 0.03).toLocaleString()} ฿</span>
                      </div>
                    )}
                    <div className="text-right border-l border-slate-200 pl-3">
                      <span className="text-[10px] text-indigo-600 font-bold block">ยอดจ่ายจริงสุทธิ</span>
                      <span className="text-sm font-extrabold text-indigo-600">
                        {paymentMethod === 'cod' 
                          ? (selectedProduct.price * quantity + Math.round(selectedProduct.price * quantity * 0.03)).toLocaleString()
                          : (selectedProduct.price * quantity).toLocaleString()
                        } ฿
                      </span>
                    </div>
                  </div>

                  {/* Navigation Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setCheckoutStep('quantity')}
                      className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition text-center"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      disabled={!firstName || !lastName || !phone || !email || !address}
                      onClick={() => setCheckoutStep('payment_slip')}
                      className={`flex-grow font-bold text-xs py-2.5 rounded-xl transition text-center shadow-sm ${(!firstName || !lastName || !phone || !email || !address) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}
                    >
                      ดำเนินการชำระเงิน
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT DETAILS & SLIP UPLOAD / SYSTEM AUTOCONFIRM */}
              {checkoutStep === 'payment_slip' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <button 
                      onClick={() => setCheckoutStep('register')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-xs font-bold text-slate-800">
                      {paymentMethod === 'cash' ? 'โอนเงินชำระและแนบหลักฐานสลิป' : 'ยืนยันสั่งซื้อเก็บเงินปลายทาง'}
                    </h4>
                  </div>

                  {/* Invoice Summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">รหัสคำสั่งซื้อชั่วคราว</span>
                        <span className="font-extrabold text-indigo-600 font-mono text-[11px]">{generatedOrderId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">ผู้รับสินค้า</span>
                        <span className="font-bold text-slate-700">{firstName} {lastName}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>ค่าสินค้า:</span>
                        <span>{(selectedProduct.price * quantity).toLocaleString()} ฿</span>
                      </div>
                      {paymentMethod === 'cod' && (
                        <div className="flex justify-between text-amber-600 text-[11px] font-semibold">
                          <span>ค่าบริการเรียกเก็บปลายทาง COD (3%):</span>
                          <span>+{Math.round(selectedProduct.price * quantity * 0.03).toLocaleString()} ฿</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-700 font-extrabold pt-1.5 border-t border-dashed border-slate-200">
                        <span>ยอดชำระสุทธิ:</span>
                        <span className="text-indigo-600 font-mono text-sm">
                          {paymentMethod === 'cod'
                            ? (selectedProduct.price * quantity + Math.round(selectedProduct.price * quantity * 0.03)).toLocaleString()
                            : (selectedProduct.price * quantity).toLocaleString()
                          } ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BANK CASH / TRANSFER OPTION */}
                  {paymentMethod === 'cash' ? (
                    <div className="space-y-4">
                      {/* Bank account details requested */}
                      <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span>กรุณาโอนเงินเข้าบัญชีเจ้าของระบบ</span>
                        </div>
                        <div className="space-y-1 text-xs text-indigo-950 font-medium bg-white/70 p-3 rounded-xl border border-indigo-100/30">
                          <p className="flex justify-between">
                            <span className="text-indigo-700">ชื่อบัญชี:</span> 
                            <strong className="text-slate-800">ไวพจน์ โสมภา</strong>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-indigo-700">ประเภทช่องทาง:</span> 
                            <strong className="text-slate-800">บัญชีพร้อมเพย์ (PromptPay)</strong>
                          </p>
                          <p className="flex justify-between text-sm pt-0.5">
                            <span className="text-indigo-700">เบอร์โทรพร้อมเพย์:</span> 
                            <strong className="text-indigo-600 font-mono font-extrabold text-base tracking-wider">081-160-1092</strong>
                          </p>
                        </div>
                      </div>

                      {/* Slip uploader */}
                      <div className="space-y-2">
                        <label className="block text-slate-700 font-bold text-xs">แนบสลิปยืนยันการโอน *</label>
                        
                        {!slipFile ? (
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropSlip}
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition cursor-pointer bg-slate-50/50"
                          >
                            <input 
                              type="file" 
                              id="slip-upload-input" 
                              accept="image/*" 
                              onChange={handleSlipChange} 
                              className="hidden" 
                            />
                            <label htmlFor="slip-upload-input" className="cursor-pointer space-y-2 block">
                              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                              <div className="text-xs">
                                <span className="text-indigo-600 font-bold">กดเพื่ออัปโหลดสลิป</span> หรือลากไฟล์มาวางที่นี่
                              </div>
                              <p className="text-[10px] text-slate-400">รองรับไฟล์สลิปธนาคารมาตรฐาน (PNG, JPG, PDF)</p>
                            </label>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                            {/* Scanning Overlay Animation */}
                            {isVerifying ? (
                              <div className="space-y-3.5 py-4 text-center relative overflow-hidden">
                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                                <div className="text-xs font-bold text-indigo-600 animate-pulse">
                                  ระบบกำลังตรวจสอบสลิปผ่าน AI อัตโนมัติ ({scanProgress}%)
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden max-w-[240px] mx-auto">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                                    style={{ width: `${scanProgress}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">ตรวจจับรหัส QR Code และยอดเงินโอน...</p>
                                
                                {/* Vertical laser scan line */}
                                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse border-y border-indigo-500/20 pointer-events-none" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckCircle className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="block font-bold text-xs text-slate-800 truncate max-w-[200px]">{slipFile}</span>
                                    <span className="block text-[10px] text-emerald-600 font-semibold">ตรวจสอบความถูกต้องสลิปสำเร็จ 100%!</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSlipFile(null)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 font-medium"
                                >
                                  เปลี่ยนรูป
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* COD OPTION INFO & SYSTEM SECURITY SECURITY AUTOCHECK */
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>ระบบเก็บเงินปลายทางผ่านการอนุมัติความปลอดภัยแล้ว</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        เจ้าหน้าที่จะดำเนินการโทรศัพท์ติดต่อยืนยันพิกัดปลายทางที่เบอร์ <strong className="text-slate-800 font-bold">{phone}</strong> ก่อนดำเนินการแพ็คของจัดส่งสินค้าด่วนภายใน 24 ชม.
                      </p>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setCheckoutStep('register')}
                      className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition text-center"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      disabled={paymentMethod === 'cash' && (!slipFile || isVerifying)}
                      onClick={handleConfirmPurchase}
                      className={`flex-grow font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md ${
                        (paymentMethod === 'cash' && (!slipFile || isVerifying))
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                      }`}
                    >
                      {paymentMethod === 'cash' ? 'ยืนยันสั่งชื้อและแจ้งโอนสลิป' : 'ยืนยันสั่งซื้อบริการ COD'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS / MAIL SENT PREVIEW */}
              {checkoutStep === 'success' && (
                <div className="space-y-5 text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800">ส่งใบยืนยันออเดอร์เรียบร้อยแล้ว!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ระบบได้ทำการอัปโหลดข้อมูลคะแนนสะสม BV เข้าระบบสายงานของท่านและส่งเอกสารใบเสร็จทางอีเมลเรียบร้อยแล้ว
                    </p>
                  </div>

                  {/* Beautiful custom-designed Email Inbox Mockup client requested */}
                  <div className="border border-slate-200 rounded-2xl text-left overflow-hidden bg-slate-50 shadow-sm text-xs">
                    <div className="bg-slate-900 text-slate-300 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-mono text-slate-400 ml-1">PNMall Mail Server Client</span>
                      </div>
                      <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">ส่งสำเร็จแล้ว</span>
                    </div>

                    <div className="p-3 border-b border-slate-200 bg-white space-y-1 text-[11px]">
                      <p className="text-slate-500"><strong className="text-slate-700">จาก:</strong> service@pnmall4u.com (PNMall4U Auto Confirmation)</p>
                      <p className="text-slate-500"><strong className="text-slate-700">ถึง:</strong> {email}</p>
                      <p className="text-slate-800 font-bold"><strong className="text-slate-700">หัวข้อ:</strong> ยืนยันคำสั่งซื้อออเดอร์ #{generatedOrderId} และรหัสผู้แนะนำสายงาน MLM ของคุณ</p>
                    </div>

                    <div className="p-4 bg-white space-y-3 max-h-[190px] overflow-y-auto text-[11px] text-slate-700 leading-relaxed">
                      <div className="text-center font-bold text-indigo-600 border-b border-dashed border-slate-100 pb-2">
                        ยินดีต้อนรับเข้าสู่ครอบครัว MLM - PNMall4U
                      </div>
                      
                      <p>เรียนคุณ <strong className="text-slate-950">{firstName} {lastName}</strong>,</p>
                      <p>ทางทีมงานของขอขอบพระคุณอย่างสูงสำหรับการสั่งซื้อสินค้าไอทีคุณภาพเยี่ยมจากระบบของเรา ข้อมูลรายละเอียดคำสั่งซื้อของท่านได้บันทึกเข้าระบบแล้วดังนี้:</p>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1.5 font-sans">
                        <p><strong>ออเดอร์ไอดี:</strong> <span className="font-mono text-indigo-600 font-bold">{generatedOrderId}</span></p>
                        <p><strong>สินค้า:</strong> {selectedProduct.name} (จำนวน {quantity} ชิ้น)</p>
                        <p><strong>คะแนนสะสมที่ได้รับ:</strong> <span className="text-indigo-600 font-bold font-mono">+{selectedProduct.bv * quantity} BV</span> (คำนวณเข้าสายงานอัปลิงก์สำเร็จ)</p>
                        <p><strong>วิธีการจ่ายเงิน:</strong> {paymentMethod === 'cod' ? 'เก็บเงินปลายทาง (ชาร์จ 3%)' : 'เงินสด (โอนพร้อมเพย์ ไวพจน์ โสมภา)'}</p>
                        <p><strong>ยอดรวมสุทธิทั้งสิ้น:</strong> <strong className="text-slate-900">
                          {paymentMethod === 'cod'
                            ? (selectedProduct.price * quantity + Math.round(selectedProduct.price * quantity * 0.03)).toLocaleString()
                            : (selectedProduct.price * quantity).toLocaleString()
                          } บาท
                        </strong></p>
                        <p><strong>ที่อยู่จัดส่ง:</strong> <span className="text-slate-500">{address}</span></p>
                      </div>

                      {/* Sponsor code notification */}
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <p className="font-bold text-indigo-900 text-[10px] uppercase tracking-wider mb-0.5">🔑 รหัสผู้แนะนำ (Referral Code / Member ID ของคุณ)</p>
                        <p className="text-slate-600 text-[10px]">โปรดใช้รหัสนี้เป็น "รหัสผู้แนะนำ" เพื่อแนะนำสมาชิกใหม่มาต่อผังโครงสร้างสายงานด้านซ้ายหรือขวาของท่าน เพื่อรับสิทธิ์คอมมิชชันทีม!</p>
                        <p className="text-center mt-1.5"><strong className="bg-white px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 font-mono text-xs tracking-widest inline-block">{generatedSponsorCode}</strong></p>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2">หากต้องการความช่วยเหลือ ติดต่อเราได้ที่เบอร์สายด่วน 081-160-1092 ตลอด 24 ชั่วโมง</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setCheckoutStep('quantity');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition text-center"
                  >
                    ปิดและกลับสู่หน้าแสดงสินค้า
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
