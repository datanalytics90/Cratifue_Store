import React, { useState, useEffect } from 'react';
import { Loader2, Palette } from 'lucide-react';
import Storefront from './components/Storefront';
import AdminPanel from './components/AdminPanel';
import { Product, Artisan, Category, Campaign, Coupon, Order, CartItem, CommissionEntry } from './types/firestore';

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
        throw new Error('Could not pull live craft registries from server node.');
      }
      const data = await response.json();
      setDb(data);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Connecting server error.');
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
      return {
        ...prev,
        ...updatedData
      };
    });
  };

  // Securely push order parameters to server ledgers
  const handlePlaceOrder = (completedOrder: Order) => {
    setDb(prev => {
      if (!prev) return null;
      return {
        ...prev,
        orders: [completedOrder, ...prev.orders]
      };
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
