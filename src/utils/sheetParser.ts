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


export const FACEBOOK_CATALOG_HEADER = 'id,title,description,availability,condition,price,link,image_link,brand,item_group_id,additional_image_link,sale_price,inventory,size,color,product_type,google_product_category,custom_label_0';

export const DEMO_FACEBOOK_SPREADSHEET_DATA = `id,title,description,availability,condition,price,link,image_link,brand,item_group_id,additional_image_link,sale_price,inventory,size,color,product_type,google_product_category,custom_label_0
"DAI-A95-20W","DAI_ICHI หลอดไฟ LED A95 Bulb DAI-ICHI ขั้ว E27 แสง Daylight","หลอดไฟ LED A95 ขั้ว E27 แสง Daylight ประหยัดพลังงาน มาตรฐาน มอก.","in stock","new","139.00 THB","https://www.noinashop.business","https://wbruny6z1studoa4.public.blob.vercel-storage.com/TANARATH/ee0604a2-1cc2-4a7b-82f8-bb5c4ea2cf84.jpg","DAI_ICHI","GRP-DAI-A95","","","99","20W","Daylight แสงขาว","เครื่องใช้ไฟฟ้า > อุปกรณ์ส่องสว่าง","Hardware > Electrical Supplies","14 BV"
"DAI-A95-25W","DAI_ICHI หลอดไฟ LED A95 Bulb DAI-ICHI ขั้ว E27 แสง Daylight","หลอดไฟ LED A95 ขั้ว E27 แสง Daylight ประหยัดพลังงาน มาตรฐาน มอก.","in stock","new","259.00 THB","https://www.noinashop.business","https://wbruny6z1studoa4.public.blob.vercel-storage.com/TANARATH/ee0604a2-1cc2-4a7b-82f8-bb5c4ea2cf84.jpg","DAI_ICHI","GRP-DAI-A95","","","99","25W","Daylight แสงขาว","เครื่องใช้ไฟฟ้า > อุปกรณ์ส่องสว่าง","Hardware > Electrical Supplies","26 BV"
"LEK-BLK-2X4","บล็อกยาง 2x4 และ 4x4 พร้อมเต้ารับกราวด์คู่ LeKise","บล็อกยางคุณภาพสูง ทนต่อแรงกระแทก เต้ารับได้มาตรฐาน มอก.166-2549 ทนทาน ปลอดภัย","in stock","new","189.00 THB","https://www.noinashop.business","https://wbruny6z1studoa4.public.blob.vercel-storage.com/TANARATH/3ef32740-4e03-4a54-9ce7-7719d52703b8.jpg","LeKise","GRP-LEK-BLK","","","99","2 x 4","ดำ","เครื่องใช้ไฟฟ้า > ปลั๊กและบล็อกยาง","Hardware > Electrical Supplies","18.9 BV"
"LEK-BLK-4X4","บล็อกยาง 2x4 และ 4x4 พร้อมเต้ารับกราวด์คู่ LeKise","บล็อกยางคุณภาพสูง ทนต่อแรงกระแทก เต้ารับได้มาตรฐาน มอก.166-2549 ทนทาน ปลอดภัย","in stock","new","239.00 THB","https://www.noinashop.business","https://wbruny6z1studoa4.public.blob.vercel-storage.com/TANARATH/3ef32740-4e03-4a54-9ce7-7719d52703b8.jpg","LeKise","GRP-LEK-BLK","","","99","4 x 4","ดำ","เครื่องใช้ไฟฟ้า > ปลั๊กและบล็อกยาง","Hardware > Electrical Supplies","23.9 BV"
"LEK-SOLAR-50W","[ซื้อ 1 แถม 1] โคมไฟถนนโซล่าเซลล์ 50W LED SOLAR STREET LIGHT ยี่ห้อ LeKise","โคมไฟถนนโซล่าเซลล์ 50W เซ็นเซอร์แสงและความเคลื่อนไหว เปิดสว่างตลอดคืน แถมเสาและรีโมท","in stock","new","1625.00 THB","https://www.noinashop.business","https://wbruny6z1studoa4.public.blob.vercel-storage.com/TANARATH/4e2765d0-6435-47c2-bb3b-886b98d40237.jpg","LeKise","","","","99","50W","Daylight แสงขาว","เครื่องใช้ไฟฟ้า > อุปกรณ์โซล่าเซลล์","Hardware > Electrical Supplies","162.5 BV"`;

export const DEMO_SPREADSHEET_DATA = DEMO_FACEBOOK_SPREADSHEET_DATA;

export const parseNumericPrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const parseHTMLTable = (htmlText: string): Product[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  
  // Find all table rows
  const rows = Array.from(doc.querySelectorAll('tr'));
  if (rows.length < 2) return [];
  
  // Find header row and column mapping
  let headerIndex = -1;
  let colMap: { [key: string]: number } = {};
  
  const targetHeaders = ['title', 'name', 'description', 'desc', 'price', 'bv', 'image', 'category', 'brand', 'condition', 'stock', 'size', 'item_group_id', 'custom_label'];
  
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const cells = Array.from(rows[r].querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
    const matchCount = cells.filter(cell => {
      const lower = cell.toLowerCase().replace(/[^a-z0-9_]/g, '');
      return targetHeaders.some(th => lower.includes(th));
    }).length;

    if (matchCount >= 2) {
      headerIndex = r;
      cells.forEach((cell, idx) => {
        const raw = cell.trim();
        const norm = raw.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');

        if (norm === 'id' || norm === 'sku' || norm === 'item_id' || norm === 'retailer_id' || raw.includes('รหัสสินค้า')) {
          if (colMap['id'] === undefined) colMap['id'] = idx;
        } else if (norm === 'item_group_id' || norm === 'group_id' || norm === 'parent_id' || norm === 'parent_sku' || raw.includes('รหัสกลุ่ม')) {
          colMap['item_group_id'] = idx;
        } else if (norm === 'title' || norm === 'name' || norm === 'product_name' || raw.includes('ชื่อสินค้า') || raw.includes('ชื่อ')) {
          if (colMap['name'] === undefined) colMap['name'] = idx;
        } else if (norm === 'description' || norm === 'desc' || raw.includes('รายละเอียด')) {
          if (colMap['description'] === undefined) colMap['description'] = idx;
        } else if (norm === 'availability' || norm === 'status' || raw.includes('สถานะ')) {
          colMap['availability'] = idx;
        } else if (norm === 'condition' || norm === 'quality' || raw.includes('สภาพ')) {
          colMap['condition'] = idx;
        } else if (norm === 'sale_price' || norm === 'discount_price' || raw.includes('ราคาโปร') || raw.includes('ราคาลด')) {
          colMap['sale_price'] = idx;
        } else if (norm === 'price' || norm === 'regular_price' || raw.includes('ราคา')) {
          colMap['price'] = idx;
        } else if (norm === 'additional_image_link' || norm === 'additional_images' || norm === 'extra_images' || norm === 'gallery' || raw.includes('ภาพเพิ่มเติม')) {
          colMap['additional_image_link'] = idx;
        } else if (norm === 'image_link' || norm === 'image' || norm === 'img' || norm === 'photo' || raw.includes('รูปภาพ') || raw.includes('ภาพหลัก')) {
          if (colMap['image'] === undefined) colMap['image'] = idx;
        } else if (norm === 'link' || norm === 'url' || norm === 'product_link' || raw.includes('ลิงก์')) {
          colMap['link'] = idx;
        } else if (norm === 'brand' || raw.includes('แบรนด์') || raw.includes('ยี่ห้อ')) {
          colMap['brand'] = idx;
        } else if (norm === 'inventory' || norm === 'quantity_to_sell_on_facebook' || norm === 'stock' || norm === 'qty' || raw.includes('สต็อก') || raw.includes('จำนวน')) {
          colMap['stock'] = idx;
        } else if (norm === 'size' || raw.includes('ขนาด')) {
          colMap['size'] = idx;
        } else if (norm === 'color' || norm === 'colour' || raw.includes('สี')) {
          colMap['color'] = idx;
        } else if (norm === 'custom_label_0' || norm === 'custom_label0' || norm === 'bv' || norm === 'point' || norm === 'points' || raw.includes('คะแนน') || raw.includes('บีวี')) {
          colMap['bv'] = idx;
        } else if (norm.startsWith('custom_label')) {
          if (colMap['bv'] === undefined) colMap['bv'] = idx;
        } else if (norm === 'product_type' || norm === 'category' || norm === 'cat' || raw.includes('หมวดหมู่')) {
          colMap['category'] = idx;
        } else if (norm === 'google_product_category' || norm === 'fb_product_category') {
          if (colMap['category'] === undefined) colMap['category'] = idx;
        } else if (norm === 'option' || norm === 'options' || norm === 'variant' || norm === 'variants' || raw.includes('แบบ') || raw.includes('ตัวเลือก') || raw.includes('รุ่น')) {
          colMap['options'] = idx;
        }
      });
      break;
    }
  }
  
  if (headerIndex === -1) {
    headerIndex = 0;
    const firstRowCells = Array.from(rows[0].querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
    firstRowCells.forEach((cell, idx) => {
      const raw = cell.trim();
      const norm = raw.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (norm.includes('title') || norm.includes('name')) colMap['name'] = idx;
      else if (norm.includes('desc')) colMap['description'] = idx;
      else if (norm.includes('price')) colMap['price'] = idx;
      else if (norm.includes('bv') || norm.includes('point') || norm.includes('label')) colMap['bv'] = idx;
      else if (norm.includes('img') || norm.includes('image')) colMap['image'] = idx;
      else if (norm.includes('cat')) colMap['category'] = idx;
      else if (norm.includes('brand')) colMap['brand'] = idx;
      else if (norm.includes('stock') || norm.includes('inv')) colMap['stock'] = idx;
      else if (norm.includes('size')) colMap['size'] = idx;
    });
  }
  
  if (colMap['name'] === undefined) colMap['name'] = 0;
  if (colMap['description'] === undefined && rows[headerIndex].children.length > 1) colMap['description'] = 1;
  if (colMap['price'] === undefined && rows[headerIndex].children.length > 2) colMap['price'] = 2;
  if (colMap['image'] === undefined && rows[headerIndex].children.length > 4) colMap['image'] = 4;

  const rawRows: any[] = [];
  
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map(c => (c.textContent || '').trim());
    if (cells.length === 0 || cells.every(c => !c)) continue;
    
    const name = cells[colMap['name']] || '';
    if (!name || name.toLowerCase() === 'title' || name.toLowerCase() === 'name') continue;
    
    const priceVal = colMap['price'] !== undefined ? parseNumericPrice(cells[colMap['price']]) : 0;
    if (priceVal <= 0) continue;

    const salePriceVal = colMap['sale_price'] !== undefined ? parseNumericPrice(cells[colMap['sale_price']]) : 0;

    let bvVal = 0;
    if (colMap['bv'] !== undefined && cells[colMap['bv']]) {
      bvVal = parseNumericPrice(cells[colMap['bv']]);
    }
    if (bvVal <= 0 && priceVal > 0) {
      bvVal = Math.round(priceVal * 0.1);
    }

    let stockVal = 99;
    if (colMap['stock'] !== undefined && cells[colMap['stock']]) {
      const parsedStock = parseInt(cells[colMap['stock']].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedStock)) stockVal = parsedStock;
    }
    if (colMap['availability'] !== undefined && cells[colMap['availability']]) {
      const avail = cells[colMap['availability']].toLowerCase().trim();
      if (avail === 'out of stock' || avail === 'outofstock' || avail === 'หมด') {
        stockVal = 0;
      }
    }

    const primaryImg = (colMap['image'] !== undefined && cells[colMap['image']])
      ? cells[colMap['image']].trim()
      : 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80';

    const additionalImgsRaw = (colMap['additional_image_link'] !== undefined && cells[colMap['additional_image_link']])
      ? cells[colMap['additional_image_link']].trim()
      : '';

    const allImgs: string[] = [];
    if (primaryImg && primaryImg.startsWith('http')) {
      const splitPrimary = primaryImg.split(/[\n,\|\s]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
      splitPrimary.forEach(u => { if (!allImgs.includes(u)) allImgs.push(u); });
    }
    if (additionalImgsRaw) {
      const splitAdditional = additionalImgsRaw.split(/[\n,\|\s]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
      splitAdditional.forEach(u => { if (!allImgs.includes(u)) allImgs.push(u); });
    }
    if (allImgs.length === 0) allImgs.push(primaryImg);

    const rowId = (colMap['id'] !== undefined && cells[colMap['id']]) ? cells[colMap['id']].trim() : '';
    const itemGroupId = (colMap['item_group_id'] !== undefined && cells[colMap['item_group_id']]) ? cells[colMap['item_group_id']].trim() : '';
    const sizeVal = (colMap['size'] !== undefined && cells[colMap['size']]) ? cells[colMap['size']].trim() : '';
    const colorVal = (colMap['color'] !== undefined && cells[colMap['color']]) ? cells[colMap['color']].trim() : '';

    let singleRowOptions: string[] | undefined = undefined;
    if (colMap['options'] !== undefined && cells[colMap['options']]) {
      const rawOpt = cells[colMap['options']].trim();
      if (rawOpt) {
        singleRowOptions = rawOpt.split(/[,|/]/).map(s => s.trim()).filter(Boolean);
      }
    }

    let variantLabel = '';
    if (sizeVal && colorVal) variantLabel = `${sizeVal} / ${colorVal}`;
    else if (sizeVal) variantLabel = sizeVal;
    else if (colorVal) variantLabel = colorVal;

    rawRows.push({
      id: rowId || `sheet-prod-${i}`,
      itemGroupId,
      name,
      description: (colMap['description'] !== undefined && cells[colMap['description']]) ? cells[colMap['description']].trim() : 'สินค้าคุณภาพพร้อมจัดส่ง',
      price: priceVal,
      salePrice: salePriceVal > 0 ? salePriceVal : undefined,
      bv: bvVal,
      image: allImgs[0] || primaryImg,
      images: allImgs,
      category: (colMap['category'] !== undefined && cells[colMap['category']]) ? cells[colMap['category']].trim() : 'อุปกรณ์ส่องสว่าง',
      brand: (colMap['brand'] !== undefined && cells[colMap['brand']]) ? cells[colMap['brand']].trim() : 'NO BRAND',
      condition: (colMap['condition'] !== undefined && cells[colMap['condition']]) ? cells[colMap['condition']].trim() : 'NEW',
      stock: stockVal,
      sku: rowId || `SKU-${3070000 + i}`,
      variantLabel,
      singleRowOptions,
      source: 'googlesheet'
    });
  }

  // Consolidate variants
  const consolidated: Product[] = [];
  const groupLookup = new Map<string, Product>();

  for (const item of rawRows) {
    const groupKey = item.itemGroupId ? `grp_${item.itemGroupId.toLowerCase()}` : `name_${item.name.toLowerCase()}`;

    let initialVariantOptions: any[] = [];
    if (item.singleRowOptions && item.singleRowOptions.length > 0) {
      initialVariantOptions = item.singleRowOptions.map((opt: string) => {
        let optName = opt.trim();
        let optPrice = item.price;
        let optBv = item.bv;
        if (optName.includes(':')) {
          const parts = optName.split(':');
          optName = parts[0].trim();
          const p = parseNumericPrice(parts[1]);
          if (p > 0) optPrice = p;
          if (parts[2]) {
            const b = parseNumericPrice(parts[2]);
            if (b > 0) optBv = b;
          }
        }
        return {
          name: optName,
          price: optPrice,
          bv: optBv,
          stock: item.stock,
          sku: item.sku,
          image: item.image
        };
      });
    }

    if (groupLookup.has(groupKey)) {
      const existing = groupLookup.get(groupKey)!;
      if (!existing.variantOptions || existing.variantOptions.length === 0) {
        existing.variantOptions = [{
          name: (existing as any).firstRowVariantLabel || 'รุ่นมาตรฐาน',
          price: existing.price,
          bv: existing.bv,
          stock: existing.stock,
          sku: existing.sku,
          image: existing.image
        }];
      }

      const thisVarName = item.variantLabel || `ตัวเลือก ${existing.variantOptions.length + 1}`;
      const existingIdx = existing.variantOptions.findIndex(ev => ev.name.toLowerCase() === thisVarName.toLowerCase());
      const newVarObj = {
        name: thisVarName,
        price: item.price,
        bv: item.bv,
        stock: item.stock,
        sku: item.sku,
        image: item.image
      };

      if (existingIdx === -1) existing.variantOptions.push(newVarObj);
      else existing.variantOptions[existingIdx] = newVarObj;

      existing.variantOptions.sort((a, b) => a.price - b.price);
      existing.options = existing.variantOptions.map(v => v.name);
      existing.price = existing.variantOptions[0].price;
      existing.bv = existing.variantOptions[0].bv;
    } else {
      const newProduct: any = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        bv: item.bv,
        image: item.image,
        images: item.images,
        category: item.category,
        brand: item.brand,
        condition: item.condition,
        stock: item.stock,
        sku: item.sku,
        firstRowVariantLabel: item.variantLabel,
        options: item.singleRowOptions && item.singleRowOptions.length > 0 ? item.singleRowOptions : undefined,
        variantOptions: initialVariantOptions,
        source: 'googlesheet'
      };

      if (initialVariantOptions.length > 0) {
        newProduct.options = initialVariantOptions.map(v => v.name);
        initialVariantOptions.sort((a, b) => a.price - b.price);
        newProduct.price = initialVariantOptions[0].price;
        newProduct.bv = initialVariantOptions[0].bv;
      }

      groupLookup.set(groupKey, newProduct);
      consolidated.push(newProduct);
    }
  }

  return consolidated;
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

  const headerCells = rows[0];
  const colMap: { [key: string]: number } = {};
  
  headerCells.forEach((cell, idx) => {
    const raw = cell.trim();
    const norm = raw.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (norm === 'id' || norm === 'sku' || norm === 'item_id' || norm === 'retailer_id' || raw.includes('รหัสสินค้า')) {
      if (colMap['id'] === undefined) colMap['id'] = idx;
    } else if (norm === 'item_group_id' || norm === 'group_id' || norm === 'parent_id' || norm === 'parent_sku' || raw.includes('รหัสกลุ่ม')) {
      colMap['item_group_id'] = idx;
    } else if (norm === 'title' || norm === 'name' || norm === 'product_name' || norm === 'productname' || raw.includes('ชื่อสินค้า') || raw.includes('ชื่อ')) {
      if (colMap['name'] === undefined) colMap['name'] = idx;
    } else if (norm === 'description' || norm === 'desc' || raw.includes('รายละเอียด')) {
      if (colMap['description'] === undefined) colMap['description'] = idx;
    } else if (norm === 'availability' || norm === 'status' || raw.includes('สถานะ')) {
      colMap['availability'] = idx;
    } else if (norm === 'condition' || norm === 'quality' || raw.includes('สภาพ')) {
      colMap['condition'] = idx;
    } else if (norm === 'sale_price' || norm === 'discount_price' || raw.includes('ราคาโปร') || raw.includes('ราคาลด')) {
      colMap['sale_price'] = idx;
    } else if (norm === 'price' || norm === 'regular_price' || raw.includes('ราคา')) {
      colMap['price'] = idx;
    } else if (norm === 'additional_image_link' || norm === 'additional_images' || norm === 'extra_images' || norm === 'gallery' || raw.includes('ภาพเพิ่มเติม')) {
      colMap['additional_image_link'] = idx;
    } else if (norm === 'image_link' || norm === 'image' || norm === 'img' || norm === 'photo' || raw.includes('รูปภาพ') || raw.includes('ภาพหลัก')) {
      if (colMap['image'] === undefined) colMap['image'] = idx;
    } else if (norm === 'link' || norm === 'url' || norm === 'product_link' || raw.includes('ลิงก์')) {
      colMap['link'] = idx;
    } else if (norm === 'brand' || raw.includes('แบรนด์') || raw.includes('ยี่ห้อ')) {
      colMap['brand'] = idx;
    } else if (norm === 'inventory' || norm === 'quantity_to_sell_on_facebook' || norm === 'stock' || norm === 'qty' || raw.includes('สต็อก') || raw.includes('จำนวน')) {
      colMap['stock'] = idx;
    } else if (norm === 'size' || raw.includes('ขนาด')) {
      colMap['size'] = idx;
    } else if (norm === 'color' || norm === 'colour' || raw.includes('สี')) {
      colMap['color'] = idx;
    } else if (norm === 'custom_label_0' || norm === 'custom_label0' || norm === 'bv' || norm === 'point' || norm === 'points' || raw.includes('คะแนน') || raw.includes('บีวี')) {
      colMap['bv'] = idx;
    } else if (norm.startsWith('custom_label')) {
      if (colMap['bv'] === undefined) colMap['bv'] = idx;
    } else if (norm === 'product_type' || norm === 'category' || norm === 'cat' || raw.includes('หมวดหมู่')) {
      colMap['category'] = idx;
    } else if (norm === 'google_product_category' || norm === 'fb_product_category') {
      if (colMap['category'] === undefined) colMap['category'] = idx;
    } else if (norm === 'option' || norm === 'options' || norm === 'variant' || norm === 'variants' || raw.includes('แบบ') || raw.includes('ตัวเลือก') || raw.includes('รุ่น')) {
      colMap['options'] = idx;
    }
  });

  if (colMap['name'] === undefined) colMap['name'] = 0;
  if (colMap['description'] === undefined && headerCells.length > 1) colMap['description'] = 1;
  if (colMap['price'] === undefined && headerCells.length > 2) colMap['price'] = 2;
  if (colMap['image'] === undefined && headerCells.length > 4) colMap['image'] = 4;

  const results: any[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 0 || cells.every(c => !c)) continue;

    const rawName = (cells[colMap['name']] || '').replace(/^["']|["']$/g, '').trim();
    if (!rawName || rawName.toLowerCase() === 'title' || rawName.toLowerCase() === 'name') continue;
    if (rawName.startsWith('<!DOCTYPE') || rawName.startsWith('<html') || rawName.startsWith('<head') || rawName.startsWith('<body') || rawName.startsWith('<style')) continue;

    const priceVal = colMap['price'] !== undefined ? parseNumericPrice(cells[colMap['price']]) : 0;
    if (priceVal <= 0) continue;

    const salePriceVal = colMap['sale_price'] !== undefined ? parseNumericPrice(cells[colMap['sale_price']]) : 0;

    let bvVal = 0;
    if (colMap['bv'] !== undefined && cells[colMap['bv']]) {
      bvVal = parseNumericPrice(cells[colMap['bv']]);
    }
    if (bvVal <= 0 && priceVal > 0) {
      bvVal = Math.round(priceVal * 0.1);
    }

    let stockVal = 99;
    if (colMap['stock'] !== undefined && cells[colMap['stock']]) {
      const parsedStock = parseInt(String(cells[colMap['stock']]).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedStock)) stockVal = parsedStock;
    }
    if (colMap['availability'] !== undefined && cells[colMap['availability']]) {
      const avail = cells[colMap['availability']].toLowerCase().trim();
      if (avail === 'out of stock' || avail === 'outofstock' || avail === 'หมด') {
        stockVal = 0;
      }
    }

    let conditionVal = 'NEW';
    if (colMap['condition'] !== undefined && cells[colMap['condition']]) {
      const rawCond = cells[colMap['condition']].replace(/^["']|["']$/g, '').trim();
      const lowerCond = rawCond.toLowerCase();
      if (lowerCond === 'new') conditionVal = 'NEW';
      else if (lowerCond === 'refurbished') conditionVal = 'Refurbished (มือสองสภาพดีเยี่ยม)';
      else if (lowerCond === 'used' || lowerCond === 'used_good') conditionVal = 'Used (มือสองสภาพดี)';
      else if (lowerCond === 'used_like_new') conditionVal = 'Used Like New (มือสองสภาพเหมือนใหม่)';
      else if (lowerCond === 'used_fair') conditionVal = 'Used Fair (มือสองสภาพพอใช้)';
      else if (rawCond) conditionVal = rawCond;
    }

    const primaryImg = (colMap['image'] !== undefined && cells[colMap['image']])
      ? cells[colMap['image']].replace(/^["']|["']$/g, '').trim()
      : 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80';

    const additionalImgsRaw = (colMap['additional_image_link'] !== undefined && cells[colMap['additional_image_link']])
      ? cells[colMap['additional_image_link']].replace(/^["']|["']$/g, '').trim()
      : '';

    const allImgs: string[] = [];
    if (primaryImg && primaryImg.startsWith('http')) {
      const splitPrimary = primaryImg.split(/[\n,\|\s]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
      splitPrimary.forEach(u => { if (!allImgs.includes(u)) allImgs.push(u); });
    }
    if (additionalImgsRaw) {
      const splitAdditional = additionalImgsRaw.split(/[\n,\|\s]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
      splitAdditional.forEach(u => { if (!allImgs.includes(u)) allImgs.push(u); });
    }
    if (allImgs.length === 0) allImgs.push(primaryImg);

    const rowId = (colMap['id'] !== undefined && cells[colMap['id']]) ? cells[colMap['id']].replace(/^["']|["']$/g, '').trim() : '';
    const itemGroupId = (colMap['item_group_id'] !== undefined && cells[colMap['item_group_id']]) ? cells[colMap['item_group_id']].replace(/^["']|["']$/g, '').trim() : '';
    const sizeVal = (colMap['size'] !== undefined && cells[colMap['size']]) ? cells[colMap['size']].replace(/^["']|["']$/g, '').trim() : '';
    const colorVal = (colMap['color'] !== undefined && cells[colMap['color']]) ? cells[colMap['color']].replace(/^["']|["']$/g, '').trim() : '';

    let singleRowOptions: string[] | undefined = undefined;
    if (colMap['options'] !== undefined && cells[colMap['options']]) {
      const rawOpt = cells[colMap['options']].replace(/^["']|["']$/g, '').trim();
      if (rawOpt) {
        singleRowOptions = rawOpt.split(/[,|/]/).map(s => s.trim()).filter(Boolean);
      }
    }

    let variantLabel = '';
    if (sizeVal && colorVal) variantLabel = `${sizeVal} / ${colorVal}`;
    else if (sizeVal) variantLabel = sizeVal;
    else if (colorVal) variantLabel = colorVal;

    results.push({
      id: rowId || `sheet-prod-${i}`,
      itemGroupId,
      name: rawName,
      description: (colMap['description'] !== undefined && cells[colMap['description']]) ? cells[colMap['description']].replace(/^["']|["']$/g, '').trim() : 'สินค้าคุณภาพพร้อมจัดส่ง',
      price: priceVal,
      salePrice: salePriceVal > 0 ? salePriceVal : undefined,
      bv: bvVal,
      image: allImgs[0] || primaryImg,
      images: allImgs,
      category: (colMap['category'] !== undefined && cells[colMap['category']]) ? cells[colMap['category']].replace(/^["']|["']$/g, '').trim() : 'อุปกรณ์ส่องสว่าง',
      brand: (colMap['brand'] !== undefined && cells[colMap['brand']]) ? cells[colMap['brand']].replace(/^["']|["']$/g, '').trim() : 'NO BRAND',
      condition: conditionVal,
      stock: stockVal,
      options: singleRowOptions,
      sku: rowId || `SKU-${3070000 + i}`,
      variantLabel,
      singleRowOptions,
      source: 'googlesheet'
    });
  }

  // Automatic Consolidation: Group by item_group_id (Facebook standard) or product name
  const consolidated: Product[] = [];
  const groupLookup = new Map<string, Product>();

  for (const item of results) {
    const groupKey = item.itemGroupId 
      ? `grp_${item.itemGroupId.trim().toLowerCase()}`
      : `name_${item.name.trim().toLowerCase()}`;

    // Prepare item's variantOptions if options exist
    if (item.options && item.options.length > 0) {
      item.variantOptions = item.options.map((opt: string) => {
        let optName = opt.trim();
        let optPrice = item.price;
        let optBv = item.bv;
        if (optName.includes(':')) {
          const parts = optName.split(':');
          optName = parts[0].trim();
          const p = parseFloat(parts[1]);
          if (!isNaN(p) && p > 0) optPrice = p;
          if (parts[2]) {
            const b = parseFloat(parts[2]);
            if (!isNaN(b)) optBv = b;
          }
        }
        return {
          name: optName,
          price: optPrice,
          bv: optBv,
          stock: item.stock,
          sku: item.sku,
          image: item.image
        };
      });
      item.options = item.variantOptions.map((v) => v.name);
    } else {
      item.variantOptions = [];
    }

    if (groupLookup.has(groupKey)) {
      const existing = groupLookup.get(groupKey)!;

      if (!existing.variantOptions || existing.variantOptions.length === 0) {
        existing.variantOptions = [{
          name: (existing as any).firstRowVariantLabel || "รุ่นมาตรฐาน",
          price: existing.price,
          bv: existing.bv,
          stock: existing.stock,
          sku: existing.sku,
          image: existing.image
        }];
      }

      const thisVarName = item.variantLabel || (item.id && item.id !== existing.id ? item.id : "ตัวเลือก " + (existing.variantOptions.length + 1));
      const existingIdx = existing.variantOptions.findIndex(
        (ev) => ev.name.toLowerCase() === thisVarName.toLowerCase()
      );

      const newVarObj = {
        name: thisVarName,
        price: item.price,
        bv: item.bv,
        stock: item.stock,
        sku: item.sku,
        image: item.image
      };

      if (existingIdx === -1) {
        existing.variantOptions.push(newVarObj);
      } else {
        existing.variantOptions[existingIdx] = newVarObj;
      }

      const existingImgs = existing.images || (existing.image ? [existing.image] : []);
      const itemImgs = item.images || (item.image ? [item.image] : []);
      for (const img of itemImgs) {
        if (!existingImgs.includes(img)) existingImgs.push(img);
      }
      existing.images = existingImgs;
      existing.image = existingImgs[0] || existing.image;

      existing.variantOptions.sort((a, b) => a.price - b.price);
      existing.options = existing.variantOptions.map((v) => v.name);
      existing.price = existing.variantOptions[0].price;
      existing.bv = existing.variantOptions[0].bv;

    } else {
      const newProduct: any = {
        id: item.id,
        itemGroupId: item.itemGroupId,
        name: item.name,
        description: item.description,
        price: item.price,
        salePrice: item.salePrice,
        bv: item.bv,
        image: item.image,
        images: item.images,
        category: item.category,
        brand: item.brand,
        condition: item.condition,
        stock: item.stock,
        sku: item.sku,
        firstRowVariantLabel: item.variantLabel,
        options: item.singleRowOptions && item.singleRowOptions.length > 0 ? item.singleRowOptions : undefined,
        variantOptions: item.variantOptions || [],
        source: "googlesheet"
      };

      if (newProduct.variantOptions && newProduct.variantOptions.length > 0) {
        newProduct.options = newProduct.variantOptions.map((v) => v.name);
        newProduct.variantOptions.sort((a, b) => a.price - b.price);
        newProduct.price = newProduct.variantOptions[0].price;
        newProduct.bv = newProduct.variantOptions[0].bv;
      }

      groupLookup.set(groupKey, newProduct);
      consolidated.push(newProduct);
    }
  }

  return consolidated;
};
