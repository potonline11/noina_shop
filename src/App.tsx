/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Member, Order, CommissionLog } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_MEMBERS, 
  INITIAL_ORDERS, 
  INITIAL_COMMISSIONS 
} from './data/mockData';

// Subcomponents and Views
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './views/HomeView';
import AboutView from './views/AboutView';
import ProductsView from './views/ProductsView';
import MarketingView from './views/MarketingView';
import ContactView from './views/ContactView';
import RegisterView from './views/RegisterView';
import LoginView from './views/LoginView';
import MemberPortal from './views/MemberPortal';
import AdminPortal from './views/AdminPortal';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<string>('home');
  
  // Auth Session State
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const cached = sessionStorage.getItem('noina_current_user');
    return cached ? JSON.parse(cached) : null;
  });

  // Global Products State (loaded from local storage or mock)
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('noina_products');
    return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
  });

  // Global MLM Members State
  const [members, setMembers] = useState<Member[]>(() => {
    const cached = localStorage.getItem('noina_members');
    return cached ? JSON.parse(cached) : INITIAL_MEMBERS;
  });

  // Global Orders History
  const [orders, setOrders] = useState<Order[]>(() => {
    const cached = localStorage.getItem('noina_orders');
    return cached ? JSON.parse(cached) : INITIAL_ORDERS;
  });

  // Global Commission Logs
  const [commissionLogs, setCommissionLogs] = useState<CommissionLog[]>(() => {
    const cached = localStorage.getItem('noina_commissions');
    return cached ? JSON.parse(cached) : INITIAL_COMMISSIONS;
  });

  // State Persistence syncs
  useEffect(() => {
    localStorage.setItem('noina_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('noina_members', JSON.stringify(members));
    
    // Keep session current user up to date if they are in members list
    if (currentUser) {
      const updatedUser = members.find(m => m.id === currentUser.id);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        sessionStorage.setItem('noina_current_user', JSON.stringify(updatedUser));
      }
    }
  }, [members]);

  useEffect(() => {
    localStorage.setItem('noina_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('noina_commissions', JSON.stringify(commissionLogs));
  }, [commissionLogs]);

  // Auth Operations
  const handleLoginSuccess = (user: Member) => {
    setCurrentUser(user);
    sessionStorage.setItem('noina_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('noina_current_user');
    setCurrentView('home');
  };

  // NLM Registration Logic (adds to tree structures!)
  const handleRegister = (newMember: Member) => {
    setMembers(prevMembers => {
      const updated = prevMembers.map(m => {
        // Update the parent's child pointer
        if (m.id === newMember.parentUserId) {
          if (newMember.position === 'left') {
            return { ...m, leftChildId: newMember.id };
          } else if (newMember.position === 'right') {
            return { ...m, rightChildId: newMember.id };
          }
        }
        return m;
      });
      return [...updated, newMember];
    });
  };

  // NLM Purchase Checkout & BV flow simulation!
  const handlePurchase = (product: Product, quantity: number) => {
    const totalAmount = product.price * quantity;
    const totalBV = product.bv * quantity;
    
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      memberId: currentUser ? currentUser.id : 'GUEST',
      memberName: currentUser ? currentUser.name : 'ลูกค้ารายย่อย (Guest)',
      items: [
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          bv: product.bv,
          quantity: quantity
        }
      ],
      totalAmount: totalAmount,
      totalBV: totalBV,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed'
    };

    setOrders(prev => [newOrder, ...prev]);

    // If user is logged in, distribute BV and award commissions!
    if (currentUser) {
      setMembers(prevMembers => {
        const tempMembers = [...prevMembers];
        
        // 1. Update buyer's personal direct BV (increasing rank potential)
        const buyerIdx = tempMembers.findIndex(m => m.id === currentUser.id);
        if (buyerIdx !== -1) {
          tempMembers[buyerIdx].totalDirectBV += totalBV;
          
          // Auto rank upgrade check
          const totalAccum = tempMembers[buyerIdx].totalDirectBV;
          if (totalAccum >= 12000) tempMembers[buyerIdx].rank = 'Diamond';
          else if (totalAccum >= 6000) tempMembers[buyerIdx].rank = 'Platinum';
          else if (totalAccum >= 3000) tempMembers[buyerIdx].rank = 'Gold';
          else if (totalAccum >= 1500) tempMembers[buyerIdx].rank = 'Silver';
        }

        // 2. Traversal Flow: Accumulate left/right BV to all upline parent nodes!
        let currentId = currentUser.id;
        let currentPosition = currentUser.position; // 'left' | 'right'
        let currentParentId = currentUser.parentUserId;

        while (currentParentId) {
          const parentIdx = tempMembers.findIndex(m => m.id === currentParentId);
          if (parentIdx === -1) break;

          const parent = tempMembers[parentIdx];
          if (currentPosition === 'left') {
            parent.leftBV += totalBV;
            parent.totalLeftBV += totalBV;
          } else if (currentPosition === 'right') {
            parent.rightBV += totalBV;
            parent.totalRightBV += totalBV;
          }

          // Traverse further up the lineage tree
          currentId = parent.id;
          currentPosition = parent.position;
          currentParentId = parent.parentUserId;
        }

        return tempMembers;
      });

      // 3. Award Direct Sponsor Bonus (100% of BV in Baht for demonstration)
      if (currentUser.sponsorId) {
        const sponsorBonusAmount = totalBV; // 1 Baht per 1 BV
        
        const newLog: CommissionLog = {
          id: `COM-${Date.now().toString().slice(-4)}`,
          memberId: currentUser.sponsorId,
          type: 'sponsor_bonus',
          amount: sponsorBonusAmount,
          bvReference: totalBV,
          description: `ค่าแนะนำแนะนำ ${currentUser.name} (${currentUser.id}) สั่งซื้อ ${product.name}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };

        setCommissionLogs(prev => [newLog, ...prev]);

        // Award money directly to sponsor's wallet
        setMembers(prevMembers => {
          return prevMembers.map(m => {
            if (m.id === currentUser.sponsorId) {
              return { ...m, walletBalance: m.walletBalance + sponsorBonusAmount };
            }
            return m;
          });
        });
      }
    }
  };

  // Admin Google Sheet sync callback (merges or replaces)
  const handleSyncProducts = (newProducts: Product[]) => {
    setProducts(prev => {
      // Filter out existing google sheet products to avoid duplication
      const localsOnly = prev.filter(p => p.source !== 'googlesheet');
      return [...localsOnly, ...newProducts];
    });
  };

  // Admin Inventory Controls
  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-root">
      
      {/* Universal header navigation */}
      <Navbar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        currentUser={currentUser} 
        onLogout={handleLogout}
      />

      {/* Main viewport area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8 md:py-12 w-full">
        {currentView === 'home' && (
          <HomeView 
            onNavigate={setCurrentView} 
            featuredProducts={products} 
          />
        )}

        {currentView === 'about' && (
          <AboutView />
        )}

        {currentView === 'products' && (
          <ProductsView 
            products={products} 
            currentUser={currentUser} 
            onPurchase={handlePurchase} 
          />
        )}

        {currentView === 'marketing' && (
          <MarketingView />
        )}

        {currentView === 'contact' && (
          <ContactView />
        )}

        {currentView === 'register' && (
          <RegisterView 
            members={members} 
            onRegister={handleRegister} 
            onNavigate={setCurrentView} 
          />
        )}

        {currentView === 'login' && (
          <LoginView 
            members={members} 
            onLoginSuccess={handleLoginSuccess} 
            onNavigate={setCurrentView} 
          />
        )}

        {currentView === 'member-portal' && currentUser && (
          <MemberPortal 
            currentUser={currentUser} 
            members={members} 
            orders={orders} 
            commissionLogs={commissionLogs} 
            onLogout={handleLogout}
          />
        )}

        {currentView === 'admin-portal' && currentUser && currentUser.role === 'admin' && (
          <AdminPortal 
            currentUser={currentUser} 
            members={members} 
            products={products} 
            orders={orders} 
            commissionLogs={commissionLogs} 
            onSyncProducts={handleSyncProducts} 
            onAddProduct={handleAddProduct} 
            onDeleteProduct={handleDeleteProduct} 
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Universal footer bar */}
      <Footer onNavigate={setCurrentView} />

    </div>
  );
}
