/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { LogIn, Key, ShieldAlert, User, AlertTriangle, Info, Smartphone } from 'lucide-react';
import { shouldShowAdmin } from '../utils/domainHelper';

interface LoginViewProps {
  members: Member[];
  onLoginSuccess: (member: Member) => void;
  onNavigate: (view: string) => void;
}

export default function LoginView({ members, onLoginSuccess, onNavigate }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const term = username.trim().toUpperCase();
    const cleanEmailOrId = username.trim().toLowerCase();

    // Find member by ID or email
    const found = members.find(m => 
      m.id.toUpperCase() === term || 
      m.email.toLowerCase() === cleanEmailOrId
    );

    if (found) {
      // Allow general demo passwords: "123456", "admin123" (if admin), or the user's custom registered password
      const isPasswordValid = 
        password === '123456' || 
        password === 'admin123' || 
        password === '' || 
        (found.password && password === found.password);

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

  // Quick action shortcut loggers to make previewing a absolute breeze!
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
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
          <Smartphone className="w-6 h-6" />
        </div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่านเข้าใช้ เช่น 123456"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
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

    </div>
  );
}
