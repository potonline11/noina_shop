/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgD4S83Y7Mh0p_ZpUqB6HwR-E9Gg56m8-q-WqP4SgK7Jq7e_gG7gG8g_example/pub?output=csv';

export const DEMO_SPREADSHEET_DATA = `Title,Description,Price,BV,Image,Category,Brand,Condition,Stock
"iPhone 12 Pro Max 128GB (มือสอง)","สภาพ 94% สุขภาพแบตเตอรี่ 85% กล้องซูมชัด จอแท้เดิม อุปกรณ์เสริมครบชุด",14900,1500,"https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",smartphone,Apple,"94% สภาพดีเยี่ยม",6
"Dell Latitude 7490 Core i5 (มือสอง)","โน๊ตบุ๊คทำงาน น้ำหนักเบา คีย์บอร์ดมีไฟ RAM 16GB SSD 256GB แบตเตอรี่เก็บไฟได้ดีเยี่ยม",8500,900,"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",notebook,Dell,"92% แข็งแรงทนทาน",4
"Apple Watch Series 6 44mm (มือสอง)","สภาพ 95% อลูมิเนียมสีดำ สายยางสปอร์ต แบต 84% เซ็นเซอร์วัดออกซิเจนปกติ ไร้รอยขีดข่วนลึก",5900,600,"https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80",accessory,Apple,"95% สวยงาม",8
"iPad Air 4 Wi-Fi 64GB (มือสอง)","สภาพสวย 97% สี Sky Blue มีกล่องเดิมแถมเคสแม่เหล็กอย่างดี หน้าจอปุ่มทัชสแกนนิ้วปกติ",12500,1300,"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",tablet,Apple,"97% สภาพสมบูรณ์",3
"Lenovo ThinkPad X1 Carbon Gen 6 (มือสอง)","โน๊ตบุ๊คเกรดพรีเมียม สภาพสวย 96% จอ IPS คมชัด RAM 8GB SSD 256GB เบาและหรูหรามาก",11900,1200,"https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",notebook,Lenovo,"96% ระดับพรีเมียม",2`;

export const parseCSV = (text: string): Product[] => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const separator = headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const results: Product[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      let val = cells[index] || '';
      val = val.replace(/^"|"$/g, '');
      row[header] = val;
    });

    // Map to Product object
    const name = row.name || row.title || row.productname || '';
    if (name) {
      results.push({
        id: `sheet-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
        name: name,
        description: row.description || row.desc || 'สินค้าดึงข้อมูลจาก Google Sheet สำเร็จ',
        price: parseFloat(row.price) || 0,
        bv: parseFloat(row.bv) || Math.round((parseFloat(row.price) || 0) * 0.1), // default 10%
        image: row.image || row.img || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
        category: (row.category || 'accessory').toLowerCase() as any,
        brand: row.brand || 'แบรนด์มือสอง',
        condition: row.condition || row.quality || '95% สภาพดี',
        stock: parseInt(row.stock) || 5,
        source: 'googlesheet'
      });
    }
  }
  return results;
};
