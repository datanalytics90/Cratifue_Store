import React, { useState } from 'react';
import { 
  ShoppingBag, Search, Compass, Heart, MapPin, Check, ChevronRight, Sparkles, SlidersHorizontal, 
  HelpCircle, Gift, Info, Trash2, ArrowLeft, Loader2, Globe, HeartHandshake, Box, Star, 
  User, CheckCircle2, Award, Calendar, ExternalLink, RefreshCw 
} from 'lucide-react';
import { Product, Artisan, Category, Campaign, Order, Coupon, CartItem } from '../types/firestore';
import AiCraftConcierge from './AiCraftConcierge';
import CraftifueLogo from './CraftifueLogo';
import { motion, AnimatePresence } from 'motion/react';

interface StorefrontProps {
  db: {
    products: Product[];
    artisans: Artisan[];
    categories: Category[];
    campaigns: Campaign[];
    coupons: Coupon[];
    orders: any[];
    lookbooks: any[];
    commissionLedger: any[];
    logoConfig: { customImage: string | null; brandName: string; primaryColor: string };
  };
  cart: {
    items: CartItem[];
    giftWrap: boolean;
    couponCode: string | null;
  };
  onUpdateCart: (updatedCart: any) => void;
  onPlaceOrder: (orderData: any) => void;
  onRefreshDb: () => void;
  showAdminLink: boolean;
  onToggleAdmin: () => void;
}

export default function Storefront({ 
  db, cart, onUpdateCart, onPlaceOrder, onRefreshDb, showAdminLink, onToggleAdmin 
}: StorefrontProps) {
  
  // View Router State
  const [currentView, setCurrentView] = useState<'home' | 'listing' | 'pdp' | 'lookbook' | 'donate' | 'track' | 'spaces'>('home');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  // Listing Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMaterial, setFilterMaterial] = useState<string | null>(null);
  const [filterArtForm, setFilterArtForm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'rating'>('relevance');

  // PDP States
  const [pdpQty, setPdpQty] = useState(1);
  const [is3DActive, setIs3DActive] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0); // For simulated 3D rotation
  const [isDraggingSpin, setIsDraggingSpin] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // AI Interior Studio Customizer States (Phase 4)
  const [isInteriorModalOpen, setIsInteriorModalOpen] = useState(false);
  const [roomDescription, setRoomDescription] = useState('My dining room has off-white wallpaper, a mahogany wood dining set and modern brass pendant lights.');
  const [isAiCustomizing, setIsAiCustomizing] = useState(false);
  const [customizationResult, setCustomizationResult] = useState<string | null>(null);
  const [savedSpaces, setSavedSpaces] = useState<any[]>([]);

  // Cart Drawer open state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCouponInput, setCartCouponInput] = useState('');
  const [cartCouponError, setCartCouponError] = useState('');
  const [cartWelfareOptIn, setCartWelfareOptIn] = useState(false);

  // Checkout flow state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: 'Aanya Iyer',
    phone: '+91 99911 22334',
    line1: 'Block C, Golden Woods',
    line2: 'Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    country: 'IN' as const
  });
  const [pincodeServiceable, setPincodeServiceable] = useState<boolean | null>(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [checkoutCompletedOrder, setCheckoutCompletedOrder] = useState<Order | null>(null);

  // Welfare Campaign Donation state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(1250); // ₹1,250 preset
  const [customDonationInput, setCustomDonationInput] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [donationReceipt, setDonationReceipt] = useState<any | null>(null);

  // Public Order Tracker state
  const [trackOrderIdInput, setTrackOrderIdInput] = useState('');
  const [trackOrderResult, setTrackOrderResult] = useState<any | null>(null);

  // New Interactive Homepage Sections States
  const [activeRegion, setActiveRegion] = useState<'bastar' | 'khurda' | 'chanderi'>('bastar');
  const [activeMaterial, setActiveMaterial] = useState<string>('brass');
  const [spotlightArtisan, setSpotlightArtisan] = useState<string>('suman');

  /* ------------------------------------------------------------------ */
  /* CART / COMMERCE ACTIONS                                             */
  /* ------------------------------------------------------------------ */

  const handleAddToCart = (item: Product, qty: number, customizationRef?: string) => {
    const existingIndex = cart.items.findIndex(x => x.productId === item.id);
    let updatedItems = [...cart.items];

    if (existingIndex !== -1) {
      updatedItems[existingIndex].qty += qty;
    } else {
      updatedItems.push({
        productId: item.id,
        sku: item.sku,
        title: item.title,
        image: item.images[0]?.url || '',
        unitPrice: item.price,
        qty: qty,
        artisanId: item.artisanId,
        customizationRef: customizationRef
      });
    }

    onUpdateCart({
      ...cart,
      items: updatedItems
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updated = cart.items.filter(x => x.productId !== productId);
    onUpdateCart({ ...cart, items: updated });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    const updated = cart.items.map(x => x.productId === productId ? { ...x, qty: newQty } : x);
    onUpdateCart({ ...cart, items: updated });
  };

  const calculateTotals = () => {
    const subtotal = cart.items.reduce((sum, x) => sum + (x.unitPrice * x.qty), 0);
    let discount = 0;
    if (cart.couponCode === 'KART10') {
      discount = Math.round(subtotal * 0.10);
    }
    const giftWrap = cart.giftWrap ? 5000 : 0; // ₹50.00 in Paise
    const welfare = cartWelfareOptIn ? 12000 : 0; // ₹120.00
    const shipping = subtotal > 150000 ? 0 : 12000; // Free above ₹1,500
    const tax = Math.round((subtotal - discount) * 0.18); // 18% GST
    const total = subtotal - discount + giftWrap + shipping + tax + welfare;

    return { subtotal, discount, giftWrap, shipping, tax, total };
  };

  const handleApplyCoupon = () => {
    if (cartCouponInput.toUpperCase() === 'KART10') {
      onUpdateCart({ ...cart, couponCode: 'KART10' });
      setCartCouponInput('');
      setCartCouponError('');
    } else {
      setCartCouponError('Coupon Code is invalid or deactivated.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* MOCK SERVICEABILITY CHECKER                                         */
  /* ------------------------------------------------------------------ */
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeChecking(true);
    setTimeout(() => {
      // Mock serviceable for Indian metros starting 11, 40, 56, 70
      const code = shippingAddress.pincode;
      if (code.length === 6 && /^[1-9][0-9]{5}$/.test(code)) {
        setPincodeServiceable(true);
      } else {
        setPincodeServiceable(false);
      }
      setPincodeChecking(false);
    }, 1000);
  };

  /* ------------------------------------------------------------------ */
  /* FULL WEB INVOICE DRAFT & CHECKOUT FLOW                             */
  /* ------------------------------------------------------------------ */
  const executePurchaseCheckout = async () => {
    const totals = calculateTotals();
    const orderDraft = {
      buyerUid: 'user_buyer_1',
      items: cart.items,
      pricing: totals,
      shippingAddress,
      paymentMethod,
      couponCode: cart.couponCode
    };

    try {
      if (paymentMethod === 'razorpay') {
        setIsDonating(true); // show loader
        // Settle a mock delay acting as Razorpay security capture
        setTimeout(async () => {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderDraft)
          });
          const completedOrder = await res.json();
          setCheckoutCompletedOrder(completedOrder);
          onPlaceOrder(completedOrder);
          setIsDonating(false);
          setIsCheckoutOpen(false);
          // Empty cart
          onUpdateCart({ items: [], giftWrap: false, couponCode: null });
        }, 1500);
      } else {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDraft)
        });
        const completedOrder = await res.json();
        setCheckoutCompletedOrder(completedOrder);
        onPlaceOrder(completedOrder);
        setIsCheckoutOpen(false);
        // Empty cart
        onUpdateCart({ items: [], giftWrap: false, couponCode: null });
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------------------------------------------------ */
  /* PUBLIC TIMELINE ORDER TRACKER                                       */
  /* ------------------------------------------------------------------ */
  const handleQueryOrderTracker = async () => {
    if (!trackOrderIdInput.trim()) return;
    try {
      const res = await fetch('/api/db/orders');
      const orders = await res.json();
      const match = orders.find((o: any) => o.id === trackOrderIdInput || o.invoiceNo === trackOrderIdInput);
      if (match) {
        setTrackOrderResult(match);
      } else {
        setTrackOrderResult({ error: 'Order not found under current parameters.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------------------------------------------------ */
  /* ARTISAN WELFARE DONATIONS ENGINE                                   */
  /* ------------------------------------------------------------------ */
  const handleSponsorDonation = async () => {
    setIsDonating(true);
    const amount = customDonationInput ? parseInt(customDonationInput) * 100 : donationAmount;
    
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: 'Aanya Iyer',
          donorEmail: 'aanya@example.com',
          campaignId: selectedCampaign?.id,
          amount: amount
        })
      });
      const data = await res.json();
      setDonationReceipt(data);
      onRefreshDb();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDonating(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* SMART INTERIOR CUSTOMIZER MODAL RUNNER (Phase 4)                 */
  /* ------------------------------------------------------------------ */
  const runAiInteriorDesigner = async () => {
    if (!selectedProduct) return;
    setIsAiCustomizing(true);
    setCustomizationResult(null);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visual_spaces',
          payload: {
            productTitle: selectedProduct.title,
            roomDescription: roomDescription
          }
        })
      });
      const data = await res.json();
      setCustomizationResult(data.content);
    } catch (err) {
      console.error(err);
      setCustomizationResult('Encountered space modeling queue latency. We recommend setting this terracotta piece alongside warm pastel drapes & brass elements.');
    } finally {
      setIsAiCustomizing(false);
    }
  };

  const handleSaveSpacedRender = () => {
    if (!selectedProduct || !customizationResult) return;
    const newSpace = {
      id: `space_${Date.now()}`,
      productTitle: selectedProduct.title,
      productImg: selectedProduct.images[0]?.url,
      recommendation: customizationResult,
      date: new Date().toLocaleDateString('en-IN')
    };
    setSavedSpaces(prev => [...prev, newSpace]);
    alert('🎨 Design recommendation saved to "My Spaces" successfully! You can add it directly to cart.');
  };

  /* ------------------------------------------------------------------ */
  /* MOCK TURNTABLE 3D VISUALIZER DRAG SYSTEM                           */
  /* ------------------------------------------------------------------ */
  const handle3DDragStart = (e: React.MouseEvent) => {
    setIsDraggingSpin(true);
    setDragStartX(e.clientX);
  };

  const handle3DDragMove = (e: React.MouseEvent) => {
    if (!isDraggingSpin) return;
    const deltaX = e.clientX - dragStartX;
    // Add delta to spin angle (clamped 0-360)
    setSpinAngle(prev => (prev + deltaX + 360) % 360);
    setDragStartX(e.clientX);
  };

  const handle3DDragEnd = () => {
    setIsDraggingSpin(false);
  };

  // Filter and sort products
  const getProcessedProducts = () => {
    let result = [...db.products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
    }

    // Filter by Pillar
    if (selectedPillar) {
      result = result.filter(p => p.pillar === selectedPillar);
    }

    // Filter by material
    if (filterMaterial) {
      result = result.filter(p => p.material.includes(filterMaterial as any));
    }

    // Filter by artForm
    if (filterArtForm) {
      result = result.filter(p => p.artForm.includes(filterArtForm as any));
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.ratingAvg - a.ratingAvg);
    }

    return result;
  };

  const filteredProducts = getProcessedProducts();

  return (
    <div className="min-h-screen bg-brand-paper pb-16 paper-grain">
      
      {/* -------------------------------------------------------------- */}
      {/* HEADER NAVIGATION BAR WITH DYNAMIC LOGO BRADING                 */}
      {/* -------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-brand-paper/90 backdrop-blur-md border-b border-brand-line select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            
            {/* Logo area */}
            <div 
              onClick={() => { setCurrentView('home'); setSelectedPillar(null); }}
              className="cursor-pointer flex flex-col items-center group"
            >
              {db.logoConfig.customImage ? (
                <img src={db.logoConfig.customImage} alt={db.logoConfig.brandName} className="max-h-12 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <CraftifueLogo size="sm" className="group-hover:scale-105 transition-transform duration-300" />
              )}
            </div>

            {/* Main top pillars list rendering */}
            <nav className="hidden md:flex space-x-4 items-center">
              {['dining', 'lighting', 'decor', 'garden', 'jewellery'].map((pillarCode) => {
                const isSelected = selectedPillar === pillarCode;
                const pillarLabel = pillarCode.charAt(0).toUpperCase() + pillarCode.slice(1);
                return (
                  <button
                    key={pillarCode}
                    onClick={() => {
                      setSelectedPillar(pillarCode);
                      setCurrentView('listing');
                    }}
                    className={`text-sm font-sans font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isSelected ? 'text-brand-clay bg-brand-paper-dark' : 'text-brand-ink-soft hover:text-brand-ink hover:bg-brand-paper-dark/40'
                    }`}
                  >
                    {pillarLabel === 'Jewellery' ? 'Handcrafted Jewellery' : pillarLabel}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* View order tracker option */}
            <button 
              onClick={() => setCurrentView('track')} 
              className="text-xs text-brand-ink-soft hover:text-brand-ink inline-flex items-center space-x-1"
            >
              <Box className="w-4 h-4 text-brand-clay" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* AI Spaces dashboard */}
            <button 
              onClick={() => setCurrentView('spaces')}
              className="text-xs text-brand-ink-soft hover:text-brand-ink inline-flex items-center space-x-1"
            >
              <Sparkles className="w-4 h-4 text-yellow-500 animate-bounce" />
              <span className="hidden sm:inline">My Spaces</span>
            </button>

            {/* Shopping Cart Trigger Icon */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-brand-ink-soft hover:text-brand-ink hover:bg-brand-paper-dark/60 rounded-full transition-all relative cursor-pointer"
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-clay text-brand-paper text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold">
                  {cart.items.reduce((sum, i) => sum + i.qty, 0)}
                </span>
              )}
            </button>

            {/* Quick launch Admin drawer view hook */}
            {showAdminLink && (
              <button 
                onClick={onToggleAdmin}
                className="bg-brand-ink hover:bg-brand-ink/90 text-brand-paper font-sans text-xs px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer select-none"
              >
                Toggle Admin Workspace
              </button>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- */}
      {/* VIEW PANEL ROUTER ROUTING LOGIC                                     */}
      {/* -------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* VIEW: HOME PAGE */}
        {currentView === 'home' && (
          <div className="space-y-16">
            
            {/* 1. GRACEFUL PREMIUM EDITORIAL HERO BANNER WITH MOTION & ATTRACTIVE IMAGE */}
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden min-h-[550px] flex items-center justify-center text-center p-8 sm:p-16 border border-brand-line shadow-xl group"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1513519107129-14a172e38d75?auto=format&fit=crop&q=80&w=1600')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Luxury dark bronze translucent vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#1A110B]/90 z-0 group-hover:opacity-95 transition-all duration-700" />
              
              {/* Delicate organic overlay accent lines representing the craft lattice */}
              <div className="absolute inset-0 opacity-15 border-[12px] border-brand-paper m-4 rounded-[20px] pointer-events-none z-10" />

              <div className="relative z-10 max-w-3xl space-y-6 flex flex-col items-center">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-sans text-brand-clay bg-brand-paper/95 border border-brand-clay/35 px-4.5 py-1.5 rounded-full font-bold uppercase tracking-widest flex items-center mb-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-ochre mr-1.5 animate-pulse" /> Direct Cluster Preservations
                </motion.span>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight uppercase font-medium"
                >
                  Authenticity <br />
                  <span className="font-serif italic font-light text-brand-paper text-3xl sm:text-4xl lg:text-5xl lowercase">Untouched.</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="font-serif text-sm sm:text-base md:text-lg italic text-brand-paper/90 max-w-xl mx-auto leading-relaxed border-t border-brand-paper/20 pt-4"
                >
                  "Direct support, direct pricing. We preserve lost-wax metalworks and ancient vitrified studio clays directly at regional craft clusters."
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto"
                >
                  <button 
                    onClick={() => { setSelectedPillar(null); setCurrentView('listing'); }}
                    className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper px-8 py-3.5 rounded-xl text-sm font-sans font-bold transition-all shadow-lg flex items-center justify-center active:scale-95 duration-200 cursor-pointer"
                  >
                    Browse Global Catalog
                  </button>
                  <button 
                    onClick={() => setCurrentView('lookbook')}
                    className="bg-brand-paper/10 hover:bg-brand-paper/20 text-white border border-brand-paper/30 backdrop-blur-md px-8 py-3.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center justify-center active:scale-95 duration-200 cursor-pointer"
                  >
                    Explore 3D Lookbook
                  </button>
                </motion.div>
              </div>
            </motion.section>

            {/* 2. PILLAR GRID TILES SECTION */}
            <section className="space-y-4">
              <h2 className="font-serif font-black text-xs uppercase tracking-widest text-[#6B5E52] border-b border-brand-line pb-2 flex items-center justify-between">
                <span className="flex items-center"><Compass className="w-4 h-4 text-brand-clay mr-2" /> Shop by Craft Pillar</span>
                <span className="text-[10px] font-mono font-normal tracking-normal text-brand-clay uppercase">5 Prime Registries Currently Online</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { id: 'dining', img: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=400', label: 'Dining Ceramics', count: 12 },
                  { id: 'lighting', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=400', label: 'Earthen Lamps', count: 8 },
                  { id: 'decor', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=400', label: 'Folk Wall Panels', count: 15 },
                  { id: 'garden', img: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400', label: 'Terracotta Pots', count: 9 },
                  { id: 'jewellery', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400', label: 'Sterling Silver', count: 11 }
                ].map((pile) => (
                  <motion.div 
                    key={pile.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedPillar(pile.id); setCurrentView('listing'); }}
                    className="group bg-brand-paper border border-brand-line rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer text-center relative flex flex-col justify-between"
                  >
                    <div className="h-32 w-full overflow-hidden relative">
                      <img src={pile.img} alt={pile.label} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3 bg-brand-paper-dark border-t border-brand-line flex justify-between items-center">
                      <span className="font-serif text-xs font-bold text-brand-ink group-hover:text-brand-clay transition-colors">{pile.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-brand-line rounded-md text-brand-ink-soft">{pile.count} ITEMS</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 3. NEW SECTION: INTERACTIVE CRAFT CLUSTERS EXPLORER (MAP / STORY) */}
            <section className="bg-brand-paper-dark border border-brand-line rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-line pb-4 gap-4">
                <div>
                  <h2 className="font-serif font-black text-xl text-brand-ink uppercase tracking-wider flex items-center">
                    <Globe className="w-5 h-5 text-brand-clay mr-2" /> Regional Craft Clusters Story Map
                  </h2>
                  <p className="text-xs text-brand-ink-soft">Preserving local geographical indications (GIs) and physical clusters directly across rural India.</p>
                </div>
                
                {/* Cluster Buttons Tab Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'bastar', label: 'Bastar, Chhattisgarh (dhokra metalwork)' },
                    { id: 'khurda', label: 'Khurda, Odisha (terracotta pottery)' },
                    { id: 'chanderi', label: 'Chanderi, MP (handwoven luxury silk)' }
                  ].map(region => (
                    <button
                      key={region.id}
                      onClick={() => setActiveRegion(region.id as any)}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-sans font-bold cursor-pointer transition-all ${
                        activeRegion === region.id 
                          ? 'bg-brand-clay text-brand-paper border-brand-clay shadow-xs' 
                          : 'bg-brand-paper border-brand-line text-brand-ink-soft hover:bg-brand-paper-dark'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cluster Map Content Display */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeRegion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                >
                  {/* Left: Beautiful Cluster Info Card */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] bg-brand-line px-2 rounded-md font-mono text-brand-clay py-1">CLUSTER IDENTITY CODE: {activeRegion.toUpperCase()}-09</span>
                    <h3 className="font-serif font-black text-2xl text-brand-ink capitalize">
                      {activeRegion === 'bastar' ? 'Bastar lost-wax smelting' : activeRegion === 'khurda' ? 'Pottery villages of Khurda' : 'Chanderi golden loom heritage'}
                    </h3>
                    
                    <div className="space-y-2 text-xs text-brand-ink-soft leading-relaxed">
                      {activeRegion === 'bastar' ? (
                        <>
                          <p>Dhokra casting is a non-ferrous metal casting using the lost-wax technique. This ancient craft dates back over 4,000 years, showcasing striking tribal aesthetics and motifs of pristine organic precision.</p>
                          <p><strong>Primary Raw Materials:</strong> Pure beeswax thread, alluvial clay from river banks, recycled scrap brass, dried paddy straws.</p>
                        </>
                      ) : activeRegion === 'khurda' ? (
                        <>
                          <p>Khurda pottery blends ancient thermal clay sciences with intricate surface patterns. Pots are individually thrown by generational potters and pit-fired in mud-walled local kilns.</p>
                          <p><strong>Primary Raw Materials:</strong> Local black clay, fireclay, natural slip pigments, ground ceramic dust.</p>
                        </>
                      ) : (
                        <>
                          <p>Chanderi weaving utilizes shimmering gold zari threads tightly intersected with fine sheer cottons and mulberry silks. Produced strictly on manual pit-looms by cooperative clusters.</p>
                          <p><strong>Primary Raw Materials:</strong> Raw silk cords, fine twisted cotton yarns, golden metallic threads, handlooms.</p>
                        </>
                      )}
                    </div>

                    {/* Regional stats indicators */}
                    <div className="grid grid-cols-3 gap-3 pt-2 text-center select-none">
                      <div className="p-2.5 bg-brand-paper border border-brand-line rounded-xl">
                        <span className="block text-lg font-mono font-bold text-brand-clay">
                          {activeRegion === 'bastar' ? '320+' : activeRegion === 'khurda' ? '180+' : '450+'}
                        </span>
                        <span className="text-[9px] text-brand-ink-soft/80 uppercase tracking-widest block mt-0.5">Artisans</span>
                      </div>
                      <div className="p-2.5 bg-brand-paper border border-brand-line rounded-xl">
                        <span className="block text-lg font-mono font-bold text-green-700">✓ YES</span>
                        <span className="text-[9px] text-brand-ink-soft/80 uppercase tracking-widest block mt-0.5">GI Protection</span>
                      </div>
                      <div className="p-2.5 bg-brand-paper border border-brand-line rounded-xl">
                        <span className="block text-lg font-mono font-bold text-brand-ink">
                          {activeRegion === 'bastar' ? '₹2.8M' : activeRegion === 'khurda' ? '₹1.5M' : '₹4.2M'}
                        </span>
                        <span className="text-[9px] text-brand-ink-soft/80 uppercase tracking-widest block mt-0.5">Funds Paid</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPillar(activeRegion === 'bastar' ? 'lighting' : activeRegion === 'khurda' ? 'dining' : 'jewellery');
                        setCurrentView('listing');
                      }}
                      className="inline-flex items-center text-xs font-sans text-brand-clay font-bold hover:underline gap-1 pt-2 cursor-pointer"
                    >
                      Browse items from this cluster <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right: Immersive graphic mockup with geographic outline and active points */}
                  <div className="lg:col-span-7 bg-brand-paper border border-brand-line rounded-2xl h-72 relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner">
                    {/* Simulated hand-drawn cartography grid network */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C4683B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    
                    {/* Map layout visual cards */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-brand-clay/10 rounded-full animate-ping" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-brand-clay/15 rounded-full" />
                      
                      {/* Interactive map pins for clusters */}
                      <div 
                        onClick={() => setActiveRegion('bastar')}
                        className={`absolute left-[35%] top-[60%] flex flex-col items-center cursor-pointer transition-transform duration-200 z-10 ${activeRegion === 'bastar' ? 'scale-110' : 'hover:scale-105 opacity-60'}`}
                      >
                        <MapPin className="w-6 h-6 text-brand-clay fill-brand-clay flex-shrink-0" />
                        <span className="bg-brand-ink text-brand-paper px-2 py-0.5 text-[9px] rounded-md font-bold shadow-xs whitespace-nowrap mt-1 uppercase">Bastar Zone</span>
                      </div>

                      <div 
                        onClick={() => setActiveRegion('khurda')}
                        className={`absolute left-[65%] top-[50%] flex flex-col items-center cursor-pointer transition-transform duration-200 z-10 ${activeRegion === 'khurda' ? 'scale-110' : 'hover:scale-105 opacity-60'}`}
                      >
                        <MapPin className="w-6 h-6 text-green-700 fill-green-700 flex-shrink-0" />
                        <span className="bg-brand-ink text-brand-paper px-2 py-0.5 text-[9px] rounded-md font-bold shadow-xs whitespace-nowrap mt-1 uppercase">Khurda Pottery</span>
                      </div>

                      <div 
                        onClick={() => setActiveRegion('chanderi')}
                        className={`absolute left-[45%] top-[25%] flex flex-col items-center cursor-pointer transition-transform duration-200 z-10 ${activeRegion === 'chanderi' ? 'scale-110' : 'hover:scale-105 opacity-60'}`}
                      >
                        <MapPin className="w-6 h-6 text-brand-ochre fill-brand-ochre flex-shrink-0" />
                        <span className="bg-brand-ink text-brand-paper px-2 py-0.5 text-[9px] rounded-md font-bold shadow-xs whitespace-nowrap mt-1 uppercase">Chanderi Silks</span>
                      </div>

                      {/* Display beautiful real-world craft photo representing the cluster */}
                      <div className="absolute right-4 bottom-4 w-40 h-24 bg-brand-paper dark border border-brand-line rounded-xl overflow-hidden shadow-md hidden sm:block">
                        <img 
                          src={
                            activeRegion === 'bastar' 
                              ? 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=300' 
                              : activeRegion === 'khurda' 
                              ? 'https://images.unsplash.com/photo-1576016770956-debb63d90029?auto=format&fit=crop&q=80&w=300' 
                              : 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=300'
                          } 
                          alt="Cluster craft" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] text-center text-brand-paper font-mono truncate font-semibold uppercase">Cluster Snapshot</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>

            {/* 4. HIGH-DEMAND Best Sellers carousel list */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-2">
                <h2 className="font-serif font-black text-xl uppercase tracking-widest text-[#2A211B] flex items-center">
                  <Star className="w-5 h-5 text-brand-ochre mr-2 animate-spin" fill="#C38F36" /> High-Demand Best Sellers
                </h2>
                <button onClick={() => { setCurrentView('listing'); setSelectedPillar(null); }} className="text-xs text-brand-clay font-bold underline cursor-pointer">See All Items</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {db.products.filter(p => p.salesCount > 15).slice(0, 4).map((p, pIdx) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pIdx * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-brand-paper border border-brand-line rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div 
                      onClick={() => { setSelectedProduct(p); setCurrentView('pdp'); }}
                      className="h-56 bg-brand-paper-dark/30 overflow-hidden cursor-pointer relative"
                    >
                      <img src={p.images[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-2 left-2 bg-brand-clay text-brand-paper text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold">BESTSELLER</span>
                      {p.discountPct > 0 && (
                        <span className="absolute top-2 right-2 bg-green-700 text-brand-paper text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">-{p.discountPct}%</span>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 
                          onClick={() => { setSelectedProduct(p); setCurrentView('pdp'); }}
                          className="font-serif text-sm font-bold text-brand-ink hover:text-brand-clay cursor-pointer line-clamp-2 leading-tight"
                        >
                          {p.title}
                        </h3>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-sm font-serif font-black text-brand-clay">₹{(p.price/100).toLocaleString('en-IN')}</span>
                          {p.mrp > p.price && (
                            <span className="text-[10px] font-serif line-through text-brand-ink-soft">₹{(p.mrp/100).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Short material indicator tag and details */}
                      <p className="text-[11px] text-brand-ink-soft/90 max-w-xs truncate italic">Craft:{p.artForm[0]?.toUpperCase()} • Mat:{p.material[0]?.toUpperCase()}</p>

                      <div className="flex justify-between items-center pt-2 border-t border-brand-line/50 text-[11px] text-brand-ink-soft">
                        <span className="text-brand-ochre font-bold flex items-center">★ <span className="ml-1 text-brand-ink font-mono font-bold">{p.ratingAvg}</span> <span className="text-brand-ink-soft ml-0.5">({p.ratingCount})</span></span>
                        <span className="font-mono bg-brand-paper-dark px-2 py-0.5 rounded text-[9px] uppercase tracking-wider text-brand-ink">Sold: <span className="font-bold text-brand-clay">{p.salesCount}</span></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 5. NEW SECTION: BEHIND THE RAW MATERIALS HUB */}
            <section className="bg-brand-paper-dark border border-brand-line rounded-3xl p-6 md:p-8 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-[10px] font-mono text-brand-clay font-bold tracking-widest uppercase">ECOLOGICALLY SOURCED</span>
                <h2 className="font-serif font-black text-2xl text-brand-ink uppercase tracking-wider">The Noble Ingredient Hub</h2>
                <p className="text-xs text-brand-ink-soft">Every piece carries chemical purity and local land heritage. Learn about the physical raw materials that structure our collections.</p>
              </div>

              {/* Material Tabs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'brass', title: 'Recycled Bell Brass', specialty: 'Used in Dhokra castings', desc: 'Sourced from scrap bell metal vessels in local tribal markets. Gives heavy, dense resonance and does not tarnish easily.', score: '99% Pure' },
                  { id: 'clay', title: 'River Alluvial Clays', specialty: 'Thermodynamics of Earthenware', desc: 'Sifted by hand from specific river bends in Odisha. Natural expansion-tolerance values and distinct earthy mineral smell.', score: 'High Temp' },
                  { id: 'silk', title: 'Zari Loomed Silk', specialty: 'Textile weave strands', desc: 'Hand-spelled organic mulberry silk blended perfectly with gold thread plating. Authentic sheer structure.', score: 'Hand loom' },
                  { id: 'silver', title: 'Filigree Silver Threads', specialty: 'Ethnic jewelry castings', desc: 'Pure sterling silver melted in mini clay crucibles and beaten manually into wire cords of hair-thin diameter.', score: '92.5 Sterling' }
                ].map(mat => (
                  <div 
                    key={mat.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      activeMaterial === mat.id 
                        ? 'bg-brand-paper border-brand-clay shadow-md ring-1 ring-brand-clay/20' 
                        : 'bg-brand-paper border-brand-line hover:border-brand-clay/40 cursor-pointer'
                    }`}
                    onClick={() => setActiveMaterial(mat.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-brand-paper-dark p-2 rounded-xl">
                        <span className="text-xs font-serif font-bold text-brand-ink capitalize">{mat.id} elements</span>
                        <span className="text-[9px] font-mono uppercase bg-brand-clay text-brand-paper px-1.5 rounded-md font-bold">{mat.score}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-brand-ink">{mat.title}</h4>
                      <p className="text-[11px] text-brand-ink-soft leading-relaxed">{mat.desc}</p>
                    </div>
                    <div className="pt-3 border-t border-brand-line/50 mt-4 text-[10px] text-brand-clay font-mono flex items-center justify-between">
                      <span>✓ 100% Eco-Pure</span>
                      <span className="underline select-none">Show items</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. WELFARE CAMPAIGN CONTRIBUTION BANNER */}
            <section className="bg-brand-teal text-brand-paper p-8 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md border border-brand-line/40 relative overflow-hidden">
              {/* Abs decorative dot graphics on canvas */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-brand-clay/10 rounded-full blur-2xl" />
              <div className="absolute left-0 bottom-0 w-32 h-32 bg-brand-ochre/15 rounded-full blur-2xl" />

              <div className="flex items-center space-x-5 relative z-10">
                <div className="p-4 bg-white/10 border border-white/20 text-brand-paper rounded-2xl shrink-0 hidden sm:block">
                  <HeartHandshake className="w-8 h-8 text-yellow-200 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono tracking-widest text-yellow-200 uppercase font-black">ACTIVE CAMPAIGN LEDGER</span>
                  <h3 className="font-serif font-black text-xl md:text-2xl leading-tight">Artisan Health and Welfare Contribution</h3>
                  <p className="text-xs text-brand-paper/85 max-w-2xl leading-relaxed">
                    100% of collected client funds are channeled directly into providing specialized primary mobile health vans, diagnostics screening kits, and doctor fees in Chhattisgarh and Odisha crafts hubs.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex gap-3 relative z-10 w-full sm:w-auto">
                <button 
                  onClick={() => setCurrentView('donate')}
                  className="bg-brand-paper hover:bg-brand-paper-dark text-brand-teal text-xs px-6 py-3.5 rounded-xl font-sans font-bold transition-all shadow-sm w-full sm:w-auto text-center cursor-pointer active:scale-95 duration-150"
                >
                  Sponsor Diagnostics Camp
                </button>
              </div>
            </section>

            {/* 7. NEW SECTION: AI INTERIOR SPACE CUSTOMIZER SHOWCASE */}
            <section className="border border-brand-line rounded-3xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-brand-paper-dark/35">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-mono text-brand-clay font-bold tracking-widest bg-brand-paper border border-brand-line px-3 py-1 rounded-full uppercase inline-flex items-center">
                  <Sparkles className="w-3 h-3 text-brand-ochre mr-1 animate-pulse" fill="#C38F36" /> Generative Space Modeling
                </span>
                <h2 className="font-serif font-black text-2xl text-brand-ink uppercase tracking-tight">AI Interior Design Studio</h2>
                <p className="text-xs text-brand-ink-soft leading-relaxed">
                  Struggling to figure out how a heavy Bastar brass bowl or high-fired ceramic platter coordinates with your specific home wallpaper or wooden furniture?
                </p>
                <p className="text-xs text-brand-ink-soft leading-relaxed bg-brand-paper border border-brand-line p-3 rounded-xl italic">
                  "Our built-in Gemini AI customizer simulates your dining table woods, wall textures, and lists customized ambient styling guides instantly!"
                </p>
                
                <div className="pt-2">
                  <button
                    onClick={() => {
                      // pick first product or open spaces
                      const matchedP = db.products[0];
                      if (matchedP) setSelectedProduct(matchedP);
                      setIsInteriorModalOpen(true);
                    }}
                    className="bg-brand-ink hover:bg-brand-ink/90 text-brand-paper font-sans text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    Launch Space Configurator <Sparkles className="w-4 h-4 text-yellow-300" />
                  </button>
                </div>
              </div>

              {/* Bento styled mock rendering animation blocks */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visual rendering mock box 1 */}
                <div className="bg-brand-paper border border-brand-line rounded-2xl p-4.5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-[10px] font-mono text-brand-ink-soft pb-2 border-b border-brand-line">
                    <span className="uppercase font-bold">CLIENT INPUT</span>
                    <span className="text-brand-clay">● READY</span>
                  </div>
                  <p className="text-xs text-brand-ink italic bg-brand-paper-dark/60 p-2.5 rounded-xl">
                    "Off-white paint, rustic oak dining table, bronze pendant hanging light."
                  </p>
                  <div className="h-28 rounded-xl overflow-hidden relative border border-brand-line/60">
                    <img 
                      src="https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=300" 
                      alt="Interior rendering" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-brand-paper bg-brand-clay px-2.5 py-1 rounded-md uppercase font-bold tracking-widest">PROPOSED LAYOUT</span>
                    </div>
                  </div>
                </div>

                {/* Visual rendering mock box 2 */}
                <div className="bg-brand-paper border border-brand-line rounded-2xl p-4.5 space-y-3 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-brand-ink-soft pb-2 border-b border-brand-line">
                      <span className="uppercase font-bold">GEMINI AI REC</span>
                      <span className="bg-green-100 text-green-700 px-1.5 rounded-md font-bold text-[9px]">SOLVED</span>
                    </div>
                    <div className="text-[11px] text-brand-ink-soft leading-relaxed space-y-1.5">
                      <p>✨ <strong>Contrast:</strong> Place the rich charcoal-brass Dhokra bowl directly on the oak grains.</p>
                      <p>✨ <strong>Harmony:</strong> Balance with dynamic beige cotton rugs to echo traditional clay tones.</p>
                    </div>
                  </div>
                  <div className="pt-2 text-right">
                    <span className="text-[9px] font-mono text-brand-clay uppercase tracking-wider block">Coordinated With Ceramic Plates</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. NEW SECTION: FEATURED ARTISAN story SPOTLIGHT */}
            <section className="bg-brand-paper border border-brand-line rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-line pb-4 gap-4">
                <div>
                  <h2 className="font-serif font-black text-xl text-brand-ink uppercase tracking-wider flex items-center">
                    <Award className="w-5 h-5 text-brand-clay mr-2" /> Featured Master Craftsman
                  </h2>
                  <p className="text-xs text-brand-ink-soft">Honoring the national award winners preserving oral tradition records.</p>
                </div>
                
                {/* Spotlight Selector */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSpotlightArtisan('suman')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${spotlightArtisan === 'suman' ? 'bg-brand-ink text-brand-paper' : 'bg-brand-paper text-brand-ink border-brand-line'}`}
                  >
                    Suman Devangan
                  </button>
                  <button 
                    onClick={() => setSpotlightArtisan('gopal')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${spotlightArtisan === 'gopal' ? 'bg-brand-ink text-brand-paper' : 'bg-brand-paper text-brand-ink border-brand-line'}`}
                  >
                    Gopal Sahu
                  </button>
                </div>
              </div>

              {/* Spotlight Display Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {spotlightArtisan === 'suman' ? (
                  <>
                    <div className="md:col-span-4 h-64 rounded-2xl overflow-hidden border border-brand-line">
                      <img 
                        src="https://images.unsplash.com/photo-1513519107129-14a172e38d75?auto=format&fit=crop&q=80&w=400" 
                        alt="Suman Devangan in workshop" 
                        className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="md:col-span-8 space-y-4">
                      <span className="text-[10px] font-mono text-brand-clay border border-brand-clay/30 bg-brand-clay/5 px-2.5 py-0.5 rounded-md uppercase font-bold">Dhokra Specialist • Chhattisgarh</span>
                      <blockquote className="font-serif text-lg italic text-brand-ink leading-relaxed">
                        "Each sculpture demands a complete transformation of materials. The wax molds dissolve completely during smelting, leaving every final copper figure as an absolute, unrepeatable visual statement."
                      </blockquote>
                      <div className="text-xs text-brand-ink-soft leading-relaxed space-y-2 max-w-2xl">
                        <p>Suman Devangan began shaping beeswax strings at the tender age of 9. Today, he directs a community furnace empowering over 12 tribal technicians, sustaining the historical wood-fired furnace arts.</p>
                      </div>
                      <div className="flex gap-4 items-center pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-serif font-black text-brand-clay">★ 4.9 Avg Rating</span>
                          <span className="text-[9px] text-[#6B5E52] font-mono">12 verified reviews</span>
                        </div>
                        <div className="w-px h-8 bg-brand-line" />
                        <div className="flex flex-col">
                          <span className="text-sm font-serif font-black text-brand-ink">5 Generations</span>
                          <span className="text-[9px] text-[#6B5E52] font-mono">Preserved Lineage</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-4 h-64 rounded-2xl overflow-hidden border border-brand-line">
                      <img 
                        src="https://images.unsplash.com/photo-1576016770956-debb63d90029?auto=format&fit=crop&q=80&w=400" 
                        alt="Gopal Sahu clay throw" 
                        className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="md:col-span-8 space-y-4">
                      <span className="text-[10px] font-mono text-green-700 border border-green-700/30 bg-green-500/5 px-2.5 py-0.5 rounded-md uppercase font-bold">Studio Clay Sculptor • Odisha</span>
                      <blockquote className="font-serif text-lg italic text-brand-ink leading-relaxed">
                        "The soil holds ancient life. Clay reacts to humidity, to your touch, and to the wood ash inside the brick kiln. No machine can reproduce the porous breathability of high-fired earthenware."
                      </blockquote>
                      <div className="text-xs text-brand-ink-soft leading-relaxed space-y-2 max-w-2xl">
                        <p>Gopal studied traditional clay chemistry in eastern Odisha, mixing lake clay and slipped pigments to develop non-toxic utensils that are structurally durable and biologically inert.</p>
                      </div>
                      <div className="flex gap-4 items-center pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-serif font-black text-[#86A171]">★ 4.8 Avg Rating</span>
                          <span className="text-[9px] text-[#6B5E52] font-mono">18 verified reviews</span>
                        </div>
                        <div className="w-px h-8 bg-brand-line" />
                        <div className="flex flex-col">
                          <span className="text-sm font-serif font-black text-brand-ink">7,000+ Pieces</span>
                          <span className="text-[9px] text-[#6B5E52] font-mono">Handmade to Date</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 9. NEW SECTION: JOURNAL STORIES & BRAND TRUST BADGES METADATA */}
            <section className="bg-brand-paper border border-brand-line rounded-3xl p-6 md:p-8 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <span className="text-[9px] font-mono uppercase bg-brand-line px-2 rounded font-bold text-brand-clay tracking-wider py-0.5">Physical trust index</span>
                <h3 className="font-serif font-bold text-lg text-brand-ink uppercase">Handcrafted Standings & Integrity</h3>
              </div>
              
              {/* Bento Trust Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center select-none">
                <div className="bg-brand-paper-dark/35 border border-brand-line rounded-2xl p-5 space-y-2 hover:shadow-md transition-shadow">
                  <div className="inline flex items-center justify-center p-3 bg-brand-clay text-brand-paper rounded-full mx-auto w-12 h-12">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-brand-ink uppercase">Direct Trade Yield</h4>
                  <p className="text-[11px] text-[#6B5E52] max-w-xs mx-auto leading-relaxed">
                    Zero speculative middlemen. Over 78% of the final sales value is directly settled into the artisan cluster bank accounts within 48 hours.
                  </p>
                </div>

                <div className="bg-brand-paper-dark/35 border border-brand-line rounded-2xl p-5 space-y-2 hover:shadow-md transition-shadow">
                  <div className="inline flex items-center justify-center p-3 bg-brand-ochre text-brand-paper rounded-full mx-auto w-12 h-12">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-brand-ink uppercase">Generational Authenticity</h4>
                  <p className="text-[11px] text-[#6B5E52] max-w-xs mx-auto leading-relaxed">
                    Every element is handcrafted using oral family instructions dating several centuries. Rigorous cluster inspection prevents machine copies.
                  </p>
                </div>

                <div className="bg-brand-paper-dark/35 border border-brand-line rounded-2xl p-5 space-y-2 hover:shadow-md transition-shadow">
                  <div className="inline flex items-center justify-center p-3 bg-green-700 text-brand-paper rounded-full mx-auto w-12 h-12">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-brand-ink uppercase">Ecological Safety First</h4>
                  <p className="text-[11px] text-[#6B5E52] max-w-xs mx-auto leading-relaxed">
                    Chemical-free Slip washes, raw plant colors, and pure alloy casting metals assure completely food-safe and child-safe household ornaments.
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VIEW: CATALOGUE LISTING */}
        {currentView === 'listing' && (
          <div className="space-y-6">
            
            {/* Header path */}
            <div className="flex items-center space-x-2 text-xs text-brand-ink-soft bg-brand-paper-dark/40 border border-brand-line/60 p-3 rounded-2xl select-none">
              <span onClick={() => setCurrentView('home')} className="hover:text-brand-clay cursor-pointer">Home</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-medium text-brand-ink">
                {selectedPillar ? selectedPillar.toUpperCase() : 'ALL ORGANIC ARTISAN CATALOGUE'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Faceted sidebar filter rail */}
              <div className="space-y-4 border border-brand-line p-4 rounded-3xl bg-brand-paper select-none h-fit">
                <div className="flex items-center justify-between border-b border-brand-line pb-2 mb-2">
                  <h3 className="font-serif font-bold text-sm text-brand-ink inline-flex items-center">
                    <SlidersHorizontal className="w-4.5 h-4.5 mr-1.5 text-brand-clay" /> Filter Crafts
                  </h3>
                  <button 
                    onClick={() => { setFilterMaterial(null); setFilterArtForm(null); }}
                    className="text-[10px] text-brand-ink-soft/80 hover:text-brand-clay underline"
                  >
                    Reset Filters
                  </button>
                </div>

                {/* Search box inline */}
                <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1 font-bold">Search Keywords</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. brass, clay, bowl..."
                      className="w-full bg-brand-paper border border-brand-line rounded-xl px-3 py-1.5 pl-8 text-xs text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-clay"
                    />
                    <Search className="w-3.5 h-3.5 absolute top-2.5 left-2.5 text-brand-ink-soft" />
                  </div>
                </div>

                {/* Materials select facet */}
                <div className="space-y-1">
                  <span className="block text-xs font-sans text-brand-ink-soft font-bold">Heritage Materials</span>
                  {['brass', 'terracotta', 'wood', 'silver', 'ceramic', 'fabric'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setFilterMaterial(filterMaterial === m ? null : m)}
                      className={`w-full text-left text-xs font-sans px-2 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                        filterMaterial === m ? 'bg-brand-clay text-brand-paper border-brand-clay' : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-paper-dark'
                      }`}
                    >
                      <span>{m.toUpperCase()}</span>
                      {filterMaterial === m && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Art Forms select facet */}
                <div className="space-y-1">
                  <span className="block text-xs font-sans text-brand-ink-soft font-bold">Art Styles</span>
                  {['dhokra', 'warli', 'meenakari', 'studio-pottery', 'hand-carved'].map((af) => (
                    <button
                      key={af}
                      onClick={() => setFilterArtForm(filterArtForm === af ? null : af)}
                      className={`w-full text-left text-xs font-sans px-2 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                        filterArtForm === af ? 'bg-brand-teal text-brand-paper border-brand-teal' : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-paper-dark'
                      }`}
                    >
                      <span>{af.toUpperCase()}</span>
                      {filterArtForm === af && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Sorting */}
                <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1 font-bold">Order Sort Criteria</label>
                  <select 
                    value={sortBy} 
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full bg-brand-paper border border-brand-line px-2.5 py-1.5 rounded-xl text-xs text-brand-ink focus:outline-none"
                  >
                    <option value="relevance">Popular Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Patron ratings</option>
                  </select>
                </div>
              </div>

              {/* Grid content */}
              <div className="lg:col-span-3">
                <div className="flex justify-between items-center border-b border-brand-line pb-2 mb-4">
                  <span className="text-xs text-brand-ink-soft font-mono uppercase">Results Found: {filteredProducts.length} crafts</span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="border border-brand-line p-12 text-center rounded-3xl bg-brand-paper/50 h-56 flex flex-col items-center justify-center">
                    <Compass className="w-8 h-8 text-brand-ink-soft/40 animate-spin mb-2" />
                    <p className="text-sm text-brand-ink-soft font-serif italic">We traversed our directories and could not spot any corresponding clay or silver records. Try adjusting selective parameters!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => (
                      <div 
                        key={p.id}
                        className="bg-brand-paper border border-brand-line rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
                      >
                        <div 
                          onClick={() => { setSelectedProduct(p); setCurrentView('pdp'); }}
                          className="h-64 bg-brand-paper-dark/30 overflow-hidden cursor-pointer relative"
                        >
                          <img src={p.images[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                          <span className="absolute top-2.5 left-2.5 bg-brand-paper border border-brand-line text-brand-ink text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-xs">
                            {p.artForm[0]}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div className="space-y-1.5">
                            <h3 
                              onClick={() => { setSelectedProduct(p); setCurrentView('pdp'); }}
                              className="font-serif text-sm font-black text-brand-ink hover:text-brand-clay cursor-pointer line-clamp-2 leading-tight"
                            >
                              {p.title}
                            </h3>
                            <p className="text-xs text-brand-ink-soft leading-relaxed line-clamp-2">{p.description}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-brand-line/50 mt-3 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-serif font-black text-brand-clay">₹{(p.price / 100).toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-brand-ink-soft/60 struck line-through">MRP: ₹{(p.mrp/100).toLocaleString('en-IN')}</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p, 1)}
                              className="bg-brand-ink hover:bg-brand-clay text-brand-paper hover:text-white px-3 py-1.5 rounded-xl text-[11px] font-sans font-medium transition-all cursor-pointer"
                            >
                              Add to Bag
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PRODUCT DETAIL PAGE (PDP) */}
        {currentView === 'pdp' && selectedProduct && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Back action */}
            <button 
              onClick={() => setCurrentView('listing')}
              className="inline-flex items-center space-x-1.5 text-xs text-brand-ink-soft hover:text-brand-ink pb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Listing</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Left Picture / orbital turntable 3D viewer container */}
              <div className="space-y-4">
                <div 
                  className="bg-brand-paper-dark/30 border border-brand-line rounded-3xl h-[400px] flex items-center justify-center overflow-hidden relative shadow-inner select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handle3DDragStart}
                  onMouseMove={handle3DDragMove}
                  onMouseUp={handle3DDragEnd}
                  onMouseLeave={handle3DDragEnd}
                >
                  {is3DActive ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center select-none w-full h-full">
                      {/* Interactive vector simulation representing turntable angle */}
                      <div className="w-64 h-64 relative bg-stone-100 rounded-full border border-brand-line flex items-center justify-center shadow-lg transform rotate-x-12">
                        <img 
                          src={selectedProduct.images[0]?.url} 
                          alt="3D Turntable view"
                          style={{ transform: `rotateY(${spinAngle}deg)` }}
                          className="w-56 h-56 object-contain pointer-events-none transition-transform duration-75"
                        />
                        {/* Shadow graphic */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-black/10 blur-md rounded-full" />
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center bg-brand-ink/80 text-brand-paper py-1.5 px-3 rounded-full mx-auto w-fit text-[10px] font-sans">
                         Drag horizontally to spin 360° |Turntable angle: {Math.round(spinAngle)}°
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={selectedProduct.images[0]?.url} 
                      alt={selectedProduct.title} 
                      className="w-full h-full object-cover" 
                    />
                  )}

                  {/* Toggle view mode triggers */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => setIs3DActive(!is3DActive)}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition-all shadow-md flex items-center space-x-1 cursor-pointer ${
                        is3DActive ? 'bg-brand-clay border-brand-clay text-brand-paper' : 'bg-brand-paper border-brand-line text-brand-ink hover:bg-brand-paper-dark'
                      }`}
                    >
                      <span>{is3DActive ? 'Static Picture' : 'View in 3D Turntable'}</span>
                    </button>
                  </div>
                </div>

                {/* Grid gallery thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.images.map((img, i) => (
                    <div key={i} className="border border-brand-line rounded-xl overflow-hidden h-20 bg-stone-100 shadow-xs cursor-pointer">
                      <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right specs and buy box */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] bg-brand-clay/10 text-brand-clay border border-brand-clay/20 uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Authentic {selectedProduct.artForm[0]} Form
                  </span>
                  <h1 className="font-serif font-serif text-2xl sm:text-3xl font-black text-brand-ink max-w-lg leading-tight tracking-tight">
                    {selectedProduct.title}
                  </h1>
                  
                  {/* Rating overview */}
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-brand-ochre flex items-center text-sm font-bold">
                       ★ {selectedProduct.ratingAvg}
                    </span>
                    <span className="text-xs text-brand-ink-soft">({selectedProduct.ratingCount} verification reviews)</span>
                  </div>
                </div>

                {/* Price tag */}
                <div className="bg-brand-paper-dark/30 p-4 border border-brand-line rounded-2xl flex items-center justify-between">
                  <div className="flex align-baseline space-x-2.5">
                    <span className="text-2xl font-serif font-black text-brand-ink">₹{(selectedProduct.price / 100).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-brand-ink-soft line-through pt-2">MRP: ₹{(selectedProduct.mrp / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-[10px] bg-brand-ochre text-brand-paper px-2 py-0.5 rounded font-black font-sans uppercase">
                    SAVE {selectedProduct.discountPct}% OFF
                  </span>
                </div>

                {/* Description editorial */}
                <p className="text-xs text-brand-ink leading-relaxed font-sans">{selectedProduct.description}</p>

                {/* Action forms */}
                <div className="flex space-x-3 items-center pt-3 border-t border-brand-line/50">
                  <div className="flex items-center space-x-1 border border-brand-line bg-brand-paper p-1.5 rounded-xl select-none">
                    <button onClick={() => setPdpQty(Math.max(1, pdpQty - 1))} className="px-2.5 py-1 text-sm bg-brand-paper-dark hover:bg-stone-300 rounded font-bold">-</button>
                    <span className="px-3 text-xs font-mono font-bold w-8 text-center">{pdpQty}</span>
                    <button onClick={() => setPdpQty(pdpQty + 1)} className="px-2.5 py-1 text-sm bg-brand-paper-dark hover:bg-stone-300 rounded font-bold">+</button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(selectedProduct, pdpQty)}
                    className="flex-1 bg-brand-clay hover:bg-brand-clay-deep text-brand-paper font-sans text-sm py-3.5 px-6 rounded-xl font-bold transition-all shadow-md cursor-pointer text-center"
                  >
                    Add to Craft Bowl Bag
                  </button>
                </div>

                {/* AI Design placement studio option button (Phase 4) */}
                <button
                  onClick={() => setIsInteriorModalOpen(true)}
                  className="w-full bg-brand-teal/10 hover:bg-brand-teal hover:text-white text-brand-teal font-sans text-xs py-3.5 px-4 rounded-xl font-bold border border-brand-teal/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Customize This for My Living Space (AI Interior Studio)</span>
                </button>
              </div>
            </div>

            {/* Down page Tabs: Artisan's backstory */}
            <div className="border-t border-brand-line pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Circular Portrait with Bio */}
                <div className="bg-brand-paper-dark/30 border border-brand-line p-5 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-paper border border-brand-line">
                      <img src="https://images.unsplash.com/photo-1513519107129-14a172e38d75?auto=format&fit=crop&q=80&w=150" alt="Karigar face" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-black text-brand-clay font-mono block">Featured Karigar</span>
                      <h4 className="font-serif font-bold text-sm text-brand-ink">Suman Devangan</h4>
                      <p className="text-[10px] text-brand-ink-soft">Bastar region metalsmith</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-brand-ink leading-relaxed italic">
                     "Each mold is constructed only once and shattered after cast, making your piece completely singular."
                  </p>
                </div>

                {/* Story */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-serif font-black text-lg text-brand-ink flex items-center">
                    <Award className="w-5 h-5 text-brand-clay mr-1.5" /> Story of Earthen Metallurgy
                  </h3>
                  <p className="text-xs text-brand-ink-soft leading-relaxed font-sans">
                     Passionate weavers and bronze alloys developers operate at absolute margins. Handcrafted on authentic lost-wax core molds. Firing temperature is kept around 1100°C for terracotta to ensure it is weather resilient.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: 3D SHOPPABLE LOOKBOOK LIST */}
        {currentView === 'lookbook' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-300">
            <h2 className="font-serif font-black text-2xl uppercase tracking-widest text-brand-ink text-center">Trending Ambient 3D Lookbook</h2>
            <p className="text-xs text-brand-ink-soft text-center max-w-xl mx-auto -mt-4">Browse pre-arranged style compositions tailored by smart schedule filters, and check out matching product trays in a single click.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {db.lookbooks.map((lb) => (
                <div key={lb.id} className="bg-brand-paper border border-brand-line rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-44 bg-stone-100 rounded-2xl flex items-center justify-center relative border border-brand-line">
                      <img src="https://images.unsplash.com/photo-1513519107129-14a172e38d75?auto=format&fit=crop&q=80&w=400" alt={lb.title} className="w-full h-full object-cover rounded-2xl opacity-80" />
                      <div className="absolute inset-0 bg-brand-ink/40 rounded-2xl flex flex-col items-center justify-center text-brand-paper p-4 text-center">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-yellow-300">Trending Style Score: {lb.trendScore}</span>
                        <h3 className="font-serif font-bold text-lg mt-1">{lb.title}</h3>
                        <p className="text-xs text-brand-paper/90 max-w-xs mt-1 leading-relaxed italic">"{lb.theme}"</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-[10px] text-brand-ink-soft font-mono uppercase">Products in lookbook:</span>
                       <div className="grid grid-cols-2 gap-2">
                         {lb.productIds.map(pId => {
                           const prod = db.products.find(item => item.id === pId);
                           if (!prod) return null;
                           return (
                             <div 
                               key={pId}
                               onClick={() => { setSelectedProduct(prod); setCurrentView('pdp'); }}
                               className="bg-brand-paper-dark border border-brand-line/50 rounded-xl p-2 flex items-center space-x-2 text-xs hover:border-brand-clay cursor-pointer"
                             >
                               <img src={prod.images[0]?.url} alt={prod.title} className="w-10 h-10 object-cover rounded bg-stone-100" />
                               <div className="min-w-0 flex-1">
                                 <h4 className="font-serif text-[11px] truncate">{prod.title}</h4>
                                 <span className="text-[10px] text-brand-clay">₹{(prod.price/100).toLocaleString('en-IN')}</span>
                               </div>
                             </div>
                           )
                         })}
                       </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      lb.productIds.forEach(pId => {
                        const item = db.products.find(p => p.id === pId);
                        if (item) handleAddToCart(item, 1);
                      });
                      alert('🎉 Full bento set added to bag! Review sizes and coupons in checkout drawer.');
                    }}
                    className="w-full bg-brand-ink hover:bg-brand-clay text-brand-paper hover:text-white py-2.5 px-4 rounded-xl text-xs font-sans font-bold transition-all shadow-sm"
                  >
                    🛍️ Add Full Style Trend Set to Cart Bag
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: WELFARE DONATIONS TERMINAL */}
        {currentView === 'donate' && (
          <div className="space-y-8 animate-in fade-in duration-300 select-none">
            <h2 className="font-serif font-black text-2xl uppercase tracking-widest text-brand-ink text-center">HUMANITARIAN TRANPARENCY PORTAL</h2>
            <p className="text-xs text-brand-ink-soft text-center max-w-xl mx-auto -mt-4">Direct sponsor clinical checkups or primary medicines for our handicraft makers. Generates government approved 80G tax-exemption receipts instantly.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Campaign target card */}
              <div className="lg:col-span-2 space-y-6">
                {db.campaigns.map((c) => {
                  const progressPct = Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100));
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCampaign(c)}
                      className={`bg-brand-paper border rounded-3xl p-6 transition-all cursor-pointer ${
                        selectedCampaign?.id === c.id ? 'border-brand-clay ring-1 ring-brand-clay shadow-md' : 'border-brand-line/60 hover:border-brand-clay'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <img src={c.cover.url} alt={c.title} className="w-full sm:w-40 h-32 object-cover rounded-2xl bg-stone-100" />
                        <div className="flex-1 space-y-2">
                          <span className="text-[9px] bg-brand-sage text-brand-paper px-2.5 py-0.5 rounded-full uppercase tracking-widest font-black font-mono">
                            {c.category.replace('_', ' ')}
                          </span>
                          <h3 className="font-serif font-bold text-base text-brand-ink leading-tight">{c.title}</h3>
                          <p className="text-xs text-brand-ink-soft leading-relaxed">{c.beneficiarySummary}</p>
                          
                          {/* Progress bar */}
                          <div className="pt-2">
                            <div className="h-2 w-full bg-brand-paper-dark border border-brand-line/60 rounded-full overflow-hidden">
                              <div style={{ width: `${progressPct}%` }} className="bg-brand-clay h-full" />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-brand-ink-soft mt-1.5 font-mono">
                              <span>Target: ₹{(c.goalAmount/100).toLocaleString('en-IN')}</span>
                              <span>Raised: {progressPct}% (₹{(c.raisedAmount/100).toLocaleString('en-IN')})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Disbursement Audit timeline */}
                      <div className="mt-5 pt-4 border-t border-brand-line/50">
                        <h4 className="text-[10px] text-brand-clay font-bold uppercase tracking-wider mb-2 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Disbursement Timeline
                        </h4>
                        <div className="space-y-2">
                          {c.disbursementMilestones.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] pb-1.5 border-b border-brand-line/30 last:border-none last:pb-0">
                              <div>
                                <span className="font-medium text-brand-ink block">{m.stage}</span>
                                <span className="text-[9px] text-brand-ink-soft">{m.releasedAt ? `Released on ${new Date(m.releasedAt).toLocaleDateString('en-IN')}` : 'Accrued Allocation'}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono leading-none ${m.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'}`}>
                                {m.status === 'verified' ? `Verified ₹${m.amount/100}` : 'planned'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sponsor Checkout terminal widget */}
              <div className="bg-brand-paper border border-brand-line p-5 rounded-3xl h-fit">
                <h3 className="font-serif font-black text-sm text-brand-ink uppercase tracking-wider mb-4 border-b border-brand-line pb-2 flex items-center">
                  <Award className="w-4.5 h-4.5 text-yellow-500 mr-2" /> Welfare sponsor widget
                </h3>

                {donationReceipt ? (
                  <div className="space-y-4 text-center py-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto animate-bounce" />
                    <h4 className="font-serif font-bold text-sm text-brand-ink leading-tight">Receipt Generated successfully!</h4>
                    <p className="text-xs text-brand-ink-soft">Receipt reference: <span className="font-mono text-[10px] bg-brand-paper-dark px-1 py-0.5 rounded">{donationReceipt.receiptNo}</span></p>
                    <p className="text-xs text-brand-ink-soft leading-relaxed">Tax exemption certificate was compiled under section 80G code and has been channalled to <strong>{donationReceipt.donorEmail}</strong>. Thank you for your warmth.</p>
                    <button 
                      onClick={() => setDonationReceipt(null)} 
                      className="bg-brand-ink text-brand-paper px-4 py-2 rounded-xl text-xs font-sans transition-all w-full"
                    >
                      Process Another Support Gift
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="block text-xs font-sans text-brand-ink-soft mb-1 font-bold">Select Welfare Target</span>
                      <p className="text-xs text-brand-ink font-serif italic bg-brand-paper-dark/40 px-3 py-2 border border-brand-line rounded-xl">
                        {selectedCampaign ? selectedCampaign.title : 'Please select an welfare card targets on the left.'}
                      </p>
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="block text-xs font-sans text-brand-ink-soft mb-1 font-bold">Preset Amounts</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[500, 1250, 5000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => { setDonationAmount(amt * 100); setCustomDonationInput(''); }}
                            className={`py-1.5 rounded-xl border text-xs font-mono transition-all ${
                              donationAmount === amt * 100 && !customDonationInput ? 'bg-brand-clay text-brand-paper border-brand-clay' : 'bg-brand-paper-dark text-brand-ink border-transparent hover:bg-stone-300'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-sans text-brand-ink-soft mb-1 font-bold">Custom Amount (₹)</span>
                      <input 
                        type="number" 
                        value={customDonationInput}
                        onChange={(e) => setCustomDonationInput(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full bg-brand-paper border border-brand-line rounded-xl p-2.5 text-xs text-brand-ink focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSponsorDonation}
                      disabled={!selectedCampaign || isDonating}
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper py-3 rounded-xl text-xs font-sans font-bold shadow-md transition-all flex items-center justify-center space-x-1"
                    >
                      {isDonating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>Sponsor Clinical diagnostics Unit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PUBLIC TIMELINE TRACKER */}
        {currentView === 'track' && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300 select-none">
            <h2 className="font-serif font-black text-2xl uppercase tracking-widest text-brand-ink text-center">Live Order Tracker</h2>
            <p className="text-xs text-brand-ink-soft text-center max-w-sm mx-auto -mt-4">Verify current status and dispatch logs through regional carriers.</p>

            <div className="bg-brand-paper border border-brand-line p-5 rounded-3xl space-y-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={trackOrderIdInput}
                  onChange={(e) => setTrackOrderIdInput(e.target.value)}
                  placeholder="e.g. order_1001 or CFT-2026-1001"
                  className="flex-1 bg-brand-paper border border-brand-line rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-clay"
                />
                <button
                  onClick={handleQueryOrderTracker}
                  className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs px-4 py-2 rounded-xl"
                >
                  Locate
                </button>
              </div>

              {trackOrderResult && (
                <div className="pt-4 border-t border-brand-line">
                  {trackOrderResult.error ? (
                    <p className="text-xs text-brand-clay font-bold">{trackOrderResult.error}</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs border-b border-brand-line pb-2">
                        <div>
                          <p className="font-bold">Invoice: {trackOrderResult.invoiceNo}</p>
                          <p className="text-[10px] text-brand-ink-soft">Carrier: Delhivery Economy Surface</p>
                        </div>
                        <span className="text-[10px] bg-brand-paper border border-brand-line px-2 rounded font-mono uppercase font-bold text-brand-clay">{trackOrderResult.status}</span>
                      </div>

                      {/* Vertical graphic line tracker */}
                      <div className="space-y-4">
                        {trackOrderResult.timeline?.map((step: any, sIdx: number) => (
                          <div key={sIdx} className="flex space-x-3 items-start relative">
                            <div className="flex flex-col items-center">
                              <span className="h-5 w-5 rounded-full bg-brand-clay text-brand-paper text-[10px] font-bold flex items-center justify-center">
                                {sIdx + 1}
                              </span>
                              {sIdx < trackOrderResult.timeline.length - 1 && <div className="h-8 w-0.5 bg-brand-clay mt-1" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-bold capitalize text-brand-ink">{step.status}</h4>
                              <p className="text-[10px] text-brand-ink-soft">{step.note}</p>
                              <span className="text-[9px] text-brand-ink-soft opacity-70 block mt-0.5">{new Date(step.at).toLocaleDateString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: MY SPACES PLACEMENTS LIST */}
        {currentView === 'spaces' && (
          <div className="space-y-6 animate-in fade-in duration-300 select-none">
            <h2 className="font-serif font-black text-2xl uppercase tracking-widest text-brand-ink text-center">My Savvy Placements Portfolio</h2>
            <p className="text-xs text-brand-ink-soft text-center -mt-4">Placements customized for your spatial layouts using premium cognitive advice.</p>

            {savedSpaces.length === 0 ? (
              <div className="border border-brand-line p-12 text-center rounded-3xl bg-brand-paper/50 h-56 flex flex-col items-center justify-center max-w-xl mx-auto">
                <Sparkles className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
                <p className="text-sm text-brand-ink-soft font-serif italic">No placement blueprints saved. Select "Customize for my interior" inside any item page to generate geometric style sheets!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedSpaces.map((item, id) => (
                  <div key={id} className="bg-brand-paper border border-brand-line rounded-3xl p-5 flex flex-col justify-between shadow-xs">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img src={item.productImg} alt="visualized product" className="w-14 h-14 object-cover rounded-xl bg-stone-100" />
                        <div>
                          <span className="text-[9px] bg-brand-clay text-brand-paper px-2 py-0.5 rounded font-bold">SAVED CANVAS</span>
                          <h4 className="font-serif text-sm font-bold truncate text-brand-ink mt-0.5">{item.productTitle}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-brand-ink bg-brand-paper-dark border border-brand-line/60 p-3 rounded-2xl leading-relaxed whitespace-pre-line font-sans">
                        {item.recommendation}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-brand-line/50 mt-4 flex items-center justify-between text-xs text-brand-ink-soft">
                      <span>Saved on: {item.date}</span>
                      <button 
                        onClick={() => {
                          const prod = db.products.find(p => p.title === item.productTitle);
                          if (prod) {
                            handleAddToCart(prod, 1, item.id);
                            alert('Added with customized spatial blueprints!');
                          }
                        }}
                        className="bg-brand-ink hover:bg-brand-clay text-brand-paper hover:text-white px-3.5 py-1.5 rounded-xl font-sans font-bold transition-all inline-flex items-center space-x-1"
                      >
                         Add customized version to Bag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------- */}
      {/* FLOATING AI CHAT CONCIERGE LAUNCHER                            */}
      {/* -------------------------------------------------------------- */}
      <AiCraftConcierge 
        products={db.products}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setCurrentView('pdp');
        }}
      />

      {/* -------------------------------------------------------------- */}
      {/* SLIDE OUT SHOPPING CART DRAWER PANEL                           */}
      {/* -------------------------------------------------------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs select-none">
          <div className="absolute top-0 right-0 w-full max-w-md h-screen bg-brand-paper shadow-2xl border-l border-brand-line flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Header drawer */}
            <div className="p-4 bg-brand-paper border-b border-brand-line flex items-center justify-between">
              <h3 className="font-serif font-black text-lg text-brand-ink uppercase tracking-wide flex items-center">
                <ShoppingBag className="w-5 h-5 mr-1.5 text-brand-clay" /> Shopping bag bowl
              </h3>
              <button onClick={() => setIsCartOpen(false)} className="text-brand-ink-soft hover:text-brand-clay font-bold text-sm tracking-wide">
                 X CLOSE
              </button>
            </div>

            {/* List scroll */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {cart.items.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center">
                  <Compass className="w-10 h-10 text-brand-ink-soft/30 animate-pulse mb-2" />
                  <p className="text-xs text-brand-ink-soft font-serif italic">Your cart is waiting for something handmade.</p>
                </div>
              ) : (
                cart.items.map((x) => (
                  <div key={x.productId} className="flex space-x-3 bg-brand-paper p-3 border border-brand-line rounded-2xl shadow-xs">
                    <img src={x.image} alt={x.title} className="w-14 h-14 object-cover rounded-xl bg-stone-100" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-serif text-xs font-bold truncate text-brand-ink leading-tight">{x.title}</h4>
                      <p className="text-xs text-brand-clay font-mono">₹{(x.unitPrice / 100).toLocaleString('en-IN')}</p>
                      
                      {x.customizationRef && (
                        <div className="text-[9px] bg-brand-clay/15 text-brand-clay px-2 py-0.5 rounded border border-brand-clay/20 w-fit leading-none">
                          Visual Plan customized
                        </div>
                      )}

                      {/* Quantity stepper update */}
                      <div className="flex items-center space-x-2 pt-1.5 justify-between">
                        <div className="flex items-center space-x-1 border border-brand-line p-1 rounded-lg">
                          <button onClick={() => handleUpdateQty(x.productId, x.qty - 1)} className="px-1.5 bg-brand-paper-dark rounded font-bold text-xs">-</button>
                          <span className="px-2 text-[11px] font-mono">{x.qty}</span>
                          <button onClick={() => handleUpdateQty(x.productId, x.qty + 1)} className="px-1.5 bg-brand-paper-dark rounded font-bold text-xs">+</button>
                        </div>
                        <button 
                          onClick={() => handleRemoveFromCart(x.productId)}
                          className="text-stone-400 hover:text-brand-clay transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sticky sum info */}
            {cart.items.length > 0 && (
              <div className="p-4 bg-brand-paper-dark border-t border-brand-line space-y-4">
                
                {/* Optional clinical welfare support */}
                <div className="bg-brand-paper border border-brand-line p-3 rounded-2xl flex items-center justify-between shadow-xs">
                  <span className="text-[11px] font-sans text-brand-ink-soft flex items-center space-x-1.5 leading-tight">
                    <Gift className="w-4.5 h-4.5 text-brand-clay flex-shrink-0 animate-pulse" />
                    <span>Opt-In: Support Bastar Clinical Camps for ₹120</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={cartWelfareOptIn}
                    onChange={(e) => {
                      setCartWelfareOptIn(e.target.checked);
                    }}
                    className="w-4.5 h-4.5 accent-brand-clay cursor-pointer"
                  />
                </div>

                {/* Coupon widget */}
                <div className="space-y-1.5">
                  <div className="flex space-x-1.5">
                    <input 
                      type="text" 
                      value={cartCouponInput}
                      onChange={(e) => setCartCouponInput(e.target.value)}
                      placeholder="e.g. KART10"
                      className="flex-1 bg-brand-paper text-xs border border-brand-line rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-clay"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="bg-brand-ink text-brand-paper text-xs px-3.5 py-1.5 rounded-xl border border-brand-ink hover:bg-stone-800"
                    >
                      Apply
                    </button>
                  </div>
                  {cart.couponCode && (
                    <p className="text-[10px] text-green-700 font-bold flex items-center">
                      <Check className="w-3.5 h-3.5 mr-0.5" /> Coupon KART10 (10% Discount) configured!
                    </p>
                  )}
                  {cartCouponError && <p className="text-[10px] text-brand-clay font-bold">{cartCouponError}</p>}
                </div>

                {/* Mathematical calculations table */}
                <div className="space-y-1 bg-brand-paper p-3 border border-brand-line rounded-2xl text-[11px] shadow-sm">
                  {(() => {
                    const totals = calculateTotals();
                    return (
                      <>
                        <div className="flex justify-between"><span>Basket Subtotal:</span><span>₹{(totals.subtotal/100).toLocaleString('en-IN')}</span></div>
                        {totals.discount > 0 && <div className="flex justify-between text-green-700 font-bold"><span>KART10 discount:</span><span>-₹{(totals.discount/100).toLocaleString('en-IN')}</span></div>}
                        {totals.giftWrap > 0 && <div className="flex justify-between"><span>Gift wrapping:</span><span>₹{(totals.giftWrap/100).toLocaleString('en-IN')}</span></div>}
                        {totals.shipping > 0 ? <div className="flex justify-between"><span>Transit handling:</span><span>₹{(totals.shipping/100).toLocaleString('en-IN')}</span></div> : <div className="flex justify-between text-brand-teal font-extrabold"><span>Transit:</span><span>FREE TRANST</span></div>}
                        <div className="flex justify-between border-t border-brand-line pt-1 mt-1 font-serif text-sm font-black text-brand-ink">
                          <span>Total Paise:</span>
                          <span>₹{(totals.total / 100).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper py-3 rounded-xl text-sm font-sans font-bold shadow-md transition-all text-center block cursor-pointer"
                >
                  Proceed with checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* DIRECT INTEGRATED CHECKOUT DIALOG MODAL                       */}
      {/* -------------------------------------------------------------- */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-brand-paper border border-brand-line w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Header checkout */}
            <div className="px-6 py-4 bg-brand-ink text-brand-paper flex items-center justify-between border-b border-brand-line">
              <h3 className="font-serif font-black text-base uppercase tracking-wider">Secured Direct Checkout</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-brand-paper/80 hover:text-white">CLOSE X</button>
            </div>

            <div className="p-6">
              {checkoutStep === 1 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-brand-line pb-2 mb-2">
                    <h4 className="font-serif font-black text-xs uppercase tracking-wider">Configure Delivery destination</h4>
                    <span className="text-[10px] font-mono text-brand-ink-soft bg-brand-paper-dark px-1.5 rounded">STEP 1 of 2</span>
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-sans text-brand-ink-soft mb-1 font-bold">Recipient Full Name</label>
                      <input 
                        type="text" 
                        value={shippingAddress.fullName} 
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-lg text-brand-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans text-brand-ink-soft mb-1 font-bold">Phone Number</label>
                      <input 
                        type="text" 
                        value={shippingAddress.phone} 
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-lg text-brand-ink focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans text-brand-ink-soft mb-1 font-bold font-bold select-none cursor-pointer">Pincode (Mock Autocomplete available)</label>
                      <form onSubmit={handleCheckPincode} className="flex space-x-1">
                        <input 
                          type="text" 
                          value={shippingAddress.pincode} 
                          onChange={(e) => {
                            setShippingAddress({ ...shippingAddress, pincode: e.target.value });
                            setPincodeServiceable(null);
                          }}
                          className="flex-1 bg-brand-paper border border-brand-line px-2.5 py-1.5 text-xs rounded-lg text-brand-ink focus:outline-none font-mono"
                        />
                        <button type="submit" className="bg-stone-200 text-brand-ink text-[10px] px-2.5 py-1 rounded-lg">verify</button>
                      </form>
                      {pincodeChecking && <span className="text-[9px] text-brand-clay-deep italic block">checking...</span>}
                      {pincodeServiceable === true && <span className="text-[9px] text-green-700 font-bold block">✓ Delhivery serviceable</span>}
                      {pincodeServiceable === false && <span className="text-[9px] text-brand-clay font-bold block">✗ pincode bad format</span>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-sans text-brand-ink-soft mb-1 font-bold">Address Line 1 (Google Places simulation)</label>
                      <input 
                        type="text" 
                        value={shippingAddress.line1} 
                        onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-style rounded-lg text-xs hover:border-brand-clay focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setCheckoutStep(2)}
                    disabled={pincodeServiceable === false}
                    className="w-full bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper text-sm py-2.5 px-4 rounded-xl font-bold transition-all shadow-md text-center"
                  >
                     Configure Transit Mode & Payouts
                  </button>
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-brand-line pb-2 mb-2">
                    <h4 className="font-serif font-black text-xs uppercase tracking-wider">Choose Gateway Method</h4>
                    <span className="text-[10px] font-mono text-brand-ink-soft bg-brand-paper-dark px-1.5 rounded">STEP 2 of 2</span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { id: 'razorpay', label: '💳 Razorpay Secured Sandbox Gateway', desc: 'Secure debit/credit, net banking & UPI' },
                      { id: 'cod', label: '📦 Cash on Delivery (COD Handling charge: Free)', desc: 'Pay instantly at doorstep delivery verification' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setPaymentMethod(mode.id as any)}
                        className={`w-full text-left p-3 rounded-2xl border text-xs font-sans transition-all flex flex-col justify-between ${
                          paymentMethod === mode.id ? 'border-brand-clay bg-brand-paper-dark' : 'border-brand-line/60 hover:border-brand-clay'
                        }`}
                      >
                        <span className="font-bold text-brand-ink">{mode.label}</span>
                        <span className="text-[10px] text-brand-ink-soft/80 mt-1">{mode.desc}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={executePurchaseCheckout}
                    disabled={isDonating}
                    className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-sm py-3 px-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    {isDonating ? <Loader2 className="w-4 h-4 animate-spin text-brand-paper" /> : null}
                    <span>Submit & Book Order (Paise verified)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* CHECKOUT DELIVERED ORDER DIALOG MODAL RECEIPT                 */}
      {/* -------------------------------------------------------------- */}
      {checkoutCompletedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in scale-in-95 duration-200">
          <div className="bg-brand-paper border border-brand-line w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-brand-teal text-brand-paper p-6 text-center shadow-inner relative">
              <CheckCircle2 className="w-12 h-12 text-yellow-300 mx-auto animate-bounce mb-2" />
              <h3 className="font-serif font-black text-lg tracking-wide uppercase">CRAFT PURCHASE BOOKED SUCCESS!</h3>
              <p className="text-xs text-brand-paper/80">Invoice reference: <span className="font-mono text-[10px] bg-brand-clay text-white px-2 py-0.5 rounded ml-1">{checkoutCompletedOrder.invoiceNo}</span></p>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans text-brand-ink leading-relaxed">
              <p className="text-center font-medium italic">"Thank you. A direct email invoice carrying a downloadable 80G tax-exempt certificate was channalled to <strong>aanya@example.com</strong>."</p>
              
              <div className="bg-brand-paper-dark p-3.5 border border-brand-line rounded-2xl font-mono text-[10px] space-y-1 block">
                <div className="flex justify-between"><span>Recipient:</span><span>{checkoutCompletedOrder.shippingAddress?.fullName}</span></div>
                <div className="flex justify-between"><span>Courier transit:</span><span>Delhivery Standard Surface</span></div>
                <div className="flex justify-between font-bold border-t border-brand-line pt-1 mt-1"><span>Paise Settled:</span><span>₹{(checkoutCompletedOrder.pricing?.total/100).toLocaleString('en-IN')}</span></div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const invoiceContent = `
                      CRAFTIFUE PLATFORM TAX INVOICE
                      Invoice No: ${checkoutCompletedOrder.invoiceNo}
                      Date: ${new Date(checkoutCompletedOrder.createdAt).toLocaleDateString('en-IN')}
                      Recipient: ${checkoutCompletedOrder.shippingAddress?.fullName}
                      Address: ${checkoutCompletedOrder.shippingAddress?.line1}, ${checkoutCompletedOrder.shippingAddress?.city}
                      -----------------------------------------------------------
                      Items Purchased:
                      ${checkoutCompletedOrder.items.map((i: any) => `- ${i.title} (x${i.qty}): ₹${((i.unitPrice * i.qty)/100).toFixed(2)}`).join('\n')}
                      -----------------------------------------------------------
                      GRAND TOTAL COMPLIED PAISE: ₹${(checkoutCompletedOrder.pricing?.total/100).toFixed(2)}
                      (Inclusive of 18% CGST + SGST)
                    `;
                    const blob = new Blob([invoiceContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `CRAFTIFUE_INVOICE_${checkoutCompletedOrder.invoiceNo}.txt`;
                    link.click();
                  }}
                  className="bg-brand-paper-dark hover:bg-stone-300 text-brand-ink text-[11px] px-3 py-2 rounded-xl border border-brand-line flex-1 text-center font-bold"
                >
                  Download TXT Invoice
                </button>
                <button
                  onClick={() => setCheckoutCompletedOrder(null)}
                  className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-[11px] px-3 py-2 rounded-xl flex-1 text-center font-bold"
                >
                  Dismiss & Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* DESIGNER AI INTERIOR STUDIO DIALOG MODAL                      */}
      {/* -------------------------------------------------------------- */}
      {isInteriorModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-brand-paper border border-brand-line w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl select-none">
            
            {/* Header style studio */}
            <div className="px-6 py-4 bg-brand-teal text-brand-paper flex items-center justify-between border-b border-brand-line">
              <h3 className="font-serif font-black text-base uppercase tracking-wider flex items-center">
                <Sparkles className="w-5 h-5 ml-1.5 text-yellow-300 animate-pulse mr-2" />
                AI Interior Customizer Studio (Phase 4)
              </h3>
              <button onClick={() => setIsInteriorModalOpen(false)} className="text-brand-paper/80 hover:text-white">CLOSE X</button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-brand-ink-soft leading-relaxed">
                Describe your targeted indoor drapes, wall colors, or wallpaper themes. Our premium architectural visualizer will formulate placing coordinates, matching materials, and visual palette arrangements matching this product.
              </p>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-brand-ink-soft mb-1">Indoor wallpaper & room layout details</label>
                <textarea 
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-brand-paper border border-brand-line/80 px-3 py-2 text-xs rounded-xl focus:outline-none"
                />
              </div>

              {customizationResult ? (
                <div className="bg-brand-paper-dark border border-brand-line p-4 rounded-2xl space-y-3">
                  <span className="text-[9px] bg-brand-clay text-brand-paper px-2 py-0.5 rounded font-bold">VIRTUAL BLUEPRINT RECOMMENDED</span>
                  <p className="text-xs text-brand-ink leading-relaxed whitespace-pre-line font-sans">
                    {customizationResult}
                  </p>
                  
                  <div className="flex space-x-2 pt-2 border-t border-brand-line">
                    <button
                      onClick={handleSaveSpacedRender}
                      className="bg-brand-paper-dark hover:bg-stone-300 text-brand-ink text-xs px-4 py-2 rounded-xl font-bold flex-1 text-center"
                    >
                      Save to My Placements Portfolio
                    </button>
                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct, 1, `saved_${Date.now()}`);
                        setIsInteriorModalOpen(false);
                        alert('Added with customized spatial blueprints!');
                      }}
                      className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs px-4 py-2 rounded-xl font-bold flex-1 text-center"
                    >
                      Proceed & add to bag
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={runAiInteriorDesigner}
                  disabled={isAiCustomizing}
                  className="w-full bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper py-3 rounded-xl text-xs font-sans font-bold shadow-md transition-all flex items-center justify-center space-x-1"
                >
                  {isAiCustomizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />}
                  <span>Formulate Placing coordinates Blueprint</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
