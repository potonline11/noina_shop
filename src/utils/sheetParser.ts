/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1UL93q_PpKGlZocvcD6ShLwbDJP-nU1emB5-hvQOLT_A/edit?usp=sharing';

export const getCleanSheetUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  // If already published/direct export, leave it
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }
  // Try to match google spreadsheets URL pattern to convert to export
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  }
  return trimmed;
};


export const DEMO_SPREADSHEET_DATA = `Title,Description,Price,BV,Image,Category,Brand,Condition,Stock
"iPhone 12 Pro Max 128GB (มือสอง)","สภาพ 94% สุขภาพแบตเตอรี่ 85% กล้องซูมชัด จอแท้เดิม อุปกรณ์เสริมครบชุด",14900,1500,"https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",smartphone,Apple,"94% สภาพดีเยี่ยม",6
"Dell Latitude 7490 Core i5 (มือสอง)","โน๊ตบุ๊คทำงาน น้ำหนักเบา คีย์บอร์ดมีไฟ RAM 16GB SSD 256GB แบตเตอรี่เก็บไฟได้ดีเยี่ยม",8500,900,"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",notebook,Dell,"92% แข็งแรงทนทาน",4
"Apple Watch Series 6 44mm (มือสอง)","สภาพ 95% อลูมิเนียมสีดำ สายยางสปอร์ต แบต 84% เซ็นเซอร์วัดออกซิเจนปกติ ไร้รอยขีดข่วนลึก",5900,600,"https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80",accessory,Apple,"95% สวยงาม",8
"iPad Air 4 Wi-Fi 64GB (มือสอง)","สภาพสวย 97% สี Sky Blue มีกล่องเดิมแถมเคสแม่เหล็กอย่างดี หน้าจอปุ่มทัชสแกนนิ้วปกติ",12500,1300,"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",tablet,Apple,"97% สภาพสมบูรณ์",3
"Lenovo ThinkPad X1 Carbon Gen 6 (มือสอง)","โน๊ตบุ๊คเกรดพรีเมียม สภาพสวย 96% จอ IPS คมชัด RAM 8GB SSD 256GB เบาและหรูหรามาก",11900,1200,"https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",notebook,Lenovo,"96% ระดับพรีเมียม",2`;

export const parseHTMLTable = (htmlText: string): Product[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  
  // Find all table rows
  const rows = Array.from(doc.querySelectorAll('tr'));
  if (rows.length < 2) return [];
  
  // Find header row and column mapping
  let headerIndex = -1;
  let colMap: { [key: string]: number } = {};
  
  const targetHeaders = ['title', 'name', 'productname', 'description', 'desc', 'price', 'bv', 'image', 'img', 'category', 'brand', 'condition', 'quality', 'stock'];
  
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const cells = Array.from(rows[r].querySelectorAll('td, th')).map(c => (c.textContent || '').trim().toLowerCase());
    // Check if this looks like a header row
    const matchCount = cells.filter(cell => targetHeaders.some(th => cell.includes(th))).length;
    if (matchCount >= 2) {
      headerIndex = r;
      cells.forEach((cell, idx) => {
        // Clean cell text (remove spaces, quotes, non-alphabetic chars)
        const cleanCell = cell.replace(/[^a-z]/g, '');
        if (cleanCell.includes('title') || cleanCell.includes('name')) colMap['name'] = idx;
        else if (cleanCell.includes('description') || cleanCell.includes('desc')) colMap['description'] = idx;
        else if (cleanCell.includes('price')) colMap['price'] = idx;
        else if (cleanCell.includes('bv')) colMap['bv'] = idx;
        else if (cleanCell.includes('image') || cleanCell.includes('img')) colMap['image'] = idx;
        else if (cleanCell.includes('category')) colMap['category'] = idx;
        else if (cleanCell.includes('brand')) colMap['brand'] = idx;
        else if (cleanCell.includes('condition') || cleanCell.includes('quality')) colMap['condition'] = idx;
        else if (cleanCell.includes('stock')) colMap['stock'] = idx;
      });
      break;
    }
  }
  
  // If we couldn't find a clear header row with keywords, try the first row anyway
  if (headerIndex === -1) {
    const firstRowCells = Array.from(rows[0].querySelectorAll('td, th')).map(c => (c.textContent || '').trim().toLowerCase());
    firstRowCells.forEach((cell, idx) => {
      const cleanCell = cell.replace(/[^a-z]/g, '');
      if (cleanCell.includes('title') || cleanCell.includes('name')) colMap['name'] = idx;
      else if (cleanCell.includes('description') || cleanCell.includes('desc')) colMap['description'] = idx;
      else if (cleanCell.includes('price')) colMap['price'] = idx;
      else if (cleanCell.includes('bv')) colMap['bv'] = idx;
      else if (cleanCell.includes('image') || cleanCell.includes('img')) colMap['image'] = idx;
      else if (cleanCell.includes('category')) colMap['category'] = idx;
      else if (cleanCell.includes('brand')) colMap['brand'] = idx;
      else if (cleanCell.includes('condition') || cleanCell.includes('quality')) colMap['condition'] = idx;
      else if (cleanCell.includes('stock')) colMap['stock'] = idx;
    });
    headerIndex = 0;
  }
  
  // Defaults if columns still not mapped
  if (colMap['name'] === undefined) colMap['name'] = 0;
  if (colMap['description'] === undefined) colMap['description'] = 1;
  if (colMap['price'] === undefined) colMap['price'] = 2;
  if (colMap['bv'] === undefined) colMap['bv'] = 3;
  if (colMap['image'] === undefined) colMap['image'] = 4;
  if (colMap['category'] === undefined) colMap['category'] = 5;
  if (colMap['brand'] === undefined) colMap['brand'] = 6;
  if (colMap['condition'] === undefined) colMap['condition'] = 7;
  if (colMap['stock'] === undefined) colMap['stock'] = 8;

  const results: Product[] = [];
  
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map(c => (c.textContent || '').trim());
    if (cells.length === 0) continue;
    
    // Skip if row is completely empty
    if (cells.every(c => !c)) continue;
    
    const name = cells[colMap['name']] || '';
    // Skip header text repeating in data
    if (!name || name.toLowerCase() === 'title' || name.toLowerCase() === 'name') continue;
    
    const priceVal = cells[colMap['price']] ? parseFloat(cells[colMap['price']].replace(/[^0-9.]/g, '')) : 0;
    const bvVal = cells[colMap['bv']] ? parseFloat(cells[colMap['bv']].replace(/[^0-9.]/g, '')) : Math.round(priceVal * 0.1);

    results.push({
      id: `sheet-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
      name: name,
      description: cells[colMap['description']] || 'สินค้าดึงข้อมูลจาก Google Sheet สำเร็จ',
      price: isNaN(priceVal) ? 0 : priceVal,
      bv: isNaN(bvVal) ? 0 : bvVal,
      image: cells[colMap['image']] || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
      category: (cells[colMap['category']] || 'accessory').toLowerCase() as any,
      brand: cells[colMap['brand']] || 'แบรนด์มือสอง',
      condition: cells[colMap['condition']] || '95% สภาพดี',
      stock: cells[colMap['stock']] ? parseInt(cells[colMap['stock']].replace(/[^0-9]/g, '')) || 5 : 5,
      source: 'googlesheet'
    });
  }
  
  return results;
};

export const parseSheetData = (text: string): Product[] => {
  if (!text) return [];
  const trimmed = text.trim();
  const isHTML = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<table') || trimmed.includes('<tr');
  
  if (isHTML) {
    try {
      return parseHTMLTable(text);
    } catch (e) {
      console.error('Error parsing HTML table from sheet data:', e);
    }
  }
  
  return parseCSV(text);
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  if (!html.includes('<') || !html.includes('>')) {
    return html;
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch (e) {
    return html.replace(/<[^>]*>/g, '');
  }
};

export const parseCSV = (text: string): Product[] => {
  if (!text) return [];

  // Determine separator from the first line
  const firstLine = text.split('\n')[0] || '';
  const separator = firstLine.includes('\t') ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote "" inside quotes
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quotes mode
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  // Add the last cell and row if anything remains
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headerRow = rows[0];
  const headers = headerRow.map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const results: Product[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 0 || cells.every(c => !c)) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      let val = cells[index] || '';
      val = val.replace(/^"|"$/g, '');
      row[header] = val;
    });

    // Map to Product object
    const name = row.name || row.title || row.productname || '';
    
    // Ignore rows that appear to be parsed from some random HTML webpage wrapper
    if (name && 
        name.toLowerCase() !== 'title' && 
        name.toLowerCase() !== 'name' && 
        !name.startsWith('<!DOCTYPE') && 
        !name.startsWith('<html') && 
        !name.startsWith('<head') && 
        !name.startsWith('<body') && 
        !name.startsWith('<style')) {
      
      const priceVal = row.price ? parseFloat(row.price.replace(/[^0-9.]/g, '')) : 0;
      const bvVal = row.bv ? parseFloat(row.bv.replace(/[^0-9.]/g, '')) : Math.round(priceVal * 0.1);

      results.push({
        id: `sheet-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
        name: name,
        description: row.description || row.desc || 'สินค้าดึงข้อมูลจาก Google Sheet สำเร็จ',
        price: isNaN(priceVal) ? 0 : priceVal,
        bv: isNaN(bvVal) ? 0 : bvVal,
        image: row.image || row.img || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
        category: (row.category || 'accessory').toLowerCase() as any,
        brand: row.brand || 'แบรนด์มือสอง',
        condition: row.condition || row.quality || '95% สภาพดี',
        stock: row.stock ? parseInt(row.stock.replace(/[^0-9]/g, '')) || 5 : 5,
        source: 'googlesheet'
      });
    }
  }
  return results;
};
