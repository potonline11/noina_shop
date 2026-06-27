/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { UserPlus, UserCheck, Shield, Users, Info, AlertTriangle, Key } from 'lucide-react';

interface RegisterViewProps {
  members: Member[];
  onRegister: (newMember: Member) => void;
  onNavigate: (view: string) => void;
}

export default function RegisterView({ members, onRegister, onNavigate }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // NLM Networking variables
  const [sponsorId, setSponsorId] = useState('NS002'); // Defaults to Somchai
  const [parentUserId, setParentUserId] = useState('NS004'); // Defaults to Wipa (who has no children yet, so slots are open!)
  const [position, setPosition] = useState<'left' | 'right'>('left');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<Member | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Form validations
    if (!name || !email || !phone || !password) {
      setError('โปรดกรอกข้อมูลพื้นฐานให้ครบถ้วนทุกช่อง');
      return;
    }

    // NLM validations
    const sponsor = members.find(m => m.id === sponsorId.trim().toUpperCase());
    if (!sponsor) {
      setError('ระบุรหัสผู้แนะนำไม่ถูกต้อง โปรดป้อนรหัสสมาชิกผู้แนะนำที่พบบนระบบ');
      return;
    }

    const parent = members.find(m => m.id === parentUserId.trim().toUpperCase());
    if (!parent) {
      setError('ระบุรหัสผู้จัดวางใต้สายงาน (Parent ID) ไม่ถูกต้อง');
      return;
    }

    // Check vacancy of target position
    if (position === 'left' && parent.leftChildId) {
      setError(`ตำแหน่งใต้สายงาน ซ้าย ของ ${parent.name} (${parent.id}) ไม่ว่างแล้ว โปรดเลือกตำแหน่งอื่น`);
      return;
    }
    if (position === 'right' && parent.rightChildId) {
      setError(`ตำแหน่งใต้สายงาน ขวา ของ ${parent.name} (${parent.id}) ไม่ว่างแล้ว โปรดเลือกตำแหน่งอื่น`);
      return;
    }

    // Create unique ID
    const nextIdNumber = members.length + 1;
    const newId = `NS${nextIdNumber.toString().padStart(3, '0')}`;

    const newMember: Member = {
      id: newId,
      name: name,
      email: email,
      phone: phone,
      password: password,
      sponsorId: sponsor.id,
      parentUserId: parent.id,
      position: position,
      leftChildId: null,
      rightChildId: null,
      rank: 'Bronze',
      leftBV: 0,
      rightBV: 0,
      totalLeftBV: 0,
      totalRightBV: 0,
      totalDirectBV: 0,
      walletBalance: 0,
      dateJoined: new Date().toISOString().split('T')[0],
      status: 'active',
      role: 'member',
    };

    // Commit to app state
    onRegister(newMember);

    setRegisteredUser(newMember);
    setSuccess(true);
    
    // Clear state
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      
      {/* Title Header */}
      <section className="text-center space-y-2 pt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
          สมัครสมาชิก Noinashop NLM
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          ร่วมเป็นครอบครัวเดียวกับเราเพื่อรับสิทธิซื้อสินค้าไอทีราคามือสองพิเศษ และสร้างโครงข่ายรายได้ตามแผนจับคู่ปันผลที่ดีที่สุด
        </p>
      </section>

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {success && registeredUser ? (
          <div className="text-center space-y-5 py-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">สมัครสมาชิกเข้าร่วมเครือข่ายสำเร็จ!</h3>
              <p className="text-xs text-emerald-600 font-semibold">ระบบนำข้อมูลจัดวางเข้าผังสายงานในแผนผัง NLM เรียบร้อยแล้ว</p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-left max-w-sm mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">ชื่อสมาชิกใหม่:</span>
                <span className="font-bold text-slate-700">{registeredUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">รหัสสมาชิก (ใช้ล็อกอิน):</span>
                <span className="font-extrabold text-indigo-600 font-mono">{registeredUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">รหัสผ่านสำหรับเข้าใช้:</span>
                <span className="font-bold text-slate-700 font-mono">{registeredUser.password || '123456'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                <span className="text-slate-400">จัดวางใต้สายงานผู้ใช้:</span>
                <span className="font-bold text-slate-700">{registeredUser.parentUserId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ฝั่งที่จัดวาง:</span>
                <span className="font-bold text-indigo-600">สายฝั่ง{registeredUser.position === 'left' ? 'ซ้าย' : 'ขวา'}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => onNavigate('login')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-sm"
              >
                เข้าสู่ระบบสมาชิก
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* 1. General Profile Fields */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-4 h-4" />
                1. ข้อมูลประวัติตัวตนทั่วไป
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อ-นามสกุลจริง</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ป้อนชื่อและนามสกุลของคุณ"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์มือถือ</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 08x-xxxxxxx"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ที่อยู่อีเมลแอดเดรส</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="เช่น yourmail@gmail.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">กำหนดรหัสผ่าน (Password)</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="สำหรับใช้ล็อกอินเข้าหลังบ้าน"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Networking genealogy Placement */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <Users className="w-4 h-4" />
                2. ข้อมูลการจัดวางสายงาน NLM
              </h3>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-800 leading-relaxed flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  ระบบได้ป้อน <strong>รหัสผู้จัดวางจำลอง</strong> ที่มีตำแหน่งว่างทางธุรกิจไว้ให้คุณเป็นค่าเริ่มต้นแล้วเพื่อความสะดวกในการทดลองใช้งาน คุณสามารถปรับเปลี่ยนรหัสเป็นผู้ใช้อื่นๆ ในผังสายงานได้ตามใจชอบ
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสผู้แนะนำตรง (Sponsor)</label>
                  <input
                    type="text"
                    required
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value)}
                    placeholder="ป้อนรหัสผู้แนะนำ เช่น NS002"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">จัดวางใต้สายงานของ (Parent ID)</label>
                  <input
                    type="text"
                    required
                    value={parentUserId}
                    onChange={(e) => setParentUserId(e.target.value)}
                    placeholder="ป้อนรหัสพ่อข่าย เช่น NS004"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ฝั่งในการจัดวางตำแหน่ง</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPosition('left')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${position === 'left' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      ข้างซ้าย (Left)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('right')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${position === 'right' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      ข้างขวา (Right)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error messaging */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-indigo-100"
            >
              สมัครสมาชิกเข้าร่วมเครือข่าย NLM
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
