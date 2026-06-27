/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Member } from '../types';
import { Smartphone, LogIn, UserPlus, LogOut, LayoutDashboard, User, ShieldAlert } from 'lucide-react';
import { shouldShowAdmin } from '../utils/domainHelper';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: Member | null;
  onLogout: () => void;
}

export default function Navbar({ currentView, onNavigate, currentUser, onLogout }: NavbarProps) {
  const menuItems = [
    { id: 'home', label: 'หน้าแรก' },
    { id: 'about', label: 'เกี่ยวกับเรา' },
    { id: 'products', label: 'สินค้าและระบบ BV' },
    { id: 'marketing', label: 'แผนการตลาด' },
    { id: 'contact', label: 'ติดต่อเรา' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:rotate-3 transition duration-200">
              <Smartphone className="w-5.5 h-5.5 md:w-6 md:h-6" />
            </div>
            <div>
              <span className="block font-sans font-bold text-lg md:text-xl text-slate-800 tracking-tight leading-none">Noinashop</span>
              <span className="block text-[10px] md:text-xs text-indigo-600 font-medium tracking-wider uppercase mt-0.5">IT Network & Second-Hand</span>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-xs md:text-sm font-semibold transition px-1.5 py-1 rounded-md relative ${currentView === item.id ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                {item.label}
                {currentView === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* User Operations Section */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* User Portal Access */}
                {((currentUser.role !== 'admin') || shouldShowAdmin()) && (
                  <button
                    onClick={() => onNavigate(currentUser.role === 'admin' ? 'admin-portal' : 'member-portal')}
                    className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    {currentUser.role === 'admin' ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>หลังบ้าน (แอดมิน)</span>
                      </>
                    ) : (
                      <>
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>หลังบ้าน (สมาชิก)</span>
                      </>
                    )}
                  </button>
                )}

                {/* Profile Widget */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-600" />
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold font-mono">
                    ID: {currentUser.id} | {currentUser.rank}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="p-1.5 md:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Login Button */}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-slate-600 hover:text-indigo-600 px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  เข้าสู่ระบบ
                </button>

                {/* Register Button */}
                <button
                  onClick={() => onNavigate('register')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-1 shadow-md shadow-indigo-100"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex justify-around items-center py-2.5 border-t border-slate-100">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`text-[10px] font-bold transition px-1.5 py-1 rounded-md ${currentView === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
