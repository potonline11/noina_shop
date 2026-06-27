/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Member, Order, CommissionLog } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'iPhone 13 Pro 256GB (มือสอง)',
    description: 'สภาพ 98% สุขภาพแบตเตอรี่ 88% อุปกรณ์ครบกล่อง เครื่องศูนย์ไทย ไร้รอยตกหล่น การใช้งานปกติ 100%',
    price: 18900,
    bv: 1800,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=600&q=80',
    category: 'smartphone',
    brand: 'Apple',
    condition: '98% สภาพนางฟ้า',
    stock: 5,
    source: 'local'
  },
  {
    id: 'prod-002',
    name: 'MacBook Air M1 RAM 8GB SSD 256GB (มือสอง)',
    description: 'สภาพ 95% สี Space Gray รอบชาร์จน้อย คีย์บอร์ดไทย-อังกฤษ อุปกรณ์ชาร์จแท้ ประสิทธิภาพดีเยี่ยม น้ำหนักเบา',
    price: 21900,
    bv: 2200,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    category: 'notebook',
    brand: 'Apple',
    condition: '95% สภาพดีมาก',
    stock: 3,
    source: 'local'
  },
  {
    id: 'prod-003',
    name: 'Samsung Galaxy S22 Ultra 5G 256GB (มือสอง)',
    description: 'สภาพ 97% สี Phantom Black มีปากกา S-Pen ซูม 100 เท่าปกติ หน้าจอติดฟิล์มกันรอยแล้ว มีรอยเคสกัดเล็กน้อย',
    price: 16500,
    bv: 1600,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    category: 'smartphone',
    brand: 'Samsung',
    condition: '97% สภาพสวยงาม',
    stock: 4,
    source: 'local'
  },
  {
    id: 'prod-004',
    name: 'iPad Pro 11-inch M1 Wi-Fi 128GB (มือสอง)',
    description: 'สภาพ 99% เหมือนใหม่ ไร้ริ้วรอย จอสวย ลำโพง 4 ตัวเสียงดังฟังชัด รองรับ Apple Pencil Gen 2',
    price: 19900,
    bv: 2000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    category: 'tablet',
    brand: 'Apple',
    condition: '99% สภาพเหมือนใหม่',
    stock: 2,
    source: 'local'
  },
  {
    id: 'prod-005',
    name: 'Asus ROG Zephyrus G14 Ryzen 7 RAM 16GB (มือสอง)',
    description: 'โน๊ตบุ๊คเกมมิ่งสุดบางเบา สภาพ 93% การ์ดจอ GTX 1660Ti หน้าจอ 120Hz เล่นเกมลื่นไหล ทำงานตัดต่อสบาย',
    price: 17900,
    bv: 1700,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    category: 'notebook',
    brand: 'Asus',
    condition: '93% สภาพพร้อมใช้งาน',
    stock: 2,
    source: 'local'
  },
  {
    id: 'prod-006',
    name: 'AirPods Pro Gen 2 (มือสอง)',
    description: 'สภาพ 96% เคสชาร์จมีรอยขนแมวบางๆ ระบบตัดเสียงรบกวน (ANC) ใช้งานได้ปกติ อุปกรณ์ครบกล่อง จุกหูฟังสำรองครบ',
    price: 4900,
    bv: 500,
    image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&w=600&q=80',
    category: 'accessory',
    brand: 'Apple',
    condition: '96% สภาพสวย',
    stock: 8,
    source: 'local'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'NS001',
    name: 'อนันต์ ยอดดี',
    email: 'anan@noinashop.com',
    phone: '081-234-5678',
    sponsorId: null,
    parentUserId: null,
    position: null,
    leftChildId: 'NS002',
    rightChildId: 'NS003',
    rank: 'Platinum',
    leftBV: 4500,
    rightBV: 6200,
    totalLeftBV: 24500,
    totalRightBV: 28200,
    totalDirectBV: 8000,
    walletBalance: 32400,
    dateJoined: '2026-01-10',
    status: 'active',
    role: 'admin'
  },
  {
    id: 'NS002',
    name: 'สมชาย ใจมั่น',
    email: 'somchai@gmail.com',
    phone: '082-345-6789',
    sponsorId: 'NS001',
    parentUserId: 'NS001',
    position: 'left',
    leftChildId: 'NS004',
    rightChildId: 'NS005',
    rank: 'Gold',
    leftBV: 1800,
    rightBV: 2200,
    totalLeftBV: 12800,
    totalRightBV: 14200,
    totalDirectBV: 4200,
    walletBalance: 15400,
    dateJoined: '2026-02-15',
    status: 'active',
    role: 'member'
  },
  {
    id: 'NS003',
    name: 'รุ่งเรือง ก้าวหน้า',
    email: 'rungruang@gmail.com',
    phone: '083-456-7890',
    sponsorId: 'NS001',
    parentUserId: 'NS001',
    position: 'right',
    leftChildId: 'NS006',
    rightChildId: 'NS007',
    rank: 'Gold',
    leftBV: 3000,
    rightBV: 1500,
    totalLeftBV: 15500,
    totalRightBV: 10800,
    totalDirectBV: 5000,
    walletBalance: 12800,
    dateJoined: '2026-02-20',
    status: 'active',
    role: 'member'
  },
  {
    id: 'NS004',
    name: 'วิภา รักษ์ดี',
    email: 'wipa@gmail.com',
    phone: '084-567-8901',
    sponsorId: 'NS002',
    parentUserId: 'NS002',
    position: 'left',
    leftChildId: null,
    rightChildId: null,
    rank: 'Silver',
    leftBV: 0,
    rightBV: 0,
    totalLeftBV: 4500,
    totalRightBV: 3800,
    totalDirectBV: 1800,
    walletBalance: 4800,
    dateJoined: '2026-03-01',
    status: 'active',
    role: 'member'
  },
  {
    id: 'NS005',
    name: 'มานะ ตั้งใจ',
    email: 'mana@gmail.com',
    phone: '085-678-9012',
    sponsorId: 'NS002',
    parentUserId: 'NS002',
    position: 'right',
    leftChildId: null,
    rightChildId: null,
    rank: 'Silver',
    leftBV: 0,
    rightBV: 0,
    totalLeftBV: 3000,
    totalRightBV: 4000,
    totalDirectBV: 2200,
    walletBalance: 5100,
    dateJoined: '2026-03-05',
    status: 'active',
    role: 'member'
  },
  {
    id: 'NS006',
    name: 'กิตติพงษ์ แสนดี',
    email: 'kittipong@gmail.com',
    phone: '086-789-0123',
    sponsorId: 'NS003',
    parentUserId: 'NS003',
    position: 'left',
    leftChildId: null,
    rightChildId: null,
    rank: 'Bronze',
    leftBV: 0,
    rightBV: 0,
    totalLeftBV: 0,
    totalRightBV: 0,
    totalDirectBV: 0,
    walletBalance: 1200,
    dateJoined: '2026-03-12',
    status: 'active',
    role: 'member'
  },
  {
    id: 'NS007',
    name: 'สุภาพร สุขใจ',
    email: 'supaporn@gmail.com',
    phone: '087-890-1234',
    sponsorId: 'NS003',
    parentUserId: 'NS003',
    position: 'right',
    leftChildId: null,
    rightChildId: null,
    rank: 'Bronze',
    leftBV: 0,
    rightBV: 0,
    totalLeftBV: 0,
    totalRightBV: 0,
    totalDirectBV: 0,
    walletBalance: 800,
    dateJoined: '2026-03-18',
    status: 'active',
    role: 'member'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    memberId: 'NS002',
    memberName: 'สมชาย ใจมั่น',
    items: [
      {
        productId: 'prod-001',
        name: 'iPhone 13 Pro 256GB (มือสอง)',
        price: 18900,
        bv: 1800,
        quantity: 1
      }
    ],
    totalAmount: 18900,
    totalBV: 1800,
    date: '2026-06-10 14:30',
    status: 'completed'
  },
  {
    id: 'ORD-1002',
    memberId: 'NS003',
    memberName: 'รุ่งเรือง ก้าวหน้า',
    items: [
      {
        productId: 'prod-002',
        name: 'MacBook Air M1 RAM 8GB SSD 256GB (มือสอง)',
        price: 21900,
        bv: 2200,
        quantity: 1
      }
    ],
    totalAmount: 21900,
    totalBV: 2200,
    date: '2026-06-12 11:15',
    status: 'completed'
  },
  {
    id: 'ORD-1003',
    memberId: 'NS004',
    memberName: 'วิภา รักษ์ดี',
    items: [
      {
        productId: 'prod-006',
        name: 'AirPods Pro Gen 2 (มือสอง)',
        price: 4900,
        bv: 500,
        quantity: 1
      }
    ],
    totalAmount: 4900,
    totalBV: 500,
    date: '2026-06-20 16:45',
    status: 'completed'
  }
];

export const INITIAL_COMMISSIONS: CommissionLog[] = [
  {
    id: 'COM-001',
    memberId: 'NS001',
    type: 'sponsor_bonus',
    amount: 1800,
    bvReference: 1800,
    description: 'ค่าแนะนำ สมชาย ใจมั่น ซื้อ iPhone 13 Pro',
    date: '2026-06-10 14:30'
  },
  {
    id: 'COM-002',
    memberId: 'NS001',
    type: 'matching_bonus',
    amount: 3600,
    bvReference: 4500,
    description: 'โบนัสจับคู่บาลานซ์ซ้าย-ขวา ประจำรอบสัปดาห์',
    date: '2026-06-15 00:00'
  },
  {
    id: 'COM-003',
    memberId: 'NS002',
    type: 'sponsor_bonus',
    amount: 500,
    bvReference: 500,
    description: 'ค่าแนะนำ วิภา รักษ์ดี ซื้อ AirPods Pro Gen 2',
    date: '2026-06-20 16:45'
  }
];

export const MARKETING_PLAN_STEPS = [
  {
    title: '1. โบนัสค่าแนะนำตรง (Sponsor Bonus)',
    desc: 'รับโบนัสค่าแนะนำสูงถึง 100% ของคะแนน BV จากยอดการซื้อสินค้าของสมาชิกที่คุณแนะนำโดยตรง เพื่อช่วยส่งเสริมการสร้างทีมที่แข็งแกร่ง',
    example: 'หากผู้แนะนำมีระดับ Bronze แนะนำตรงซื้อสินค้า 1,000 BV ได้รับโบนัส 1,000 บาท'
  },
  {
    title: '2. โบนัสจับคู่จ่ายสายงาน (Binary Matching Bonus)',
    desc: 'คำนวณโบนัสจับคู่จากขาล่างและขาบน โดยจ่ายสูงถึง 40% - 60% ของทีมข้างที่คะแนนน้อยกว่า (Weak Side) ตามตำแหน่งทางธุรกิจของคุณ',
    example: 'ข้างซ้ายมี 10,000 BV ข้างขวามี 15,000 BV จับคู่จ่าย 10,000 BV คิดที่ 50% รับทันที 5,000 บาท คะแนนฝั่งแข็งเก็บไว้รอบถัดไป'
  },
  {
    title: '3. โบนัสผู้บริหารองค์กร (Leadership Matching / Pool Bonus)',
    desc: 'สิทธิพิเศษสำหรับผู้ขึ้นตำแหน่งเกียรติยศระดับ Gold ขึ้นไป รับส่วนแบ่งยอดขาย All Sale ทั่วโลกของบริษัท 2% - 5%',
    example: 'เมื่อทำคุณสมบัติครบ รับสัดส่วนรายไตรมาสหรือรายปี แบ่งตามสัดส่วนความสำเร็จ'
  }
];

export const MEMBERSHIP_RANKS = [
  { name: 'Bronze', minBV: 0, benefit: 'โบนัสแนะนำ 100% | จับคู่จ่าย 40%' },
  { name: 'Silver', minBV: 1500, benefit: 'โบนัสแนะนำ 100% | จับคู่จ่าย 50% | แมทชิ่ง 1 ชั้น' },
  { name: 'Gold', minBV: 3000, benefit: 'โบนัสแนะนำ 100% | จับคู่จ่าย 60% | แมทชิ่ง 2 ชั้น | ยอดขาย All Sale 2%' },
  { name: 'Platinum', minBV: 6000, benefit: 'โบนัสแนะนำ 100% | จับคู่จ่าย 60% | แมทชิ่ง 3 ชั้น | ยอดขาย All Sale 3%' },
  { name: 'Diamond', minBV: 12000, benefit: 'โบนัสแนะนำ 100% | จับคู่จ่าย 60% | แมทชิ่ง 4 ชั้น | ยอดขาย All Sale 5%' }
];
