/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Order, CommissionLog } from '../types';
import { Link, Clipboard, ShoppingBag, FolderGit2, CreditCard, Award, ArrowUpRight, LogOut, CheckCircle, Info } from 'lucide-react';
import TreeChart from '../components/TreeChart';

interface MemberPortalProps {
  currentUser: Member;
  members: Member[];
  orders: Order[];
  commissionLogs: CommissionLog[];
  onLogout: () => void;
}

type SubMenu = 'referral' | 'orders' | 'tree' | 'income';

export default function MemberPortal({ currentUser, members, orders, commissionLogs, onLogout }: MemberPortalProps) {
  const [activeTab, setActiveTab] = useState<SubMenu>('referral');
  const [copySuccess, setCopySuccess] = useState(false);

  // Filter orders for current member
  const memberOrders = orders.filter(o => o.memberId === currentUser.id);

  // Filter commission logs for current member
  const memberCommissions = commissionLogs.filter(c => c.memberId === currentUser.id);

  // Calculate referral link
  const referralLink = `${window.location.origin}/register?sponsor=${currentUser.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'Diamond': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-orange-50 text-orange-800 border-orange-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      
      {/* Left sidebar: Member profile summary & navigation (4 cols) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-indigo-100">
            {currentUser.name.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800">{currentUser.name}</h3>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 border ${getRankBadgeColor(currentUser.rank)}`}>
              ตำแหน่ง {currentUser.rank}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3.5 text-xs text-left space-y-2 text-slate-500">
            <div className="flex justify-between">
              <span>รหัสประจำตัว:</span>
              <span className="font-bold text-slate-700 font-mono">{currentUser.id}</span>
            </div>
            <div className="flex justify-between">
              <span>เบอร์โทรศัพท์:</span>
              <span className="font-semibold text-slate-700">{currentUser.phone}</span>
            </div>
            <div className="flex justify-between">
              <span>อีเมลแอดเดรส:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[130px]">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Sub-menu Navigation Links */}
        <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('referral')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'referral' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Link className="w-4 h-4 shrink-0" />
            ลิงก์แนะนำสมาชิก
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            ประวัติการสั่งซื้อ
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FolderGit2 className="w-4 h-4 shrink-0" />
            แผนผังสายงาน
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition ${activeTab === 'income' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            รายงานรายได้
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-2"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            ออกจากระบบ
          </button>
        </div>

      </div>

      {/* Right container: Dynamic portal view contents (9 cols) */}
      <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px]">
        
        {/* TAB 1: ลิงก์แนะนำ (Referral link widget) */}
        {activeTab === 'referral' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">ลิงก์ขยายงานแนะนำสมาชิก (Your Referral Link)</h3>
              <p className="text-xs text-slate-500 mt-1">คัดลอกลิงก์ส่วนตัวของคุณไปส่งต่อให้เพื่อนหรือแชร์ลงสื่อออนไลน์เพื่อลงทะเบียนใต้สายงานและรับโบนัสแนะนำ</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
              <label className="block text-xs font-semibold text-slate-600">ลิงก์แนะนำของคุณ:</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-grow px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-mono text-indigo-700 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  <Clipboard className="w-4 h-4" />
                  {copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                </button>
              </div>

              {copySuccess && (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  คัดลอกลิงก์สำเร็จ นำไปส่งต่อได้ทันที!
                </p>
              )}
            </div>

            {/* Explanation card */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-xs text-indigo-800 space-y-2.5">
              <h4 className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                ลิงก์นี้ทำงานอย่างไร?
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                <li>เมื่อผู้ใช้งานอื่นคลิกลิงก์และกรอกแบบฟอร์มสมัครสมาชิก รหัสแนะนำจะถูกระบุเป็น <span className="font-bold text-indigo-700">{currentUser.id}</span> ของคุณโดยอัตโนมัติ</li>
                <li>ทุกยอดการสั่งซื้อสินค้ามือสองของสมาชิกใหม่จะนำคะแนนสะสม BV มาคิดโบนัสค่าแนะนำตอบแทน 100% ให้คุณทันที</li>
                <li>สายงานการสปอนเซอร์แบบแนะนำตรงช่วยยกระดับสิทธิประโยชน์ของคุณสู่ตำแหน่ง Gold และ Diamond เพื่อรับส่วนแบ่งยอด All Sale เพิ่มขึ้น</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: ประวัติการสั่งซื้อ (Order history table) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">ประวัติการสั่งซื้อสินค้าของคุณ</h3>
              <p className="text-xs text-slate-500 mt-1">รายการโทรศัพท์มือถือและอุปกรณ์ไอทีมือสองที่คุณเคยทำการสั่งซื้อพร้อมแต้มสะสม BV</p>
            </div>

            {memberOrders.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-semibold">คุณยังไม่มีประวัติการทำรายการสั่งซื้อใดๆ</p>
                <p className="text-xs text-slate-400 mt-1">สามารถเลือกซื้อสินค้าสภาพดีราคาสุดพิเศษได้ที่หน้ารายการสินค้า</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memberOrders.map((order, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                      <div>
                        <span className="block font-bold text-slate-800 text-xs">{order.id}</span>
                        <span className="block text-[10px] text-slate-400 font-medium">{order.date}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                        {order.status === 'completed' ? 'สำเร็จ / Completed' : 'รอดำเนินการ'}
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

                    <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-end bg-transparent">
                      <span className="text-[10px] text-indigo-600 font-bold font-mono">+{order.totalBV} BV ได้รับการสะสม</span>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block">ยอดชำระสุทธิ</span>
                        <span className="text-xs font-extrabold text-slate-800">{order.totalAmount.toLocaleString()} ฿</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: แผนผังสายงาน (Lineage Binary tree chart) */}
        {activeTab === 'tree' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">แผนผังองค์กรและทีมงานสายงานของคุณ</h3>
              <p className="text-xs text-slate-500 mt-1">สำรวจตำแหน่งที่ปรึกษา ลำดับโครงสร้างการจัดวางฝั่งซ้ายและขวาของดาวน์ไลน์ในสายงานของคุณ</p>
            </div>

            {/* Tree Chart Component centered on member */}
            <TreeChart 
              members={members} 
              rootId={currentUser.id} 
              isAdminView={false}
            />
          </div>
        )}

        {/* TAB 4: รายงานรายได้ (Commission Income Reports) */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">สรุปรายงานรายได้และกระเป๋าเงินคอมมิชชัน</h3>
              <p className="text-xs text-slate-500 mt-1">ยอดโบนัสการแนะนำตรงและโบนัสการจับคู่จับคะแนนตามโครงข่าย NLM</p>
            </div>

            {/* Wallet summary statistics grids */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                <span className="block text-[10px] text-indigo-600 font-bold">คอมมิชชันสะสม</span>
                <span className="text-base font-extrabold text-indigo-900 mt-1 block">{currentUser.walletBalance.toLocaleString()} ฿</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-[10px] text-slate-400 font-bold">แนะนำตรงรวม</span>
                <span className="text-base font-extrabold text-slate-800 mt-1 block">{currentUser.totalDirectBV.toLocaleString()} BV</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="block text-[10px] text-emerald-600 font-bold">ทีมฝั่งซ้าย</span>
                <span className="text-base font-extrabold text-emerald-800 mt-1 block">{currentUser.leftBV} BV</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <span className="block text-[10px] text-blue-600 font-bold">ทีมฝั่งขวา</span>
                <span className="text-base font-extrabold text-blue-800 mt-1 block">{currentUser.rightBV} BV</span>
              </div>
            </div>

            {/* Detailed list of income logs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">ประวัติการได้รับคอมมิชชันและโบนัส</h4>
              
              {memberCommissions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">ไม่มีรายการบันทึกรายได้ในกระเป๋าของคุณในขณะนี้</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {memberCommissions.map((log, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mb-1 ${log.type === 'sponsor_bonus' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {log.type === 'sponsor_bonus' ? 'โบนัสแนะนำ' : log.type === 'matching_bonus' ? 'โบนัสจับคู่' : 'โบนัสระดับชั้น'}
                        </span>
                        <h5 className="font-bold text-slate-700">{log.description}</h5>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{log.date}</span>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-0.5">
                          +{log.amount.toLocaleString()} ฿
                        </span>
                        <span className="block text-[9px] text-slate-400 font-mono font-medium">อิงจาก {log.bvReference} BV</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
