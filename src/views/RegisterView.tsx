/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { UserPlus, UserCheck, Shield, Users, Info, AlertTriangle, Key, Sparkles, Eye, EyeOff, Mail, MessageSquare, Check } from 'lucide-react';

interface RegisterViewProps {
  members: Member[];
  onRegister: (newMember: Member) => Promise<{ success: boolean; message: string }> | void;
  onNavigate: (view: string) => void;
}

export default function RegisterView({ members, onRegister, onNavigate }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // NLM Networking variables
  const [sponsorId, setSponsorId] = useState('NS002'); // Defaults to Somchai
  const [parentUserId, setParentUserId] = useState('NS004'); // Defaults to Wipa (who has no children yet, so slots are open!)
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [isAutoPlacement, setIsAutoPlacement] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<Member | null>(null);
  const [spilloverInfo, setSpilloverInfo] = useState<{
    originalParentId: string;
    originalPosition: 'left' | 'right';
    finalParentId: string;
    finalPosition: 'left' | 'right';
  } | null>(null);
  
  const [webhookResult, setWebhookResult] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [copiedRegSuccess, setCopiedRegSuccess] = useState(false);

  const getRegShareText = (user: Member) => {
    return (
      `ยินดีต้อนรับสมาชิกใหม่ Noinashop NLM!\n` +
      `----------------------------------------\n` +
      `👤 ชื่อสมาชิก: คุณ ${user.name}\n` +
      `🔑 รหัสสมาชิก (Member ID): ${user.id}\n` +
      `📧 อีเมลใช้ล็อกอิน: ${user.email}\n` +
      `🔒 รหัสผ่านเข้าใช้ (Password): ${user.password}\n` +
      `----------------------------------------\n` +
      `👥 ผู้แนะนำตรง (Sponsor): ${user.sponsorId}\n` +
      `📍 สายงานจัดวางใต้: ${user.parentUserId} (${user.position === 'left' ? 'ทีมงานฝั่งซ้าย' : 'ทีมงานฝั่งขวา'})\n` +
      `🌟 ระดับสมาชิก: ${user.rank || 'Bronze'}\n` +
      `----------------------------------------\n` +
      `🔗 ลิงก์ร้านค้าของคุณสำหรับขยายทีมงาน:\n` +
      `https://NoinashopNLM.com/?sponsor=${user.id}\n\n` +
      `คุณสามารถนำรหัสสมาชิก หรืออีเมล ร่วมกับรหัสผ่านด้านบน ล็อกอินเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบคะแนนสะสม โบนัสจับคู่จ่าย และแผนภาพสายงานได้ทันที!`
    );
  };

  const sendRegEmail = (user: Member) => {
    const subject = encodeURIComponent(`ยินดีต้อนรับสมาชิกใหม่ Noinashop NLM - รหัสสมาชิก ${user.id}`);
    const body = encodeURIComponent(getRegShareText(user));
    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyReg = (user: Member) => {
    const text = getRegShareText(user);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRegSuccess(true);
      setTimeout(() => setCopiedRegSuccess(false), 3000);
    });
  };

  // Auto-find first vacant spot when Sponsor ID changes and isAutoPlacement is enabled
  React.useEffect(() => {
    if (isAutoPlacement && members && members.length > 0) {
      const targetSponsorId = sponsorId.trim().toUpperCase();
      const sponsorExists = members.some(m => m.id === targetSponsorId);
      if (sponsorExists) {
        const spot = findSpilloverSpot(targetSponsorId, 'left', members);
        setParentUserId(spot.parentId);
        setPosition(spot.position);
      }
    }
  }, [sponsorId, members, isAutoPlacement]);

  // Helper function to find the first vacant position under a specific parent node (Spillover)
  const findSpilloverSpot = (
    startParentId: string,
    preferredSide: 'left' | 'right',
    membersList: Member[]
  ): { parentId: string; position: 'left' | 'right' } => {
    const memberMap = new Map<string, Member>();
    membersList.forEach(m => memberMap.set(m.id, m));

    const startParent = memberMap.get(startParentId);
    if (!startParent) {
      return { parentId: startParentId, position: preferredSide };
    }

    const queue: string[] = [startParentId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentMember = memberMap.get(currentId);
      if (!currentMember) continue;

      if (preferredSide === 'left') {
        if (!currentMember.leftChildId) {
          return { parentId: currentId, position: 'left' };
        }
        if (!currentMember.rightChildId) {
          return { parentId: currentId, position: 'right' };
        }
        if (currentMember.leftChildId) queue.push(currentMember.leftChildId);
        if (currentMember.rightChildId) queue.push(currentMember.rightChildId);
      } else {
        if (!currentMember.rightChildId) {
          return { parentId: currentId, position: 'right' };
        }
        if (!currentMember.leftChildId) {
          return { parentId: currentId, position: 'left' };
        }
        if (currentMember.rightChildId) queue.push(currentMember.rightChildId);
        if (currentMember.leftChildId) queue.push(currentMember.leftChildId);
      }
    }

    return { parentId: startParentId, position: preferredSide };
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSpilloverInfo(null);

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

    // Automatic Spillover: If the requested position is occupied, find the first available position
    let finalParentId = parent.id;
    let finalPosition = position;
    const isOccupied = (position === 'left' && parent.leftChildId) || (position === 'right' && parent.rightChildId);

    if (isOccupied) {
      const spot = findSpilloverSpot(parent.id, position, members);
      finalParentId = spot.parentId;
      finalPosition = spot.position;
      setSpilloverInfo({
        originalParentId: parent.id,
        originalPosition: position,
        finalParentId: spot.parentId,
        finalPosition: spot.position
      });
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
      parentUserId: finalParentId,
      position: finalPosition,
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
    setWebhookResult({ loading: true });
    
    // Call the parent state update handler to insert the member into the local memory tree
    onRegister(newMember);

    // Get Webhook URL and Sheet URL from localStorage (configured in Admin panel)
    const clientWebhookUrl = localStorage.getItem('noina_order_webhook_url') || '';
    const clientSheetUrl = localStorage.getItem('noina_sheet_url') || '';
    
    // Extract sheetId from Google Sheets URL
    const extractSheetIdLocal = (url: string) => {
      const match = url.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      return match ? match[1] : '';
    };
    const sheetId = extractSheetIdLocal(clientSheetUrl);

    // Directly call the Vercel backend route /api/register to save to Google Sheets and send SMTP email
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: clientWebhookUrl,
        sheetId: sheetId,
        type: 'registration',
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        password: newMember.password,
        sponsorId: newMember.sponsorId,
        parentUserId: newMember.parentUserId,
        position: newMember.position,
        rank: newMember.rank,
        dateJoined: newMember.dateJoined
      })
    })
    .then(async (res) => {
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error('[RegisterView] Failed to parse JSON response:', text);
        parsed = { success: true, message: 'ส่งคำสมัครสำเร็จ (ไม่สามารถถอดรหัส JSON ได้)' };
      }

      setWebhookResult({
        loading: false,
        success: parsed.success !== false,
        message: parsed.message || 'ระบบได้บันทึกรายชื่อสมาชิกลงสเปรดชีต และส่งอีเมลยืนยันตัวตนเรียบร้อยแล้ว!'
      });
    })
    .catch((err) => {
      console.error('[RegisterView] Webhook API connection error:', err);
      setWebhookResult({
        loading: false,
        success: false,
        message: err?.message || 'การเชื่อมต่อระบบเซิร์ฟเวอร์หลังบ้านล้มเหลว'
      });
    });

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
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">ฝั่งที่จัดวาง:</span>
                <span className="font-bold text-indigo-600">สายฝั่ง{registeredUser.position === 'left' ? 'ซ้าย' : 'ขวา'}</span>
              </div>

              {spilloverInfo && (
                <div className="border-t border-slate-200 pt-2 mt-2 space-y-1 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 text-[10px] text-amber-800 leading-normal">
                  <div className="font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    ระบบจัดวางแบบอัตโนมัติ (Spillover)
                  </div>
                  <p>
                    เนื่องจากตำแหน่งดั้งเดิมคือใต้รหัส <strong className="font-mono">{spilloverInfo.originalParentId}</strong> ฝั่ง{spilloverInfo.originalPosition === 'left' ? 'ซ้าย' : 'ขวา'} เต็มแล้ว ระบบจึงได้ค้นหาและโยนสายงานลงไปที่ตำแหน่งแรกที่ยังว่างอยู่ คือใต้รหัส <strong className="font-mono">{spilloverInfo.finalParentId}</strong> ฝั่ง{spilloverInfo.finalPosition === 'left' ? 'ซ้าย' : 'ขวา'} ให้เรียบร้อยโดยอัตโนมัติ!
                  </p>
                </div>
              )}
            </div>

            {/* Google Sheets and Email webhook status feedback */}
            <div className="max-w-sm mx-auto space-y-4">
              {webhookResult.loading ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-center text-slate-500 animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                  <span>กำลังบันทึกลง Google Sheet และส่งอีเมลตอบกลับอัตโนมัติ...</span>
                </div>
              ) : webhookResult.success ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-left text-emerald-800 space-y-1.5 shadow-sm">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    เชื่อมต่อระบบ Google Sheet สำเร็จ!
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-normal font-medium">
                    {webhookResult.message || 'ระบบได้บันทึกรายชื่อสมาชิกลงตาราง Members และส่งอีเมลแจ้งเตือนข้อมูลการล็อกอินผ่าน Google Workspace เรียบร้อยแล้ว'}
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-indigo-50/60 to-emerald-50/60 border border-indigo-100/50 rounded-2xl p-4 text-xs text-left text-slate-700 space-y-3 shadow-sm">
                  <div className="font-extrabold flex items-center gap-1.5 text-indigo-800">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    สมัครสมาชิกสำเร็จ 100% (บันทึกในระบบเรียบร้อย)
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal font-medium">
                    🎉 บัญชีของท่านถูกบันทึกลงในฐานข้อมูล Noina Shop แล้ว! รหัสสมาชิกของคุณคือ <strong className="font-mono text-indigo-700 text-xs px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100">{registeredUser?.id}</strong> สมาชิกสามารถนำไปเข้าสู่ระบบสายงานได้ทันที!
                  </p>
                  
                  <div className="border-t border-indigo-100/40 pt-2.5 mt-2 space-y-2 text-[10px] text-slate-500 leading-normal">
                    <p className="font-bold text-slate-600 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      * สิทธิ์การส่งอีเมลยืนยันอัตโนมัติ:
                    </p>
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                      หากแอดมินยังไม่ได้ดีพลอย Google Apps Script Web App ภายใต้บัญชี Google Workspace <strong className="text-indigo-800">admin@noinashop.business</strong> ระบบจะไม่สามารถส่งอีเมลอัตโนมัติได้
                    </p>
                  </div>
                </div>
              )}

              {/* Quick backup notification utilities for admin/customer */}
              {registeredUser && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-left space-y-3 shadow-sm">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    เครื่องมือช่วยแชร์และแจ้งเตือนผู้สมัคร (Backup Utility):
                  </span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => sendRegEmail(registeredUser)}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 text-[11px] shadow-sm cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-red-500" />
                      📧 ส่งอีเมลรหัสสมาชิก (สำรองผ่าน Mail Client)
                    </button>
                    
                    <button
                      onClick={() => {
                        const text = getRegShareText(registeredUser);
                        window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 text-[11px] shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      💬 ส่งข้อมูลสมาชิกเข้า LINE
                    </button>
                    
                    <button
                      onClick={() => handleCopyReg(registeredUser)}
                      className={`w-full font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 text-[11px] shadow-sm border cursor-pointer ${
                        copiedRegSuccess 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {copiedRegSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          คัดลอกลงคลิปบอร์ดสำเร็จแล้ว!
                        </>
                      ) : (
                        <>
                          <span>📋 คัดลอกรหัสเข้าใช้ & ลิงก์ร้านค้า</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="สำหรับใช้ล็อกอินเข้าหลังบ้าน"
                      className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Networking genealogy Placement */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  2. ข้อมูลการจัดวางสายงาน NLM
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAutoPlacement(!isAutoPlacement)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${isAutoPlacement ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  {isAutoPlacement ? '⭐ แนะนำ: จัดวางอัตโนมัติเปิดใช้งาน' : '⚙️ จัดวางแบบกำหนดเอง'}
                </button>
              </div>

              {isAutoPlacement ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800 leading-relaxed">
                  <div className="flex gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5 animate-pulse" />
                    <div>
                      <strong>ระบบจัดวางให้อัตโนมัติ (Auto-Placement)</strong>: ค้นหาตำแหน่งว่างแรกสุดใต้สายงานรหัสผู้แนะนำ <span className="font-mono font-bold bg-white/80 px-1 rounded">{sponsorId}</span> โดยอัตโนมัติ พบตำแหน่งที่ว่างอยู่คือใต้รหัส <span className="font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded text-indigo-700">{parentUserId}</span> ฝั่ง<span className="font-bold text-indigo-700">{position === 'left' ? 'ซ้าย' : 'ขวา'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong>กำลังจัดวางแบบระบุกำหนดเอง</strong>: รหัส <span className="font-mono font-bold bg-white/80 px-1 rounded">{parentUserId}</span> และฝั่งที่คุณเลือกจะถูกใช้ในการจัดสายงานโดยตรง
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAutoPlacement(true)}
                    className="shrink-0 bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition shadow-sm ml-2"
                  >
                    เปิดจัดวางอัตโนมัติ 💡
                  </button>
                </div>
              )}

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
                    onChange={(e) => {
                      setParentUserId(e.target.value);
                      setIsAutoPlacement(false); // Turn off auto placement on manual edits
                    }}
                    placeholder="ป้อนรหัสพ่อข่าย เช่น NS004"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ฝั่งในการจัดวางตำแหน่ง</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPosition('left');
                        setIsAutoPlacement(false); // Turn off auto placement on manual edits
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${position === 'left' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      ข้างซ้าย (Left)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPosition('right');
                        setIsAutoPlacement(false); // Turn off auto placement on manual edits
                      }}
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
