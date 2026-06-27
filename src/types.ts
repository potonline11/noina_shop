/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  bv: number; // Business Volume / BV Points
  image: string;
  category: 'smartphone' | 'notebook' | 'accessory' | 'tablet';
  brand: string;
  condition: string; // e.g., "95% Like New", "98% Excellent"
  stock: number;
  source?: 'local' | 'googlesheet';
}

export interface Member {
  id: string; // e.g., "NS001", "NS002"
  name: string;
  email: string;
  phone: string;
  sponsorId: string | null; // ID of the person who referred them
  parentUserId: string | null; // ID of the immediate parent in the binary tree
  position: 'left' | 'right' | null; // Position under parent
  leftChildId: string | null; // Left downline user ID
  rightChildId: string | null; // Right downline user ID
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  leftBV: number; // Current accumulative Left BV for matching calculation
  rightBV: number; // Current accumulative Right BV for matching calculation
  totalLeftBV: number; // Lifetime Left BV
  totalRightBV: number; // Lifetime Right BV
  totalDirectBV: number; // BV from direct sales
  walletBalance: number; // Calculated commission earnings (Baht)
  dateJoined: string;
  status: 'active' | 'inactive';
  role: 'member' | 'admin';
}

export interface Order {
  id: string;
  memberId: string;
  memberName: string;
  items: {
    productId: string;
    name: string;
    price: number;
    bv: number;
    quantity: number;
  }[];
  totalAmount: number;
  totalBV: number;
  date: string;
  status: 'pending' | 'completed';
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentMethod?: 'cod' | 'cash';
  codFee?: number;
  slipUrl?: string;
}

export interface CommissionLog {
  id: string;
  memberId: string;
  type: 'sponsor_bonus' | 'matching_bonus' | 'level_bonus';
  amount: number;
  bvReference: number;
  description: string;
  date: string;
}
