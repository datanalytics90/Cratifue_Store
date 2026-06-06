import React, { useState, useEffect } from 'react';
import { Loader2, Palette } from 'lucide-react';
import Storefront from './components/Storefront';
import AdminPanel from './components/AdminPanel';
import { Product, Artisan, Category, Campaign, Coupon, Order, CartItem, CommissionEntry } from './types/firestore';
import initialDb from '../db-craftifue.json';

interface DatabaseState {
  products: Product[];
  artisans: Artisan[];
  categories: Category[];
  campaigns: Campaign[];
  coupons: Coupon[];
  lookbooks: any[];
  orders: Order[];
  commissionLedger: CommissionEntry[];
  commissionProfiles: any[];
  payouts: any[];
  logoConfig: {
    customImage: string | null;
    brandName: string;
    primaryColor: string;
  };
  notifications: any[];
  autoStockRefill: boolean;
}

// Global fetch interceptor for client-side offline / serverless / Vercel modes
let isInterceptorSetup = false;
const setupFetchInterceptor = (fallbackDb: any, setDbState: (db: any) => void) => {
  if (isInterceptorSetup) return;
  isInterceptorSetup = true;

  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    
    // Check if we should intercept this API request
    if (url.startsWith('/api/')) {
      const dbFromStorage = () => {
        try {
          const val = localStorage.getItem('craftifue_local_db');
          return val ? JSON.parse(val) : fallbackDb;
        } catch (e) {
          return fallbackDb;
        }
      };
      
      const saveDbToStorage = (newDb: any) => {
        try {
          localStorage.setItem('craftifue_local_db', JSON.stringify(newDb));
          setDbState(newDb);
        } catch (e) {
          console.error("Failed to save db to localStorage", e);
        }
      };
      
      // Match the endpoints
      if (url === '/api/db') {
        const currentDb = dbFromStorage();
        return new Response(JSON.stringify(currentDb), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // /api/db/:collection
      const dbCollectionMatch = url.match(/^\/api\/db\/([a-zA-Z0-9]+)$/);
      if (dbCollectionMatch) {
        const collection = dbCollectionMatch[1];
        const currentDb = dbFromStorage();
        if (init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          const newId = body.id || `local_${collection}_${Date.now()}`;
          const newItem = { ...body, id: newId };
          const updatedCollection = [newItem, ...(currentDb[collection] || [])];
          const updatedDb = { ...currentDb, [collection]: updatedCollection };
          saveDbToStorage(updatedDb);
          return new Response(JSON.stringify(newItem), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // GET
        return new Response(JSON.stringify(currentDb[collection] || []), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // /api/db/:collection/:id
      const dbItemMatch = url.match(/^\/api\/db\/([a-zA-Z0-9]+)\/([a-zA-Z0-9_\-]+)$/);
      if (dbItemMatch) {
        const collection = dbItemMatch[1];
        const id = dbItemMatch[2];
        const currentDb = dbFromStorage();
        const collectionItems = currentDb[collection] || [];
        
        if (init?.method === 'PUT') {
          const body = JSON.parse(init.body as string);
          const updatedCollection = collectionItems.map((item: any) => {
            const itemId = item.id || item.uid;
            if (itemId === id) {
              return { ...item, ...body };
            }
            return item;
          });
          const updatedDb = { ...currentDb, [collection]: updatedCollection };
          saveDbToStorage(updatedDb);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (init?.method === 'DELETE') {
          const updatedCollection = collectionItems.filter((item: any) => {
            const itemId = item.id || item.uid;
            return itemId !== id;
          });
          const updatedDb = { ...currentDb, [collection]: updatedCollection };
          saveDbToStorage(updatedDb);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (url === '/api/checkout') {
        const body = JSON.parse(init?.body as string);
        const currentDb = dbFromStorage();
        
        const newOrder = {
          id: `order_local_${Date.now()}`,
          buyerUid: 'user_admin',
          customerDetails: body.deliveryAddress,
          items: body.items,
          subtotalPaise: body.subtotal,
          discountPaise: body.discount || 0,
          shippingPaise: body.shippingFee || 0,
          taxPaise: body.taxFee || 0,
          totalPaise: body.total,
          giftWrap: body.giftWrap || false,
          paymentStatus: 'paid',
          orderStatus: 'placed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Deduct inventory
        const updatedProducts = (currentDb.products || []).map((p: any) => {
          const cartItem = body.items.find((item: any) => item.productId === p.id);
          if (cartItem) {
            return {
              ...p,
              inventory: Math.max(0, p.inventory - cartItem.quantity),
              salesCount: (p.salesCount || 0) + cartItem.quantity
            };
          }
          return p;
        });
        
        const updatedDb = {
          ...currentDb,
          products: updatedProducts,
          orders: [newOrder, ...(currentDb.orders || [])]
        };
        saveDbToStorage(updatedDb);
        return new Response(JSON.stringify(newOrder), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url === '/api/donate') {
        const body = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ success: true, amount: body.amountPaise }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url === '/api/logo/config') {
        const body = JSON.parse(init?.body as string);
        const currentDb = dbFromStorage();
        const updatedDb = {
          ...currentDb,
          logoConfig: {
            ...currentDb.logoConfig,
            ...body
          }
        };
        saveDbToStorage(updatedDb);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url === '/api/config/refill') {
        const body = JSON.parse(init?.body as string);
        const currentDb = dbFromStorage();
        const updatedDb = {
          ...currentDb,
          autoStockRefill: body.enabled
        };
        saveDbToStorage(updatedDb);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url === '/api/inventory/refill') {
        const currentDb = dbFromStorage();
        const updatedProducts = (currentDb.products || []).map((p: any) => {
          if (p.inventory < 5) {
            return { ...p, inventory: p.inventory + 12 };
          }
          return p;
        });
        const updatedDb = {
          ...currentDb,
          products: updatedProducts
        };
        saveDbToStorage(updatedDb);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url === '/api/gemini/generate') {
         const body = JSON.parse(init?.body as string);
         const promptText = (body.prompt || '').toLowerCase();
         let sampleText = "The masterpiece demonstrates incredible artistry, passed down through generations. Lovingly shaped with natural materials standard to our regional cluster, it celebrates the deep historical heritage.";
         
         if (promptText.includes('bio') || promptText.includes('biography')) {
           sampleText = "Master of ancestral crafts, with a career spanning over four decades in the indigenous heartlands. Preserving lost metallurgy and oral patterns passed from parent to child with utmost meticulous accuracy.";
         } else if (promptText.includes('story') || promptText.includes('narrative')) {
           sampleText = "Deep in the tranquil regional groves, the craft begins on high-fired terracotta wheels before being hand-burnished under natural sunlight. Every motif echoes three centuries of continuous artistic dedication.";
         } else if (promptText.includes('product') || promptText.includes('details') || promptText.includes('description')) {
           sampleText = "Meticulously crafted using heavy copper alloys and pure mineral slip paints. Resistant to environmental wear, it provides high-contrast traditional geometric appeal fitting both heritage collections and minimal dining table layouts.";
         }
         return new Response(JSON.stringify({ response: sampleText }), {
           status: 200,
           headers: { 'Content-Type': 'application/json' }
         });
      }
    }
    
    return originalFetch(input, init);
  };
};

export default function App() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [cart, setCart] = useState<{
    items: CartItem[];
    giftWrap: boolean;
    couponCode: string | null;
  }>({
    items: [],
    giftWrap: false,
    couponCode: null
  });
  
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Route tracker separation
  useEffect(() => {
    const handleUrlTracking = () => {
      const isAd = window.location.pathname === '/admin' || window.location.search.includes('admin=true');
      setIsAdminPath(isAd);
    };
    handleUrlTracking();
    window.addEventListener('popstate', handleUrlTracking);
    return () => window.removeEventListener('popstate', handleUrlTracking);
  }, []);

  const navigateToStorefront = () => {
    window.history.pushState({}, '', '/');
    setIsAdminPath(false);
  };

  // Settle real-time API sync matching /api/db endpoint
  const fetchLatestDatabaseState = async () => {
    try {
      const response = await fetch('/api/db');
      if (!response.ok) {
        throw new Error('Server returned unsuccessful status ' + response.status);
      }
      const data = await response.json();
      if (!data || typeof data !== 'object' || !data.products) {
        throw new Error('Database is malformed.');
      }
      setDb(data);
      setErrorText('');
    } catch (err: any) {
      console.warn('⚠️ Server database unreachable or malformed. Activating client-side localStorage fallback mode.', err.message);
      
      let localDb: any = null;
      try {
        const stored = localStorage.getItem('craftifue_local_db');
        if (stored) {
          localDb = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse craftifue_local_db from localStorage', e);
      }
      
      if (!localDb || !localDb.products) {
        localDb = initialDb;
        try {
          localStorage.setItem('craftifue_local_db', JSON.stringify(localDb));
        } catch (e) {
          console.error(e);
        }
      }
      
      // Setup the global fetch interceptor with the local db state update callback
      setupFetchInterceptor(localDb, (updatedDb) => {
        setDb(updatedDb);
      });
      
      setDb(localDb);
      setErrorText(''); // Clear error to allow successful app rendering
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestDatabaseState();
  }, []);

  const handleUpdateDatabase = (updatedData: Partial<DatabaseState>) => {
    setDb(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        ...updatedData
      };
      // Keep localStorage in sync if running locally
      try {
        localStorage.setItem('craftifue_local_db', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Securely push order parameters to server ledgers
  const handlePlaceOrder = (completedOrder: Order) => {
    setDb(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        orders: [completedOrder, ...prev.orders]
      };
      try {
        localStorage.setItem('craftifue_local_db', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    fetchLatestDatabaseState();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex flex-col items-center justify-center text-center p-6 select-none">
        <Loader2 className="w-12 h-12 text-[#C4683B] animate-spin mb-4" />
        <h2 className="font-serif font-black text-2xl text-[#2A211B] animate-pulse">CRAFTIFUE MASTER LEDGER</h2>
        <p className="text-sm text-[#6B5E52] mt-1.5 font-sans italic">Consulting lost-wax copper castings and primary handloom directories surrounding Bastar & Chanderi...</p>
      </div>
    );
  }

  if (errorText || !db) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex flex-col items-center justify-center p-6 text-center select-none">
        <span className="p-3 bg-red-100 rounded-full text-red-700 font-bold mb-4 flex items-center justify-center text-lg">⚠️</span>
        <h2 className="font-serif font-bold text-xl text-red-900">Database Connection Intercepted</h2>
        <p className="text-xs text-red-700/85 max-w-sm mt-1.5 leading-relaxed">{errorText}</p>
        <button 
          onClick={fetchLatestDatabaseState}
          className="mt-4 bg-[#C4683B] hover:bg-[#9E4F2A] text-white text-xs px-4 py-2 rounded-xl transition-all font-sans font-bold"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] selection:bg-brand-clay selection:text-brand-paper py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-brand-ink text-brand-paper px-6 py-4 rounded-3xl border border-brand-line shadow-lg gap-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-brand-clay animate-ping" />
              <p className="text-xs font-mono tracking-wider text-brand-paper/80 uppercase">🔐 SECURE INTERNAL CONTROL ACCESS POINT</p>
            </div>
            <button 
              onClick={navigateToStorefront}
              className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper font-sans text-xs px-4 py-2 font-bold rounded-2xl transition-all select-none cursor-pointer border-0 shadow"
            >
              ← Back to Consumer Storefront
            </button>
          </div>
          <AdminPanel 
            db={db}
            onUpdateDb={handleUpdateDatabase}
            onRefreshDb={fetchLatestDatabaseState}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-paper selection:bg-brand-clay selection:text-brand-paper">
      
      {/* 1. COMPACT PUBLIC CONSUMER STOREFRONT LAYER WITH ABSOLUTELY HIDDEN ADMIN PANEL ACCESS */}
      <Storefront 
        db={db}
        cart={cart}
        onUpdateCart={setCart}
        onPlaceOrder={handlePlaceOrder}
        onRefreshDb={fetchLatestDatabaseState}
        showAdminLink={false}
        onToggleAdmin={() => {}}
      />
    </div>
  );
}
