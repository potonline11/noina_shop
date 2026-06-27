/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { Database, Link, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet, Eye } from 'lucide-react';
import { parseCSV, DEMO_SPREADSHEET_DATA, DEFAULT_SHEET_URL, getCleanSheetUrl, parseSheetData } from '../utils/sheetParser';

interface GoogleSheetSyncProps {
  onSyncComplete: (products: Product[]) => void;
  currentProductsCount: number;
}

export default function GoogleSheetSync({ onSyncComplete, currentProductsCount }: GoogleSheetSyncProps) {
  // Default sample sheet url (publicly accessible or beautifully simulated as standard demo)
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('noina_sheet_url') || DEFAULT_SHEET_URL;
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    setPreviewProducts([]);

    try {
      // If it is the default placeholder or looks fake, we will parse our beautiful demo Google Sheet data
      // directly to give the user a zero-configuration successful demonstration!
      if (sheetUrl.includes('example') || !sheetUrl.startsWith('http')) {
        setTimeout(() => {
          const products = parseCSV(DEMO_SPREADSHEET_DATA);
          setPreviewProducts(products);
          onSyncComplete(products);
          localStorage.setItem('noina_sheet_url', sheetUrl);
          setLoading(false);
          setStatus({
            type: 'success',
            message: `ดึงข้อมูลจำลองสำเร็จ! ค้นพบสินค้าทั้้งหมด ${products.length} รายการ และนำเข้าสู่ระบบเรียบร้อยแล้ว`
          });
        }, 1200);
        return;
      }

      // Real network fetch
      const cleanUrl = getCleanSheetUrl(sheetUrl);
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error('ไม่สามารถเข้าถึงลิงก์ Google Sheet นี้ได้ โปรดตรวจสอบความถูกต้องและการเผยแพร่');
      }

      const text = await response.text();
      const products = parseSheetData(text);

      if (products.length === 0) {
        throw new Error('ไม่พบข้อมูลสินค้าที่ถูกต้องในไฟล์ โปรดตรวจสอบว่ามีแถวหัวข้อ (Header) เช่น Title, Description, Price, BV');
      }

      setPreviewProducts(products);
      onSyncComplete(products);
      localStorage.setItem('noina_sheet_url', sheetUrl);
      setStatus({
        type: 'success',
        message: `ดึงข้อมูลจาก Google Sheet สำเร็จ! ค้นพบและนำเข้าสินค้าใหม่ทั้งหมด ${products.length} รายการ`
      });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล โปรดตรวจสอบลิงก์ CSV ของคุณอีกครั้ง'
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Sync Trigger
  const triggerDemoSync = () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    
    setTimeout(() => {
      const products = parseCSV(DEMO_SPREADSHEET_DATA);
      setPreviewProducts(products);
      onSyncComplete(products);
      setLoading(false);
      setStatus({
        type: 'success',
        message: `เชื่อมต่อระบบจำลอง Google Sheet สำเร็จ! โหลดสินค้ามือสองเพิ่มอีก ${products.length} รายการเพื่อทดสอบระบบ`
      });
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">ระบบดึงข้อมูลสินค้าจาก Google Sheets</h3>
          <p className="text-xs text-slate-500 mt-0.5">อัปเดตและซิงก์ข้อมูลสินค้าของร้าน Noinashop แบบเรียลไทม์ได้ทันที</p>
        </div>
      </div>

      {/* Instructions Guide */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-xs text-slate-600">
        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1">
          <Database className="w-4 h-4 text-emerald-600" />
          วิธีการจัดเตรียม Google Sheet เพื่อเผยแพร่สินค้า:
        </h4>
        <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
          <li>สร้าง Google Sheet และใส่แถวหัวข้อแรก (แถวที่ 1) ดังนี้: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">Title, Description, Price, BV, Image, Category, Brand, Condition, Stock</code></li>
          <li>กรอกข้อมูลสินค้ามือสอง (Category รองรับ: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">smartphone</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">notebook</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">accessory</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">tablet</code>)</li>
          <li>ไปที่เมนู <strong>ไฟล์ (File)</strong> &gt; <strong>แชร์ (Share)</strong> &gt; <strong>เผยแพร่ทางเว็บ (Publish to web)</strong></li>
          <li>เลือกประเภทข้อมูลเป็น <strong>ค่าที่คั่นด้วยจุลภาค (.csv)</strong> จากนั้นกดปุ่ม "เผยแพร่"</li>
          <li>คัดลอกลิงก์ที่ได้ มาวางในช่องกรอกด้านล่างเพื่อทำการดึงข้อมูล</li>
        </ol>
      </div>

      {/* Sync Form */}
      <form onSubmit={handleSync} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Link className="w-3.5 h-3.5 text-slate-400" />
            ลิงก์ Google Sheet เผยแพร่แบบ CSV (.csv)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              ดึงข้อมูล
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {status.type !== 'idle' && (
          <div className={`p-4 rounded-xl text-xs flex gap-2 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Demo/Shortcut Panel */}
        <div className="flex flex-wrap justify-between items-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500">มีสินค้าดึงจากชีตแล้วในหน้าสินค้า</span>
          <button
            type="button"
            onClick={triggerDemoSync}
            disabled={loading}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            <Database className="w-3 h-3" />
            โหลดตัวอย่างสินค้า Google Sheet ทันที (จำลอง)
          </button>
        </div>
      </form>

      {/* Sync Preview Panel */}
      {previewProducts.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h4 className="font-semibold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-600" />
            พรีวิวสินค้าที่ดึงมา ({previewProducts.length} รายการ)
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
            {previewProducts.map((p, idx) => (
              <div key={idx} className="flex gap-3 items-center bg-slate-50 border border-slate-100 rounded-lg p-2.5 hover:bg-slate-100 transition">
                <img referrerPolicy="no-referrer" src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-white border border-slate-200" />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{p.name}</h5>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] uppercase font-bold shrink-0">{p.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-xs font-bold text-slate-800">{p.price.toLocaleString()} ฿</span>
                  <span className="block text-[10px] font-medium text-indigo-600 font-mono">+{p.bv} BV</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
