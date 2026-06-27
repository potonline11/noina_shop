/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Product, Order, CommissionLog } from '../types';
import { Users, FileSpreadsheet, Layers, ShoppingBag, DollarSign, Award, RefreshCw, Trash2, PlusCircle, ShieldAlert, BarChart3, Plus, ArrowUpRight } from 'lucide-react';
import GoogleSheetSync from '../components/GoogleSheetSync';
import TreeChart from '../components/TreeChart';

interface AdminPortalProps {
  currentUser: Member;
  members: Member[];
  products: Product[];
  orders: Order[];
  commissionLogs: CommissionLog[];
  onSyncProducts: (newProducts: Product[]) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'members' | 'tree' | 'googlesheet' | 'products' | 'orders';

export default function AdminPortal({
  currentUser,
  members,
  products,
  orders,
  commissionLogs,
  onSyncProducts,
  onAddProduct,
  onDeleteProduct,
  onLogout
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Local states for adding custom products manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    brand: '',
    price: '',
    bv: '',
    category: 'smartphone' as any,
    condition: '95% สภาพดี',
    image: '',
    description: ''
  });

  // Calculate high-level business stats
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalBVProcessed = orders.reduce((sum, o) => sum + o.totalBV, 0);
  const totalCommissionsPaid = commissionLogs.reduce((sum, c) => sum + c.amount, 0);

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price || !newProd.bv) return;

    const product: Product = {
      id: `prod-manual-${Date.now()}`,
      name: newProd.name,
      description: newProd.description || 'สินค้ากรอกด้วยตนเองจากแอดมิน',
      price: parseFloat(newProd.price) || 0,
      bv: parseFloat(newProd.bv) || 0,
      image: newProd.image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
      category: newProd.category,
      brand: newProd.brand || 'แบรนด์มือสอง',
      condition: newProd.condition,
      stock: 5,
      source: 'googlesheet'
    };

    onAddProduct(product);
    setShowAddForm(false);
    setNewProd({
      name: '',
      brand: '',
      price: '',
      bv: '',
      category: 'smartphone',
      condition: '95% สภาพดี',
      image: '',
      description: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16" id="admin-portal-view">
      
      {/* Left Sidebar Navigation (3 cols) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Administrator profile widget */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-lg font-bold">
            AD
          </div>
          <div>
            <h3 className="font-extrabold text-sm">{currentUser.name}</h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              ผู้ดูแลระบบสูงสุด (Super Admin)
            </span>
          </div>

          <div className="border-t border-slate-800 pt-3 text-xs text-left space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>บัญชีแอดมิน:</span>
              <span className="font-bold text-slate-200 font-mono">{currentUser.id}</span>
            </div>
            <div className="flex justify-between">
              <span>ตำแหน่งองค์กร:</span>
              <span className="font-semibold text-slate-200">Platinum</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Menus */}
        <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            แผงควบคุมระบบ (Dashboard)
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4 shrink-0" />
            ข้อมูลสมาชิกองค์กรทั้งหมด
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            ผังสายงานองค์กรรวม
          </button>

          <button
            onClick={() => setActiveTab('googlesheet')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'googlesheet' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            ซิงก์สินค้า Google Sheets
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            จัดการคลังสินค้ามือสอง
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            รายการคำสั่งซื้อของเครือข่าย
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-2"
          >
            ออกจากระบบ
          </button>
        </div>

      </div>

      {/* Right Content Area (9 cols) */}
      <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[550px]">
        
        {/* SUBTAB 1: Dashboard Overview statistics */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">แผงควบคุมหลักผู้ดูแลระบบ (Admin Dashboard)</h3>
              <p className="text-xs text-slate-500 mt-1">ภาพรวมทางธุรกิจ ยอดคะแนนสะสม BV ยอดขาย และกิจกรรมสมาชิกทั้งหมดในระบบสหกรณ์ Noinashop</p>
            </div>

            {/* Top statistic widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">ยอดขายสินค้าจริง</span>
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="block text-base font-extrabold text-slate-800 mt-1.5">{totalSalesRevenue.toLocaleString()} ฿</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-indigo-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">คะแนน BV สุทธิ</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="block text-base font-extrabold text-indigo-900 mt-1.5">{totalBVProcessed.toLocaleString()} BV</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">โบนัสที่จ่ายคืน</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="block text-base font-extrabold text-emerald-600 mt-1.5">-{totalCommissionsPaid.toLocaleString()} ฿</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">จำนวนสมาชิก</span>
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                <span className="block text-base font-extrabold text-slate-800 mt-1.5">{members.length} คน</span>
              </div>
            </div>

            {/* Fast access help notice */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-800 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ระบบแอดมินพรีเมียม:</span> ในส่วนควบคุมระบบนี้ แอดมินสามารถดึงข้อมูลสินค้าจาก <strong>Google Sheet</strong> ได้โดยตรง ดูผังสายงานหลักของทั้งองค์กรได้ แนะนำการวางรหัสสมาชิกใหม่ ตรวจเช็คประวัติการรับคอมมิชชัน และลบหรือแก้ไขสินค้าได้เรียลไทม์
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: รายละเอียดสมาชิกทั้งหมด (Members list) */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">ข้อมูลสมาชิกเครือข่ายองค์กรทั้งหมด</h3>
              <p className="text-xs text-slate-500 mt-1">รายละเอียดรายบุคคล ยอดสปอนเซอร์ และยอดกระเป๋าคอมมิชชันสะสมของสมาชิก Noinashop ทุกระดับชั้น</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                    <th className="py-3 px-4">รหัส</th>
                    <th className="py-3 px-4">ชื่อสมาชิก</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">ผู้แนะนำ / พ่อข่าย</th>
                    <th className="py-3 px-4">ตำแหน่ง</th>
                    <th className="py-3 px-4 text-center">คะแนน ซ้าย | ขวา</th>
                    <th className="py-3 px-4 text-right">รายได้สะสม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-extrabold text-indigo-600 font-mono">{m.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{m.name}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{m.phone}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {m.sponsorId ? `${m.sponsorId} / ${m.parentUserId || ''}` : 'ROOT / -'}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                          {m.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        L: {m.leftBV} | R: {m.rightBV}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {m.walletBalance.toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: ผังสายงานรวม (Master organizational binary tree chart) */}
        {activeTab === 'tree' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">แผนผังสายงานเครือข่ายองค์กรรวมทั้งหมด</h3>
              <p className="text-xs text-slate-500 mt-1">โครงสร้างผังไบนารีเริ่มต้นสูงสุดจากจุดเริ่มต้นระบบ (Root node: NS001) แอดมินสามารถค้นหาและตรวจสอบได้ทั้งหมด</p>
            </div>

            {/* Tree Chart Component centered on master root */}
            <TreeChart 
              members={members} 
              rootId="NS001" 
              isAdminView={true}
            />
          </div>
        )}

        {/* SUBTAB 4: Google Sheet Import system */}
        {activeTab === 'googlesheet' && (
          <div className="space-y-6">
            <GoogleSheetSync 
              onSyncComplete={onSyncProducts} 
              currentProductsCount={products.length} 
            />
          </div>
        )}

        {/* SUBTAB 5: จัดการคลังสินค้า (Products inventory manager) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">จัดการสินค้าไอทีและคะแนนส่วนกลาง</h3>
                <p className="text-xs text-slate-500 mt-1">แอดมินสามารถเพิ่มสินค้าจำลองด้วยตนเอง หรือลบผลิตภัณฑ์ออกจากชั้นจัดจำหน่ายได้ทันที</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มสินค้าด้วยมือ'}
              </button>
            </div>

            {/* Manual Add Product Form */}
            {showAddForm && (
              <form onSubmit={handleAddProductSubmit} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 text-xs">
                <h4 className="font-bold text-slate-800 mb-2">ป้อนรายละเอียดสินค้าใหม่:</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ชื่อสินค้าไอที</label>
                    <input
                      type="text"
                      required
                      value={newProd.name}
                      onChange={(e) => setNewProd({...newProd, name: e.target.value})}
                      placeholder="เช่น iPhone 11 Pro Max 64GB"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">แบรนด์สินค้า</label>
                    <input
                      type="text"
                      value={newProd.brand}
                      onChange={(e) => setNewProd({...newProd, brand: e.target.value})}
                      placeholder="เช่น Apple, Samsung, Dell"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ราคาสินค้ามือสอง (บาท)</label>
                    <input
                      type="number"
                      required
                      value={newProd.price}
                      onChange={(e) => setNewProd({...newProd, price: e.target.value})}
                      placeholder="เช่น 12900"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">คะแนนสะสม (BV)</label>
                    <input
                      type="number"
                      required
                      value={newProd.bv}
                      onChange={(e) => setNewProd({...newProd, bv: e.target.value})}
                      placeholder="เช่น 1200"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">หมวดหมู่สินค้า</label>
                    <select
                      value={newProd.category}
                      onChange={(e) => setNewProd({...newProd, category: e.target.value as any})}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="smartphone">โทรศัพท์มือถือ</option>
                      <option value="notebook">โน๊ตบุ๊ค</option>
                      <option value="tablet">แท็บเล็ต</option>
                      <option value="accessory">อุปกรณ์เสริม</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">สภาพสินค้ามือสอง</label>
                    <input
                      type="text"
                      value={newProd.condition}
                      onChange={(e) => setNewProd({...newProd, condition: e.target.value})}
                      placeholder="เช่น 98% สภาพนางฟ้า"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ลิงก์รูปภาพประกอบสินค้า</label>
                    <input
                      type="text"
                      value={newProd.image}
                      onChange={(e) => setNewProd({...newProd, image: e.target.value})}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">คำอธิบายรายละเอียดสั้นๆ</label>
                  <input
                    type="text"
                    value={newProd.description}
                    onChange={(e) => setNewProd({...newProd, description: e.target.value})}
                    placeholder="ป้อนสเปกเบื้องต้น หรือสุขภาพแบตเตอรี่..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  บันทึกสินค้าใหม่ขึ้นชั้นวาง
                </button>
              </form>
            )}

            {/* List products with actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">รายการสินค้าในระบบปัจจุบัน</h4>
              
              <div className="divide-y divide-slate-100">
                {products.map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex gap-3 items-center">
                      <img referrerPolicy="no-referrer" src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-white border border-slate-200 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-700 truncate max-w-[200px] sm:max-w-md">{p.name}</h5>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">{p.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">แบรนด์: {p.brand} | สภาพ: {p.condition} | แหล่งที่มา: {p.source === 'googlesheet' ? 'Google Sheet' : 'ป้อนด้วยมือ'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <span className="block font-bold text-slate-800">{p.price.toLocaleString()} ฿</span>
                        <span className="block text-[10px] text-indigo-600 font-bold font-mono">{p.bv} BV</span>
                      </div>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="ลบออกจากระบบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 6: ประวัติใบสั่งซื้อทั้งหมดในเครือข่าย (Orders monitor) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">ประวัติการสั่งซื้อทั้งหมดในเครือข่าย</h3>
              <p className="text-xs text-slate-500 mt-1">แอดมินสามารถเห็นใบสั่งซื้อสินค้าและปริมาณคะแนน BV ที่ไหลสะสมเข้าสู่โครงสร้างดาวน์ไลน์ของทุกคนได้ทั้งหมด</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-semibold">ยังไม่มีใบสั่งซื้อจากทางหน้าบ้านเกิดขึ้นในระบบ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="block font-bold text-slate-800 text-xs">{order.id} | ผู้ซื้อ: <strong className="text-indigo-600">{order.memberName} ({order.memberId})</strong></span>
                        <span className="block text-[10px] text-slate-400 font-medium">{order.date}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                        เสร็จสิ้น / Completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium truncate max-w-[280px] sm:max-w-md">{item.name} x {item.quantity}</span>
                          <span className="font-semibold text-slate-700">{item.price.toLocaleString()} ฿</span>
                        </div>
                      ))}
                    </div>

                    {/* Customer shipping details in Admin View */}
                    {(order.phone || order.email || order.address) && (
                      <div className="bg-white border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 mt-1.5 shadow-sm">
                        <p className="font-bold text-slate-700 border-b border-dashed border-slate-100 pb-1 mb-1 text-[10px] uppercase tracking-wider flex justify-between">
                          <span>🚚 ข้อมูลผู้ลงทะเบียนจัดส่ง & การชำระเงิน</span>
                          <span className="text-indigo-600 font-mono text-[9px]">{order.id}</span>
                        </p>
                        {order.phone && <p><strong>เบอร์โทรศัพท์:</strong> {order.phone}</p>}
                        {order.email && <p><strong>อีเมล์:</strong> {order.email}</p>}
                        {order.address && <p><strong>ที่อยู่จัดส่ง:</strong> {order.address}</p>}
                        <div className="flex flex-wrap justify-between items-center pt-1.5 mt-1 border-t border-slate-100 text-[10px]">
                          <span>
                            <strong>วิธีชำระเงิน:</strong>{' '}
                            {order.paymentMethod === 'cod' ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">เก็บเงินปลายทาง (COD +3%)</span>
                            ) : (
                              <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">เงินสด / โอนสลิปพร้อมเพย์</span>
                            )}
                          </span>
                          {order.slipUrl && order.slipUrl !== 'COD' && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1 mt-1 sm:mt-0">
                              ✓ สลิปผ่านการตรวจ AI ({order.slipUrl})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-2.5 flex justify-between items-end bg-transparent">
                      <span className="text-[10px] text-indigo-600 font-bold font-mono">+{order.totalBV} BV เข้าระบบและอัปลิงก์ทั้งหมด</span>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block">ยอดรวมใบคำสั่งซื้อ</span>
                        <span className="text-xs font-extrabold text-slate-800">{order.totalAmount.toLocaleString()} ฿</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
