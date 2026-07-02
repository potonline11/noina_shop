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

const extractSheetId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_\-]+)/);
  return match ? match[1] : '';
};

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
      // Keep only products with source 'googlesheet' or 'seller' to ensure correct products are displayed
      const validProducts = parsed.filter(p => p.source === 'googlesheet' || p.source === 'seller');
      if (validProducts.length > 0) {
        return validProducts;
      }
    }
    return [];
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
    const saveOrdersToServer = async () => {
      if (!isStoreLoaded) return;
      try {
        await fetch('/api/products-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders })
        });
      } catch (err) {
        console.error('Failed to sync orders to server:', err);
      }
    };
    saveOrdersToServer();
  }, [orders, isStoreLoaded]);

  useEffect(() => {
    localStorage.setItem('noina_commissions', JSON.stringify(commissionLogs));
    const saveCommissionsToServer = async () => {
      if (!isStoreLoaded) return;
      try {
        await fetch('/api/products-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commissionLogs })
        });
      } catch (err) {
        console.error('Failed to sync commissions to server:', err);
      }
    };
    saveCommissionsToServer();
  }, [commissionLogs, isStoreLoaded]);

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
          if (data.orders && data.orders.length > 0) {
            setOrders(data.orders);
            localStorage.setItem('noina_orders', JSON.stringify(data.orders));
          }
          if (data.commissionLogs && data.commissionLogs.length > 0) {
            setCommissionLogs(data.commissionLogs);
            localStorage.setItem('noina_commissions', JSON.stringify(data.commissionLogs));
          }
          if (data.sheetUrl) {
            serverSheetUrl = data.sheetUrl;
            localStorage.setItem('noina_sheet_url', data.sheetUrl);
          }
          if (data.webhookUrl) {
            serverWebhookUrl = data.webhookUrl;
            localStorage.setItem('noina_order_webhook_url', data.webhookUrl);
          }
          if (data.logoUrl) {
            localStorage.setItem('noina_logo_url', data.logoUrl);
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

    const clientWebhookUrl = localStorage.getItem('noina_order_webhook_url') || '';
    const clientSheetUrl = localStorage.getItem('noina_sheet_url') || '';
    const sheetId = extractSheetId(clientSheetUrl);

    // Automatically POST new registration to Google Sheets Webhook URL & Send SMTP Email via unified backend route /api/register
    return fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: clientWebhookUrl,
        sheetId: sheetId,
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
    }).then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('[App] Failed to parse webhook JSON response:', text);
          const lowerText = text.toLowerCase();
          if (lowerText.includes('not_found') || lowerText.includes('could not be found') || lowerText.includes('page not found')) {
            return {
              success: false,
              message: '❌ ไม่พบหน้าสคริปต์ Google Apps Script (NOT_FOUND): ลิงก์ที่แอดมินกรอกในระบบไม่ถูกต้อง หรือ Deployment ID ไม่มีอยู่จริงในระบบ Google โปรดตรวจสอบว่าคัดลอก Web App URL (ลงท้ายด้วย /exec) มาอย่างถูกต้องครบถ้วนและบันทึกในระบบแอดมิน (NS001)'
            };
          }
          if (lowerText.includes('sign in') || lowerText.includes('accounts.google') || lowerText.includes('login') || lowerText.includes('servicelogin')) {
            return {
              success: false,
              message: '🔒 ไม่สามารถเข้าถึงสคริปต์ได้เนื่องจากติดสิทธิความปลอดภัยของ Google: โปรดแก้ไขสิทธิผู้มีสิทธิเข้าถึง Web App ใน Google Apps Script โดยตั้งค่า Who has access เป็น "Anyone" (ทุกคน) แล้วทำการ Deploy และนำลิงก์ /exec ใหม่มาบันทึกในระบบแอดมิน (NS001)'
            };
          }
          return {
            success: false,
            message: text.substring(0, 150) || 'การตอบกลับจากเซิร์ฟเวอร์ไม่ได้อยู่ในรูปแบบ JSON'
          };
        }
      })
      .then(data => {
        console.log('Server webhook-proxy response for registration:', data);
        return {
          success: !!data.success,
          message: data.message || 'ส่งข้อมูลการสมัครสมาชิกลงชีตสำเร็จ'
        };
      }).catch(err => {
        console.warn('Post registration to server webhook-proxy failed:', err);
        return {
          success: false,
          message: 'ไม่สามารถส่งข้อมูลสมัครสมาชิกไปยัง Google Sheet ได้: ' + err.message
        };
      });
  };

  const handleUpdatePassword = (memberId: string, newPassword: string) => {
    setMembers(prevMembers => {
      const updated = prevMembers.map(m => m.id === memberId ? { ...m, password: newPassword } : m);
      
      // Also notify webhook via server-side proxy so Google Sheet is updated and an email alert is sent to user with the new password
      const resetMember = updated.find(m => m.id === memberId);
      if (resetMember) {
        const clientWebhookUrl = localStorage.getItem('noina_order_webhook_url') || '';
        const clientSheetUrl = localStorage.getItem('noina_sheet_url') || '';
        const sheetId = extractSheetId(clientSheetUrl);
        fetch('/api/webhook-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhookUrl: clientWebhookUrl,
            sheetId: sheetId,
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
        }).then(async (res) => {
            const text = await res.text();
            try {
              return JSON.parse(text);
            } catch (e) {
              const lowerText = text.toLowerCase();
              if (lowerText.includes('not_found') || lowerText.includes('could not be found') || lowerText.includes('page not found')) {
                return {
                  success: false,
                  message: '❌ ไม่พบหน้าสคริปต์ Google Apps Script (NOT_FOUND): ลิงก์ไม่ถูกต้อง โปรดตรวจสอบลิงก์ Web App'
                };
              }
              if (lowerText.includes('sign in') || lowerText.includes('accounts.google') || lowerText.includes('login') || lowerText.includes('servicelogin')) {
                return {
                  success: false,
                  message: '🔒 ติดสิทธิความปลอดภัย Google: โปรดแชร์สิทธิ Web App เป็น "Anyone" (ทุกคน)'
                };
              }
              return { success: false, message: text.substring(0, 100) };
            }
          })
          .then(data => {
            console.log('Server webhook-proxy response for password reset:', data);
          }).catch(err => {
            console.warn('Post password reset to server webhook-proxy failed:', err);
          });
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

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    const clientWebhookUrl = localStorage.getItem('noina_order_webhook_url') || '';
    const clientSheetUrl = localStorage.getItem('noina_sheet_url') || '';
    const sheetId = extractSheetId(clientSheetUrl);

    // Automatically POST to Google Sheets Webhook URL via server-side proxy (Bypasses client-side CORS issues and works across all devices)
    fetch('/api/webhook-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: clientWebhookUrl,
        sheetId: sheetId,
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
    }).then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          const lowerText = text.toLowerCase();
          if (lowerText.includes('not_found') || lowerText.includes('could not be found') || lowerText.includes('page not found')) {
            return {
              success: false,
              message: '❌ ไม่พบหน้าสคริปต์ Google Apps Script (NOT_FOUND): ลิงก์ไม่ถูกต้อง โปรดตรวจสอบลิงก์ Web App'
            };
          }
          if (lowerText.includes('sign in') || lowerText.includes('accounts.google') || lowerText.includes('login') || lowerText.includes('servicelogin')) {
            return {
              success: false,
              message: '🔒 ติดสิทธิความปลอดภัย Google: โปรดแชร์สิทธิ Web App เป็น "Anyone" (ทุกคน)'
            };
          }
          return { success: false, message: text.substring(0, 100) };
        }
      })
      .then(data => {
        console.log('Server webhook-proxy response for order:', data);
      }).catch(err => {
        console.warn('Post to server webhook-proxy failed:', err);
      });

    // Clear cart upon successful purchase
    setCart([]);

    // Prepare states to be updated
    let updatedProducts = [...products];
    let updatedMembers = [...members];
    let updatedCommissionLogs = [...commissionLogs];

    // Decrement stock for purchased products
    items.forEach(item => {
      updatedProducts = updatedProducts.map(p => {
        if (p.id === item.product.id) {
          const newStock = Math.max(0, (p.stock || 1) - item.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });
    });
    setProducts(updatedProducts);

    // Award commissions and handle seller payouts if seller products exist
    items.forEach((item, itemIdx) => {
      if (item.product.source === 'seller' && item.product.sellerId) {
        const sellerId = item.product.sellerId;
        const totalCost = item.product.price * item.quantity;
        const websiteFee = Math.round(totalCost * 0.05);
        const sellerPayout = totalCost - websiteFee;

        // Add seller earning log
        const newSellerLog: CommissionLog = {
          id: `COM-SEL-${Date.now().toString().slice(-4)}-${itemIdx}-${Math.floor(Math.random() * 100)}`,
          memberId: sellerId,
          type: 'seller_earning' as any,
          amount: sellerPayout,
          bvReference: item.product.bv * item.quantity,
          description: `รายรับสุทธิจากการขาย ${item.product.name} จำนวน ${item.quantity} ชิ้น (หักค่าธรรมเนียมบำรุงเว็บ 5% = ${websiteFee} ฿)`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        updatedCommissionLogs = [newSellerLog, ...updatedCommissionLogs];

        // Credit seller's wallet
        updatedMembers = updatedMembers.map(m => {
          if (m.id === sellerId) {
            return { ...m, walletBalance: m.walletBalance + sellerPayout };
          }
          return m;
        });
      }
    });

    // If user is logged in, distribute BV and award MLM direct sponsor bonus
    if (currentUser) {
      // 1. Update buyer's personal direct BV (increasing rank potential) and upline tree BV
      const tempMembers = [...updatedMembers];
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

      // 2. Traversal Flow: Accumulate left/right BV to all upline parent nodes
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
      updatedMembers = tempMembers;

      // 3. Award Direct Sponsor Bonus (100% of BV in Baht)
      if (currentUser.sponsorId) {
        const sponsorBonusAmount = totalBV; // 1 Baht per 1 BV
        const itemsSummary = items.map(item => item.product.name).join(', ');
        const sponsorLog: CommissionLog = {
          id: `COM-SPN-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
          memberId: currentUser.sponsorId,
          type: 'sponsor_bonus',
          amount: sponsorBonusAmount,
          bvReference: totalBV,
          description: `ค่าแนะนำแนะนำ ${currentUser.name} (${currentUser.id}) สั่งซื้อ ${itemsSummary.length > 30 ? itemsSummary.slice(0, 30) + '...' : itemsSummary}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        updatedCommissionLogs = [sponsorLog, ...updatedCommissionLogs];

        // Award money directly to sponsor's wallet
        updatedMembers = updatedMembers.map(m => {
          if (m.id === currentUser.sponsorId) {
            return { ...m, walletBalance: m.walletBalance + sponsorBonusAmount };
          }
          return m;
        });
      }
    }

    // Set updated React states
    setMembers(updatedMembers);
    setCommissionLogs(updatedCommissionLogs);

    // Update currentUser state and sessionStorage if the active member's properties (like balance or rank) changed
    if (currentUser) {
      const activeMemberUpdated = updatedMembers.find(m => m.id === currentUser.id);
      if (activeMemberUpdated) {
        setCurrentUser(activeMemberUpdated);
        sessionStorage.setItem('noina_current_user', JSON.stringify(activeMemberUpdated));
      }
    }

    // Save all local states to localStorage for robust fallback
    localStorage.setItem('noina_products', JSON.stringify(updatedProducts));
    localStorage.setItem('noina_members', JSON.stringify(updatedMembers));
    localStorage.setItem('noina_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('noina_commissions', JSON.stringify(updatedCommissionLogs));

    // Save complete updated state transaction to the database backend
    fetch('/api/products-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: updatedProducts,
        members: updatedMembers,
        orders: updatedOrders,
        commissionLogs: updatedCommissionLogs
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Successfully synchronized order checkout data to server store:', data);
    })
    .catch(err => {
      console.error('Failed to sync checkout data to server store:', err);
    });
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
            products={products}
            onLogout={handleLogout}
            onAddSellerProduct={(newProd) => setProducts(prev => [newProd, ...prev])}
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
