/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { 
  LogIn, 
  Key, 
  ShieldAlert, 
  User, 
  AlertTriangle, 
  Info, 
  Smartphone, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle, 
  RefreshCw, 
  Lock 
} from 'lucide-react';
import { shouldShowAdmin } from '../utils/domainHelper';

interface LoginViewProps {
  members: Member[];
  onLoginSuccess: (member: Member) => void;
  onNavigate: (view: string) => void;
  onUpdatePassword?: (memberId: string, newPassword: string) => void;
}

export default function LoginView({ members, onLoginSuccess, onNavigate, onUpdatePassword }: LoginViewProps) {
  const [logoUrl] = useState(() => {
    return localStorage.getItem('noina_logo_url') || '';
  });
  const [logoError, setLogoError] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Password Reset States
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Search, 2: Verification, 3: Set New Password, 4: Success
  const [resetSearch, setResetSearch] = useState('');
  const [resetVerifyInput, setResetVerifyInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const term = username.trim().toUpperCase();
    const cleanEmailOrId = username.trim().toLowerCase();

    // Find member by ID or email safely (checking if m.email exists before calling toLowerCase)
    const found = members.find(m => 
      m.id.toUpperCase() === term || 
      (m.email && m.email.trim().toLowerCase() === cleanEmailOrId)
    );

    if (found) {
      // Allow general demo passwords: "123456", "admin123" (if admin), or the user's custom registered password
      const cleanPassword = password.trim();
      const cleanSavedPassword = found.password ? found.password.trim() : '';

      // Extremely robust matching for testing ease:
      // 1. If password is '123456' or 'admin123'
      // 2. If no password was saved during registration (or undefined)
      // 3. Case-insensitive exact match
      const isPasswordValid = 
        cleanPassword === '123456' || 
        cleanPassword === 'admin123' || 
        cleanPassword === '' || 
        !cleanSavedPassword ||
        (cleanSavedPassword && cleanPassword.toLowerCase() === cleanSavedPassword.toLowerCase()) ||
        cleanPassword === cleanSavedPassword;

      if (isPasswordValid) {
        onLoginSuccess(found);
        // Navigate based on role
        if (found.role === 'admin') {
          onNavigate('admin-portal');
        } else {
          onNavigate('member-portal');
        }
      } else {
        setError('รหัสผ่านไม่ถูกต้อง โปรดระบุรหัสผ่านที่คุณกรอกตอนสมัคร หรือ "123456"');
      }
    } else {
      setError('ไม่พบรหัสสมาชิก หรืออีเมลนี้ในระบบ โปรดตรวจสอบความถูกต้อง');
    }
  };

  const handleResetSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const term = resetSearch.trim().toUpperCase();
    const emailTerm = resetSearch.trim().toLowerCase();

    // Safely search for member by ID or Email
    const matched = members.find(m => 
      m.id.toUpperCase() === term || 
      (m.email && m.email.trim().toLowerCase() === emailTerm)
    );

    if (matched) {
      setFoundMember(matched);
      setResetStep(2);
    } else {
      setResetError('ไม่พบรหัสสมาชิก หรืออีเมลนี้ในระบบ โปรดตรวจสอบอีกครั้ง');
    }
  };

  const handleResetVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!foundMember) return;

    const input = resetVerifyInput.trim().toLowerCase();
    const correctEmail = foundMember.email ? foundMember.email.trim().toLowerCase() : '';
    const correctPhone = foundMember.phone ? foundMember.phone.trim().replace(/[^0-9]/g, '') : '';
    const cleanInputPhone = input.replace(/[^0-9]/g, '');

    // Verify ownership by checking if they enter the exact email or exact phone number (digits only matching)
    if (input === correctEmail || (cleanInputPhone && cleanInputPhone === correctPhone)) {
      setResetStep(3);
    } else {
      setResetError('ข้อมูลยืนยันตัวตนไม่ถูกต้อง (ระบุเบอร์โทรศัพท์หรืออีเมลที่เคยกรอกตอนสมัครไม่ตรงกัน)');
    }
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!foundMember) return;

    const pw = newPassword.trim();
    if (pw.length < 4) {
      setResetError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (onUpdatePassword) {
      onUpdatePassword(foundMember.id, pw);
    }

    setResetStep(4);
    setResetSuccess(`รีเซ็ทรหัสผ่านของรหัสสมาชิก ${foundMember.id} เรียบร้อยแล้ว! ข้อมูลได้รับการบันทึก และจะส่งอีเมลแจ้งเตือนการรีเซ็ทรหัสผ่านไปยัง ${foundMember.email || 'อีเมลของคุณ'} เรียบร้อย (เมื่อตั้งค่า Webhook)`);
  };

  // Quick action shortcut loggers to make previewing an absolute breeze!
  const handleQuickLogin = (role: 'admin' | 'member') => {
    const id = role === 'admin' ? 'NS001' : 'NS002';
    const found = members.find(m => m.id === id);
    if (found) {
      onLoginSuccess(found);
      onNavigate(role === 'admin' ? 'admin-portal' : 'member-portal');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-16">
      
      {/* Brand Header */}
      <section className="text-center space-y-2 pt-4">
        {logoUrl && !logoError ? (
          <img 
            src={logoUrl} 
            alt="Noinashop Logo" 
            onError={() => setLogoError(true)}
            className="w-12 h-12 rounded-full object-cover mx-auto shadow-md border border-slate-100"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
          ลงชื่อเข้าใช้ระบบ Noinashop NLM
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          กรอกรหัสสมาชิกเพื่อตรวจสอบสายงานและประวัติการรับคอมมิชชันสะสมของท่าน
        </p>
      </section>

      {/* Login Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              รหัสสมาชิก หรืออีเมลแอดเดรส
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น NS002 หรือ somchai@gmail.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsResetOpen(true);
                  setResetStep(1);
                  setResetSearch('');
                  setResetVerifyInput('');
                  setNewPassword('');
                  setFoundMember(null);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition hover:underline"
              >
                ลืมรหัสผ่าน? / รีเซ็ทรหัสผ่าน
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านเข้าใช้ หรือรหัสที่กำหนดตอนสมัคร"
                className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบหลังบ้าน
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">ทางลัดทดลองใช้งานระบบ</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Demo Fast Login shortcuts */}
        <div className="space-y-2">
          {shouldShowAdmin() && (
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              เข้าสู่ระบบแอดมิน (อนันต์ - แอดมินหลัก)
            </button>
          )}

          <button
            type="button"
            onClick={() => handleQuickLogin('member')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-indigo-600" />
            เข้าสู่ระบบสมาชิก (สมชาย - ระดับ Gold)
          </button>
        </div>

        {/* Instruction Info */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[11px] text-slate-500 flex gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            รหัสผ่านในการทดสอบทั่วไปคือ <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">123456</code> คุณสามารถสมัครสมาชิกใหม่เพื่อนำรหัสมาทดลองล็อกอินได้จริง!
          </div>
        </div>

      </div>

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in duration-200">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">รีเซ็ทรหัสผ่านผู้ใช้ (Reset Password)</h3>
                <p className="text-[10px] text-slate-400">กู้คืนสิทธิเข้าถึงบัญชีสมาชิก Noinashop NLM</p>
              </div>
            </div>

            {/* Step 1: Search Account */}
            {resetStep === 1 && (
              <form onSubmit={handleResetSearch} className="space-y-4 pt-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  ระบุรหัสสมาชิก (เช่น <span className="font-mono font-bold">NS002</span>) หรืออีเมลที่ลงทะเบียนไว้เพื่อค้นหาบัญชีผู้ใช้งานของคุณ
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">รหัสสมาชิก หรือ อีเมลแอดเดรส</label>
                  <input
                    type="text"
                    required
                    value={resetSearch}
                    onChange={(e) => setResetSearch(e.target.value)}
                    placeholder="ป้อนรหัสสมาชิก หรือ อีเมลแอดเดรส"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-800 flex gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                  >
                    ค้นหาบัญชี
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verification */}
            {resetStep === 2 && foundMember && (
              <form onSubmit={handleResetVerify} className="space-y-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">บัญชีผู้ใช้ที่พบ</div>
                  <div className="font-bold text-slate-800">{foundMember.name}</div>
                  <div className="font-mono text-slate-500">รหัส: {foundMember.id}</div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  เพื่อความปลอดภัย โปรดกรอก <strong className="text-indigo-600">เบอร์โทรศัพท์มือถือ</strong> หรือ <strong className="text-indigo-600">อีเมล</strong> ที่คุณเคยใช้ในการสมัครสมาชิก เพื่อยืนยันความเป็นเจ้าของบัญชี
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทร หรือ อีเมลที่ใช้สมัคร</label>
                  <input
                    type="text"
                    required
                    value={resetVerifyInput}
                    onChange={(e) => setResetVerifyInput(e.target.value)}
                    placeholder="ป้อนเบอร์โทร หรือ อีเมลของคุณ"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-800 flex gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                  >
                    ยืนยันตัวตน
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {resetStep === 3 && foundMember && (
              <form onSubmit={handleSaveNewPassword} className="space-y-4 pt-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  ยืนยันตัวตนเรียบร้อย! โปรดกำหนดรหัสผ่านใหม่ที่คุณต้องการใช้งานสำหรับรหัส <strong className="font-mono">{foundMember.id}</strong>
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">รหัสผ่านใหม่ (New Password)</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="ความยาวอย่างน้อย 4 ตัวอักษร"
                      className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-800 flex gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    บันทึกรหัสผ่านใหม่
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success */}
            {resetStep === 4 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-800">รีเซ็ทรหัสผ่านสำเร็จ!</h4>
                  <p className="text-xs text-slate-500 leading-relaxed px-2">
                    {resetSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                >
                  ปิดหน้าต่างนี้เพื่อเข้าสู่ระบบ
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
