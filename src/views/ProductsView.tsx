/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Trash2,
  Plus,
  Minus,
  CheckSquare,
  MessageSquare,
  Zap,
  Lightbulb,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  currentUser: Member | null;
  onPurchase: (items: { product: Product; quantity: number }[], registrationDetails?: any) => void;
  cart: { product: Product; quantity: number }[];
  onAddToCart: (product: Product, qty: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, qty: number) => void;
  onClearCart: () => void;
}

// Formats descriptions seamlessly: cleans up massive gaps from HTML tags and parses newlines for plain text
const formatDescriptionHtml = (desc: string): string => {
  if (!desc) return '';
  const hasHtml = /<[a-z][\s\S]*>/i.test(desc);
  if (!hasHtml) {
    return desc.replace(/\n/g, '<br />');
  }
  return desc
    .replace(/>\s*\n\s*</g, '><') // Collapse newlines formatted inside HTML tags
    .replace(/\r/g, '');
};

export default function ProductsView({ 
  products, 
  currentUser, 
  onPurchase, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  onUpdateCartQuantity, 
  onClearCart 
}: ProductsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [activePreviewImage, setActivePreviewImage] = useState<string>('');
  const [copiedProductShare, setCopiedProductShare] = useState<boolean>(false);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [showAddSuccess, setShowAddSuccess] = useState<boolean>(false);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart_items' | 'register' | 'payment_slip' | 'success'>('cart_items');

  // Registration/Shipping state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cod'>('cash');
  
  // Slip verification state
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  
  // Generated success metadata
  const [generatedOrderId, setGeneratedOrderId] = useState<string>('');
  const [generatedSponsorCode, setGeneratedSponsorCode] = useState<string>('');
  const [completedOrderSummary, setCompletedOrderSummary] = useState<any>(null);

  const [copiedOrderSuccess, setCopiedOrderSuccess] = useState<boolean>(false);

  const getOrderSuccessShareText = (o: any) => {
    const itemsText = o.items.map((i: any) => `• ${i.product.name} x ${i.quantity}`).join('\n');
    const paymentText = o.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง (COD +3%)' : 'เงินสด / โอนเงินผ่านระบบพร้อมเพย์';
    return (
      `ใบเสร็จรับเงิน Noina Shop (รหัสคำสั่งซื้อ: ${o.orderId})\n` +
      `----------------------------------------\n` +
      `👤 ลูกค้าผู้สั่งซื้อ: คุณ ${o.firstName} ${o.lastName}\n` +
      `📦 รายการที่สั่งซื้อ:\n${itemsText}\n` +
      `----------------------------------------\n` +
      `💰 ยอดรวมสุทธิ: ${o.totalAmount.toLocaleString()} บาท\n` +
      `📈 คะแนนได้รับ: +${o.totalBV} BV (ไหลขึ้นสายงานแล้ว)\n` +
      `🚚 วิธีการจัดส่ง/ชำระเงิน: ${paymentText}\n` +
      `📍 ที่อยู่จัดส่ง: ${o.address || 'รับหน้าร้าน'}\n` +
      `----------------------------------------\n` +
      `ขอบพระคุณที่อุดหนุนสินค้าไอทีคุณภาพดีจากร้าน Noina Shop!`
    );
  };

  const handleCopyOrderSuccess = (o: any) => {
    navigator.clipboard.writeText(getOrderSuccessShareText(o));
    setCopiedOrderSuccess(true);
    setTimeout(() => setCopiedOrderSuccess(false), 2000);
  };

  const sendOrderSuccessEmail = (o: any) => {
    const subject = encodeURIComponent(`ใบเสร็จและการยืนยันคำสั่งซื้อ ${o.orderId} - Noina Shop`);
    const body = encodeURIComponent(getOrderSuccessShareText(o));
    window.open(`mailto:${o.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  // Auto-fill names if logged in
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.name.split(' ')[0] || '');
      setLastName(currentUser.name.split(' ').slice(1).join(' ') || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower === 'เครื่องใช้ไฟฟ้า' || lower.includes('ไฟฟ้า') || lower.includes('appliance')) return Zap;
    if (lower === 'อุปกรณ์ส่องสว่าง' || lower.includes('สว่าง') || lower.includes('ไฟ') || lower.includes('light')) return Lightbulb;
    if (lower === 'smartphone' || lower.includes('มือถือ') || lower.includes('phone')) return Smartphone;
    if (lower === 'notebook' || lower.includes('โน๊ตบุ๊ค') || lower.includes('laptop')) return Laptop;
    if (lower === 'tablet' || lower.includes('แท็บเล็ต')) return Tablet;
    if (lower === 'accessory' || lower.includes('อุปกรณ์เสริม')) return Info;
    return Layers;
  };

  // Category labels with icons (including dynamic categories from Google Sheet)
  const defaultCategories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers },
    { id: 'เครื่องใช้ไฟฟ้า', label: 'เครื่องใช้ไฟฟ้า', icon: Zap },
    { id: 'อุปกรณ์ส่องสว่าง', label: 'อุปกรณ์ส่องสว่าง', icon: Lightbulb },
    { id: 'smartphone', label: 'โทรศัพท์มือถือ', icon: Smartphone },
    { id: 'notebook', label: 'โน๊ตบุ๊ค', icon: Laptop },
    { id: 'tablet', label: 'แท็บเล็ต', icon: Tablet },
    { id: 'accessory', label: 'อุปกรณ์เสริม', icon: Info },
  ];

  const categories = React.useMemo(() => {
    const list = [...defaultCategories];
    const existingIds = new Set(list.map(c => c.id.toLowerCase()));
    
    products.forEach(p => {
      const cat = (p.category || '').trim();
      if (cat && !existingIds.has(cat.toLowerCase()) && cat.toLowerCase() !== 'all') {
        existingIds.add(cat.toLowerCase());
        list.push({
          id: cat,
          label: cat,
          icon: getCategoryIcon(cat)
        });
      }
    });
    return list;
  }, [products]);

  // Filtering products
  const filteredProducts = products.filter(p => {
    const pCat = (p.category || '').trim().toLowerCase();
    const activeCat = activeCategory.trim().toLowerCase();
    const matchesCategory = 
      activeCat === 'all' || 
      pCat === activeCat ||
      (activeCat === 'เครื่องใช้ไฟฟ้า' && (pCat === 'เครื่องใช้ไฟฟ้า' || pCat.includes('ไฟฟ้า') || pCat.includes('appliance')));
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate pricing breakdown of the cart
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalBV = cart.reduce((sum, item) => sum + item.product.bv * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 50 : 0; // Flat fee 50 THB per round
  const codFee = paymentMethod === 'cod' ? Math.round(subtotal * 0.03) : 0; // 3% COD fee
  const totalAmount = subtotal + shippingFee + codFee;

  const getCleanOption = (opt: string) => {
    if (!opt) return '';
    return opt.split(':')[0].trim();
  };

  const getOptionVariant = (prod?: Product | null, opt?: string) => {
    if (!prod || !opt) return null;
    const clean = getCleanOption(opt).toLowerCase();
    if (prod.variantOptions && prod.variantOptions.length > 0) {
      const found = prod.variantOptions.find(v => v.name.toLowerCase() === clean);
      if (found) return found;
    }
    return null;
  };

  const getOptionPrice = (prod?: Product | null, opt?: string) => {
    if (!prod) return 0;
    if (!opt) return prod.price;
    const v = getOptionVariant(prod, opt);
    if (v && typeof v.price === 'number' && v.price > 0) return v.price;
    if (opt.includes(':')) {
      const p = parseFloat(opt.split(':')[1]);
      if (!isNaN(p) && p > 0) return p;
    }
    return prod.price;
  };

  const getOptionBv = (prod?: Product | null, opt?: string) => {
    if (!prod) return 0;
    if (!opt) return prod.bv;
    const v = getOptionVariant(prod, opt);
    if (v && typeof v.bv === 'number' && !isNaN(v.bv)) return v.bv;
    if (opt.includes(':')) {
      const parts = opt.split(':');
      if (parts.length >= 3) {
        const b = parseFloat(parts[2]);
        if (!isNaN(b)) return b;
      }
    }
    return prod.bv;
  };

  const getOptionSku = (prod?: Product | null, opt?: string) => {
    if (!prod) return '';
    if (!opt) return prod.sku || '';
    const v = getOptionVariant(prod, opt);
    if (v && v.sku) return v.sku;
    return prod.sku || '';
  };

  const handleOpenAddModal = (product: Product, preselectedOption?: string) => {
    setSelectedProduct(product);
    let chosenOpt = '';
    if (preselectedOption) {
      chosenOpt = preselectedOption;
    } else if (product.options && product.options.length > 0) {
      chosenOpt = product.options[0];
    }
    setSelectedOption(chosenOpt);
    const variant = getOptionVariant(product, chosenOpt);
    if (variant && variant.image) {
      setActivePreviewImage(variant.image);
    } else {
      setActivePreviewImage(product.images && product.images.length > 0 ? product.images[0] : product.image);
    }
    setQtyToAdd(1);
    setShowAddSuccess(false);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProduct) return;
    const cleanOpt = getCleanOption(selectedOption);
    const unitPrice = getOptionPrice(selectedProduct, selectedOption);
    const unitBv = getOptionBv(selectedProduct, selectedOption);
    const unitSku = getOptionSku(selectedProduct, selectedOption);
    const finalProduct: Product = cleanOpt
      ? {
          ...selectedProduct,
          price: unitPrice,
          bv: unitBv,
          sku: unitSku || selectedProduct.sku,
          id: `${selectedProduct.id}-${encodeURIComponent(cleanOpt)}`,
          name: `${selectedProduct.name} [${cleanOpt}]`
        }
      : {
          ...selectedProduct,
          price: unitPrice,
          bv: unitBv,
          sku: unitSku || selectedProduct.sku
        };
    onAddToCart(finalProduct, qtyToAdd);
    setShowAddSuccess(true);
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    const cleanOpt = getCleanOption(selectedOption);
    const unitPrice = getOptionPrice(selectedProduct, selectedOption);
    const unitBv = getOptionBv(selectedProduct, selectedOption);
    const unitSku = getOptionSku(selectedProduct, selectedOption);
    const finalProduct: Product = cleanOpt
      ? {
          ...selectedProduct,
          price: unitPrice,
          bv: unitBv,
          sku: unitSku || selectedProduct.sku,
          id: `${selectedProduct.id}-${encodeURIComponent(cleanOpt)}`,
          name: `${selectedProduct.name} [${cleanOpt}]`
        }
      : {
          ...selectedProduct,
          price: unitPrice,
          bv: unitBv,
          sku: unitSku || selectedProduct.sku
        };
    onAddToCart(finalProduct, qtyToAdd);
    setSelectedProduct(null);
    handleOpenCheckout();
  };

  const handleOpenCheckout = () => {
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
    setCheckoutStep('cart_items');
    setSlipFile(null);
    setVerificationResult('idle');
    setGeneratedOrderId(`ORD-${Date.now().toString().slice(-4)}`);
    setGeneratedSponsorCode(currentUser ? currentUser.id : `NS${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleFinalCheckoutSubmit = () => {
    if (cart.length === 0) return;

    // Capture order summary for success screen before clearing cart
    const orderDetails = {
      orderId: generatedOrderId,
      items: [...cart],
      subtotal,
      shippingFee,
      codFee,
      totalAmount,
      totalBV,
      paymentMethod,
      firstName,
      lastName,
      phone,
      email,
      address,
      sponsorCode: generatedSponsorCode,
      slipUrl: slipFile || (paymentMethod === 'cod' ? 'COD' : '')
    };

    setCompletedOrderSummary(orderDetails);

    // Call app parent to save the order
    onPurchase(cart, {
      orderId: generatedOrderId,
      firstName,
      lastName,
      phone,
      email,
      address,
      paymentMethod,
      slipUrl: slipFile || (paymentMethod === 'cod' ? 'COD' : ''),
      sponsorCode: generatedSponsorCode
    });

    // บังคับให้เพิ่มคำสั่ง fetch('/api/register') เพื่อส่งข้อมูลประวัติออเดอร์ ไปยังระบบหลังบ้าน
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'order',
        orderId: generatedOrderId,
        customerName: `${firstName} ${lastName}`,
        email,
        phone,
        items: cart.map(item => `${item.product.name} (x${item.quantity})`).join(', '),
        totalAmount,
        totalBV,
        paymentMethod,
        address,
        slipUrl: slipFile || (paymentMethod === 'cod' ? 'COD' : ''),
        sponsorCode: generatedSponsorCode
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Order sync result:', data);
    })
    .catch(err => {
      console.error('Failed to sync order:', err);
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
    }, 120);
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
              <div 
                onClick={() => handleOpenAddModal(product)}
                className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer"
              >
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
                {product.source === 'seller' && (
                  <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                    ผู้ขาย: {product.sellerName || 'สมาชิก'}
                  </span>
                )}
              </div>

              {/* Product Body */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3.5 bg-white">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block tracking-wider">
                    {product.brand}
                  </span>
                  <h3 
                    onClick={() => handleOpenAddModal(product)}
                    className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-amber-700 transition cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  
                  {/* Selectable Options on Card directly */}
                  {product.options && product.options.length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-700">ขนาด / ตัวเลือก:</span>
                        <span className="text-[10px] text-amber-600 font-semibold">{product.options.length} ตัวเลือก</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.options.map((opt, optIdx) => {
                          const clean = getCleanOption(opt);
                          const optP = getOptionPrice(product, opt);
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddModal(product, opt);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-500 hover:text-white text-amber-900 transition flex items-center gap-1 shadow-xs"
                              title={`คลิกเลือกขนาด ${clean}`}
                            >
                              <span>{clean}</span>
                              {product.variantOptions && product.variantOptions.length > 1 && optP > 0 && (
                                <span className="text-[10px] font-normal opacity-80">({optP.toLocaleString()}฿)</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="html-description text-xs text-slate-500 leading-relaxed font-sans break-words line-clamp-2" dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(product.description) }} />
                </div>

                {/* Buy Section */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none">
                      {product.condition === 'NEW' ? 'ราคาจำหน่าย' : 'ราคามือสอง'}
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-slate-900">
                      {(() => {
                        if (product.variantOptions && product.variantOptions.length > 1) {
                          const prices = product.variantOptions.map(v => v.price).filter(p => p > 0);
                          const minP = Math.min(...prices);
                          const maxP = Math.max(...prices);
                          if (minP !== maxP && minP > 0 && maxP > 0) {
                            return `${minP.toLocaleString()} - ${maxP.toLocaleString()} ฿`;
                          }
                        }
                        return `${product.price.toLocaleString()} ฿`;
                      })()}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleOpenAddModal(product)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    ดูรายละเอียด & สั่งซื้อ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur px-5 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-5 max-w-lg w-[90%] justify-between animate-fade-in animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-300 font-medium leading-none">สินค้า {cart.length} รายการ | {totalBV} BV</span>
              <span className="block font-bold text-sm mt-0.5">{subtotal.toLocaleString()} ฿</span>
            </div>
          </div>
          <button
            onClick={handleOpenCheckout}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
          >
            ตรวจตะกร้า & สั่งซื้อ
          </button>
        </div>
      )}

      {/* MODAL 1: PRODUCT DETAIL & BUY MODAL (EXACT TANARATH / LEKISE E-COMMERCE LAYOUT) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="bg-white rounded-2xl md:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col animate-fade-in">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition shadow-xs"
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>

            {/* Scrollable Container */}
            <div className="overflow-y-auto p-5 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                
                {/* Left Column: Product Gallery */}
                <div className="md:col-span-6 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-4 relative group">
                    <img 
                      referrerPolicy="no-referrer" 
                      src={activePreviewImage || (selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0] : selectedProduct.image)} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300" 
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/85 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                      {selectedProduct.condition === 'NEW' ? 'สินค้าใหม่' : selectedProduct.condition}
                    </span>
                    <span className="absolute top-3 right-12 bg-indigo-600 text-white font-mono font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-sm">
                      +{getOptionBv(selectedProduct, selectedOption)} BV
                    </span>
                  </div>

                  {/* Multi-Image Thumbnails Carousel / Strip */}
                  {(() => {
                    const gallery = selectedProduct.images && selectedProduct.images.length > 0 
                      ? selectedProduct.images 
                      : [selectedProduct.image];
                    if (gallery.length <= 1) return null;
                    return (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400">รูปภาพสินค้าเพิ่มเติม:</span>
                        <div className="flex flex-wrap gap-2">
                          {gallery.map((img, idx) => {
                            const isCur = (activePreviewImage || gallery[0]) === img;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActivePreviewImage(img)}
                                className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-white p-1 transition ${
                                  isCur
                                    ? 'border-amber-500 ring-2 ring-amber-200'
                                    : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img referrerPolicy="no-referrer" src={img} alt="" className="w-full h-full object-contain" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Trust Guarantee Box */}
                  <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>มาตรฐานคุณภาพและการันตี</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      • สินค้ามาตรฐาน มอก. ตรวจสอบคุณภาพความปลอดภัยก่อนจัดส่ง<br />
                      • รองรับบริการเก็บเงินปลายทาง (COD) และจัดส่งพัสดุด่วนทั่วประเทศ
                    </p>
                  </div>
                </div>

                {/* Right Column: Product Detail & Actions */}
                <div className="md:col-span-6 space-y-4">
                  {/* Category & Brand */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] uppercase font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 tracking-wider">
                        {selectedProduct.brand}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        หมวดหมู่: {selectedProduct.category}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                      {selectedProduct.name}
                    </h2>
                  </div>

                  {/* Description / Features */}
                  <div 
                    className="html-description text-xs md:text-sm text-slate-600 leading-relaxed font-sans break-words bg-slate-50/70 p-3 rounded-xl border border-slate-100 max-h-48 overflow-y-auto" 
                    dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(selectedProduct.description) }} 
                  />

                  {/* Specs & Attributes Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">SKU / รหัสสินค้า:</span>
                      <span className="font-mono font-bold text-slate-800">{getOptionSku(selectedProduct, selectedOption) || selectedProduct.sku || '3070035'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">น้ำหนัก:</span>
                      <span className="font-bold text-slate-800">{selectedProduct.weight || (selectedProduct.condition === 'NEW' ? '0.80 กิโลกรัม' : selectedProduct.condition)}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[10px]">ยอดคะแนนธุรกิจ:</span>
                      <span className="font-extrabold text-indigo-600 font-mono">+{getOptionBv(selectedProduct, selectedOption)} BV / ชิ้น</span>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="py-2 border-y border-slate-100 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-500">ราคา:</span>
                      <span className="text-2xl md:text-3xl font-black text-amber-600 font-mono">
                        {(getOptionPrice(selectedProduct, selectedOption) * qtyToAdd).toLocaleString()}.00
                      </span>
                      <span className="text-sm font-semibold text-slate-600">บาท</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      พร้อมจัดส่ง ({selectedProduct.stock} ชิ้น)
                    </span>
                  </div>

                  {/* Selectable Product Options / Sizes */}
                  {selectedProduct.options && selectedProduct.options.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <span>ขนาด:</span>
                          <span className="text-amber-600 font-extrabold">{getCleanOption(selectedOption)}</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">คลิกเพื่อเลือกขนาดที่ต้องการ</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedProduct.options.map((opt, i) => {
                          const clean = getCleanOption(opt);
                          const isSelected = selectedOption === opt || getCleanOption(selectedOption) === clean;
                          const optPrice = getOptionPrice(selectedProduct, opt);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSelectedOption(opt);
                                const v = getOptionVariant(selectedProduct, opt);
                                if (v && v.image) {
                                  setActivePreviewImage(v.image);
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition shadow-xs flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-amber-500 text-white border-2 border-amber-500 ring-2 ring-amber-200'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              <span>{clean}</span>
                              {optPrice > 0 && (
                                <span className={`text-[11px] font-semibold ${isSelected ? 'text-amber-100' : 'text-amber-600'}`}>
                                  ({optPrice.toLocaleString()} ฿)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity Counter */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-800 block">จำนวน</label>
                    <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                      <button 
                        type="button"
                        onClick={() => setQtyToAdd(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        -
                      </button>
                      <span className="w-14 text-center font-bold font-mono text-xs md:text-sm text-slate-900 border-x border-slate-200 py-2">
                        {qtyToAdd}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setQtyToAdd(prev => Math.min(selectedProduct.stock, prev + 1))}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add Success Toast Notification */}
                  {showAddSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between animate-fade-in text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                        <span>เพิ่ม <strong>{selectedProduct.name} {getCleanOption(selectedOption) ? `[${getCleanOption(selectedOption)}]` : ''}</strong> ลงตะกร้าแล้ว!</span>
                      </div>
                      <button
                        onClick={handleOpenCheckout}
                        className="font-bold text-emerald-700 underline hover:text-emerald-900 ml-2"
                      >
                        ไปที่ตะกร้า →
                      </button>
                    </div>
                  )}

                  {/* Two Main Action Buttons: Add to Cart & Buy Now */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAddToCart}
                      className="bg-[#c26219] hover:bg-[#b05614] text-white font-bold text-xs md:text-sm py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-center"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>เพิ่มลงตะกร้า</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs md:text-sm py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-center"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>ซื้อเลย</span>
                    </button>
                  </div>

                  {/* Inquiry Section */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
                      สอบถามข้อมูลเพิ่มเติม
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`mailto:pnmall4u@gmail.com?subject=${encodeURIComponent('สอบถามข้อมูลสินค้า: ' + selectedProduct.name)}`}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition text-center"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>ส่งอีเมล</span>
                      </a>
                      <a
                        href="https://line.me/ti/p/~noinashop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-2 border border-emerald-300 hover:border-emerald-400 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 transition text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Line</span>
                      </a>
                      <a
                        href="https://m.me/noinashop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-2 border border-blue-300 hover:border-blue-400 rounded-lg text-xs font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-50 transition text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Messenger</span>
                      </a>
                    </div>

                    {/* Navigation and Social Share */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="text-slate-500 hover:text-slate-800 font-medium"
                      >
                        ← เลือกสินค้าอื่นต่อ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.href);
                            setCopiedProductShare(true);
                            setTimeout(() => setCopiedProductShare(false), 2000);
                          }
                        }}
                        className="hover:text-slate-700 transition flex items-center gap-1 text-slate-500 font-medium"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedProductShare ? 'คัดลอกลิงก์แล้ว!' : 'แชร์สินค้านี้'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MULTI-ITEM CHECKOUT WIZARD MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative">
            
            {/* Steps indicator banner */}
            <div className="bg-indigo-900 text-white p-5 text-center relative">
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
              <h3 className="font-bold text-sm">ออเดอร์หมายเลข {generatedOrderId}</h3>
              <p className="text-[10px] text-indigo-200 mt-1">
                {checkoutStep === 'cart_items' && 'ขั้นตอนที่ 1: ตรวจสอบตะกร้าสินค้า'}
                {checkoutStep === 'register' && 'ขั้นตอนที่ 2: กรอกข้อมูลลงทะเบียนจัดส่ง'}
                {checkoutStep === 'payment_slip' && 'ขั้นตอนที่ 3: แนบสลิปยืนยัน'}
                {checkoutStep === 'success' && 'ขั้นตอนที่ 4: สั่งซื้อเสร็จสมบูรณ์'}
              </p>
              
              {/* Stepper Dots */}
              <div className="flex justify-center items-center gap-4 mt-3">
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 'cart_items' ? 'bg-indigo-400 text-white ring-2 ring-indigo-300' : 'bg-indigo-800 text-indigo-300'}`}>1</span>
                <span className="w-4 h-[1px] bg-indigo-800"></span>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 'register' ? 'bg-indigo-400 text-white ring-2 ring-indigo-300' : checkoutStep === 'payment_slip' || checkoutStep === 'success' ? 'bg-indigo-600 text-indigo-200' : 'bg-indigo-800 text-indigo-300'}`}>2</span>
                <span className="w-4 h-[1px] bg-indigo-800"></span>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 'payment_slip' ? 'bg-indigo-400 text-white ring-2 ring-indigo-300' : checkoutStep === 'success' ? 'bg-indigo-600 text-indigo-200' : 'bg-indigo-800 text-indigo-300'}`}>3</span>
                <span className="w-4 h-[1px] bg-indigo-800"></span>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 'success' ? 'bg-indigo-400 text-white ring-2 ring-indigo-300' : 'bg-indigo-800 text-indigo-300'}`}>4</span>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-white max-h-[80vh] overflow-y-auto">
              
              {/* STEP 1: CART ITEMS CHECKLIST */}
              {checkoutStep === 'cart_items' && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    รายการในตะกร้าช็อปปิ้งของคุณ
                  </h4>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400">ยังไม่มีสินค้าในตะกร้าของคุณ</p>
                      <button 
                        onClick={() => setIsCheckoutOpen(false)}
                        className="mt-3 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        🛍️ เลือกสินค้าเลย
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Cart List */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex gap-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs justify-between items-center">
                            <img referrerPolicy="no-referrer" src={item.product.image} className="w-12 h-12 object-cover rounded-lg shrink-0 border" />
                            <div className="flex-grow min-w-0">
                              <span className="block font-bold text-slate-800 truncate">{item.product.name}</span>
                              <span className="text-[10px] font-semibold text-indigo-600 block mt-0.5 font-mono">+{item.product.bv} BV / ชิ้น</span>
                              <span className="text-[10px] text-slate-500 block">ราคา: {item.product.price.toLocaleString()} ฿</span>
                            </div>
                            
                            {/* Quantity Manipulator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => onUpdateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 border text-slate-700 flex items-center justify-center font-bold"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-5 text-center font-bold font-mono text-[11px]">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateCartQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 border text-slate-700 flex items-center justify-center font-bold"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => onRemoveFromCart(item.product.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 ml-1.5"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Summary */}
                      <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs text-slate-600 bg-white">
                        <div className="flex justify-between">
                          <span>ราคารวมสินค้า:</span>
                          <span className="font-bold text-slate-800">{subtotal.toLocaleString()} ฿</span>
                        </div>
                        <div className="flex justify-between text-indigo-600 font-semibold">
                          <span>รวมคะแนนธุรกิจในรอบนี้:</span>
                          <span className="font-mono">{totalBV.toLocaleString()} BV</span>
                        </div>
                        <div className="flex justify-between text-slate-500 border-t border-dashed border-slate-200 pt-2 text-[11px]">
                          <span>ค่าจัดส่งสินค้า (ต่อรอบ):</span>
                          <span className="font-bold text-indigo-600">50 ฿</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-800 font-extrabold border-t border-slate-200 pt-2">
                          <span>ยอดรวมชำระเบื้องต้น:</span>
                          <span className="text-indigo-600 font-mono text-base">{(subtotal + 50).toLocaleString()} ฿</span>
                        </div>
                      </div>

                      {/* Info Login Alert */}
                      {!currentUser ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[10px] leading-relaxed flex gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            คุณสั่งซื้อในฐานะ <strong>ลูกค้าบุคคลภายนอก (Guest)</strong> จะไม่ได้รับการสะสมคะแนน BV เข้าระบบและอัปลิงก์ แนะนำเข้าล็อกอินหรือสมัครสมาชิกก่อนสั่งซื้อ
                          </div>
                        </div>
                      ) : (
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl text-[10px] leading-relaxed flex gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            บัญชีผู้ใช้งาน <strong>{currentUser.name}</strong> จะได้รับคะแนนสะสม <strong>+{totalBV} BV</strong> เพื่อใช้อัปสปีดตำแหน่งสายงาน MLM
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex gap-3 pt-2">
                        {/* SELECT MORE PRODUCTS REQUIREMENT BUTTON */}
                        <button
                          onClick={() => setIsCheckoutOpen(false)}
                          className="flex-grow bg-slate-100 hover:bg-slate-200 text-indigo-700 font-bold text-xs py-2.5 rounded-xl transition text-center border border-indigo-100"
                        >
                          🛍️ เลือกสินค้าเพิ่ม
                        </button>
                        <button
                          onClick={() => setCheckoutStep('register')}
                          className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md shadow-indigo-100"
                        >
                          ไปขั้นตอนลงทะเบียนจัดส่ง
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: REGISTRATION & BILLING METHOD */}
              {checkoutStep === 'register' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <button 
                      onClick={() => setCheckoutStep('cart_items')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-xs font-bold text-slate-800">ข้อมูลการลงทะเบียนและพิกัดจัดส่ง</h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">ชื่อจริง *</label>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            placeholder="กรอกชื่อจริง"
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
                            placeholder="กรอกนามสกุล"
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
                        <label className="block text-slate-600 font-bold mb-1">อีเมล์รับส่งรหัสแนะนำ *</label>
                        <div className="relative">
                          <input 
                            type="email"
                            required
                            placeholder="เช่น yourname@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800"
                          />
                          <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ที่อยู่ผู้รับจัดส่ง *</label>
                      <div className="relative">
                        <textarea 
                          required
                          rows={2.5}
                          placeholder="บ้านเลขที่ หมู่ที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-800 resize-none"
                        />
                        <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Method billing choice */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-slate-700 font-bold">เลือกวิธีชำระเงินของคุณ *</label>
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
                            <span className="block font-extrabold text-[11px]">โอนธนาคาร / QR</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">ไม่มีชาร์จเพิ่ม</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="bg-indigo-100 text-indigo-700 text-[8px] px-1 rounded font-extrabold uppercase leading-none">COD</span>
                            {paymentMethod === 'cod' && <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">✓</span>}
                          </div>
                          <div className="mt-2 text-left">
                            <span className="block font-extrabold text-[11px]">เก็บเงินปลายทาง</span>
                            <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">บวกเพิ่ม 3%</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calculations summary with shipping fee */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ยอดสินค้าทั้งหมด:</span>
                      <strong className="text-slate-700">{subtotal.toLocaleString()} ฿</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ค่าจัดส่งด่วน (Flat rate):</span>
                      <strong className="text-indigo-600 font-bold">+50 ฿</strong>
                    </div>
                    {paymentMethod === 'cod' && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>ค่าบริการเก็บเงินปลายทาง (3%):</span>
                        <span>+{codFee.toLocaleString()} ฿</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2 border-t border-dashed border-slate-200 mt-2">
                      <span>ยอดจ่ายเงินสุทธิ:</span>
                      <span className="text-indigo-600 text-base">{totalAmount.toLocaleString()} ฿</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setCheckoutStep('cart_items')}
                      className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition text-center"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      disabled={!firstName || !lastName || !phone || !email || !address}
                      onClick={() => setCheckoutStep('payment_slip')}
                      className={`flex-grow font-bold text-xs py-2.5 rounded-xl transition text-center shadow-sm ${(!firstName || !lastName || !phone || !email || !address) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}
                    >
                      ต่อไป: ตรวจสอบและชำระเงิน
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: BILL SLIP UPLOADER OR COD APPROVAL */}
              {checkoutStep === 'payment_slip' && (
                <div className="space-y-4 animate-fade-in">
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

                  {/* Pricing summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase leading-none">รหัสออเดอร์จัดส่ง</span>
                        <span className="font-extrabold text-indigo-600 font-mono text-xs">{generatedOrderId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block leading-none">ผู้รับสินค้า</span>
                        <span className="font-bold text-slate-700">{firstName} {lastName}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>ค่าสินค้า:</span>
                        <span>{subtotal.toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>ค่าจัดส่งสินค้า (ต่อรอบ):</span>
                        <span>50 ฿</span>
                      </div>
                      {paymentMethod === 'cod' && (
                        <div className="flex justify-between text-amber-700 text-[11px] font-semibold">
                          <span>ค่าบริการเรียกเก็บปลายทาง COD (3%):</span>
                          <span>+{codFee.toLocaleString()} ฿</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-800 font-extrabold pt-2 border-t border-dashed border-slate-200 mt-2">
                        <span>ยอดชำระรวม:</span>
                        <span className="text-indigo-600 font-mono text-base">{totalAmount.toLocaleString()} ฿</span>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'cash' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span>ช่องทางโอนพร้อมเพย์ ไวพจน์ โสมภา</span>
                        </div>
                        <div className="space-y-1 text-xs text-indigo-950 font-medium bg-white/70 p-3 rounded-xl border border-indigo-100/30">
                          <p className="flex justify-between">
                            <span className="text-indigo-700">ชื่อผู้รับ:</span> 
                            <strong className="text-slate-800">ไวพจน์ โสมภา</strong>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-indigo-700">ประเภทช่องทาง:</span> 
                            <strong className="text-slate-800">พร้อมเพย์ (PromptPay)</strong>
                          </p>
                          <p className="flex justify-between text-sm pt-0.5">
                            <span className="text-indigo-700">เบอร์โทรพร้อมเพย์:</span> 
                            <strong className="text-indigo-600 font-mono font-extrabold text-base tracking-wider">081-160-1092</strong>
                          </p>
                        </div>
                      </div>

                      {/* Slip uploader */}
                      <div className="space-y-2">
                        <label className="block text-slate-700 font-bold text-xs">แนบสลิปโอนเงิน *</label>
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
                                <span className="text-indigo-600 font-bold">กดเพื่ออัปโหลดไฟล์สลิป</span> หรือลากไฟล์มาวางที่นี่
                              </div>
                              <p className="text-[10px] text-slate-400">รองรับรูปแบบ JPG, PNG, PDF (ตรวจสลิปผ่าน AI อัตโนมัติ)</p>
                            </label>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                            {isVerifying ? (
                              <div className="space-y-3 py-3 text-center relative overflow-hidden">
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
                                <p className="text-[10px] text-slate-400">ตรวจจับ QR Code โครงสร้างพร้อมเพย์...</p>
                                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse border-y border-indigo-500/10 pointer-events-none" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">✓</div>
                                  <div>
                                    <span className="block font-bold text-xs text-slate-800 truncate max-w-[180px]">{slipFile}</span>
                                    <span className="block text-[10px] text-emerald-600 font-semibold">ผ่านการอนุมัติสลิปโอนเงินสำเร็จ!</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSlipFile(null)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
                                >
                                  เปลี่ยนสลิป
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>ชำระเงินเมื่อรับสินค้า (COD +3%)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        เจ้าหน้าที่จะโทรศัพท์ติดต่อเพื่อคอนเฟิร์มชื่อผู้รับและพิกัดที่เบอร์ <strong className="text-slate-800">{phone}</strong> ก่อนการเริ่มจัดส่งพัสดุ โดยลูกค้าจะจ่ายชำระยอดทั้งสิ้น <strong className="text-indigo-600">{totalAmount.toLocaleString()} ฿</strong> กับเจ้าหน้าที่ขนส่งที่หน้าบ้านของท่าน
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
                      onClick={handleFinalCheckoutSubmit}
                      className={`flex-grow font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md ${
                        (paymentMethod === 'cash' && (!slipFile || isVerifying))
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                      }`}
                    >
                      {paymentMethod === 'cash' ? 'ยืนยันสั่งชื้อและส่งหลักฐานโอน' : 'ยืนยันสั่งซื้อบริการปลายทาง COD'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS WITH REAL EMAIL SENDING AND GOOGLE SHEETS SYNC PREVIEW */}
              {checkoutStep === 'success' && completedOrderSummary && (
                <div className="space-y-5 text-center animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800">ส่งใบยืนยันออเดอร์และบันทึกชีทสำเร็จ!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      อัปเดตคะแนนธุรกิจสะสม NLM ของท่านเข้าระบบเรียบร้อยแล้ว ใบเสร็จการสั่งซื้อพร้อมรหัสผู้แนะนำได้ถูกส่งไปทางอีเมล์ของท่าน
                    </p>
                  </div>

                  {/* Beautiful custom-designed Email Inbox Mockup client requested */}
                  <div className="border border-slate-200 rounded-2xl text-left overflow-hidden bg-slate-50 shadow-sm text-xs">
                    <div className="bg-slate-900 text-slate-300 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-mono text-slate-400 ml-1">Gmail / PNMall Mail Server</span>
                      </div>
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">✓ ส่งอีเมลสำเร็จ</span>
                    </div>

                    <div className="p-3 border-b border-slate-200 bg-white space-y-1 text-[10px]">
                      <p className="text-slate-500"><strong className="text-slate-700">จาก:</strong> service@pnmall4u.com (PNMall IT Support)</p>
                      <p className="text-slate-500"><strong className="text-slate-700">ถึง:</strong> {completedOrderSummary.email}</p>
                      <p className="text-slate-800 font-bold"><strong className="text-slate-700">หัวข้อ:</strong> ยืนยันคำสั่งซื้อออเดอร์ #{completedOrderSummary.orderId} และรหัสผู้แนะนำสายงาน MLM ของคุณ</p>
                    </div>

                    <div className="p-4 bg-white space-y-3 max-h-[190px] overflow-y-auto text-[11px] text-slate-700 leading-relaxed font-sans">
                      <div className="text-center font-bold text-indigo-600 border-b border-dashed border-slate-100 pb-2">
                        ยินดีต้อนรับเข้าสู่ครอบครัว MLM - Noinashop
                      </div>
                      
                      <p>เรียนคุณ <strong className="text-slate-950">{completedOrderSummary.firstName} {completedOrderSummary.lastName}</strong>,</p>
                      <p>เราได้รับคำสั่งซื้อและยอดชำระของคุณเรียบร้อยแล้ว รายละเอียดออเดอร์หมายเลข <strong className="text-indigo-600">{completedOrderSummary.orderId}</strong> มีดังนี้:</p>
                      
                      <table className="w-full text-xs text-left border-collapse border border-slate-100">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-2">สินค้า</th>
                            <th className="p-2 text-center">จำนวน</th>
                            <th className="p-2 text-right">ราคา</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedOrderSummary.items.map((item: any) => (
                            <tr key={item.product.id} className="border-b border-slate-100">
                              <td className="p-2 font-bold truncate max-w-[150px]">{item.product.name}</td>
                              <td className="p-2 text-center text-slate-500">{item.quantity}</td>
                              <td className="p-2 text-right">{(item.product.price * item.quantity).toLocaleString()} ฿</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1 font-sans">
                        <p className="flex justify-between text-slate-500">
                          <span>คะแนนสะสมที่ได้รับ:</span>
                          <strong className="text-indigo-600 font-mono">+{completedOrderSummary.totalBV} BV</strong>
                        </p>
                        <p className="flex justify-between text-slate-500">
                          <span>ค่าจัดส่งสินค้า (ต่อรอบ):</span>
                          <strong className="text-slate-700">50 ฿</strong>
                        </p>
                        {completedOrderSummary.paymentMethod === 'cod' && (
                          <p className="flex justify-between text-amber-700">
                            <span>ค่าบริการเก็บเงินปลายทาง (3%):</span>
                            <strong>+{completedOrderSummary.codFee} ฿</strong>
                          </p>
                        )}
                        <p className="flex justify-between text-slate-900 font-extrabold pt-2 border-t border-dashed border-slate-200 text-xs">
                          <span>ยอดชำระรวมทั้งสิ้น:</span>
                          <strong className="text-indigo-600 text-sm">{completedOrderSummary.totalAmount.toLocaleString()} ฿</strong>
                        </p>
                        <p className="text-[10px] text-slate-500 pt-1"><strong>ที่จัดส่ง:</strong> {completedOrderSummary.address}</p>
                      </div>

                      {/* Sponsor code notification */}
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <p className="font-bold text-indigo-900 text-[10px] uppercase tracking-wider mb-0.5">🔑 รหัสผู้แนะนำ MLM (Member ID) ของคุณ</p>
                        <p className="text-slate-600 text-[10px]">ส่งรหัสแนะนำนี้ให้กับลูกค้าคนถัดๆ ไปมาสมัครสมาชิกร้าน เพื่อผูกติดสายงาน MLM ของคุณ และสะสมโบนัสปันผล!</p>
                        <p className="text-center mt-1.5"><strong className="bg-white px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 font-mono text-xs tracking-widest inline-block">{completedOrderSummary.sponsorCode}</strong></p>
                      </div>

                      <p className="text-[9px] text-slate-400 text-center border-t border-slate-100 pt-2">PNMall4U Shop System - พัฒนาด้วยเทคโนโลยี Google Apps Script & Cloud Sync</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {/* INFO ON GOOGLE SHEET INTEGRATION FOR DEMO */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-[10px] text-slate-500 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 block">✓ เชื่อมต่อ Google Sheets เรียบร้อยแล้ว!</span>
                        ข้อมูลออเดอร์นี้ได้ส่ง POST ไร้การปิดกั้นไปยังลิงก์ Google Sheet Script Webhook แล้ว หากท่านเป็นผู้ดูแลร้าน ท่านสามารถไปดูโค้ดการเชื่อมต่อระบบอีเมลอัตโนมัติและสเปรดชีตจริงได้ในเมนู <strong>หลังบ้านผู้ดูแลระบบ (Admin)</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-1">
                      <button
                        onClick={() => sendOrderSuccessEmail(completedOrderSummary)}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition shadow-sm"
                        title="ส่งสลิปผ่านทาง Email"
                      >
                        <Mail className="w-4 h-4" />
                        อีเมลแจ้งใบเสร็จ
                      </button>
                      <button
                        onClick={() => handleCopyOrderSuccess(completedOrderSummary)}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition shadow-sm"
                        title="คัดลอกข้อความสำหรับส่ง LINE/SMS"
                      >
                        {copiedOrderSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                            คัดลอกเรียบร้อย!
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            ส่งใบเสร็จทาง LINE
                          </>
                        )}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setCheckoutStep('cart_items');
                        onClearCart();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition text-center"
                    >
                      ปิดและล้างหน้าตะกร้า
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
