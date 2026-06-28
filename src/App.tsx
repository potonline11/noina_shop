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

  const [isStoreLoaded, setIsStoreLoaded] = useState(false);

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
    
    // Also save to server products-store to preserve registered users
    const saveMembersToServer = async () => {
      if (!isStoreLoaded) return; // Prevent overwriting during initial load
      try {
        await fetch('/api/products-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members })
        });
      } catch (err) {
        console.error('Failed to sync members list to server:', err);
      }
    };
    saveMembersToServer();
    
    // Keep session current user up to date if they are in members list
    if (currentUser) {
      const updatedUser = members.find(m => m.id === currentUser.id);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        sessionStorage.setItem('noina_current_user', JSON.stringify(updatedUser));
      }
    }
  }, [members, isStoreLoaded]);

  useEffect(() => {
    localStorage.setItem('noina_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('noina_commissions', JSON.stringify(commissionLogs));
  }, [commissionLogs]);

  // Load server-side synced products and configurations on startup
  useEffect(() => {
    const autoSyncFromSheet = async (urlToUse?: string) => {
      try {
        let savedUrl = urlToUse || localStorage.getItem('noina_sheet_url') || DEFAULT_SHEET_URL;
        if (savedUrl.includes('_example')) {
          savedUrl = DEFAULT_SHEET_URL;
          localStorage.setItem('noina_sheet_url', DEFAULT_SHEET_URL);
        }
        const cleanUrl = getCleanSheetUrl(savedUrl);
        if (cleanUrl && cleanUrl.startsWith('http')) {
          const res = await fetch(cleanUrl);
          if (res.ok) {
            const text = await res.text();
            const sheetProds = parseSheetData(text);
            if (sheetProds.length > 0) {
              setProducts(sheetProds);
              localStorage.setItem('noina_products', JSON.stringify(sheetProds));
              // Save to server so Gemini AI chat has access to the correct products list
              await fetch('/api/products-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: sheetProds, sheetUrl: savedUrl })
              });
              return;
            }
          }
        }
        
        // Fallback to locally cached products if any
        const cached = localStorage.getItem('noina_products');
        if (cached) {
          setProducts(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('Auto-sync on startup failed, using cached products:', err);
        const cached = localStorage.getItem('noina_products');
        if (cached) {
          setProducts(JSON.parse(cached));
        }
      }
    };

    const loadServerStore = async () => {
      try {
        const response = await fetch('/api/products-store');
        let serverSheetUrl = '';
        let serverWebhookUrl = '';
        let gotProductsFromServer = false;
        
        if (response.ok) {
          const data = await response.json();
          if (data.members && data.members.length > 0) {
            setMembers(data.members);
            localStorage.setItem('noina_members', JSON.stringify(data.members));
          }
          if (data.sheetUrl) {
            serverSheetUrl = data.sheetUrl;
            localStorage.setItem('noina_sheet_url', data.sheetUrl);
          }
          if (data.webhookUrl) {
            serverWebhookUrl = data.webhookUrl;
            localStorage.setItem('noina_order_webhook_url', data.webhookUrl);
          }
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
            localStorage.setItem('noina_products', JSON.stringify(data.products));
            gotProductsFromServer = true;
          }
        }

        // Auto-uplink: If the server has no sheetUrl but the browser has a custom one,
        // send it to the server so it is persisted for all subsequent users.
        let clientSheetUrl = localStorage.getItem('noina_sheet_url') || '';
        if (clientSheetUrl.includes('_example')) {
          clientSheetUrl = DEFAULT_SHEET_URL;
          localStorage.setItem('noina_sheet_url', DEFAULT_SHEET_URL);
        }
        const clientWebhookUrl = localStorage.getItem('noina_order_webhook_url') || '';
        
        let urlToUse = serverSheetUrl;
        if (!urlToUse || urlToUse.includes('_example')) {
          urlToUse = DEFAULT_SHEET_URL;
        }
        
        if ((!serverSheetUrl || serverSheetUrl.includes('_example')) && clientSheetUrl && clientSheetUrl.startsWith('http')) {
          urlToUse = clientSheetUrl;
          console.log('Auto-uplinking sheet URL to server:', clientSheetUrl);
          try {
            await fetch('/api/products-store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sheetUrl: clientSheetUrl })
            });
          } catch (e) {
            console.warn('Failed to uplink sheetUrl to server:', e);
          }
        }
        
        if (!serverWebhookUrl && clientWebhookUrl && clientWebhookUrl.startsWith('http')) {
          console.log('Auto-uplinking webhook URL to server:', clientWebhookUrl);
          try {
            await fetch('/api/products-store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webhookUrl: clientWebhookUrl })
            });
          } catch (e) {
            console.warn('Failed to uplink webhookUrl to server:', e);
          }
        }

        // Always sync in the background if there is a custom Google Sheet URL.
        // This ensures the products list is automatically and silently updated in the background
        // on every visit/refresh, without the user ever needing to go to the admin panel!
        if (urlToUse && urlToUse.startsWith('http')) {
          console.log('Background auto-syncing from custom Google Sheet URL:', urlToUse);
          autoSyncFromSheet(urlToUse).catch(err => {
            console.warn('Background sheet auto-sync failed:', err);
          });
        } else if (!gotProductsFromServer) {
          await autoSyncFromSheet(urlToUse || undefined);
        }
      } catch (err) {
        console.warn('Failed to load server config, calling auto sync directly:', err);
        await autoSyncFromSheet();
      } finally {
        setIsStoreLoaded(true);
      }
    };

    loadServerStore();
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

    // Automatically POST new registration to Google Sheets Webhook URL if saved by the admin in localStorage
    const webhookUrl = localStorage.getItem('noina_order_webhook_url');
    if (webhookUrl && webhookUrl.startsWith('http')) {
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'registration',
          id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          password: newMember.password,
          sponsorId: newMember.sponsorId,
          parentUserId: newMember.parentUserId,
          position: newMember.position,
          rank: newMember.rank,
          dateJoined: newMember.dateJoined
        })
      }).then(() => {
        console.log('Successfully posted registration to Google Sheet script webhook:', webhookUrl);
      }).catch(err => {
        console.warn('Post registration to Google Sheet script webhook failed:', err);
      });
    }
  };

  const handleUpdatePassword = (memberId: string, newPassword: string) => {
    setMembers(prevMembers => {
      const updated = prevMembers.map(m => m.id === memberId ? { ...m, password: newPassword } : m);
      
      // Also notify webhook so Google Sheet is updated and an email alert is sent to user with the new password
      const resetMember = updated.find(m => m.id === memberId);
      if (resetMember) {
        const webhookUrl = localStorage.getItem('noina_order_webhook_url');
        if (webhookUrl && webhookUrl.startsWith('http')) {
          fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'registration',
              id: resetMember.id,
              name: resetMember.name,
              email: resetMember.email,
              phone: resetMember.phone,
              password: resetMember.password,
              sponsorId: resetMember.sponsorId || '',
              parentUserId: resetMember.parentUserId || '',
              position: resetMember.position || '',
              rank: resetMember.rank || 'Bronze',
              dateJoined: resetMember.dateJoined || new Date().toISOString().split('T')[0]
            })
          }).catch(err => {
            console.warn('Post password reset webhook failed:', err);
          });
        }
      }
      return updated;
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
          type: 'order',
          orderId: newOrder.id,
          subtotal: baseAmount,
          shippingFee: shippingFee,
          firstName: registrationDetails?.firstName || '',
          lastName: registrationDetails?.lastName || '',
          sponsorId: currentUser ? currentUser.id : `NS${Math.floor(1000 + Math.random() * 9000)}`,
          sponsorCode: registrationDetails?.sponsorCode || (currentUser ? currentUser.id : '')
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

  // Admin Google Sheet sync callback (replaces entirely and saves to server)
  const handleSyncProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      const savedUrl = localStorage.getItem('noina_sheet_url') || '';
      await fetch('/api/products-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: newProducts,
          sheetUrl: savedUrl
        })
      });
    } catch (err) {
      console.error('Failed to save synced products to server:', err);
    }
  };

  // Admin Inventory Controls
  const handleAddProduct = async (product: Product) => {
    const updated = [...products, product];
    setProducts(updated);
    try {
      await fetch('/api/products-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
    } catch (err) {
      console.error('Failed to save added product to server:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    try {
      await fetch('/api/products-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
    } catch (err) {
      console.error('Failed to save deleted product to server:', err);
    }
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
            onUpdatePassword={handleUpdatePassword}
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
