/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { User, ChevronDown, ChevronUp, Search, Info, Award } from 'lucide-react';

interface TreeChartProps {
  members: Member[];
  rootId: string;
  onSelectMember?: (id: string) => void;
  isAdminView?: boolean;
}

export default function TreeChart({ members, rootId, onSelectMember, isAdminView = false }: TreeChartProps) {
  const [focusedId, setFocusedId] = useState<string>(rootId);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');

  // Find member by ID
  const findMember = (id: string | null): Member | undefined => {
    if (!id) return undefined;
    return members.find(m => m.id === id);
  };

  const currentRoot = findMember(focusedId) || findMember(rootId);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const term = searchTerm.trim().toUpperCase();
    if (!term) return;

    const found = members.find(m => m.id === term || m.name.includes(term));
    if (found) {
      setFocusedId(found.id);
      setSearchTerm('');
    } else {
      setSearchError('ไม่พบสมาชิกชื่อหรือรหัสนี้');
    }
  };

  // Reset to original root
  const handleReset = () => {
    setFocusedId(rootId);
    setSearchError('');
  };

  // Get color for rank
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Diamond': return 'from-cyan-500 to-blue-600 border-cyan-400 text-white';
      case 'Platinum': return 'from-purple-500 to-indigo-600 border-purple-400 text-white';
      case 'Gold': return 'from-amber-400 to-amber-600 border-yellow-300 text-white';
      case 'Silver': return 'from-slate-300 to-slate-400 border-slate-200 text-slate-800';
      default: return 'from-orange-100 to-orange-200 border-orange-300 text-orange-800';
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'Diamond': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-orange-50 text-orange-800 border-orange-200';
    }
  };

  // Binary TreeNode component (renders a member node, its left branch, and its right branch)
  const TreeNode = ({ memberId, positionLabel }: { memberId: string | null, positionLabel?: 'ซ้าย' | 'ขวา' }) => {
    const member = findMember(memberId);

    if (!member) {
      return (
        <div className="flex flex-col items-center p-4">
          <div className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-2">
            <span className="font-medium text-gray-400">ตำแหน่งว่าง</span>
            {positionLabel && <span className="mt-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px]">ฝั่ง{positionLabel}</span>}
          </div>
        </div>
      );
    }

    const rankStyle = getRankColor(member.rank);

    return (
      <div className="flex flex-col items-center">
        {/* Connection Line to parent */}
        <div className="w-0.5 h-6 bg-slate-300"></div>

        {/* Node Card */}
        <div 
          onClick={() => {
            setFocusedId(member.id);
            if (onSelectMember) onSelectMember(member.id);
          }}
          className={`w-44 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group ${focusedId === member.id ? 'ring-2 ring-primary border-primary scale-105' : 'border-slate-200'}`}
        >
          {/* Rank Banner */}
          <div className={`px-2 py-1 bg-gradient-to-r ${rankStyle} text-[10px] font-bold flex justify-between items-center`}>
            <span>{member.id}</span>
            <span className="flex items-center gap-0.5">
              <Award className="w-3 h-3" />
              {member.rank}
            </span>
          </div>

          {/* Member Info */}
          <div className="p-2.5 text-center bg-white">
            <h4 className="text-xs font-semibold text-slate-800 truncate">{member.name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{member.phone}</p>
            
            {/* BV Stats */}
            <div className="mt-2 pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-1 text-[9px] text-slate-600">
              <div className="bg-emerald-50 rounded py-0.5">
                <span className="block font-medium text-emerald-700">L: {member.leftBV}</span>
              </div>
              <div className="bg-blue-50 rounded py-0.5">
                <span className="block font-medium text-blue-700">R: {member.rightBV}</span>
              </div>
            </div>

            {positionLabel && (
              <div className="mt-1.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-medium ${positionLabel === 'ซ้าย' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  สาย{positionLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tree branch divider and recursively render children if present */}
        {(member.leftChildId || member.rightChildId) && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-slate-300"></div>
            
            {/* Horizontal branch line connecting left and right children */}
            <div className="relative w-full flex justify-center">
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-300"></div>
            </div>

            {/* Children grid */}
            <div className="flex gap-4 md:gap-8 justify-center mt-0 w-full">
              <div className="flex flex-col items-center">
                <TreeNode memberId={member.leftChildId} positionLabel="ซ้าย" />
              </div>
              <div className="flex flex-col items-center">
                <TreeNode memberId={member.rightChildId} positionLabel="ขวา" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm overflow-hidden" id="tree-chart-container">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            ผังโครงสร้างสายงานแบบไบนารี (Binary Tree)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            แสดงสายงานผู้แนะนำ คะแนนบาลานซ์ฝั่งซ้าย (L) และฝั่งขวา (R) คลิกรายชื่อเพื่อซูมเข้าไปดูระดับลึกลงไป
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full sm:w-auto flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="รหัส หรือชื่อผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold shadow-sm transition">
            ค้นหา
          </button>
          {focusedId !== rootId && (
            <button 
              type="button" 
              onClick={handleReset}
              className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-300 font-semibold transition"
            >
              รีเซ็ต
            </button>
          )}
        </form>
      </div>

      {searchError && (
        <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {searchError}
        </div>
      )}

      {/* Selected Member Detail Highlight (Floating Panel) */}
      {currentRoot && (
        <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 font-bold border border-indigo-200 text-lg">
              {currentRoot.id.slice(-3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800">{currentRoot.name} ({currentRoot.id})</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRankBadge(currentRoot.rank)}`}>
                  {currentRoot.rank}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ผู้แนะนำ: <span className="font-semibold text-slate-700">{currentRoot.sponsorId || 'ไม่มี (จุดเริ่มต้นสายงาน)'}</span> | 
                เบอร์โทร: <span className="font-semibold text-slate-700">{currentRoot.phone}</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center border-t md:border-t-0 pt-3 md:pt-0 border-indigo-100">
            <div className="bg-white p-2 rounded-lg border border-indigo-100 min-w-[100px]">
              <span className="block text-[10px] text-slate-400 font-medium">คะแนนฝั่งซ้าย (L)</span>
              <span className="text-sm font-bold text-emerald-600">{currentRoot.leftBV} BV</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100 min-w-[100px]">
              <span className="block text-[10px] text-slate-400 font-medium">คะแนนฝั่งขวา (R)</span>
              <span className="text-sm font-bold text-blue-600">{currentRoot.rightBV} BV</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100 min-w-[100px]">
              <span className="block text-[10px] text-slate-400 font-medium">รายได้สะสม</span>
              <span className="text-sm font-bold text-indigo-600">{currentRoot.walletBalance.toLocaleString()} ฿</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Tree Rendering Container */}
      <div className="overflow-auto py-10 flex justify-center bg-white rounded-xl border border-slate-100 min-h-[500px]">
        <div className="inline-block px-10">
          <div className="flex flex-col items-center">
            {/* Root Node (Current focused member) */}
            <div 
              onClick={() => {
                if (currentRoot) {
                  setFocusedId(currentRoot.id);
                  if (onSelectMember) onSelectMember(currentRoot.id);
                }
              }}
              className={`w-44 bg-white border rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ring-4 ring-indigo-100 ${focusedId === currentRoot?.id ? 'border-indigo-600' : 'border-slate-200'}`}
            >
              {currentRoot && (
                <>
                  <div className={`px-2 py-1 bg-gradient-to-r ${getRankColor(currentRoot.rank)} text-[10px] font-bold flex justify-between items-center`}>
                    <span>{currentRoot.id} (เป้าหมาย)</span>
                    <span className="flex items-center gap-0.5">
                      <Award className="w-3 h-3" />
                      {currentRoot.rank}
                    </span>
                  </div>
                  <div className="p-3 text-center">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{currentRoot.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{currentRoot.phone}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[9px] text-slate-600">
                      <div className="bg-emerald-50 rounded py-0.5">
                        <span className="block font-medium text-emerald-700">L: {currentRoot.leftBV}</span>
                      </div>
                      <div className="bg-blue-50 rounded py-0.5">
                        <span className="block font-medium text-blue-700">R: {currentRoot.rightBV}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tree Branch Line Downward */}
            {currentRoot && (currentRoot.leftChildId || currentRoot.rightChildId) && (
              <div className="flex flex-col items-center w-full">
                <div className="w-0.5 h-6 bg-slate-300"></div>
                
                {/* Horizontal Connector bar */}
                <div className="relative w-full flex justify-center">
                  <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-300"></div>
                </div>

                {/* Grid for child nodes */}
                <div className="flex gap-4 md:gap-12 justify-center mt-0 w-full">
                  <div className="flex flex-col items-center">
                    <TreeNode memberId={currentRoot.leftChildId} positionLabel="ซ้าย" />
                  </div>
                  <div className="flex flex-col items-center">
                    <TreeNode memberId={currentRoot.rightChildId} positionLabel="ขวา" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Instructions */}
      <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-500 flex gap-2 items-start">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-700 mb-0.5">คำแนะนำ:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>คลิกที่กล่องสมาชิกใดๆ ในผังเพื่อตั้งเป็นเป้าหมายหลักในการดูสายงานระดับที่ลึกลงไป</li>
            <li>กดปุ่ม <strong>"รีเซ็ต"</strong> เพื่อกลับสู่ระดับเริ่มต้นสูงสุด</li>
            <li>คะแนนซ้าย (L) และขวา (R) จะสะสมขึ้นด้านบนเมื่อมีดาวน์ไลน์ในสายงานทำการสั่งซื้อสินค้าที่มีคะแนน BV</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
