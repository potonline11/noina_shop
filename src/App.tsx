/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Member, Order, CommissionLog } from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_ORDERS, 
  INITIAL_COMMISSIONS 
} from './data/mockData';
import { parseCSV, DEMO_SPREADSHEET_DATA, DEFAULT_SHEET_URL, getCleanSheetUrl, parseSheetData } from './utils/sheetParser';

// Subcomponents and Views
import Navbar from './components/Navbar';
import AIChatWidget from './components/AIChatWidget';
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

  // Global Products State (loaded from local storage or default Google Sheet csv)
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('noina_products');
    if (cached) {
      const parsed = JSON.parse(cached) as Product[];
      // Keep only products with source 'googlesheet' to ensure database products are not displayed
      const sheetOnly = parsed.filter(p => p.source === 'googlesheet');
      if (sheetOnly.length > 0) {
        return sheetOnly;
      }
    }
    return parseCSV(DEMO_SPREADSHEET_DATA);
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

  // Auto-sync with Google Sheet on startup
  useEffect(() => {
    const autoSyncFromSheet = async () => {
      try {
        const savedUrl = localStorage.getItem('noina_sheet_url') || DEFAULT_SHEET_URL;
        const cleanUrl = getCleanSheetUrl(savedUrl);
        if (cleanUrl && cleanUrl.startsWith('http') && !cleanUrl.includes('_example')) {
          const res = await fetch(cleanUrl);
          if (res.ok) {
            const text = await res.text();
            const sheetProds = parseSheetData(text);
            if (sheetProds.length > 0) {
              setProducts(sheetProds);
            }
          }
        }
      } catch (err) {
        console.warn('Auto-sync on startup failed, using cached/demo sheet products:', err);
      }
    };
    autoSyncFromSheet();
  }, []);

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

  // Shopping Cart States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const cached = localStorage.getItem('noina_cart');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem('noina_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += qty;
        return updated;
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: qty } : item));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // NLM Purchase Checkout & BV flow simulation!
  const handlePurchase = (items: { product: Product; quantity: number }[], registrationDetails?: any) => {
    if (items.length === 0) return;
    
    const baseAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingFee = 50; // flat 50 Baht
    let codFee = 0;
    
    if (registrationDetails && registrationDetails.paymentMethod === 'cod') {
      codFee = Math.round(baseAmount * 0.03);
    }
    const totalAmount = baseAmount + shippingFee + codFee;
    const totalBV = items.reduce((sum, item) => sum + item.product.bv * item.quantity, 0);
    
    const orderId = registrationDetails?.orderId || `ORD-${Date.now().toString().slice(-4)}`;
    
    const newOrder: Order = {
      id: orderId,
      memberId: currentUser ? currentUser.id : 'GUEST',
      memberName: registrationDetails 
        ? `${registrationDetails.firstName} ${registrationDetails.lastName}` 
        : (currentUser ? currentUser.name : 'ลูกค้ารายย่อย (Guest)'),
      items: items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        bv: item.product.bv,
        quantity: item.quantity
      })),
      totalAmount: totalAmount,
      totalBV: totalBV,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
      firstName: registrationDetails?.firstName || '',
      lastName: registrationDetails?.lastName || '',
      phone: registrationDetails?.phone || '',
      email: registrationDetails?.email || '',
      address: registrationDetails?.address || '',
      paymentMethod: registrationDetails?.paymentMethod || 'cash',
      codFee: codFee,
      slipUrl: registrationDetails?.slipUrl || ''
    };

    setOrders(prev => [newOrder, ...prev]);

    // Automatically POST to Google Sheets Webhook URL if saved by the admin in localStorage
    const webhookUrl = localStorage.getItem('noina_order_webhook_url');
    if (webhookUrl && webhookUrl.startsWith('http')) {
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newOrder,
          firstName: registrationDetails?.firstName || '',
          lastName: registrationDetails?.lastName || '',
          sponsorId: currentUser ? currentUser.id : `NS${Math.floor(1000 + Math.random() * 9000)}`
        })
      }).then(() => {
        console.log('Successfully posted order to Google Sheet script webhook:', webhookUrl);
      }).catch(err => {
        console.warn('Post to Google Sheet script webhook failed:', err);
      });
    }

    // Clear cart upon successful purchase
    setCart([]);

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
        
        const itemsSummary = items.map(item => item.product.name).join(', ');
        const newLog: CommissionLog = {
          id: `COM-${Date.now().toString().slice(-4)}`,
          memberId: currentUser.sponsorId,
          type: 'sponsor_bonus',
          amount: sponsorBonusAmount,
          bvReference: totalBV,
          description: `ค่าแนะนำแนะนำ ${currentUser.name} (${currentUser.id}) สั่งซื้อ ${itemsSummary.length > 30 ? itemsSummary.slice(0, 30) + '...' : itemsSummary}`,
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

  // Admin Google Sheet sync callback (replaces entirely)
  const handleSyncProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
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
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCurrentView('products')}
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
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onClearCart={handleClearCart}
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

      {/* Floating AI Chat support widget */}
      <AIChatWidget products={products} />

    </div>
  );
}
