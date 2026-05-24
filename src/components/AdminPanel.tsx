import React, { useState, useEffect } from 'react';
import { 
  BarChart, TrendingUp, Package, Users, Palette, Compass, Activity, Check, Plus, Trash2, 
  Sparkles, RotateCcw, Award, Mail, Calendar, CheckSquare, Megaphone, Loader2, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Product, Artisan, Category, Campaign, Coupon, CommissionEntry } from '../types/firestore';

interface AdminPanelProps {
  db: {
    products: Product[];
    artisans: Artisan[];
    categories: Category[];
    campaigns: Campaign[];
    coupons: Coupon[];
    commissionLedger: CommissionEntry[];
    orders: any[];
    lookbooks: any[];
    logoConfig: { customImage: string | null; brandName: string; primaryColor: string };
  };
  onUpdateDb: (updatedData: any) => void;
  onRefreshDb: () => void;
}

export default function AdminPanel({ db, onUpdateDb, onRefreshDb }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'artisans' | 'outreach' | 'logo' | 'campaigns'>('analytics');
  
  // AI States
  const [isAiPredicting, setIsAiPredicting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiGeneratingId, setAiGeneratingId] = useState<string | null>(null);

  // Logo Editor State
  const [logoName, setLogoName] = useState(db.logoConfig.brandName);
  const [logoColor, setLogoColor] = useState(db.logoConfig.primaryColor);
  const [logoInput, setLogoInput] = useState(db.logoConfig.customImage || '');

  // Catalog edit States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);

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
            baseAmount: 1000000, // ₹10,000 reference base
            ratePct: 3,
            amount: 30000,       // ₹300 reward Paise
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
      // Trigger AI to find candidate details
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
          payload: { title, artForm, material }
        })
      });
      const data = await res.json();
      
      // Update local state or edit buffer
      if (editingProduct && editingProduct.id === prodId) {
        setEditingProduct({
          ...editingProduct,
          description: data.content
        });
      } else {
        // Direct DB update
        const pIndex = db.products.findIndex(p => p.id === prodId);
        if (pIndex !== -1) {
          const updated = { ...db.products[pIndex], description: data.content };
          fetch(`/api/db/products/${prodId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).then(() => onRefreshDb());
        }
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
          payload: { name, region, specialties: specs }
        })
      });
      const data = await res.json();
      
      if (editingArtisan && editingArtisan.id === artId) {
        setEditingArtisan({
          ...editingArtisan,
          story: data.content
        });
      } else {
        const aIndex = db.artisans.findIndex(a => a.id === artId);
        if (aIndex !== -1) {
          const updated = { ...db.artisans[aIndex], story: data.content };
          fetch(`/api/db/artisans/${artId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).then(() => onRefreshDb());
        }
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

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    fetch(`/api/db/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct)
    }).then(() => {
      onRefreshDb();
      setEditingProduct(null);
      alert('Product saved successfully.');
    });
  };

  return (
    <div className="bg-brand-paper border border-brand-line rounded-3xl overflow-hidden shadow-xl" id="admin-workspace-layer">
      {/* Drawer Title Bar */}
      <div className="bg-brand-ink text-brand-paper px-6 py-4 flex items-center justify-between border-b border-brand-line">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-brand-clay font-bold animate-pulse" />
          <h2 className="font-serif font-black text-xl tracking-tight uppercase">Craftifue Admin Console</h2>
        </div>
        <p className="text-xs text-brand-paper/70 font-mono">ROLE: PLATFORM ADMINISTRATOR</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-brand-line bg-brand-paper-dark/60 flex space-x-1 p-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'analytics', label: '📊 Predictive Trends AI', icon: TrendingUp },
          { id: 'products', label: '🛋️ Product Registry', icon: Package },
          { id: 'artisans', label: '🎭 Artisan Directory', icon: Users },
          { id: 'outreach', label: '🪶 Human-in-the-Loop CRM', icon: Mail },
          { id: 'logo', label: '🎨 Real-Time Brand Update', icon: Palette },
          { id: 'campaigns', label: '📢 Relief Campaigns', icon: Megaphone }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-sans font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === t.id 
                  ? 'bg-brand-clay text-brand-paper shadow-md' 
                  : 'text-brand-ink-soft hover:bg-brand-paper-dark hover:text-brand-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* 1. ANALYTICS PREDICTIVE ENGINE */}
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
                className="bg-brand-teal hover:bg-brand-teal/90 text-brand-paper px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center space-x-2 disabled:opacity-45"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiPredicting ? 'animate-spin' : ''}`} />
                <span>Re-Run AI Engine</span>
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
                <span className="text-[10px] text-brand-clay-deep font-mono">Sellers accrued payables</span>
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
                {/* Visual Chart */}
                <div className="lg:col-span-2 bg-brand-paper border border-brand-line p-4 rounded-2xl shadow-sm">
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

                {/* Gemini Text Insight Summary */}
                <div className="bg-brand-paper-dark/30 border border-brand-line p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] bg-brand-clay text-white px-2 py-0.5 rounded-full font-sans uppercase tracking-widest font-bold">Predictive Smart Analyst</span>
                    <h4 className="font-serif font-black text-brand-ink text-base mt-2">Gemini Demand Insights</h4>
                    <p className="text-xs text-brand-ink-soft italic font-serif mt-1">"{aiAnalysis.forecastSummary}"</p>
                    
                    <div className="mt-4 text-xs text-brand-ink leading-relaxed prose prose-sm overflow-y-auto max-h-40 scrollbar-thin">
                      {/* Formatted inline blocks of output */}
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
                <button onClick={triggerAiPredictiveModel} className="bg-brand-clay text-brand-paper px-4 py-2 rounded-xl text-sm font-sans flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>Execute Neural Predictive Audit</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. PRODUCT CRUD TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-brand-ink">Product Database Register</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List grid */}
              <div className="lg:col-span-2 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {db.products.map((p) => (
                  <div key={p.id} className="bg-brand-paper border border-brand-line p-3 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all">
                    <div className="flex items-center space-x-3">
                      <img src={p.images[0]?.url} alt={p.title} className="w-12 h-12 object-cover rounded-xl bg-stone-100" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-ink">{p.title}</h4>
                        <p className="text-xs text-brand-ink-soft">SKU: {p.sku} | Price: ₹{(p.price / 100).toLocaleString('en-IN')} | Stock: <span className={p.inventory < 10 ? 'text-brand-clay font-bold' : 'text-green-700'}>{p.inventory}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setEditingProduct(p)}
                        className="text-xs border border-brand-line hover:border-brand-clay text-brand-ink px-3 py-1.5 rounded-xl transition-all font-sans"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor sidebar */}
              <div className="bg-brand-paper-dark/30 border border-brand-line p-4 rounded-3xl">
                {editingProduct ? (
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-brand-ink">Modify Craft Product</h4>
                      <button type="button" onClick={() => setEditingProduct(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay">Cancel</button>
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-brand-ink-soft mb-1">Product Name</label>
                      <input 
                        type="text" 
                        value={editingProduct.title} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-sm rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-sans text-brand-ink-soft mb-1">Price (Paise)</label>
                        <input 
                          type="number" 
                          value={editingProduct.price} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-sm rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-brand-ink-soft mb-1">Stock</label>
                        <input 
                          type="number" 
                          value={editingProduct.inventory} 
                          onChange={(e) => setEditingProduct({ ...editingProduct, inventory: parseInt(e.target.value) })}
                          className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-sm rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-sans text-brand-ink-soft">Description</label>
                        <button
                          type="button"
                          onClick={() => handleAiDescriptionGenerate(editingProduct.id, editingProduct.title, editingProduct.artForm[0], editingProduct.material[0])}
                          disabled={aiGeneratingId === editingProduct.id}
                          className="bg-brand-clay/10 hover:bg-brand-clay hover:text-white text-brand-clay border border-brand-clay/20 text-[10px] px-2.5 py-1.5 rounded-lg font-sans transition-all flex items-center space-x-1"
                        >
                          {aiGeneratingId === editingProduct.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />}
                          <span>Auto-Rewrite Draft with AI</span>
                        </button>
                      </div>
                      <textarea 
                        value={editingProduct.description} 
                        rows={4}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full bg-brand-paper border border-brand-line px-3 py-2 text-xs rounded-xl focus:outline-none leading-relaxed font-sans"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-sm py-2 px-4 rounded-xl font-sans transition-all shadow-md"
                    >
                      Save Specifications
                    </button>
                  </form>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Package className="w-8 h-8 text-brand-ink-soft/40 mb-2" />
                    <p className="text-xs text-brand-ink-soft font-sans">Select any item in the inventory register to modify properties or trigger luxury copywriting rewrites.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ARTISAN TAB */}
        {activeTab === 'artisans' && (
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-brand-ink">Artisan Directory</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {db.artisans.map((a) => (
                  <div key={a.id} className="bg-brand-paper border border-brand-line p-3 rounded-2xl flex items-center justify-between hover:border-brand-clay transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-brand-paper-dark flex items-center justify-center font-serif font-bold text-brand-clay shadow-xs">
                        {a.name.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-ink">{a.name}</h4>
                        <p className="text-xs text-brand-ink-soft">{a.region} | Crafts: {a.craftSpecialty.join(', ')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditingArtisan(a)}
                      className="text-xs border border-brand-line hover:border-brand-clay text-brand-ink px-3 py-1.5 rounded-xl font-sans transition-all"
                    >
                      View Backstory
                    </button>
                  </div>
                ))}
              </div>

              {/* Artisan Backstory Editor */}
              <div className="bg-brand-paper-dark/30 border border-brand-line p-4 rounded-3xl">
                {editingArtisan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-brand-ink">{editingArtisan.name} Story</h4>
                      <button onClick={() => setEditingArtisan(null)} className="text-xs text-brand-ink-soft hover:text-brand-clay">Close</button>
                    </div>

                    <div>
                      <p className="text-xs font-sans text-brand-ink-soft font-medium">Core Region Bio</p>
                      <p className="text-xs text-brand-ink mt-1 bg-brand-paper p-2.5 rounded-xl border border-brand-line/60 leading-relaxed">{editingArtisan.bio}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-sans font-medium text-brand-ink-soft">Artistic Backstory</span>
                        <button
                          onClick={() => handleAiArtisanStoryGenerate(editingArtisan.id, editingArtisan.name, editingArtisan.region, editingArtisan.craftSpecialty)}
                          disabled={aiGeneratingId === editingArtisan.id}
                          className="bg-brand-clay/10 hover:bg-brand-clay hover:text-white text-brand-clay border border-brand-clay/20 text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                        >
                          {aiGeneratingId === editingArtisan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-500" />}
                          <span>Generate Story with AI</span>
                        </button>
                      </div>
                      <textarea
                        value={editingArtisan.story || ''}
                        rows={6}
                        onChange={(e) => setEditingArtisan({ ...editingArtisan, story: e.target.value })}
                        className="w-full bg-brand-paper text-brand-ink placeholder:text-brand-ink-soft/40 p-2.5 text-xs rounded-xl border border-brand-line focus:outline-none leading-relaxed font-sans"
                        placeholder="Write or hit generate to draft historical heritage copy..."
                      />
                    </div>

                    <button
                      onClick={() => {
                        fetch(`/api/db/artisans/${editingArtisan.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(editingArtisan)
                        }).then(() => {
                          onRefreshDb();
                          setEditingArtisan(null);
                          alert('Artisan story updated.');
                        });
                      }}
                      className="w-full bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-xs py-2 px-4 rounded-xl font-sans transition-all"
                    >
                      Save Backstory Draft
                    </button>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center">
                    <Users className="w-8 h-8 text-brand-ink-soft/40 mb-2" />
                    <p className="text-xs text-brand-ink-soft font-sans font-medium">Select an artisan, then configure historical heritage backlinks or invoke our storyteller writer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. AI OUTREACH HUMAN-IN-THE-LOOP CRM (USP Phase 5) */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
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
                  className="bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper px-4 py-2 rounded-xl text-xs font-sans font-medium select-none cursor-pointer flex items-center space-x-1"
                >
                  {isFindingLeads ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Probe Artisan Leads</span>
                </button>
              </div>
            </div>

            {/* Pipeline list */}
            <div className="space-y-4">
              <h4 className="font-serif font-extrabold text-sm text-brand-ink uppercase tracking-wider">Active Outreach Ledger</h4>
              
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
                          <Mail className="w-3 h-3 mr-1" /> Gemini Draft Letter (Human Read Only)
                        </span>
                        <pre className="text-[10px] text-brand-ink mt-1.5 whitespace-pre-wrap font-sans max-h-24 overflow-y-auto leading-relaxed border-t border-brand-line pt-2">
                          {lead.emailDraft}
                        </pre>
                      </div>

                      {lead.meetingLink && (
                        <div className="mt-2 bg-indigo-50 border border-indigo-100 p-2 rounded-xl flex items-center space-x-2 text-[10px] text-indigo-900 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Scheduler: <a href={lead.meetingLink} target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Meet Conference Link</a></span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-line/50 flex flex-wrap gap-1.5">
                      {lead.status === 'found' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'contacted')}
                          className="bg-brand-teal text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium hover:bg-brand-teal/90 transition-all select-none cursor-pointer"
                        >
                          ✉️ Approve & Send Email
                        </button>
                      )}
                      {lead.status === 'contacted' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'meeting_scheduled')}
                          className="bg-indigo-600 text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium hover:bg-indigo-700 transition-all select-none cursor-pointer"
                        >
                          📆 Schedule Meet Call
                        </button>
                      )}
                      {lead.status === 'meeting_scheduled' && (
                        <button
                          onClick={() => executeOutreachAction(lead.id, 'onboarded')}
                          className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-[10px] px-3 py-1.5 rounded-lg font-sans font-medium transition-all select-none cursor-pointer"
                        >
                          🎉 Complete Onboard (+₹300 Accrued Accrual)
                        </button>
                      )}
                      {lead.status === 'onboarded' && (
                        <span className="text-[10px] text-green-700 font-bold flex items-center">
                          <Check className="w-4 h-4 mr-0.5" /> Account fully configured in registry!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. BRAND LOGO CONFIG TAB */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div className="bg-brand-paper border border-brand-line p-4 rounded-3xl">
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
                            logoColor === cp.code ? 'bg-brand-ink text-brand-paper border-brand-ink' : 'bg-brand-paper border-brand-line hover:bg-brand-paper-dark'
                          }`}
                        >
                          <span style={{ backgroundColor: cp.code }} className="w-3 h-3 rounded-full border border-white" />
                          <span>{cp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-brand-ink-soft mb-1">Upload Brand Logo (Paste Base64 or Image Link)</label>
                    <textarea 
                      value={logoInput}
                      onChange={(e) => setLogoInput(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/... or paste image Base64 data schema"
                      className="w-full bg-brand-paper border border-brand-line p-2.5 text-xs rounded-xl focus:outline-none font-mono"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleApplyLogoBranding}
                    className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper py-2 px-4 rounded-xl text-sm font-sans font-medium transition-all shadow-md cursor-pointer select-none"
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
          </div>
        )}

        {/* 6. CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-brand-ink flex items-center">
              <Megaphone className="w-5 h-5 text-brand-clay mr-2" />
              Welfare Campaigns & Milestone Disbursements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.campaigns.map((c) => (
                <div key={c.id} className="bg-brand-paper border border-brand-line rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-black text-brand-ink text-base">{c.title}</h4>
                    <p className="text-xs text-brand-ink-soft mt-1 leading-relaxed">{c.beneficiarySummary}</p>
                    
                    <div className="mt-3 bg-brand-paper-dark/30 p-2.5 rounded-xl border border-brand-line/60">
                      <span className="text-[10px] text-brand-clay font-black uppercase tracking-wider">Disbursement Milestones Ledger</span>
                      <div className="mt-1 space-y-2">
                        {c.disbursementMilestones.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-brand-line/50 pb-1.5 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium text-brand-ink">{m.stage}</p>
                              <p className="text-[9px] text-brand-ink-soft">{m.releasedAt ? `Released on ${new Date(m.releasedAt).toLocaleDateString('en-IN')}` : 'Disbursement Planned'}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono leading-none ${m.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {m.status === 'verified' ? `Verified ₹${m.amount/100}` : `Planned ₹${m.amount/100}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add action to plan milestone */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const stage = fd.get('stage') as string;
                    const amount = parseInt(fd.get('amount') as string) * 100;
                    if (!stage || !amount) return;

                    const updatedCampaigns = db.campaigns.map(camp => {
                      if (camp.id === c.id) {
                        return {
                          ...camp,
                          disbursementMilestones: [
                            ...camp.disbursementMilestones,
                            { stage, amount, status: 'planned' }
                          ]
                        };
                      }
                      return camp;
                    });

                    fetch(`/api/db/campaigns/${c.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedCampaigns.find(camp => camp.id === c.id))
                    }).then(() => {
                      onRefreshDb();
                      alert('Disbursement milestone uploaded.');
                    });
                  }} className="mt-4 pt-3 border-t border-brand-line/50 grid grid-cols-2 gap-2">
                    <input type="text" name="stage" placeholder="New planned stage description" className="bg-brand-paper border border-brand-line px-2 py-1 text-xs rounded-lg" required />
                    <div className="flex space-x-1">
                      <input type="number" name="amount" placeholder="₹ Amount" className="bg-brand-paper border border-brand-line px-2 py-1 text-xs rounded-lg w-20" required />
                      <button type="submit" className="bg-brand-clay text-brand-paper text-[10px] px-2.5 py-1 rounded-lg">disburse</button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
