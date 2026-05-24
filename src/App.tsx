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
  logoConfig: {
    customImage: string | null;
    brandName: string;
    primaryColor: string;
  };
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
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

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

  return (
    <div className="relative min-h-screen bg-brand-paper selection:bg-brand-clay selection:text-brand-paper">
      
      {/* 1. MAIN CLIENT STOREFRONT LAYER */}
      <Storefront 
        db={db}
        cart={cart}
        onUpdateCart={setCart}
        onPlaceOrder={handlePlaceOrder}
        onRefreshDb={fetchLatestDatabaseState}
        showAdminLink={true}
        onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)}
      />

      {/* 2. DOCKABLE ADMINISTRATOR CONSOLE PANEL PANEL */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center animate-in slide-in-from-bottom duration-300">
          <div className="w-full max-w-7xl h-[85vh] bg-brand-paper shadow-2xl border-t border-brand-line rounded-t-3xl overflow-y-auto flex flex-col justify-between">
            
            {/* Top closer handle */}
            <div className="sticky top-0 z-10 bg-brand-ink text-brand-paper px-6 py-2 flex items-center justify-between border-b border-brand-line shadow-sm">
              <span className="text-xs text-brand-paper/60 font-medium">✨ Administrator database entries update in real time on the Storefront</span>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-1 px-3.5 rounded-lg font-bold font-mono transition-all uppercase"
                id="btn-close-admin-drawer"
              >
                Close Dock x
              </button>
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <AdminPanel 
                db={db}
                onUpdateDb={handleUpdateDatabase}
                onRefreshDb={fetchLatestDatabaseState}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
