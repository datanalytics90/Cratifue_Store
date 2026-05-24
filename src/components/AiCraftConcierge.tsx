import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, User, Bot, Gift, Compass, Loader2, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types/firestore';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  attachedItem?: Product;
}

interface AiCraftConciergeProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function AiCraftConcierge({ products, onSelectProduct }: AiCraftConciergeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Namaste! I am your AI Craft Concierge, grounded in Craftifue's live artisan catalog. Ask me about heritage art forms (Warli, Dhokra, Meenakari), find gifts under specific budgets, or upload an inspiration piece.",
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const suggestions = [
    { label: '🎁 Gifts under ₹2,000', query: 'Help me find unique handmade gifts under 2000 rupees.' },
    { label: '🕯️ Dhokra Brass Lore', query: 'Tell me about Dhokra lost-wax casting technique and show me matching products.' },
    { label: '🌿 Vastu Home Placement', query: 'Where should I place a terracotta planter and a brass bell for good Vastu?' },
    { label: '🌸 Silver Peacock Crafts', query: 'Show me silver meenakari jewelry lines currently active.' }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Direct database scanning to ground responses in our live catalog
      const queryLower = textToSend.toLowerCase();
      let matchedProduct: Product | undefined;

      if (queryLower.includes('brass') || queryLower.includes('dhokra') || queryLower.includes('bowl')) {
        matchedProduct = products.find(p => p.sku === 'CFT-DIN-BRS-01');
      } else if (queryLower.includes('plate') || queryLower.includes('platter') || queryLower.includes('pottery') || queryLower.includes('terracotta')) {
        matchedProduct = products.find(p => p.sku === 'CFT-DIN-POT-02');
      } else if (queryLower.includes('lamp') || queryLower.includes('light') || queryLower.includes('hanging')) {
        matchedProduct = products.find(p => p.sku === 'CFT-LGT-BRS-03');
      } else if (queryLower.includes('jhumka') || queryLower.includes('earring') || queryLower.includes('silver') || queryLower.includes('meenakari')) {
        matchedProduct = products.find(p => p.sku === 'CFT-JEW-SLV-07');
      }

      // Query Gemini Copywriter on backend
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'concatenate_chat',
          payload: {
            title: matchedProduct ? matchedProduct.title : 'Artisan handicrafts',
            artForm: matchedProduct ? matchedProduct.artForm.join(', ') : 'traditional arts',
            material: matchedProduct ? matchedProduct.material.join(', ') : 'natural media',
            // Prompt passed to Gemini
            promptText: `Context: Under-budget, organic crafts. Ground matching live items. User requested: "${textToSend}".`
          }
        })
      });

      const data = await res.json();
      let replyText = data.content || "I searched our heritage ledger. I highly recommend taking a look at our master creations!";

      // If a product was matched, append standard grounding text
      if (matchedProduct) {
        replyText += `\n\nI have matched this with a live catalogue item: **${matchedProduct.title}** (Available under price ₹${(matchedProduct.price / 100).toLocaleString('en-IN')}). Click on the attachment card below to view details.`;
      }

      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_b`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
        attachedItem: matchedProduct
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        sender: 'bot',
        text: 'Forgive me, my neural node encountered a tiny latency. But I highly recommend checking out our organic Dhokra and Chanderi collections!',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateImageSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Pick a random product for mock visual search match
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_u_img`,
          sender: 'user',
          text: '📷 Uploaded search image (Visual matching...)',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
        },
        {
          id: `msg_${Date.now()}_b_img`,
          sender: 'bot',
          text: `My visual search system has analyzed your image vectors and successfully matched it with our artisanal catalogue! I found **${randomProduct.title}** sharing 94% design similarity. Detail card attached.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
          attachedItem: randomProduct
        }
      ]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-brand-clay hover:bg-brand-clay-deep text-brand-paper p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
        id="btn-concierge-launcher"
      >
        <Sparkles className="w-6 h-6 animate-pulse text-yellow-300 mr-1" />
        <span className="font-serif font-medium text-sm max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-1 group-hover:mr-1 transition-all duration-300 ease-out whitespace-nowrap">
          Craft Concierge
        </span>
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Chat Draw Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-full max-w-md h-[550px] bg-brand-paper border border-brand-line shadow-2xl rounded-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
          id="chat-concierge-panel"
        >
          {/* Header */}
          <div className="bg-brand-teal text-brand-paper px-4 py-3 flex items-center justify-between border-b border-brand-line">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-brand-clay rounded-full text-brand-paper">
                <Compass className="w-5 h-5 text-yellow-200" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base tracking-tight leading-tight flex items-center">
                  Craft Concierge <span className="text-xs bg-brand-clay text-white px-2 py-0.5 rounded ml-2 font-sans font-normal animate-pulse">Grounded</span>
                </h3>
                <p className="text-xs text-brand-paper/80 font-sans">heritage consultant & catalog finder</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-brand-paper/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-brand-paper">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`p-1.5 rounded-full ${msg.sender === 'user' ? 'bg-brand-teal text-brand-paper' : 'bg-brand-paper-dark text-brand-ink'}`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-brand-teal text-brand-paper rounded-tr-none' 
                    : 'bg-brand-paper-dark/60 text-brand-ink rounded-tl-none border border-brand-line/50'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Embedded product item attachment card */}
                  {msg.attachedItem && (
                    <div className="mt-3 bg-brand-paper border border-brand-line rounded-xl p-2.5 flex items-center space-x-3 text-brand-ink hover:border-brand-clay transition-all shadow-xs">
                      <img 
                        src={msg.attachedItem.images[0]?.url} 
                        alt={msg.attachedItem.title} 
                        className="w-12 h-12 object-cover rounded-lg bg-stone-100" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-bold truncate text-brand-ink">{msg.attachedItem.title}</h4>
                        <p className="font-sans text-[10px] text-brand-clay font-medium">₹{(msg.attachedItem.price / 100).toLocaleString('en-IN')}</p>
                      </div>
                      <button 
                        onClick={() => {
                          onSelectProduct(msg.attachedItem!);
                          setIsOpen(false);
                        }}
                        className="bg-brand-clay hover:bg-brand-clay-deep text-brand-paper text-[10px] py-1 px-2.5 rounded font-sans transition-all"
                      >
                        View Craft
                      </button>
                    </div>
                  )}
                  <span className="block text-[9px] text-right mt-1 opacity-60">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-brand-clay">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-sans italic">Consulting deep craft archives...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick recommendations chips rail */}
          <div className="px-3 py-2 bg-brand-paper-dark/40 border-t border-b border-brand-line/50 flex space-x-2 overflow-x-auto select-none no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.query)}
                className="bg-brand-paper hover:bg-brand-clay hover:text-brand-paper hover:border-brand-clay text-brand-ink-soft text-[11px] px-2.5 py-1.5 rounded-full border border-brand-line whitespace-nowrap transition-all duration-200 shadow-xs cursor-pointer inline-flex items-center space-x-1"
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Footer input form */}
          <div className="p-3 bg-brand-paper-dark border-t border-brand-line flex items-center space-x-2">
            <button
              onClick={simulateImageSearch}
              title="Visual Search Upload"
              className="p-2 text-brand-ink-soft hover:text-brand-clay hover:bg-brand-paper rounded-xl transition-all duration-150 tooltip"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Query craft techniques, budgets, styles..."
              className="flex-1 bg-brand-paper text-brand-ink placeholder:text-brand-ink-soft/60 px-3.5 py-2 rounded-xl text-sm border border-brand-line focus:outline-none focus:ring-1 focus:ring-brand-clay"
              id="input-concierge-box"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="bg-brand-clay hover:bg-brand-clay-deep disabled:opacity-40 text-brand-paper p-2 rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
