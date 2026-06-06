import React, { useState, useEffect } from 'react';
import { 
  BarChart, TrendingUp, Package, Users, Palette, Compass, Activity, Check, Plus, Trash2, 
  Sparkles, RotateCcw, Award, Mail, Calendar, CheckSquare, Megaphone, Loader2, RefreshCw, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Product, Artisan, Category, Campaign, Coupon, CommissionEntry, Lookbook } from '../types/firestore';

interface AdminPanelProps {
  db: {
    products: Product[];
    artisans: Artisan[];
    categories: Category[];
    campaigns: Campaign[];
    coupons: Coupon[];
    commissionLedger: CommissionEntry[];
    commissionProfiles: any[];
    payouts: any[];
    orders: any[];
    lookbooks: any[];
    logoConfig: { customImage: string | null; brandName: string; primaryColor: string };
    notifications: any[];
    autoStockRefill: boolean;
  };
  onUpdateDb: (updatedData: any) => void;
  onRefreshDb: () => void;
}

export default function AdminPanel({ db, onUpdateDb, onRefreshDb }: AdminPanelProps) {
  const [activeTab, setActiveTab ] = useState<'analytics' | 'products' | 'artisans' | 'outreach' | 'logo' | 'campaigns' | 'lookbooks' | 'coupons' | 'inventory' | 'commissions'>('analytics');
  
  // AI States
  const [isAiPredicting, setIsAiPredicting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiGeneratingId, setAiGeneratingId] = useState<string | null>(null);

  // Logo Editor State
  const [logoName, setLogoName] = useState(db.logoConfig.brandName);
  const [logoColor, setLogoColor] = useState(db.logoConfig.primaryColor);
  const [logoInput, setLogoInput] = useState(db.logoConfig.customImage || '');

  // Catalog Edit / Creational Buffer States
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingArtisan, setEditingArtisan] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingLookbook, setEditingLookbook] = useState<any>(null);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  // Inventory & Refill States
  const [manualStocks, setManualStocks] = useState<Record<string, number>>({});
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [isRefillingBatch, setIsRefillingBatch] = useState(false);

  // Commissions and Settings States
  const [commArtisanFilter, setCommArtisanFilter] = useState<string>(''); 
  const [commStatusFilter, setCommStatusFilter] = useState<string>('');   
  const [payoutReferenceNo, setPayoutReferenceNo] = useState<string>('');
  const [defaultCommProfile, setDefaultCommProfile] = useState<any>({
    id: 'default',
    name: 'Standard Artisan Commission Profile',
    onboardingPct: 3,
    perSalePct: 5,
    onboardingBase: 1000000,
    returnWindowDays: 7,
    isActive: true
  });
  const [isSavingCommProfile, setIsSavingCommProfile] = useState<boolean>(false);

  useEffect(() => {
    if (db.commissionProfiles && db.commissionProfiles.length > 0) {
      const p = db.commissionProfiles.find((x: any) => x.id === 'default') || db.commissionProfiles[0];
      setDefaultCommProfile(p);
    }
  }, [db.commissionProfiles]);

  // Lead Outreach States (Phase 5 Expert Finder)
  const [outreachBrief, setOutreachBrief] = useState('Chanderi weavers & zari stitchers in Chanderi dist.');
  const [isFindingLeads, setIsFindingLeads] = useState(false);
  const [outreachLeads, setOutreachLeads] = useState<any[]>([
    {
      id: 'out_lead_1',
      candidateName: 'Madhuri Pathak',
      candidateRegion: 'Chanderi, Madhya Pradesh',
      candidateCraft: ['block-print'],
      contactValue: 'madhuri.weaving@chanderi.org',
      emailDraft: 'Dear Madhuri-ji,\n\nWe saw your intricate gold-zari weaving motifs at the handicraft summit. We would love to direct-host your creations on Craftifue with our standard 3% on-boarding credits directly settled into your account ledger.\n\nWarmly,\nCraftifue Team',
      status: 'found'
    }
  ]);

  // Load Smart Predictive Analytical model on first tab display
  useEffect(() => {
    if (activeTab === 'analytics' && !aiAnalysis) {
      triggerAiPredictiveModel();
    }
  }, [activeTab]);

  const triggerAiPredictiveModel = async () => {
    setIsAiPredicting(true);
    try {
      const res = await fetch('/api/gemini/analytics');
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiPredicting(false);
    }
  };

  // Human-in-the-loop outreach pipeline runner
  const executeOutreachAction = (leadId: string, nextStatus: 'drafted' | 'contacted' | 'meeting_scheduled' | 'onboarded') => {
    setOutreachLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        let textUpdate = lead.emailDraft;
        let mockMeetingLink;
        if (nextStatus === 'meeting_scheduled') {
          mockMeetingLink = 'https://meet.google.com/cft-artisan-onboard';
        }
        return {
          ...lead,
          status: nextStatus,
          meetingLink: mockMeetingLink || lead.meetingLink
        };
      }
      return lead;
    }));

    // If final onboard, create the actual artisan entity in the database
    if (nextStatus === 'onboarded') {
      const targetLead = outreachLeads.find(l => l.id === leadId);
      if (targetLead) {
        const newArtisan: Artisan = {
          id: `artisan_${Date.now()}`,
          ownerUid: `user_seller_${Date.now()}`,
          name: targetLead.candidateName,
          slug: targetLead.candidateName.toLowerCase().replace(/\s+/g, '-'),
          region: targetLead.candidateRegion,
          craftSpecialty: targetLead.candidateCraft,
          materials: ['thread', 'fabric'],
          bio: 'Onboarded via expert finder machine intelligence campaign.',
          story: 'Passed regional auditing and met live onboarding standard parameters.',
          portfolio: [
            { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=200', type: 'image' }
          ],
          ratingAvg: 5.0,
          productCount: 0,
          onboardingStatus: 'onboarded',
          commissionProfileId: 'default',
          kycVerified: true,
          payoutMasked: '•••• 1221',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Post to backend database artisans
        fetch('/api/db/artisans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArtisan)
        }).then(() => {
          // Immediately reward default 3% onboarding credit
          const reward: CommissionEntry = {
            id: `col_${Date.now()}`,
            artisanId: newArtisan.id,
            type: 'onboarding',
            baseAmount: 1000000, 
            ratePct: 3,
            amount: 30000,       
            status: 'payable',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          fetch('/api/db/commissionLedger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reward)
          }).then(() => {
            onRefreshDb();
            alert(`🎉 Onboard success! ${targetLead.candidateName} added as artisan. ₹300 onboarding accrued reward has been booked in ledger.`);
          });
        });
      }
    }
  };

  const handleFinderAgentSleuth = async () => {
    setIsFindingLeads(true);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'outreach',
          payload: {
            name: 'Devi Sahu',
            crafts: ['dhokra', 'brass-diyas'],
            region: 'Bastar metal corridors'
          }
        })
      });
      const data = await response.json();
      const newLead = {
        id: `out_lead_${Date.now()}`,
        candidateName: 'Devi Sahu',
        candidateRegion: 'Kondagaon, Bastar Division',
        candidateCraft: ['dhokra'],
        contactValue: 'devi.bastar@brass.in',
        emailDraft: data.content,
        status: 'found'
      };
      setOutreachLeads(prev => [...prev, newLead]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFindingLeads(false);
    }
  };

  // AI copywriting rewrites
  const handleAiDescriptionGenerate = async (prodId: string, title: string, artForm: string, material: string) => {
    setAiGeneratingId(prodId);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          payload: { title, artForm: artForm || 'traditional', material: material || 'organic' }
        })
      });
      const data = await res.json();
      
      if (editingProduct) {
        setEditingProduct((prev: any) => ({
          ...prev,
          description: data.content
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingId(null);
    }
  };

  const handleAiArtisanStoryGenerate = async (artId: string, name: string, region: string, specs: string[]) => {
    setAiGeneratingId(artId);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'story',
          payload: { name, region, specialties: specs || [] }
        })
      });
      const data = await res.json();
      
      if (editingArtisan) {
        setEditingArtisan((prev: any) => ({
          ...prev,
          story: data.content
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingId(null);
    }
  };

  // Apply logo config branding
  const handleApplyLogoBranding = async () => {
    try {
      const res = await fetch('/api/logo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: logoName,
          primaryColor: logoColor,
          customImage: logoInput || null
        })
      });
      const data = await res.json();
      onUpdateDb({ logoConfig: data });
      alert('✨ Brand style applied in real-time! The heading header and accent tones are synchronized.');
    } catch (err) {
      console.error(err);
    }
  };

  // Generic Save / Submit handler that resolves POST or PUT correctly
  const handleSaveItem = async (collection: string, currentItem: any, setEditingItem: (val: any) => void) => {
    try {
      const collectionItems = db[collection as keyof typeof db] as any[];
      const isEditing = currentItem.id && collectionItems?.some((x: any) => x.id === currentItem.id);
      
      const itemId = isEditing ? currentItem.id : `${collection.substring(0, 3)}_${Date.now()}`;
      const url = isEditing 
        ? `/api/db/${collection}/${itemId}` 
        : `/api/db/${collection}`;
      const method = isEditing ? 'PUT' : 'POST';

      // Attach ID and compute auxiliary fields
      let payload = { ...currentItem };
      if (!isEditing) {
        payload.id = itemId;
      }

      if (collection === 'products') {
        const priceVal = Number(payload.price) || 0;
        const mrpVal = Number(payload.mrp) || priceVal;
        payload.discountPct = mrpVal > 0 ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
        payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
      } else if (collection === 'artisans') {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
      } else if (collection === 'campaigns') {
        payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
      } else if (collection === 'lookbooks') {
        payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
      } else if (collection === 'coupons') {
        payload.id = payload.code.toUpperCase();
        payload.code = payload.code.toUpperCase();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefreshDb();
        setEditingItem(null);
        alert(`✨ Saved ${collection.slice(0, -1)} successfully! Live changes applied immediately.`);
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while persisting updates to database.');
    }
  };

  // Generic deletion handler
  const handleDeleteItem = async (collection: string, id: string, setEditingItem: (val: any) => void) => {
    if (!confirm(`Are you sure you want to permanently delete this ${collection.slice(0, -1)}?`)) return;
    try {
      const res = await fetch(`/api/db/${collection}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefreshDb();
        setEditingItem(null);
        alert('🗑️ Deleted successfully! Page updated.');
      } else {
        alert('Could not delete item. Verify collection parameters.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error during deletion request.');
    }
  };

  // Creational Template Initializers
  const initNewProduct = () => ({
    id: '',
    title: 'New Artisanal Creation',
    slug: '',
    sku: `CFT-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
    description: 'Beautifully crafted using fine components and traditional wisdom.',
    artisanId: db.artisans[0]?.id || '',
    categoryPath: ['dining', 'ceramic-bowls'],
    pillar: 'dining',
    material: ['terracotta'],
    artForm: ['studio-pottery'],
    colors: ['Earthy Brown'],
    price: 120000, 
    mrp: 150000,   
    discountPct: 20,
    inventory: 10,
    variants: [],
    images: [{ url: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=600', type: 'image' }],
    dimensionsCm: { l: 20, w: 20, h: 20 },
    weightGrams: 800,
    tags: ['new-arrival', 'handcrafted'],
    status: 'active',
    ratingAvg: 4.8,
    ratingCount: 1,
    salesCount: 0,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const initNewArtisan = () => ({
    id: '',
    ownerUid: `user_seller_${Date.now()}`,
    name: 'Shree Karigar',
    slug: '',
    region: 'Kondagaon, Bastar Division',
    craftSpecialty: ['dhokra'],
    materials: ['brass'],
    bio: 'Renowned expert practicing regional heritage artistry.',
    story: 'Directly casting oral legacies handed down through historic workshops.',
    portfolio: [{ url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=600', type: 'image' }],
    ratingAvg: 4.9,
    productCount: 0,
    onboardingStatus: 'onboarded',
    commissionProfileId: 'default',
    kycVerified: true,
    payoutMasked: '•••• 7792',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const initNewCampaign = () => ({
    id: '',
    title: 'Monsoon Rainwater & Kiln Security Aid',
    slug: '',
    category: 'artisan_welfare',
    beneficiarySummary: 'Kiln sheds, fuel subsidies, and emergency rainfall protections.',
    story: 'We distribute high fire wood and organic clay slates to assist makers during monsoon surges, keeping traditional looms shielded.',
    cover: { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', type: 'image' },
    goalAmount: 20000000, 
    raisedAmount: 0,
    donorCount: 0,
    verifiedDocUrls: [],
    disbursementMilestones: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const initNewLookbook = () => ({
    id: '',
    title: 'Cozy Earth Studio Room Decor',
    slug: '',
    theme: 'Interpreting folk handlooms and studio pots inside clean contemporary residential spaces.',
    heroModel3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    productIds: [db.products[0]?.id || 'prod_dining_1'],
    trendScore: 92,
    refreshedAt: new Date().toISOString()
  });

  const initNewCoupon = () => ({
    id: '',
    code: 'CRAFT15',
    type: 'percent',
    value: 15,
    minOrder: 80000, 
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true
  });

  return (
    <div className="bg-brand-paper border border-brand-line rounded-3xl overflow-hidden shadow-xl" id="admin-workspace-layer">
      {/* Top Banner Navigation */}
      <div className="bg-brand-ink text-brand-paper px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-brand-line">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-brand-clay font-bold animate-pulse" />
          <h2 className="font-serif font-black text-xl tracking-tight uppercase">Craftifue Admin Console</h2>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0 font-mono text-xs">
          <span className="bg-brand-clay/20 text-brand-clay px-2 py-0.5 rounded text-[10px] font-bold">LIVE SYNC WORKING</span>
          <p className="text-brand-paper/75">ROLE: PLATFORM ADMINISTRATOR</p>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="border-b border-brand-line bg-brand-paper-dark/60 flex space-x-1 p-2 overflow-x-auto no-scrollbar decoration-none">
        {[
          { id: 'analytics', label: '📊 Predictive Trends AI', icon: TrendingUp },
          { id: 'products', label: '🛋️ Products Register', icon: Package },
          { id: 'inventory', label: '⚙️ Inventory & Refills', icon: RefreshCw },
          { id: 'artisans', label: '🎭 Artisan Directory', icon: Users },
          { id: 'commissions', label: '💵 Commissions & Settlements', icon: Award },
          { id: 'outreach', label: '🪶 Human CRM Finder', icon: Mail },
          { id: 'logo', label: '🎨 Site Logo & Brand', icon: Palette },
          { id: 'campaigns', label: '📢 Relief Campaigns', icon: Megaphone },
          { id: 'lookbooks', label: '📖 Editorial Lookbooks', icon: Compass },
          { id: 'coupons', label: '🎫 Promo Coupons', icon: CheckSquare }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setEditingProduct(null);
                setEditingArtisan(null);
                setEditingCampaign(null);
                setEditingLookbook(null);
                setEditingCoupon(null);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-sans font-medium rounded-xl transition-all cursor-pointer select-none border-0 ${
                activeTab === t.id 
                  ? 'bg-brand-clay text-brand-paper shadow-md font-bold' 
                  : 'text-brand-ink-soft hover:bg-brand-paper-dark hover:text-brand-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6">
        
        {/* 1. ANALYTICS TABS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-ink">AI-Powered Predictive Sales Analysis</h3>
                <p className="text-xs text-brand-ink-soft">Analyzes live orders, categories and commission payloads to forecast quarterly demand models.</p>
              </div>
              <button 
                onClick={triggerAiPredictiveModel}
                disabled={isAiPredicting}
                className="bg-brand-teal hover:bg-brand-teal/90 text-brand-paper px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center space-x-2 disabled:opacity-45 select-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiPredicting ? 'animate-spin' : ''}`} />
                <span>Re-Run AI Model</span>
              </button>
            </div>

            {/* Core Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-brand-paper-dark/40 border border-brand-line p-4 rounded-2xl">
                <p className="text-xs text-brand-ink-soft">Cumulative Platform GMV</p>
                <h4 className="font-serif font-bold text-2xl text-brand-ink mt-1">
                  ₹{(db.orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.pricing.total : 0), 0) / 100).toLocaleString('en-IN')}
                </h4>
                <span className="text-[10px] text-green-600 font-medium">↑ 14% this month</span>
              </div>
              <div className="bg-brand-paper-dark/40 border border-brand-line p-4 rounded-2xl">
                <p className="text-xs text-brand-ink-soft">Active Orders Confirmed</p>
                <h4 className="font-serif font-bold text-2xl text-brand-ink mt-1">{db.orders.length}</h4>
                <span className="text-[10px] text-brand-ink-soft font-mono">COD Pendings: {db.orders.filter(o => o.paymentStatus === 'cod_pending').length}</span>
              </div>
              <div className="bg-brand-paper-dark/40 border border-brand-line p-4 rounded-2xl">
                <p className="text-xs text-brand-ink-soft">Welfare Funds Disbursed</p>
                <h4 className="font-serif font-bold text-2xl text-brand-teal mt-1">
                  ₹{(db.campaigns.reduce((sum, c) => sum + c.disbursementMilestones.reduce((acc, m) => acc + (m.status === 'verified' ? m.amount : 0), 0), 0) / 100).toLocaleString('en-IN')}
                </h4>
                <span className="text-[10px] text-brand-teal font-medium">80G Tax-exempt verified</span>
              </div>
              <div className="bg-brand-paper-dark/40 border border-brand-line p-4 rounded-2xl">
                <p className="text-xs text-brand-ink-soft">Unsettled Commissions Ledger</p>
                <h4 className="font-serif font-bold text-2xl text-brand-clay mt-1">
                  ₹{(db.commissionLedger.reduce((sum, e) => sum + (e.status !== 'paid' ? e.amount : 0), 0) / 100).toLocaleString('en-IN')}
                </h4>
                <span className="text-[10px] text-brand-clay-deep font-mono">Artisans accrued payorable</span>
              </div>
            </div>

            {/* Smart Chart Area */}
            {isAiPredicting ? (
              <div className="bg-brand-paper-dark/30 border border-brand-line h-64 flex flex-col items-center justify-center rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-brand-clay mb-2" />
                <p className="text-sm font-serif italic text-brand-clay">Querying master forecasting node...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-brand-paper border border-brand-line p-4 rounded-2xl shadow-sm animate-in fade-in duration-300">
                  <h4 className="font-serif font-bold text-sm text-brand-ink mb-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-brand-clay mr-1.5" /> 3-Month Automated Demand Forecast (June - August 2026)
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aiAnalysis.forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDining" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C4683B" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#C4683B" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLighting" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1F5A58" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1F5A58" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDecor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D99A2B" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#D99A2B" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE7D6" />
                        <XAxis dataKey="month" stroke="#6B5E52" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6B5E52" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} tickLine={false} />
                        <Tooltip formatter={(value: any) => [`₹${(value/100).toLocaleString('en-IN')}`, 'Predicted Sales']} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="diningSales" name="Dining (Clay)" stroke="#C4683B" fillOpacity={1} fill="url(#colorDining)" />
                        <Area type="monotone" dataKey="lightingSales" name="Lighting (Lamps)" stroke="#1F5A58" fillOpacity={1} fill="url(#colorLighting)" />
                        <Area type="monotone" dataKey="decorSales" name="Wall Decor (Warli)" stroke="#D99A2B" fillOpacity={1} fill="url(#colorDecor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-brand-paper-dark/30 border border-brand-line p-4 rounded-2xl flex flex-col justify-between animate-in fade-in duration-300">
                  <div>
                    <span className="text-[9px] bg-brand-clay text-white px-2 py-0.5 rounded-full font-sans uppercase tracking-widest font-bold">Predictive Expert Analyst</span>
                    <h4 className="font-serif font-black text-brand-ink text-base mt-2">Gemini Demand Insights</h4>
                    <p className="text-xs text-brand-ink-soft italic font-serif mt-1">"{aiAnalysis.forecastSummary}"</p>
                    
                    <div className="mt-4 text-xs text-brand-ink leading-relaxed prose prose-sm overflow-y-auto max-h-40 scrollbar-thin">
                      <p className="whitespace-pre-line text-xs font-sans">{aiAnalysis.analysisMarkdown?.replace(/###|##|#/g, '')}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-brand-line mt-2 text-[10px] text-brand-ink-soft">
                     Model run: <span className="font-mono text-[9px] bg-brand-paper px-1 rounded">{aiAnalysis.modelUsed}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-brand-paper-dark/30 border border-brand-line h-40 flex items-center justify-center rounded-2xl">
                <button onClick={triggerAiPredictiveModel} className="bg-brand-clay text-brand-paper px-4 py-2 rounded-xl text-sm font-sans flex items-center space-x-2 border-0 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-yellow-200 animate-spin" />
                  <span>Execute Neural Predictive Audit</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. PRODUCTS DIRECTORY (CRUD) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-ink">Product Database Register</h3>
                <p className="text-xs text-brand-ink-soft">Edit, Add or Remove products dynamically from headers, catalog galleries and detail pages instantly.</p>
              </div>
              <button
                onClick={() => setEditingProduct(initNewProduct())}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold flex items-center justify-center space-x-1 border-0 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Product</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* List grid */}
              <div className="lg:col-span-7 space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {db.products.map((p) => (
                  <div key={p.id} className={`bg-brand-paper border p-3 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all ${editingProduct?.id === p.id ? 'border-brand-clay shadow' : 'border-brand-line'}`}>
                    <div className="flex items-center space-x-3">
                      <img src={p.images[0]?.url} alt={p.title} className="w-14 h-14 object-cover rounded-xl bg-stone-100 border border-brand-line" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-ink">{p.title}</h4>
                        <div className="text-xs text-brand-ink-soft flex flex-wrap gap-x-2 items-center">
                          <span>SKU: <span className="font-mono text-[10px] bg-brand-paper-dark px-1 rounded">{p.sku}</span></span>
                          <span>Price: <b>₹{(p.price / 100).toLocaleString('en-IN')}</b></span>
                          <span>Stock: <span className={`font-bold ${p.inventory < 5 ? 'text-brand-clay' : 'text-green-700'}`}>{p.inventory}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 border-s border-brand-line pl-3">
                      <button 
                        onClick={() => setEditingProduct(p)}
                        className="text-xs border border-brand-line hover:border-brand-clay bg-brand-paper text-brand-ink px-2.5 py-1.5 rounded-xl transition-all font-sans cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('products', p.id, setEditingProduct)}
                        className="text-xs border border-brand-line hover:bg-brand-clay hover:text-brand-paper text-brand-clay-deep p-1.5 rounded-xl transition-all cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor sidebar */}
              <div className="lg:col-span-5 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl sticky top-4">
                {editingProduct ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('products', editingProduct, setEditingProduct); }} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-line">
                      <div>
                        <span className="text-[10px] text-brand-clay font-bold font-mono tracking-wider uppercase block">{editingProduct.id ? 'EDIT MODE' : 'CREATE MODE'}</span>
                        <h4 className="font-serif font-black text-brand-ink text-base">{editingProduct.title || 'Create Product'}</h4>
                      </div>
                      <button type="button" onClick={() => setEditingProduct(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay font-mono">Cancel x</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Product Title</label>
                        <input 
                          type="text" 
                          required
                          value={editingProduct.title} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-xs rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">SKU Code</label>
                        <input 
                          type="text" 
                          value={editingProduct.sku} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Price (₹ INR)</label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct.price / 100} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Math.round(Number(e.target.value) * 100) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-xs rounded-xl focus:outline-none font-mono font-bold text-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">MRP Size (₹ INR)</label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct.mrp / 100} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, mrp: Math.round(Number(e.target.value) * 100) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Inventory</label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct.inventory} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, inventory: parseInt(e.target.value) || 0 })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Primary Pillar</label>
                        <select
                          value={editingProduct.pillar || 'dining'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, pillar: e.target.value as any })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="dining">Dining (Tableware)</option>
                          <option value="lighting">Lighting (Lamps)</option>
                          <option value="decor">Decor (Folk panels)</option>
                          <option value="garden">Garden (Terracotta)</option>
                          <option value="jewellery">Ethnic Jewellery</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Assign Artisan Source</label>
                        <select
                          value={editingProduct.artisanId}
                          onChange={(e) => setEditingProduct({ ...editingProduct, artisanId: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="">-- select maker --</option>
                          {db.artisans.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.region.split(',')[0]})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-[#7a644f] mb-0.5">categoryPath (comma separated)</label>
                        <input 
                          type="text" 
                          value={editingProduct.categoryPath?.join(', ') || ''} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, categoryPath: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-[11px] rounded-xl focus:outline-none font-mono"
                          placeholder="e.g. dining, ceramic-bowls"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-[#7a644f] mb-0.5">Materials (comma separated)</label>
                        <input 
                          type="text" 
                          value={editingProduct.material?.join(', ') || ''} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-[11px] rounded-xl focus:outline-none font-mono"
                          placeholder="e.g. brass, iron"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Primary Image URL Resource</label>
                      <input 
                        type="text" 
                        required
                        value={editingProduct.images?.[0]?.url || ''} 
                        onChange={(e) => {
                          const copy = [...(editingProduct.images || [])];
                          if (copy[0]) {
                            copy[0].url = e.target.value;
                          } else {
                            copy.push({ url: e.target.value, type: 'image' });
                          }
                          setEditingProduct({ ...editingProduct, images: copy });
                        }}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        placeholder="https://images.unsplash.com/promo-link..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-sans text-brand-ink-soft">Description</label>
                        <button
                          type="button"
                          onClick={() => handleAiDescriptionGenerate(editingProduct.id || 'new', editingProduct.title, editingProduct.artForm?.[0], editingProduct.material?.[0])}
                          disabled={aiGeneratingId === (editingProduct.id || 'new')}
                          className="bg-brand-clay/10 hover:bg-brand-clay hover:text-white text-brand-clay border border-brand-clay/20 text-[10px] px-2.5 py-1 rounded-lg font-sans transition-all flex items-center space-x-1 cursor-pointer select-none"
                        >
                          {aiGeneratingId === (editingProduct.id || 'new') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />}
                          <span>Generate Dynamic Script with AI</span>
                        </button>
                      </div>
                      <textarea 
                        value={editingProduct.description} 
                        required
                        rows={3}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans transition-all shadow-md font-bold uppercase tracking-wider border-0 cursor-pointer select-none"
                    >
                      Save & Propagate Changes
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Package className="w-8 h-8 text-brand-ink-soft/45 mb-2 animate-bounce" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select any item in the inventory register to modify or click <b>Onboard New Product</b> to build custom listings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ARTISANS DIRECTORY (CRUD) */}
        {activeTab === 'artisans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-ink">Artisan Partner Directory</h3>
                <p className="text-xs text-brand-ink-soft">Onboard traditional regional crafts handlers and track generational authenticity stories dynamically.</p>
              </div>
              <button 
                onClick={() => setEditingArtisan(initNewArtisan())}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold flex items-center justify-center space-x-1 border-0 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Artisan Partner</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* List grid */}
              <div className="lg:col-span-7 space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {db.artisans.map((a) => (
                  <div key={a.id} className={`bg-brand-paper border p-3 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all ${editingArtisan?.id === a.id ? 'border-brand-clay shadow' : 'border-brand-line'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-brand-line bg-brand-paper-dark flex items-center justify-center font-serif font-bold text-brand-clay text-lg shadow-inner">
                        {a.portfolio?.[0]?.url ? (
                          <img src={a.portfolio[0].url} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          a.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-ink">{a.name}</h4>
                        <p className="text-[11px] text-brand-ink-soft font-mono">Region: {a.region} | Hand: {a.craftSpecialty?.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 pl-3 border-s border-brand-line">
                      <button 
                        onClick={() => setEditingArtisan(a)}
                        className="text-xs border border-brand-line hover:border-brand-clay text-brand-ink bg-brand-paper px-2.5 py-1.5 rounded-xl transition-all font-sans cursor-pointer"
                      >
                        Edit Story
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('artisans', a.id, setEditingArtisan)}
                        className="text-xs border border-brand-line hover:bg-brand-clay hover:text-brand-paper text-brand-clay-deep p-1.5 rounded-xl transition-all cursor-pointer"
                        title="Delete artisan profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Artisan Backstory Editor */}
              <div className="lg:col-span-5 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl sticky top-4">
                {editingArtisan ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('artisans', editingArtisan, setEditingArtisan); }} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-line">
                      <div>
                        <span className="text-[10px] text-brand-clay font-bold font-mono uppercase tracking-widest block">{editingArtisan.id ? 'EDIT PROFILE' : 'NEW ONBOARD'}</span>
                        <h4 className="font-serif font-black text-brand-ink text-sm">{editingArtisan.name || 'Setup Artisan Partner'}</h4>
                      </div>
                      <button type="button" onClick={() => setEditingArtisan(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay font-mono">Cancel x</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Partner Name</label>
                        <input 
                          type="text" 
                          required
                          value={editingArtisan.name} 
                          onChange={(e) => setEditingArtisan({ ...editingArtisan, name: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Geographic Origin</label>
                        <input 
                          type="text" 
                          required
                          value={editingArtisan.region} 
                          onChange={(e) => setEditingArtisan({ ...editingArtisan, region: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                          placeholder="e.g. Bastar, Chhattisgarh"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-clay mb-0.5">Specialties (comma list)</label>
                        <input 
                          type="text" 
                          value={editingArtisan.craftSpecialty?.join(', ') || ''} 
                          onChange={(e) => setEditingArtisan({ ...editingArtisan, craftSpecialty: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-clay mb-0.5">Primary Raw Materials</label>
                        <input 
                          type="text" 
                          value={editingArtisan.materials?.join(', ') || ''} 
                          onChange={(e) => setEditingArtisan({ ...editingArtisan, materials: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Profile Photo/Portfolio URL</label>
                      <input 
                        type="text" 
                        required
                        value={editingArtisan.portfolio?.[0]?.url || ''} 
                        onChange={(e) => {
                          const copy = [...(editingArtisan.portfolio || [])];
                          if (copy[0]) {
                            copy[0].url = e.target.value;
                          } else {
                            copy.push({ url: e.target.value, type: 'image' });
                          }
                          setEditingArtisan({ ...editingArtisan, portfolio: copy });
                        }}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Short Biography Description</label>
                      <textarea 
                        value={editingArtisan.bio} 
                        rows={2}
                        required
                        onChange={(e) => setEditingArtisan({ ...editingArtisan, bio: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                        placeholder="Veteran weaver with over 30 years experience in royal weaves..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-sans text-brand-ink-soft">Generational Heritage Story (Longform)</label>
                        <button
                          type="button"
                          onClick={() => handleAiArtisanStoryGenerate(editingArtisan.id || 'new_art', editingArtisan.name, editingArtisan.region, editingArtisan.craftSpecialty)}
                          disabled={aiGeneratingId === (editingArtisan.id || 'new_art')}
                          className="bg-brand-clay/15 hover:bg-brand-clay hover:text-white text-brand-clay border border-brand-clay/20 text-[10px] px-2.5 py-1 rounded-lg font-sans transition-all flex items-center space-x-1 cursor-pointer select-none"
                        >
                          {aiGeneratingId === (editingArtisan.id || 'new_art') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />}
                          <span>Draft Heritage Story with AI</span>
                        </button>
                      </div>
                      <textarea 
                        value={editingArtisan.story || ''} 
                        rows={4}
                        required
                        onChange={(e) => setEditingArtisan({ ...editingArtisan, story: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                        placeholder="Paste or run storyteller script above..."
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans transition-all shadow-md font-bold uppercase tracking-wider border-0 cursor-pointer select-none"
                    >
                      Save Partner Configuration
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Users className="w-8 h-8 text-brand-ink-soft/45 mb-2 animate-pulse" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select an artisan, then configure historical heritage stories or invoke our storyteller writer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. AI OUTREACH FINDER */}
        {activeTab === 'outreach' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border border-brand-line bg-brand-paper p-4 rounded-3xl">
              <h3 className="font-serif font-bold text-base text-brand-ink flex items-center">
                <Compass className="w-5 h-5 text-brand-clay mr-1.5 animate-spin" /> 
                AI Handcrafted-Expert Finder Agent (Phase 5)
              </h3>
              <p className="text-xs text-brand-ink-soft mt-1 leading-relaxed">
                Enter your targeted craft requirements. Our intelligence engine parses local catalogs and geographic databases to create structured leads. **Personalized letters are drafted in sandbox, and NEVER send without manual administrator approval.**
              </p>

              <div className="mt-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                <input 
                  type="text" 
                  value={outreachBrief}
                  onChange={(e) => setOutreachBrief(e.target.value)}
                  placeholder="e.g. Traditional Mango-wood carving masters in Jaipur Division"
                  className="flex-1 bg-brand-paper border border-brand-line px-3.5 py-2 text-sm rounded-xl focus:outline-none"
                />
                <button
                  onClick={handleFinderAgentSleuth}
                  disabled={isFindingLeads}
                  className="bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper px-4 py-2 rounded-xl text-xs font-sans font-medium select-none cursor-pointer border-0 flex items-center space-x-1"
                >
                  {isFindingLeads ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Probe Artisan Leads</span>
                </button>
              </div>
            </div>

            {/* Pipeline list */}
            <div className="space-y-4">
              <h4 className="font-serif font-extrabold text-sm text-brand-ink uppercase tracking-wider">Active Outreach Catalog</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outreachLeads.map((lead) => (
                  <div key={lead.id} className="bg-brand-paper border border-brand-line rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Status indicator tag */}
                      <span className={`absolute top-4 right-4 text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full ${
                        lead.status === 'onboarded' ? 'bg-green-100 text-green-800' :
                        lead.status === 'meeting_scheduled' ? 'bg-indigo-100 text-indigo-800' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status}
                      </span>

                      <h4 className="font-serif font-bold text-sm text-brand-ink">{lead.candidateName}</h4>
                      <p className="text-xs text-brand-ink-soft">{lead.candidateRegion}</p>
                      
                      <div className="mt-3 bg-brand-paper-dark/30 border border-brand-line/60 p-2.5 rounded-xl">
                        <span className="text-[10px] text-brand-clay font-bold tracking-wider uppercase flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> Gemini Draft Letter (Human Verified Approving)
                        </span>
                        <pre className="text-[10px] text-brand-ink mt-1.5 whitespace-pre-wrap font-sans max-h-24 overflow-y-auto leading-relaxed border-t border-brand-line pt-2">
                          {lead.emailDraft}
                        </pre>
                      </div>

                      {lead.meetingLink && (
                        <div className="mt-2 bg-indigo-50 border border-indigo-100 p-2 rounded-xl flex items-center space-x-2 text-[10px] text-indigo-900 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Scheduler: <a href={lead.meetingLink} target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-700">Google Meet Conference Link</a></span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-line/50 flex flex-wrap gap-1.5">
                      {lead.status === 'found' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'contacted')}
                          className="bg-brand-teal text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium hover:bg-brand-teal/90 transition-all select-none border-0 cursor-pointer"
                        >
                          ✉️ Approve & Send Email
                        </button>
                      )}
                      {lead.status === 'contacted' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'meeting_scheduled')}
                          className="bg-indigo-600 text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium hover:bg-indigo-700 transition-all select-none border-0 cursor-pointer"
                        >
                          📆 Schedule Meet Call
                        </button>
                      )}
                      {lead.status === 'meeting_scheduled' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'onboarded')}
                          className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium transition-all select-none border-0 cursor-pointer"
                        >
                          🎉 Complete Onboard (+₹300 Credit Accrued)
                        </button>
                      )}
                      {lead.status === 'onboarded' && (
                        <span className="text-[10px] text-green-700 font-bold flex items-center">
                          <Check className="w-4 h-4 mr-0.5 text-green-700" /> Account fully configured in registry!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. BRAND STYLE CONFIG */}
        {activeTab === 'logo' && (
          <div className="bg-brand-paper border border-brand-line p-6 rounded-3xl animate-in fade-in duration-300">
            <h3 className="font-serif font-bold text-base text-brand-ink">Dynamic Brand & Logo Editor</h3>
            <p className="text-xs text-brand-ink-soft">Make real-time updates to your site branding. Update the logo instantly across all headers and components.</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1">Company Brand Name</label>
                  <input 
                    type="text" 
                    value={logoName}
                    onChange={(e) => setLogoName(e.target.value)}
                    className="w-full bg-brand-paper border border-brand-line px-3.5 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-clay"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1">Accent Theme Tint</label>
                  <div className="flex space-x-2">
                    {[
                      { code: '#C4683B', label: 'Clay Terracotta' },
                      { code: '#1F5A58', label: 'Earthy Pine' },
                      { code: '#2A211B', label: 'Ink Charcoal' }
                    ].map((cp) => (
                      <button 
                        key={cp.code}
                        type="button" 
                        onClick={() => setLogoColor(cp.code)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[11px] font-sans transition-all flex items-center justify-center space-x-1.5 cursor-pointer select-none ${
                          logoColor === cp.code ? 'bg-brand-ink text-brand-paper border-brand-ink font-bold' : 'bg-brand-paper border-brand-line hover:bg-brand-paper-dark'
                        }`}
                      >
                        <span style={{ backgroundColor: cp.code }} className="w-3 h-3 rounded-full border border-white" />
                        <span>{cp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                 <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1">Select and Upload Brand Logo File</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setLogoInput(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-brand-paper text-brand-ink-soft text-xs border border-dashed border-brand-line p-3 rounded-xl cursor-pointer hover:bg-brand-paper-dark transition-all focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-brand-ink-soft mb-1">OR Paste Brand Logo (Image Link / Base64 Data)</label>
                  <textarea 
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/... or paste image Base64 data schema"
                    className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none font-mono"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleApplyLogoBranding}
                  className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper py-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer border-0 select-none"
                >
                  Apply Brand Changes Real-Time
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="bg-brand-paper-dark/40 border border-brand-line p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-brand-ink-soft/60 uppercase tracking-widest font-mono">Real-Time Header Preview</span>
                
                <div className="mt-4 bg-brand-paper border border-brand-line px-6 py-4 rounded-2xl shadow-sm flex items-center justify-between w-full max-w-sm">
                  {/* Brand Logo Rendering */}
                  <div className="flex items-center space-x-2">
                    {logoInput ? (
                      <img src={logoInput} alt="Uploaded logo" className="max-h-8 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center select-none">
                        <span className="font-serif font-black text-lg italic tracking-tight text-brand-ink">{logoName}</span>
                        <div className="h-1.5 w-12 flex space-x-0.5 rounded-full overflow-hidden mt-0.5">
                          <span className="bg-brand-clay flex-1" />
                          <span className="bg-amber-400 flex-1" />
                          <span className="bg-brand-sage flex-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ color: logoColor }} className="text-xs font-serif font-bold italic">Authentic India</span>
                </div>
                
                <p className="text-[11px] text-brand-ink-soft/80 mt-4 leading-relaxed max-w-xs font-sans">
                  Updating brand configurations automatically synchronizes mega-menus, loader screens and accent button coloring schemas immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. CAMPAIGNS TAB (CRUD) */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F5A58]">Welfare Campaigns Partnership</h3>
                <p className="text-xs text-brand-ink-soft">Post humanitarian disaster assistance relief funds and plan verified disbursement schedules.</p>
              </div>
              <button 
                onClick={() => setEditingCampaign(initNewCampaign())}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold flex items-center justify-center space-x-1 border-0 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Campaign</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column Campaign listing */}
              <div className="lg:col-span-7 space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {db.campaigns.map((c) => (
                  <div key={c.id} className="bg-brand-paper border border-brand-line rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif font-black text-brand-ink text-base">{c.title}</h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingCampaign(c)}
                            className="text-xs px-2.5 py-1 border border-brand-line hover:border-brand-clay bg-brand-paper text-brand-ink rounded-lg cursor-pointer"
                          >
                            Edit Properties
                          </button>
                          <button
                            onClick={() => handleDeleteItem('campaigns', c.id, setEditingCampaign)}
                            className="p-1 px-1.5 border border-brand-line hover:bg-brand-clay-deep hover:text-brand-paper rounded-lg text-brand-clay-deep cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-brand-ink-soft leading-relaxed">
                        <p>{c.beneficiarySummary}</p>
                        <p className="font-bold text-brand-ink mt-2">Goal Target: <b>₹{(c.goalAmount/100).toLocaleString('en-IN')}</b> | Raised : <b>₹{(c.raisedAmount/100).toLocaleString('en-IN')}</b></p>
                      </div>
                      
                      <div className="mt-3 bg-brand-paper-dark/40 p-3 rounded-xl border border-brand-line/60">
                        <span className="text-[10px] text-brand-clay font-black uppercase tracking-wider block">Disbursement Milestones Ledger</span>
                        <div className="mt-1 space-y-2">
                          {c.disbursementMilestones && c.disbursementMilestones.length > 0 ? (
                            c.disbursementMilestones.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] border-b border-brand-line/45 pb-1.5 last:border-0 last:pb-0">
                                <div>
                                  <p className="font-medium text-brand-ink">{m.stage}</p>
                                  <p className="text-[9px] text-brand-ink-soft">{m.releasedAt ? `Released on ${new Date(m.releasedAt).toLocaleDateString()}` : 'Planned'}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono leading-none ${m.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {m.status === 'verified' ? `Verified ₹${m.amount/100}` : `Planned ₹${m.amount/100}`}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] italic text-brand-ink-soft">No disburse schedules mapped yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Add Custom Milestone inside dynamic card */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const stage = fd.get('stage') as string;
                      const amount = parseInt(fd.get('amount') as string) * 100;
                      if (!stage || !amount) return;

                      const updatedMilestones = [...(c.disbursementMilestones || []), { stage, amount, status: 'planned' }];
                      const updatedPayload = { ...c, disbursementMilestones: updatedMilestones };

                      fetch(`/api/db/campaigns/${c.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedPayload)
                      }).then(() => {
                        onRefreshDb();
                        alert('Disbursement milestone uploaded schedule successfully.');
                        e.currentTarget.reset();
                      });
                    }} className="mt-4 pt-3 border-t border-brand-line/50 grid grid-cols-2 gap-2">
                      <input type="text" name="stage" placeholder="New planned stage description" className="bg-brand-paper border border-brand-line px-2 py-1 text-xs rounded-lg" required />
                      <div className="flex space-x-1">
                        <input type="number" name="amount" placeholder="₹ Amount" className="bg-brand-paper border border-brand-line px-2 py-1 text-xs rounded-lg w-20 font-mono" required />
                        <button type="submit" className="bg-brand-clay text-brand-paper text-[10px] px-2.5 py-1 rounded-lg border-0 cursor-pointer">Post</button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>

              {/* Right Column edit Campaign properties */}
              <div className="lg:col-span-5 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl sticky top-4">
                {editingCampaign ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('campaigns', editingCampaign, setEditingCampaign); }} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-line">
                      <h4 className="font-serif font-black text-brand-ink text-sm">{editingCampaign.id ? 'Edit Campaign Info' : 'Publish Welfare Program'}</h4>
                      <button type="button" onClick={() => setEditingCampaign(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay font-mono">Cancel x</button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Campaign Title</label>
                      <input 
                        type="text" 
                        required
                        value={editingCampaign.title} 
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Target Category</label>
                        <select
                          value={editingCampaign.category || 'artisan_welfare'}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, category: e.target.value as any })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="artisan_welfare">Artisan Welfare (Kits/Shields)</option>
                          <option value="medical">Medical (Health Camps)</option>
                          <option value="education">Education (Scholarships)</option>
                          <option value="disaster_relief">Disaster Relief</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Goal Budget (₹ INR)</label>
                        <input 
                          type="number" 
                          required
                          value={editingCampaign.goalAmount / 100} 
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, goalAmount: Math.round(Number(e.target.value) * 100) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Cover Image Header URL</label>
                      <input 
                        type="text" 
                        required
                        value={editingCampaign.cover?.url || ''} 
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, cover: { url: e.target.value, type: 'image' } })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Beneficiary Summary Statement</label>
                      <input 
                        type="text" 
                        required
                        value={editingCampaign.beneficiarySummary} 
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, beneficiarySummary: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Long-Form Story & Motive</label>
                      <textarea 
                        value={editingCampaign.story || ''} 
                        rows={4}
                        required
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, story: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                        placeholder="Describe the target impact, logistics and verified NGOs involved..."
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#1F5A58] hover:bg-[#15413f] text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold transition-all border-0 cursor-pointer select-none"
                    >
                      Publish/Update Campaign
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Megaphone className="w-8 h-8 text-[#1F5A58]/45 mb-2 animate-bounce" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select a campaign or click Onboard New Campaign to set up dynamic aid panels.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. LOOKBOOKS TAB (CRUD) */}
        {activeTab === 'lookbooks' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-clay">Dynamic Editorial Lookbooks</h3>
                <p className="text-xs text-brand-ink-soft">Design seasonal lookbooks, tagging specific products to build "Shop the Look" editorial modules.</p>
              </div>
              <button 
                onClick={() => setEditingLookbook(initNewLookbook())}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold flex items-center justify-center space-x-1 border-0 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Lookbook</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* List left side */}
              <div className="lg:col-span-7 space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {db.lookbooks.map((lb) => (
                  <div key={lb.id} className={`bg-brand-paper border p-4 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all ${editingLookbook?.id === lb.id ? 'border-brand-clay shadow' : 'border-brand-line'}`}>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-brand-ink">{lb.title}</h4>
                      <p className="text-xs text-brand-ink-soft italic leading-normal mt-1 max-w-md">"{lb.theme}"</p>
                      <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-brand-clay font-bold">
                        <span>Trend Score: {lb.trendScore || 90}%</span>
                        <span>•</span>
                        <span>Linked Products: {lb.productIds?.length || 0} items</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 pl-3 border-s border-brand-line">
                      <button 
                        onClick={() => setEditingLookbook(lb)}
                        className="text-xs border border-brand-line hover:border-brand-clay text-brand-ink bg-brand-paper px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('lookbooks', lb.id, setEditingLookbook)}
                        className="border border-brand-line hover:bg-brand-clay-deep hover:text-brand-paper text-brand-clay-deep p-1.5 rounded-xl cursor-pointer"
                        title="Delete lookbook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit side */}
              <div className="lg:col-span-5 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl sticky top-4">
                {editingLookbook ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('lookbooks', editingLookbook, setEditingLookbook); }} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-line">
                      <h4 className="font-serif font-black text-brand-ink text-sm">{editingLookbook.id ? 'Edit Lookbook Theme' : 'Design Seasonal Lookbook'}</h4>
                      <button type="button" onClick={() => setEditingLookbook(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay font-mono">Cancel x</button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Lookbook Title</label>
                      <input 
                        type="text" 
                        required
                        value={editingLookbook.title} 
                        onChange={(e) => setEditingLookbook({ ...editingLookbook, title: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Aesthetic Theme Synopsis</label>
                      <textarea 
                        required
                        value={editingLookbook.theme} 
                        rows={3}
                        onChange={(e) => setEditingLookbook({ ...editingLookbook, theme: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                        placeholder="e.g. Earthy minimal tones pairing raw slate clay dining servers with traditional brass lattice lights..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Trend Score (0-100)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          max="100"
                          value={editingLookbook.trendScore} 
                          onChange={(e) => setEditingLookbook({ ...editingLookbook, trendScore: parseInt(e.target.value) || 90 })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">3D Viewer GLB link (optional)</label>
                        <input 
                          type="text" 
                          value={editingLookbook.heroModel3dUrl} 
                          onChange={(e) => setEditingLookbook({ ...editingLookbook, heroModel3dUrl: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Tagged Product ID associations (Checkboxes / Select options toggle)</label>
                      <div className="max-h-40 overflow-y-auto bg-brand-paper border border-brand-line p-2.5 rounded-xl space-y-2">
                        {db.products.map(p => {
                          const isChecked = editingLookbook.productIds?.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center space-x-2 text-xs text-brand-ink cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  let currentIds = editingLookbook.productIds ? [...editingLookbook.productIds] : [];
                                  if (e.target.checked) {
                                    if (!currentIds.includes(p.id)) currentIds.push(p.id);
                                  } else {
                                    currentIds = currentIds.filter(id => id !== p.id);
                                  }
                                  setEditingLookbook({ ...editingLookbook, productIds: currentIds });
                                }}
                                className="rounded text-brand-clay focus:ring-brand-clay"
                              />
                              <span>{p.title} <span className="text-[10px] text-brand-ink-soft font-mono">({p.id})</span></span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold border-0 cursor-pointer select-none"
                    >
                      Save Lookbook Setup
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Compass className="w-8 h-8 text-brand-clay/45 mb-2 animate-spin" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select a lookbook or click Publish New Lookbook to design dynamic styled editorial frames.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. PROMO COUPONS TAB (CRUD) */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-teal">Promo Coupons & Discounts</h3>
                <p className="text-xs text-brand-ink-soft">Create percentages or fixed-rupees promotional discount vouchers that apply on checkouts instantly.</p>
              </div>
              <button 
                onClick={() => setEditingCoupon(initNewCoupon())}
                className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold flex items-center justify-center space-x-1 border-0 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side listing */}
              <div className="lg:col-span-7 space-y-3 max-h-[550px] overflow-y-auto pr-2 font-sans text-xs">
                {db.coupons.map((c) => (
                  <div key={c.id} className={`bg-brand-paper border p-4 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all ${editingCoupon?.id === c.id ? 'border-brand-clay shadow' : 'border-brand-line'}`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm uppercase bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded border border-brand-teal/20 tracking-wider">
                          {c.code}
                        </span>
                        <span className={`h-2.5 w-2.5 rounded-full ${c.isActive ? 'bg-green-600' : 'bg-stone-400'}`} />
                      </div>
                      <p className="text-xs text-brand-ink mt-2">
                        Benefit: <b>{c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value/100} Fixed Coupon`}</b>
                      </p>
                      <p className="text-[11px] text-brand-ink-soft">
                        Min spend: ₹{(c.minOrder ? c.minOrder/100 : 0)} | Used limits recorded: {c.usedCount} times applied
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 pl-3 border-s border-brand-line">
                      <button 
                        onClick={() => setEditingCoupon(c)}
                        className="text-xs border border-brand-line hover:border-brand-clay text-brand-ink bg-brand-paper px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('coupons', c.id, setEditingCoupon)}
                        className="border border-brand-line hover:bg-brand-clay-deep hover:text-brand-paper text-brand-clay-deep p-1.5 rounded-xl cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side Editing Form */}
              <div className="lg:col-span-5 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl sticky top-4">
                {editingCoupon ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('coupons', editingCoupon, setEditingCoupon); }} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-line">
                      <h4 className="font-serif font-black text-brand-ink text-sm">{editingCoupon.id ? 'Edit Coupon Parameters' : 'Deploy Promo Code'}</h4>
                      <button type="button" onClick={() => setEditingCoupon(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay font-mono">Cancel x</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1 font-mono">COUPON CODE (UPPERCASE)</label>
                        <input 
                          type="text" 
                          required
                          value={editingCoupon.code} 
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono uppercase tracking-wider font-bold"
                          placeholder="e.g. MONSOON10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Discount Type</label>
                        <select
                          value={editingCoupon.type || 'percent'}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="percent">Percentage % Off</option>
                          <option value="flat">Flat ₹ (INR) Amount Off</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">
                          {editingCoupon.type === 'percent' ? 'Discount Value (% Off)' : 'Discount Value (₹ INR)'}
                        </label>
                        <input 
                          type="number" 
                          required
                          value={editingCoupon.type === 'percent' ? editingCoupon.value : (editingCoupon.value / 100)} 
                          onChange={(e) => {
                            const inputVal = Number(e.target.value);
                            setEditingCoupon({ 
                              ...editingCoupon, 
                              value: editingCoupon.type === 'percent' ? inputVal : Math.round(inputVal * 100) 
                            });
                          }}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Min Order Requirement (₹ INR)</label>
                        <input 
                          type="number" 
                          required
                          value={(editingCoupon.minOrder || 0) / 100} 
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrder: Math.round(Number(e.target.value) * 100) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Starts At Timestamp</label>
                        <input 
                          type="text" 
                          required
                          value={editingCoupon.startsAt || ''} 
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, startsAt: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-brand-ink-soft mb-1">Ends At Timestamp</label>
                        <input 
                          type="text" 
                          required
                          value={editingCoupon.endsAt || ''} 
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, endsAt: e.target.value })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-1.5 text-xs rounded-xl focus:outline-none font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="isActive"
                        checked={editingCoupon.isActive}
                        onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                        className="rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <label htmlFor="isActive" className="text-xs text-brand-ink-soft font-medium cursor-pointer select-none">
                        Voucher is currently active and can be redeemed on checkout
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-brand-teal hover:bg-brand-teal/90 text-brand-paper text-xs py-2 px-4 rounded-xl font-sans font-bold border-0 cursor-pointer select-none"
                    >
                      Publish Voucher Code
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <CheckSquare className="w-8 h-8 text-brand-teal/45 mb-2 animate-bounce" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select an existing coupon or click Create New Coupon to release platform-wide incentives.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. INVENTORY & REFILLS TAB (DYNAMIC MANAGEMENT & ALERTS) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-300 font-sans mt-2" id="inventory-management-dashboard">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-brand-line pb-4">
              <div>
                <h3 className="font-serif font-black text-xl text-brand-ink">Inventory Controller & Auto Stock Refill</h3>
                <p className="text-xs text-brand-ink-soft">Track real-time stock counts, configure auto-replenishment levels, and view system logistics telemetry logs.</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {/* Auto Refill Mode Status Toggle */}
                <button
                  type="button"
                  disabled={isUpdatingConfig}
                  onClick={async () => {
                    setIsUpdatingConfig(true);
                    try {
                      const currentVal = db.autoStockRefill;
                      const res = await fetch('/api/config/refill', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enabled: !currentVal })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        onRefreshDb();
                        alert(`🔄 Auto stock refill system is now ${data.autoStockRefill ? 'ENABLED' : 'DISABLED'}`);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsUpdatingConfig(false);
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border-0 flex items-center space-x-1.5 cursor-pointer select-none ${
                    db.autoStockRefill !== false
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingConfig ? 'animate-spin' : ''}`} />
                  <span>Auto Stock Refill: {db.autoStockRefill !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                </button>

                {/* Batch Refill All Trigger */}
                <button
                  type="button"
                  disabled={isRefillingBatch}
                  onClick={async () => {
                    setIsRefillingBatch(true);
                    try {
                      const res = await fetch('/api/inventory/refill', { method: 'POST' });
                      if (res.ok) {
                        const data = await res.json();
                        onRefreshDb();
                        alert(`🎉 Stock replenishing completed! Autocast refilled ${data.refilledCount} low stock creations.`);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsRefillingBatch(false);
                    }
                  }}
                  className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center space-x-1.5 border-0 cursor-pointer select-none shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Quick Refill Low Stock Items</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Product Inventory Table */}
              <div className="lg:col-span-8 bg-brand-paper border border-brand-line p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-brand-ink flex items-center">
                    <Package className="w-4 h-4 mr-1.5 text-brand-clay" /> Product Inventories Register ({db.products.length} Products lists)
                  </h4>
                  <span className="text-[10px] font-mono text-brand-ink-soft">CHANGES STREAM IN REAL TIME TO THE SHOP FRONTEND</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-line text-brand-ink-soft uppercase text-[10px] tracking-wider">
                        <th className="pb-2 font-medium">Product / SKU</th>
                        <th className="pb-2 font-medium">Status Badge</th>
                        <th className="pb-2 font-medium">Current Stock</th>
                        <th className="pb-2 font-medium text-right font-bold text-brand-ink">Override Stock Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.products.map((p) => {
                        const currentVal = manualStocks[p.id] !== undefined ? manualStocks[p.id] : p.inventory;
                        let statusColor = 'bg-stone-100 text-stone-700';
                        let statusLabel = 'In Stock';
                        if (p.inventory <= 0) {
                          statusColor = 'bg-red-100 text-red-700 border border-red-200';
                          statusLabel = 'OUT of stock';
                        } else if (p.inventory <= 4) {
                          statusColor = 'bg-amber-100 text-amber-800 border border-amber-200';
                          statusLabel = 'Low warning';
                        } else {
                          statusColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                          statusLabel = 'Healthy';
                        }

                        return (
                          <tr key={p.id} className="border-b border-brand-line/50 hover:bg-brand-paper-dark/30 transition-all">
                            <td className="py-3 pr-2">
                              <div className="flex items-center space-x-2.5">
                                <img src={p.images?.[0]?.url} alt="" className="w-10 h-10 object-cover rounded-lg border border-brand-line bg-stone-100" referrerPolicy="no-referrer" />
                                <div>
                                  <p className="font-serif font-bold text-brand-ink leading-tight">{p.title}</p>
                                  <p className="text-[10px] font-mono text-brand-ink-soft">{p.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-sm">
                              {p.inventory}
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setManualStocks({ ...manualStocks, [p.id]: val });
                                  }}
                                  className="w-14 bg-brand-paper border border-brand-line p-1 rounded-lg text-center font-mono font-bold focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const payload = { ...p, inventory: currentVal };
                                      const res = await fetch(`/api/db/products/${p.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                      });
                                      if (res.ok) {
                                        onRefreshDb();
                                        alert(`✨ Stock updated successfully for "${p.title}"!`);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="bg-brand-teal hover:bg-brand-teal-deep text-brand-paper text-[11px] px-2.5 py-1.5 rounded-xl font-sans font-bold border-0 cursor-pointer select-none"
                                >
                                  Save
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Alerts & Notifications Feed Sidebar */}
              <div className="lg:col-span-4 bg-brand-paper-dark/35 border border-brand-line p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-black text-xs text-brand-ink flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-brand-clay animate-pulse" /> Live Telemetry Logs
                  </h4>
                  <span className="text-[9px] bg-brand-clay/10 text-brand-clay px-2 py-0.5 rounded font-mono font-bold">
                    {(db.notifications || []).length} LOGS
                  </span>
                </div>

                <p className="text-[11px] text-brand-ink-soft leading-relaxed">Tracking platform payments, donations, low-stock warnings, and refill schedules.</p>

                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {db.notifications && db.notifications.length > 0 ? (
                    [...db.notifications].reverse().map((notif) => {
                      let borderTheme = 'border-stone-200 bg-white/70';
                      let iconColor = 'text-stone-500';

                      if (notif.title?.includes('Refill') || notif.kind === 'inventory_refill') {
                        borderTheme = 'border-green-200 bg-green-50/50';
                        iconColor = 'text-green-600 font-bold';
                      } else if (notif.title?.includes('Warning') || notif.title?.includes('Low') || notif.kind === 'inventory_alert') {
                        borderTheme = 'border-amber-200 bg-amber-50/50';
                        iconColor = 'text-amber-600 font-bold';
                      } else if (notif.kind === 'order' || notif.title?.includes('Order')) {
                        borderTheme = 'border-teal-200 bg-teal-50/50';
                        iconColor = 'text-teal-600 font-bold';
                      }

                      return (
                        <div key={notif.id} className={`p-3 rounded-2xl border text-xs shadow-xs space-y-1 transition-all ${borderTheme}`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-serif ${iconColor}`}>{notif.title}</span>
                            <span className="text-[9px] text-stone-400 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed font-sans">{notif.body}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-center">
                      <p className="text-[11px] text-brand-ink-soft/45 font-sans">No operational logs recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. COMMISSIONS & SETTLEMENTS TAB */}
        {activeTab === 'commissions' && (
          <div className="space-y-6 animate-in fade-in duration-300 font-sans mt-2" id="commissions-ledger-dashboard">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-line pb-4">
              <div>
                <h3 className="font-serif font-black text-xl text-brand-ink">Commission Engine & Artisan Settlements</h3>
                <p className="text-xs text-brand-ink-soft">Configure platform-wide commission structures dynamically and register payout transactions for Indian artisans.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* ADVANCE RETURNING POLICY BUTTON (Simulation button) */}
                <button
                  type="button"
                  onClick={async () => {
                    const accrued = (db.commissionLedger || []).filter(e => e.status === 'accrued');
                    if (accrued.length === 0) {
                      alert('No accrued items in ledger to advance!');
                      return;
                    }
                    if (confirm(`Do you want to fast-forward the return window of ${accrued.length} accrued commissions and mark them as payable?`)) {
                      // Call Put request on each accrued item to turn into payable
                      try {
                        let updatedCount = 0;
                        for (const entry of accrued) {
                          const res = await fetch(`/api/db/commissionLedger/${entry.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...entry, status: 'payable' })
                          });
                          if (res.ok) updatedCount++;
                        }
                        onRefreshDb();
                        alert(`🕒 Successfully fast-forwarded return windows. Marked ${updatedCount} entries as "payable"!`);
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  className="bg-brand-paper hover:bg-brand-paper-dark text-brand-ink hover:text-brand-clay text-xs border border-brand-line px-3.5 py-2 rounded-xl transition-all font-sans font-bold select-none cursor-pointer"
                >
                  🕒 Fast-Forward Return Window
                </button>

                {/* CSV DOWNLOAD BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    const ledger = db.commissionLedger || [];
                    const filtered = ledger.filter(e => {
                      const matchArtisan = !commArtisanFilter || e.artisanId === commArtisanFilter;
                      const matchStatus = !commStatusFilter || e.status === commStatusFilter;
                      return matchArtisan && matchStatus;
                    });

                    if (filtered.length === 0) {
                      alert('No ledger items found matching the current filters to export!');
                      return;
                    }

                    let csvContent = "data:text/csv;charset=utf-8,";
                    csvContent += "ID,Artisan ID,Type,Related Order,Base Amount (INR),Rate (%),Commission (INR),Status,Created At\n";
                    
                    filtered.forEach(e => {
                      const artisan = db.artisans?.find(a => a.id === e.artisanId)?.name || e.artisanId;
                      const baseInInr = (e.baseAmount / 100).toFixed(2);
                      const commInInr = (e.amount / 100).toFixed(2);
                      const row = `"${e.id}","${artisan}","${e.type}","${e.orderId || 'N/A'}",${baseInInr},${e.ratePct},${commInInr},"${e.status}","${e.createdAt}"`;
                      csvContent += row + "\n";
                    });

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `CRAFTIFUE_COMMISSION_LEDGER_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs px-3.5 py-2 rounded-xl transition-all font-sans font-bold select-none cursor-pointer border-0 shadow-xs"
                >
                  📥 Export Ledger to CSV
                </button>
              </div>
            </div>

            {/* Summarized metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Accrued Ledger Items (Future Payouts)', 
                  val: (db.commissionLedger || []).filter(e => e.status === 'accrued').reduce((sum, e) => sum + e.amount, 0),
                  color: 'text-amber-600 bg-amber-50/50' 
                },
                { 
                  label: 'Payable Balance (Settlement Ready)', 
                  val: (db.commissionLedger || []).filter(e => e.status === 'payable').reduce((sum, e) => sum + e.amount, 0),
                  color: 'text-green-700 bg-green-50/50' 
                },
                { 
                  label: 'Paid (Settled to Bank Accounts)', 
                  val: (db.commissionLedger || []).filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
                  color: 'text-brand-teal bg-[#E8F3F1]/60' 
                },
                { 
                  label: 'Commissions Reversed / Offset', 
                  val: (db.commissionLedger || []).filter(e => e.status === 'reversed').reduce((sum, e) => sum + e.amount, 0),
                  color: 'text-brand-clay bg-red-50/50' 
                }
              ].map((m, idx) => (
                <div key={idx} className="border border-brand-line p-4 rounded-3xl bg-brand-paper shadow-xs">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-brand-ink-soft select-none mb-1 leading-normal">{m.label}</p>
                  <p className={`text-xl font-serif font-extrabold ${m.color.split(' ')[0]}`}>
                    ₹{(m.val / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: EDIT RULES / COMMISSION PROFILES */}
              <div className="lg:col-span-5 bg-white border border-brand-line rounded-3xl p-5 shadow-xs space-y-4">
                <div className="border-b border-brand-line pb-2 flex items-center space-x-1.5 leading-none">
                  <Award className="w-4 h-4 text-brand-clay" />
                  <h4 className="font-serif font-black text-sm uppercase tracking-wider text-brand-ink">Commission Profile Rules</h4>
                </div>
                <p className="text-[11px] text-brand-ink-soft leading-relaxed">
                  Modify system rule book presets. These settings control onboarding bonuses and per-transaction fees collected on checkout.
                </p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingCommProfile(true);
                  try {
                    const res = await fetch(`/api/db/commissionProfiles/default`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(defaultCommProfile)
                    });
                    if (res.ok) {
                      onRefreshDb();
                      alert('🎉 Global Commission System rule profiles revised successfully!');
                    } else {
                      alert('Error updating system profiles.');
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsSavingCommProfile(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-brand-ink-soft mb-1">Onboarding Support Credit Base (Rupees)</label>
                    <input 
                      type="number"
                      required
                      value={defaultCommProfile.onboardingBase / 100}
                      onChange={(e) => setDefaultCommProfile({ 
                        ...defaultCommProfile, 
                        onboardingBase: Math.round(Number(e.target.value) * 100) 
                      })}
                      className="w-full bg-brand-paper text-brand-ink border border-brand-line rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-clay focus:outline-none"
                    />
                    <span className="text-[9px] text-brand-ink-soft/75 mt-1 block font-mono">Equivalent to {defaultCommProfile.onboardingBase} paise.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold text-brand-ink-soft mb-1">Onboarding Bonus Rate (%)</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={defaultCommProfile.onboardingPct}
                        onChange={(e) => setDefaultCommProfile({ 
                          ...defaultCommProfile, 
                          onboardingPct: Number(e.target.value) 
                        })}
                        className="flex-1 accent-brand-clay"
                      />
                      <span className="text-xs font-mono font-bold bg-brand-paper-dark px-2.5 py-1 rounded-lg border border-brand-line text-brand-ink">
                        {defaultCommProfile.onboardingPct}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold text-brand-ink-soft mb-1">Per-Order Sale Commission Rate (%)</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={defaultCommProfile.perSalePct}
                        onChange={(e) => setDefaultCommProfile({ 
                          ...defaultCommProfile, 
                          perSalePct: Number(e.target.value) 
                        })}
                        className="flex-1 accent-brand-clay"
                      />
                      <span className="text-xs font-mono font-bold bg-brand-paper-dark px-2.5 py-1 rounded-lg border border-brand-line text-brand-ink">
                        {defaultCommProfile.perSalePct}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold text-brand-ink-soft mb-1">Customer Policy Return Window (Days)</label>
                    <input 
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={defaultCommProfile.returnWindowDays}
                      onChange={(e) => setDefaultCommProfile({ 
                        ...defaultCommProfile, 
                        returnWindowDays: Number(e.target.value) 
                      })}
                      className="w-full bg-brand-paper text-brand-ink border border-brand-line rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-clay focus:outline-none"
                    />
                    <span className="text-[9px] text-brand-ink-soft/75 mt-1 block">Accrued items safely flag as payable after these many days.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingCommProfile}
                    className="w-full bg-brand-teal hover:bg-brand-teal/90 disabled:opacity-50 text-white font-sans text-xs px-4 py-2.5 font-bold rounded-xl transition-all cursor-pointer border-0 shadow-sm uppercase tracking-wider"
                  >
                    {isSavingCommProfile ? 'Revising Preset Rules...' : 'Save Rule Configuration'}
                  </button>
                </form>
              </div>

              {/* Right column: LEDGER & PAYOUTS DISPATCHER */}
              <div className="lg:col-span-7 bg-brand-paper border border-brand-line rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-4 font-sans text-brand-ink">
                  {/* Ledger Filters */}
                  <div className="grid grid-cols-2 gap-2 border-b border-brand-line pb-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-ink-soft mb-1 font-bold">Filter Artisan</label>
                      <select
                        value={commArtisanFilter}
                        onChange={(e) => setCommArtisanFilter(e.target.value)}
                        className="w-full bg-brand-paper-dark/60 text-brand-ink border border-brand-line/80 px-2 py-1.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="">All Artisans</option>
                        {db.artisans?.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.region.split(',')[0]})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-ink-soft mb-1 font-bold">Filter Status</label>
                      <select
                        value={commStatusFilter}
                        onChange={(e) => setCommStatusFilter(e.target.value)}
                        className="w-full bg-brand-paper-dark/60 text-brand-ink border border-brand-line/80 px-2 py-1.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="">All Statuses</option>
                        <option value="accrued">Accrued</option>
                        <option value="payable">Payable</option>
                        <option value="paid">Paid</option>
                        <option value="reversed">Reversed</option>
                      </select>
                    </div>
                  </div>

                  {/* List ledger table limit 5 */}
                  <div className="overflow-x-auto select-none">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-brand-line text-brand-ink-soft font-mono uppercase text-[10px]">
                          <th className="py-2">Artisan</th>
                          <th className="py-2">Type</th>
                          <th className="py-2 text-right">Base Amount</th>
                          <th className="py-2 text-center">Rate</th>
                          <th className="py-2 text-right">Commission</th>
                          <th className="py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const items = (db.commissionLedger || []).filter(e => {
                            const matchArtisan = !commArtisanFilter || e.artisanId === commArtisanFilter;
                            const matchStatus = !commStatusFilter || e.status === commStatusFilter;
                            return matchArtisan && matchStatus;
                          });

                          if (items.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-brand-ink-soft italic text-[11px]">
                                  No transaction entries recorded in filtered ledger.
                                </td>
                              </tr>
                            );
                          }

                          return items.map((e) => {
                            const artisan = db.artisans?.find(a => a.id === e.artisanId)?.name || 'Direct Trade';
                            let statusColor = 'bg-stone-100 text-stone-700';
                            if (e.status === 'accrued') statusColor = 'bg-amber-100 text-amber-800';
                            if (e.status === 'payable') statusColor = 'bg-green-100 text-green-800 font-bold';
                            if (e.status === 'paid') statusColor = 'bg-teal-100 text-teal-800';
                            if (e.status === 'reversed') statusColor = 'bg-red-100 text-red-800';

                            return (
                              <tr key={e.id} className="border-b border-brand-line/50 hover:bg-brand-paper-dark/30">
                                <td className="py-2 font-serif font-black text-brand-ink">{artisan}</td>
                                <td className="py-2">
                                  <span className={`text-[9px] uppercase font-mono px-1 rounded ${e.type === 'onboarding' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {e.type}
                                  </span>
                                </td>
                                <td className="py-2 text-right font-mono text-brand-ink-soft">₹{(e.baseAmount / 100).toFixed(2)}</td>
                                <td className="py-2 text-center font-mono">{e.ratePct}%</td>
                                <td className="py-2 text-right font-mono font-bold text-brand-ink">₹{(e.amount / 100).toFixed(2)}</td>
                                <td className="py-2 text-center">
                                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold font-sans ${statusColor}`}>
                                    {e.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Settle Payable Commissions */}
                  {commArtisanFilter ? (() => {
                    const selectedArtisanName = db.artisans?.find(a => a.id === commArtisanFilter)?.name || 'This Artisan';
                    const payableComms = (db.commissionLedger || []).filter(e => e.artisanId === commArtisanFilter && e.status === 'payable');
                    const outstandingPaise = payableComms.reduce((sum, e) => sum + e.amount, 0);

                    return (
                      <div className="mt-4 bg-brand-paper-dark/40 border border-brand-line rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-serif font-black text-xs uppercase tracking-wide text-brand-ink">Settle Balance to Bank for {selectedArtisanName}</h5>
                            <p className="text-[10px] text-brand-ink-soft">Consolidate verified payable commissions ledger rows into paid statuses.</p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-900 border border-green-200 py-1 px-2.5 rounded-lg font-mono font-bold">
                            Outstanding: ₹{(outstandingPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {outstandingPaise > 0 ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text"
                              required
                              value={payoutReferenceNo}
                              onChange={(e) => setPayoutReferenceNo(e.target.value)}
                              placeholder="Transfer transaction reference..."
                              className="flex-1 bg-brand-paper text-brand-ink placeholder:text-brand-ink-soft/60 px-3 py-1.5 rounded-xl text-xs border border-brand-line focus:ring-1 focus:ring-brand-clay focus:outline-none animate-pulse"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!payoutReferenceNo.trim()) {
                                  alert('Please enter bank transaction reference number.');
                                  return;
                                }
                                if (confirm(`Authorize manual bank payout settlement to ${selectedArtisanName} for ₹${(outstandingPaise / 100).toFixed(2)}?`)) {
                                  try {
                                    // Settle each payable entry
                                    const payoutId = `pay_${Date.now()}`;
                                    for (const entry of payableComms) {
                                      await fetch(`/api/db/commissionLedger/${entry.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ...entry, status: 'paid', payoutId })
                                      });
                                    }

                                    // Record payout document in direct database payouts collection
                                    await fetch(`/api/db/payouts`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        id: payoutId,
                                        artisanId: commArtisanFilter,
                                        amount: outstandingPaise,
                                        status: 'paid',
                                        method: 'bank_transfer',
                                        reference: payoutReferenceNo,
                                        initiatedBy: 'user_admin',
                                        createdAt: new Date().toISOString()
                                      })
                                    });

                                    // Push paid notification to artisan user
                                    await fetch(`/api/db/notifications`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        uid: 'user_admin',
                                        kind: 'payout',
                                        title: '💰 Artisan Settlement Complete',
                                        body: `Platform payout record ${payoutId} settled for ₹${(outstandingPaise / 100).toFixed(2)} to ${selectedArtisanName}.`,
                                        read: false
                                      })
                                    });

                                    setPayoutReferenceNo('');
                                    onRefreshDb();
                                    alert(`💸 Balance settled completely for ${selectedArtisanName}! Payout ledger recorded.`);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              className="bg-brand-teal hover:bg-brand-teal/90 text-white text-xs px-4 py-2 rounded-xl transition-all font-sans font-bold select-none cursor-pointer border-0 shadow"
                            >
                              💰 Record Payout
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-brand-ink-soft italic font-sans text-center">Artisan has ₹0.00 in payable dues. Wait for return window policies or fast-forward active return windows manually.</p>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="bg-brand-paper-dark/35 border border-brand-line rounded-2xl p-6 text-center mt-4">
                      <HelpCircle className="w-5 h-5 text-brand-clay pointer-events-none mx-auto mb-1 animate-pulse" />
                      <p className="text-[12px] text-brand-ink-soft leading-normal">Select an onboarded artisan in filters to enable direct bank payouts.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
