import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db-craftifue.json');

// Parse JSON bodies (increased limits for potential image uploads)
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini SDK with telemetry headers
const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not defined. AI features will fallback to offline mock responses.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const ai = initGemini();

/* ------------------------------------------------------------------ */
/* DATABASE MANAGER (Local JSON Store)                                 */
/* ------------------------------------------------------------------ */

interface DbSchema {
  users: any[];
  artisans: any[];
  categories: any[];
  products: any[];
  collections: any[];
  carts: any[];
  orders: any[];
  shipments: any[];
  commissionProfiles: any[];
  commissionLedger: any[];
  payouts: any[];
  campaigns: any[];
  donations: any[];
  aiOutreach: any[];
  reviews: any[];
  coupons: any[];
  notifications: any[];
  spaces: any[];
  lookbooks: any[];
  logoConfig: {
    customImage: string | null;  // base64 or URL
    brandName: string;
    primaryColor: string;
  };
}

const DEFAULT_DB: DbSchema = {
  users: [
    {
      uid: 'user_admin',
      role: 'admin',
      displayName: 'RD Admin',
      email: 'rd14190@gmail.com',
      addresses: [
        {
          fullName: 'Rajesh Sharma',
          phone: '+91 98765 43210',
          line1: '102, Craft Haven Apt',
          line2: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'IN',
          isDefault: true
        }
      ],
      wishlist: [],
      defaultLocale: 'en-IN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      uid: 'user_buyer_1',
      role: 'buyer',
      displayName: 'Aanya Iyer',
      email: 'aanya@example.com',
      addresses: [
        {
          fullName: 'Aanya Iyer',
          phone: '+91 99911 22334',
          line1: 'Block C, Golden Woods',
          line2: 'Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
          country: 'IN',
          isDefault: true
        }
      ],
      wishlist: [],
      defaultLocale: 'en-IN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  artisans: [
    {
      id: 'artisan_suman',
      ownerUid: 'user_seller_suman',
      name: 'Suman Devangan',
      slug: 'suman-devangan',
      region: 'Bastar, Chhattisgarh',
      craftSpecialty: ['dhokra', 'hand-carved'],
      materials: ['brass', 'iron'],
      bio: 'Suman has been casting bronze using the traditional lost-wax Dhokra technique for over 32 years. His family preserves an oral metallurgical legacy passed down across five generations.',
      story: 'Suman comes from a remote hamlet in Bastar. Suman molds every beeswax thread by hand before wrapping it around dynamic clay core figures, giving birth to fluid mythological sculptures and brass diyas of immaculate craft quality.',
      portfolio: [
        { url: 'https://images.unsplash.com/photo-1513519107129-14a172e38d75?auto=format&fit=crop&q=80&w=600', alt: 'Casting workshop', type: 'image' }
      ],
      ratingAvg: 4.9,
      productCount: 8,
      onboardingStatus: 'onboarded',
      commissionProfileId: 'default',
      kycVerified: true,
      payoutMasked: '•••• 8821',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'artisan_gopal',
      ownerUid: 'user_seller_gopal',
      name: 'Gopal Sahu',
      slug: 'gopal-sahu',
      region: 'Khurda, Odisha',
      craftSpecialty: ['studio-pottery', 'warli'],
      materials: ['terracotta', 'ceramic'],
      bio: 'Gopal is an award-winning clay sculptor who specializes in high-fired terracotta pottery, mixing clay types to create durable daily-use dining ware.',
      story: 'Born to family of clay artisans near the Chilika lake, Gopal studied ancient kiln design and blends tribal Warli themes onto terracotta plate surfaces in his Odisha workshop.',
      portfolio: [
        { url: 'https://images.unsplash.com/photo-1576016770956-debb63d90029?auto=format&fit=crop&q=80&w=600', alt: 'Pottery wheel', type: 'image' }
      ],
      ratingAvg: 4.8,
      productCount: 7,
      onboardingStatus: 'onboarded',
      commissionProfileId: 'default',
      kycVerified: true,
      payoutMasked: '•••• 1245',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'artisan_lalita',
      ownerUid: 'user_seller_lalita',
      name: 'Lalita Meo',
      slug: 'lalita-meo',
      region: 'Chanderi, Madhya Pradesh',
      craftSpecialty: ['block-print', 'meenakari'],
      materials: ['silver', 'fabric', 'thread'],
      bio: 'Lalita weaves block-printed fabrics and crafts delicate hand-strung silver meenakari jewelry lines reflecting royal patterns.',
      story: 'Lalita directs a self-help cooperative of 15 women artisans in Chanderi, enabling girls to master block carving & traditional enameling.',
      portfolio: [
        { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600', alt: 'Block print process', type: 'image' }
      ],
      ratingAvg: 4.7,
      productCount: 6,
      onboardingStatus: 'onboarded',
      commissionProfileId: 'default',
      kycVerified: true,
      payoutMasked: '•••• 3922',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  categories: [
    // Pillars (Level 0)
    { id: 'cat_dining', name: 'Dining', slug: 'dining', parentId: null, path: ['dining'], level: 0, pillar: 'dining', sortOrder: 1, isActive: true, seo: { title: 'Artisanal Dining and Tableware | Craftifue', description: 'Explore hand-thrown ceramic plates, wooden server trays and lost-wax brass bowls.' } },
    { id: 'cat_lighting', name: 'Lighting', slug: 'lighting', parentId: null, path: ['lighting'], level: 0, pillar: 'lighting', sortOrder: 2, isActive: true, seo: { title: 'Decorative Handcrafted Lamps and Lighting | Craftifue', description: 'Pendant lamps, desk lanterns and classic clay diyas.' } },
    { id: 'cat_decor', name: 'Decor', slug: 'decor', parentId: null, path: ['decor'], level: 0, pillar: 'decor', sortOrder: 3, isActive: true, seo: { title: 'Elegant Indian Home Decor & Frames | Craftifue', description: 'Warli and Madhubani wall panels, brass figurines and hand-carved mirrors.' } },
    { id: 'cat_garden', name: 'Garden', slug: 'garden', parentId: null, path: ['garden'], level: 0, pillar: 'garden', sortOrder: 4, isActive: true, seo: { title: 'Earthy Terracotta Planters & Hanging Pots | Craftifue', description: 'Terracotta wall hanging pots, ceramic bowls and succulent planters.' } },
    { id: 'cat_jewellery', name: 'Handcrafted Jewellery', slug: 'handcrafted-jewellery', parentId: null, path: ['handcrafted-jewellery'], level: 0, pillar: 'jewellery', sortOrder: 5, isActive: true, seo: { title: 'Ethnic Handcrafted Sterling Silver & Brass Jewelry | Craftifue', description: 'Beautiful earrings, necklaces, bangles and rings handcrafted by local master silver smiths.' } },

    // Sub-Categories (Level 1)
    { id: 'cat_dining_plates', name: 'Ceramic Plates', slug: 'ceramic-plates', parentId: 'cat_dining', path: ['dining', 'ceramic-plates'], level: 1, pillar: 'dining', sortOrder: 10, isActive: true, seo: { title: 'High-fired Ceramic Dinner Plates', description: 'Studio pottery.' } },
    { id: 'cat_dining_bowls', name: 'Ceramic Bowls', slug: 'ceramic-bowls', parentId: 'cat_dining', path: ['dining', 'ceramic-bowls'], level: 1, pillar: 'dining', sortOrder: 11, isActive: true, seo: { title: 'Hand-etched Ceramic Bowls', description: 'Studio pottery serving bowls.' } },
    { id: 'cat_dining_trays', name: 'Wooden Serving Platters', slug: 'wooden-serving-platters', parentId: 'cat_dining', path: ['dining', 'wooden-serving-platters'], level: 1, pillar: 'dining', sortOrder: 12, isActive: true, seo: { title: 'Rosewood Platter Sets', description: 'Carved serving accessories.' } },
    
    { id: 'cat_lighting_lamps', name: 'Pendant Lamps', slug: 'pendant-lamps', parentId: 'cat_lighting', path: ['lighting', 'pendant-lamps'], level: 1, pillar: 'lighting', sortOrder: 20, isActive: true, seo: { title: 'Terracotta Pendant Hanging Lights', description: 'Natural earthen glow.' } },
    { id: 'cat_lighting_diyas', name: 'Brass Diyas', slug: 'brass-diyas', parentId: 'cat_lighting', path: ['lighting', 'brass-diyas'], level: 1, pillar: 'lighting', sortOrder: 21, isActive: true, seo: { title: 'Lost-wax Cast Brass Diyas', description: 'Bastar metal craft.' } },

    { id: 'cat_decor_panels', name: 'Wall Panels', slug: 'wall-panels', parentId: 'cat_decor', path: ['decor', 'wall-panels'], level: 1, pillar: 'decor', sortOrder: 30, isActive: true, seo: { title: 'Traditional Wall Panels & Paintings', description: 'Madhubani/Warli.' } },
    { id: 'cat_decor_mirrors', name: 'Wooden Mirrors', slug: 'wooden-mirrors', parentId: 'cat_decor', path: ['decor', 'wooden-mirrors'], level: 1, pillar: 'decor', sortOrder: 31, isActive: true, seo: { title: 'Mango Wood Mirrors', description: 'Engraved glass mirrors.' } },

    { id: 'cat_garden_planters', name: 'Terracotta Planters', slug: 'terracotta-planters', parentId: 'cat_garden', path: ['garden', 'terracotta-planters'], level: 1, pillar: 'garden', sortOrder: 40, isActive: true, seo: { title: 'Earthen Garden Planters', description: 'Porious natural pots.' } },
    { id: 'cat_garden_hanging', name: 'Hanging Pots', slug: 'hanging-pots', parentId: 'cat_garden', path: ['garden', 'hanging-pots'], level: 1, pillar: 'garden', sortOrder: 41, isActive: true, seo: { title: 'Jute Hanging Baskets', description: 'Eco friendly hanging.' } },

    { id: 'cat_jew_earrings', name: 'Earrings', slug: 'earrings', parentId: 'cat_jewellery', path: ['handcrafted-jewellery', 'earrings'], level: 1, pillar: 'jewellery', sortOrder: 50, isActive: true, seo: { title: 'Handcrafted Earrings', description: 'Ethnic silver ear studs.' } },
    { id: 'cat_jew_necklaces', name: 'Necklaces & Pendants', slug: 'necklaces-pendants', parentId: 'cat_jewellery', path: ['handcrafted-jewellery', 'necklaces-pendants'], level: 1, pillar: 'jewellery', sortOrder: 51, isActive: true, seo: { title: 'Royal Enamelled Necklaces', description: 'Tribal silver neck pieces.' } },
    { id: 'cat_jew_bangles', name: 'Bangles & Bracelets', slug: 'bangles-bracelets', parentId: 'cat_jewellery', path: ['handcrafted-jewellery', 'bangles-bracelets'], level: 1, pillar: 'jewellery', sortOrder: 52, isActive: true, seo: { title: 'Silver Filigree Bracelets', description: 'Ornate wrist bangles.' } }
  ],
  products: [
    // DINING
    {
      id: 'prod_dining_1',
      title: 'Bastar Tribal Brass Serving Bowl',
      slug: 'bastar-tribal-brass-serving-bowl',
      sku: 'CFT-DIN-BRS-01',
      description: 'Handcasted in Bastar Chhatisgarh, this heavy brass serving bowl features typical fluid lost-wax tribal carvings along its outer rim. Ideal for festive styling or dry fruit serving.',
      artisanId: 'artisan_suman',
      categoryPath: ['dining', 'ceramic-bowls'],
      pillar: 'dining',
      material: ['brass'],
      artForm: ['dhokra'],
      colors: ['Gold', 'Bronze'],
      price: 189900, // ₹1,899.00
      mrp: 249900, // ₹2,499.00
      discountPct: 24,
      inventory: 15,
      variants: [
        { sku: 'CFT-DIN-BRS-01-S', label: 'Medium (15cm)', price: 189900, mrp: 249900, inventory: 15 },
        { sku: 'CFT-DIN-BRS-01-L', label: 'Large (22cm)', price: 289900, mrp: 349900, inventory: 8 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=600', alt: 'Tribal brass bowl', type: 'image', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=600', alt: 'Lost wax casting view', type: 'image' }
      ],
      model3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', // Fallback .glb for model preview
      dimensionsCm: { l: 15, w: 15, h: 8 },
      weightGrams: 900,
      tags: ['brass bowl', 'tribal', 'dining', 'bastar', 'festive decoration'],
      status: 'active',
      ratingAvg: 4.9,
      ratingCount: 12,
      salesCount: 38,
      isNew: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_dining_2',
      title: 'Studio Pottery Terracotta Platter Set',
      slug: 'studio-pottery-terracotta-platter-set',
      sku: 'CFT-DIN-POT-02',
      description: 'Hand-thrown earthen dining platter accompanied by three organic side bowls. Fully fired to 1100°C for exceptional strength, hand-painted with tribal geometric figures.',
      artisanId: 'artisan_gopal',
      categoryPath: ['dining', 'ceramic-plates'],
      pillar: 'dining',
      material: ['terracotta', 'ceramic'],
      artForm: ['studio-pottery', 'warli'],
      colors: ['Tan', 'Black', 'White'],
      price: 145000, // ₹1,450.00
      mrp: 199900, // ₹1,999.00
      discountPct: 27,
      inventory: 24,
      variants: [
        { sku: 'CFT-DIN-POT-02-D', label: 'Standard Set', price: 145000, mrp: 199900, inventory: 24 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=600', alt: 'Terracotta plated dining ware', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 30, w: 30, h: 4 },
      weightGrams: 1500,
      tags: ['plates', 'terracotta dinnerwear', 'studio pottery', 'earthen', 'organic'],
      status: 'active',
      ratingAvg: 4.8,
      ratingCount: 16,
      salesCount: 42,
      isNew: false,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // LIGHTING
    {
      id: 'prod_light_1',
      title: 'Bastar Hanging Antler Brass Lamp',
      slug: 'bastar-hanging-antler-brass-lamp',
      sku: 'CFT-LGT-BRS-03',
      description: 'A striking structural brass pendant light using deer-motif lost wax panels, casting majestic intricate tribal lattice shadows across your walls and ceilings.',
      artisanId: 'artisan_suman',
      categoryPath: ['lighting', 'pendant-lamps'],
      pillar: 'lighting',
      material: ['brass'],
      artForm: ['dhokra'],
      colors: ['Gold', 'Ancient Gold'],
      price: 349000, // ₹3,490.00
      mrp: 499000, // ₹4,990.00
      discountPct: 30,
      inventory: 6,
      variants: [
        { sku: 'CFT-LGT-BRS-03-P', label: 'Single Hanging Pillar', price: 349000, mrp: 499000, inventory: 6 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600', alt: 'Antique brass hanging light', type: 'image', isPrimary: true }
      ],
      model3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      dimensionsCm: { l: 20, w: 20, h: 45 },
      weightGrams: 2200,
      tags: ['brass lamp', 'dhokra light', 'pendant light', 'bastar decor'],
      status: 'active',
      ratingAvg: 5.0,
      ratingCount: 4,
      salesCount: 12,
      isNew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_light_2',
      title: 'Terracotta Bell Hanging Pendant Light',
      slug: 'terracotta-bell-hanging-pendant-light',
      sku: 'CFT-LGT-POT-04',
      description: 'Natural earthen dome bell styled hanging light. Handcrafted slip-carved geometric slots allow warm shafts of ambient light. Equipped with brass socket fixture.',
      artisanId: 'artisan_gopal',
      categoryPath: ['lighting', 'pendant-lamps'],
      pillar: 'lighting',
      material: ['terracotta'],
      artForm: ['studio-pottery'],
      colors: ['Earthy Brown', 'Clay Red'],
      price: 129000, // ₹1,290.00
      mrp: 179000, // ₹1,790.00
      discountPct: 27,
      inventory: 18,
      variants: [
        { sku: 'CFT-LGT-POT-04-B', label: 'Terracotta Bell', price: 129000, mrp: 179000, inventory: 18 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600', alt: 'Clay hanging bell lamp', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 22, w: 22, h: 22 },
      weightGrams: 1400,
      tags: ['bell lamp', 'clay light', 'terracotta lighting', 'earthy modern style'],
      status: 'active',
      ratingAvg: 4.7,
      ratingCount: 8,
      salesCount: 22,
      isNew: false,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // DECOR
    {
      id: 'prod_decor_1',
      title: 'Warli Hand-Carved Framed Wall Story',
      slug: 'warli-hand-carved-framed-wall-story',
      sku: 'CFT-DEC-WRL-05',
      description: 'Intricately hand-carved mango wood frame enclosing a rice-paste Warli folk tribal storytelling board. Showcases scenes of harvest, community bonds and forest rhythms.',
      artisanId: 'artisan_gopal',
      categoryPath: ['decor', 'wall-panels'],
      pillar: 'decor',
      material: ['wood', 'fabric'],
      artForm: ['warli', 'hand-carved'],
      colors: ['Mahogany', 'Cream'],
      price: 245000, // ₹2,450.00
      mrp: 350000, // ₹3,500.00
      discountPct: 30,
      inventory: 10,
      variants: [
        { sku: 'CFT-DEC-WRL-05-ST', label: 'Medium Frame', price: 245000, mrp: 350000, inventory: 10 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600', alt: 'Tribal framed artwork', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 45, w: 30, h: 3 },
      weightGrams: 1800,
      tags: ['warli frame', 'tribal painting', 'wall panel', 'wood carved frame'],
      status: 'active',
      ratingAvg: 4.8,
      ratingCount: 7,
      salesCount: 15,
      isNew: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // GARDEN
    {
      id: 'prod_gard_1',
      title: 'Hand-Etched Terracotta Wall Planter Pot',
      slug: 'hand-etched-terracotta-wall-planter-pot',
      sku: 'CFT-GAR-POT-06',
      description: 'Earthy porous terracotta wall hanging pot with gorgeous, hand-etched waves. Porous nature encourages supreme soil breathing, keeping root-rot completely at bay.',
      artisanId: 'artisan_gopal',
      categoryPath: ['garden', 'terracotta-planters'],
      pillar: 'garden',
      material: ['terracotta'],
      artForm: ['studio-pottery'],
      colors: ['Brick Red'],
      price: 79900, // ₹799.00
      mrp: 119900, // ₹1,199.00
      discountPct: 33,
      inventory: 30,
      variants: [
        { sku: 'CFT-GAR-POT-06-W', label: 'Etched Dome Pot', price: 79900, mrp: 119900, inventory: 30 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=600', alt: 'Earthen wall planters', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 18, w: 12, h: 18 },
      weightGrams: 800,
      tags: ['planter pot', 'wall planter', 'terracotta pot', 'eco gardening'],
      status: 'active',
      ratingAvg: 4.6,
      ratingCount: 20,
      salesCount: 64,
      isNew: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // JEWELLERY
    {
      id: 'prod_jew_1',
      title: 'Sterling Silver Meenakari Peacock Jhumkas',
      slug: 'sterling-silver-meenakari-peacock-jhumkas',
      sku: 'CFT-JEW-SLV-07',
      description: 'Splendid sterling silver standard 925 royal peacock earrings, colored using high-class Chanderi hand-fired meenakari vitrified enameling with pure miniature glass beads drops.',
      artisanId: 'artisan_lalita',
      categoryPath: ['handcrafted-jewellery', 'earrings'],
      pillar: 'jewellery',
      material: ['silver', 'beadwork'],
      artForm: ['meenakari'],
      colors: ['Sky Blue', 'Teal Green', 'Silver'],
      price: 289000, // ₹2,890.00
      mrp: 399000, // ₹3,990.00
      discountPct: 27,
      inventory: 14,
      variants: [
        { sku: 'CFT-JEW-SLV-07-S', label: 'Classic Sterling Blue', price: 289000, mrp: 399000, inventory: 14 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600', alt: 'Handmade silver meenakari earring drops', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 6, w: 3, h: 2 },
      weightGrams: 28,
      tags: ['silver earrings', 'meenakari jhumkas', 'royal ethnic jewelry', 'handmade jewelry'],
      status: 'active',
      ratingAvg: 4.9,
      ratingCount: 15,
      salesCount: 45,
      isNew: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_jew_2',
      title: 'Hand-Woven Royal Silk Thread Choker',
      slug: 'hand-woven-royal-silk-thread-choker',
      sku: 'CFT-JEW-THR-08',
      description: 'Lustrous, deep peacock blue pure silk threads hand-braided and adorned with tiny silver beads and a brilliant hand-carved brass center dial casting ethnic royal elegance.',
      artisanId: 'artisan_lalita',
      categoryPath: ['handcrafted-jewellery', 'necklaces-pendants'],
      pillar: 'jewellery',
      material: ['thread', 'brass'],
      artForm: ['block-print', 'meenakari'],
      colors: ['Royal Blue', 'Gold'],
      price: 185000, // ₹1,850.00
      mrp: 250000, // ₹2,500.00
      discountPct: 26,
      inventory: 12,
      variants: [
        { sku: 'CFT-JEW-THR-08-C', label: 'Standard Ribbon Tie', price: 185000, mrp: 250000, inventory: 12 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600', alt: 'Silk thread silver necklace choker', type: 'image', isPrimary: true }
      ],
      dimensionsCm: { l: 32, w: 4, h: 1 },
      weightGrams: 45,
      tags: ['silk choker', 'thread necklace', 'traditional neckpiece', 'handmade mp arts'],
      status: 'active',
      ratingAvg: 4.8,
      ratingCount: 10,
      salesCount: 23,
      isNew: false,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  collections: [
    { id: 'col_warli_min', title: 'Warli Minimalists', slug: 'warli-minimal', sortOrder: 1, isActive: true, rule: { kind: 'manual', productIds: ['prod_dining_2', 'prod_decor_1'] } },
    { id: 'col_brass_fest', title: 'Festive Brass Alloys', slug: 'brass-festive', sortOrder: 2, isActive: true, rule: { kind: 'manual', productIds: ['prod_dining_1', 'prod_light_1'] } },
    { id: 'col_monsoon_earth', title: 'Monsoon Earthenware', slug: 'earthy-monsoon', sortOrder: 3, isActive: true, rule: { kind: 'manual', productIds: ['prod_dining_2', 'prod_light_2', 'prod_gard_1'] } }
  ],
  carts: [],
  orders: [
    // Pre-seed some historic sample orders to fuel the Predictive Demand Analytics tool realistically!
    {
      id: 'order_1001',
      buyerUid: 'user_buyer_1',
      items: [
        { productId: 'prod_dining_1', sku: 'CFT-DIN-BRS-01-S', title: 'Bastar Tribal Brass Serving Bowl', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=300', unitPrice: 189900, qty: 1, artisanId: 'artisan_suman', commissionPct: 5 }
      ],
      pricing: { subtotal: 189900, discount: 0, giftWrap: 0, shipping: 12000, tax: 34182, total: 236082 },
      shippingAddress: { fullName: 'Aanya Iyer', phone: '+91 99911 22334', line1: 'Block C, Golden Woods', line2: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', country: 'IN', isDefault: true },
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      status: 'delivered',
      razorpayOrderId: 'order_rp_seed1',
      razorpayPaymentId: 'pay_rp_seed1',
      invoiceNo: 'CFT-2026-1001',
      timeline: [
        { status: 'created', at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), note: 'Order created.' },
        { status: 'paid', at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), note: 'Payment verified.' },
        { status: 'shipped', at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: 'Dispatched through Delhivery.' },
        { status: 'delivered', at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), note: 'Delivered in hand.' }
      ],
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'order_1002',
      buyerUid: 'user_buyer_1',
      items: [
        { productId: 'prod_dining_2', sku: 'CFT-DIN-POT-02-D', title: 'Studio Pottery Terracotta Platter Set', image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=300', unitPrice: 145000, qty: 2, artisanId: 'artisan_gopal', commissionPct: 5 },
        { productId: 'prod_gard_1', sku: 'CFT-GAR-POT-06-W', title: 'Hand-Etched Terracotta Wall Planter Pot', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=300', unitPrice: 79900, qty: 1, artisanId: 'artisan_gopal', commissionPct: 5 }
      ],
      pricing: { subtotal: 369900, discount: 20000, giftWrap: 5000, shipping: 15000, tax: 66582, total: 436482 },
      shippingAddress: { fullName: 'Aanya Iyer', phone: '+91 99911 22334', line1: 'Block C, Golden Woods', line2: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', country: 'IN', isDefault: true },
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      status: 'confirmed',
      razorpayOrderId: 'order_rp_seed2',
      razorpayPaymentId: 'pay_rp_seed2',
      invoiceNo: 'CFT-2026-1002',
      timeline: [
        { status: 'created', at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Order placed.' },
        { status: 'paid', at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Payment received.' },
        { status: 'confirmed', at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Awaiting shipping pickup.' }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  shipments: [
    {
      id: 'ship_1',
      orderId: 'order_1001',
      provider: 'delhivery',
      awbCode: 'AWB-55113912a',
      courier: 'Delhivery Surface Premium',
      status: 'delivered',
      history: [
        { status: 'manifested', location: 'Bastar Outpost', at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'in_transit', location: 'Raipur Hub', at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'out_for_delivery', location: 'Bengaluru South East', at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'delivered', location: 'Bengaluru Whitefield Office', at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  commissionProfiles: [
    { id: 'default', name: 'Standard Artisan Commission Profile', onboardingPct: 3, perSalePct: 5, onboardingBase: 1000000, returnWindowDays: 7, isActive: true }
  ],
  commissionLedger: [
    { id: 'col_1', artisanId: 'artisan_suman', type: 'onboarding', baseAmount: 1000000, ratePct: 3, amount: 30000, status: 'payable', createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col_2', artisanId: 'artisan_suman', type: 'sale', orderId: 'order_1001', productId: 'prod_dining_1', baseAmount: 189900, ratePct: 5, amount: 9495, status: 'payable', createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col_3', artisanId: 'artisan_gopal', type: 'sale', orderId: 'order_1002', productId: 'prod_dining_2', baseAmount: 290000, ratePct: 5, amount: 14500, status: 'accrued', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() }
  ],
  payouts: [
    { id: 'pay_1', artisanId: 'artisan_suman', entryIds: ['col_1'], amount: 30000, status: 'paid', method: 'bank_transfer', reference: 'TXN-77312948', initiatedBy: 'user_admin', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  campaigns: [
    {
      id: 'camp_1',
      title: 'Artisan Healthcare and Welfare Trust Fund',
      slug: 'artisan-healthcare-fund',
      category: 'artisan_welfare',
      beneficiarySummary: 'Affectionate coverage for medical, life, and accident insurances for rural Indian karigars and their elder kin.',
      story: 'Often living in extreme remoteness, veteran weavers and potters lack immediate reach to clinics. This fund finances fully loaded primary health checkup vans visiting Bastar, Khurda, and Chanderi craft clusters once every fortnight.',
      cover: { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', alt: 'Artisan cluster', type: 'image' },
      goalAmount: 50000000, // ₹5,00,000.00
      raisedAmount: 1250000, // ₹12,500.00
      donorCount: 22,
      verifiedDocUrls: ['https://example.com/certificate-of-trust-welfare.pdf'],
      disbursementMilestones: [
        { stage: 'First Bastar Healthcare Mobile Camp setup', amount: 500000, status: 'verified', proofUrl: '#', recipient: 'Raipur Mission Clinic', releasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { stage: 'Chanderi Weaver Cluster Health Auditing Support', amount: 450000, status: 'planned' }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  donations: [
    { id: 'don_1', donorUid: 'user_buyer_1', donorName: 'Aanya Iyer', donorEmail: 'aanya@example.com', campaignId: 'camp_1', amount: 125000, razorpayPaymentId: 'pay_rp_don1', receiptNo: '80G-2026-9041', status: 'paid', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  aiOutreach: [
    {
      id: 'out_1',
      query: 'Bastar metal craft specialists',
      candidateName: 'Ramesh Sonkar',
      candidateRegion: 'Kondagaon, Bastar Division',
      candidateCraft: ['dhokra'],
      contactChannel: 'email',
      contactValue: 'ramesh.bastar@crafts.in',
      emailDraft: 'Dear Ramesh-ji,\n\nWe saw your intricate copper figurines of forest gods during the Dilli Haat craft fair. We are building an direct digital storefront on Craftifue to showcase Bastar metals directly to buyers. With our 3% onboarding support, we would love to list your crafts and tell your artistic story to patrons worldwide.\n\nWarmly, \nRD Craftifue India Team',
      status: 'drafted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  reviews: [
    { id: 'rev_1', productId: 'prod_dining_1', buyerUid: 'user_buyer_1', rating: 5, title: 'Incredibly authentic feel', body: 'The lost-wax brass carvings feel deeply textured. You can immediately feel the weight and gravity of the maker in it!', verifiedPurchase: true, createdAt: new Date().toISOString() }
  ],
  coupons: [
    { id: 'KART10', code: 'KART10', type: 'percent', value: 10, minOrder: 100000, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(), usedCount: 3, isActive: true }
  ],
  notifications: [
    { id: 'not_1', uid: 'user_admin', kind: 'order', title: 'New Order Received', body: 'Order #1002 has been placed successfully by Aanya Iyer.', read: false, createdAt: new Date().toISOString() }
  ],
  spaces: [],
  lookbooks: [
    {
      id: 'lb_festive',
      title: 'Monsoon Festive Brass Elegance',
      slug: 'brass-festive-elegance',
      theme: 'Adorning modern minimal dining spaces with traditional heavy cast lost-wax ritual objects.',
      heroModel3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      productIds: ['prod_dining_1', 'prod_light_1'],
      trendScore: 92,
      refreshedAt: new Date().toISOString()
    },
    {
      id: 'lb_earthen',
      title: 'Clay & Hand-Etched Terracotta',
      slug: 'clay-terracotta-gardening',
      theme: 'Eco-breathing earthen materials blended with modern geometric carving.',
      heroModel3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      productIds: ['prod_dining_2', 'prod_light_2', 'prod_gard_1'],
      trendScore: 88,
      refreshedAt: new Date().toISOString()
    }
  ],
  logoConfig: {
    customImage: null,
    brandName: 'Craftifue',
    primaryColor: '#C4683B'
  }
};

// Seed DB on startup if it doesn't exist
const ensureDbLoaded = (): DbSchema => {
  if (!fs.existsSync(DB_FILE)) {
    console.log('🌱 Seeding database store file initialized at', DB_FILE);
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    return DEFAULT_DB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    // Guard against empty files
    if (!data.trim()) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
      return DEFAULT_DB;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB_FILE. Repairing and restoring default seed.', error);
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    return DEFAULT_DB;
  }
};

const saveDb = (dbState: DbSchema) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
};

let db = ensureDbLoaded();

/* ------------------------------------------------------------------ */
/* GENERIC DB CRUD REST ENDPOINTS                                      */
/* ------------------------------------------------------------------ */

app.get('/api/db', (req, res) => {
  // Always reload live state to support real-time file updates
  db = ensureDbLoaded();
  res.json(db);
});

app.get('/api/db/:collection', (req, res) => {
  db = ensureDbLoaded();
  const coll = req.params.collection as keyof DbSchema;
  if (!(coll in db)) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(db[coll]);
});

app.post('/api/db/:collection', (req, res) => {
  db = ensureDbLoaded();
  const coll = req.params.collection as keyof DbSchema;
  if (!(coll in db) || !Array.isArray(db[coll])) {
    return res.status(404).json({ error: 'Collection not found or read-only' });
  }
  const item = req.body;
  if (!item.id) {
    item.id = `${coll.substring(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  item.createdAt = item.createdAt || new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  db[coll].push(item);
  saveDb(db);
  res.status(201).json(item);
});

app.put('/api/db/:collection/:id', (req, res) => {
  db = ensureDbLoaded();
  const { collection, id } = req.params;
  const coll = collection as keyof DbSchema;
  if (!(coll in db) || !Array.isArray(db[coll])) {
    return res.status(445).json({ error: 'Collection not found' });
  }
  const arr = db[coll] as any[];
  const index = arr.findIndex((x: any) => x.id === id || (x.uid && x.uid === id));
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  const current = arr[index];
  const updated = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  arr[index] = updated;
  saveDb(db);
  res.json(updated);
});

app.delete('/api/db/:collection/:id', (req, res) => {
  db = ensureDbLoaded();
  const { collection, id } = req.params;
  const coll = collection as keyof DbSchema;
  if (!(coll in db) || !Array.isArray(db[coll])) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  const arr = db[coll] as any[];
  const filtered = arr.filter((x: any) => x.id !== id && x.uid !== id);
  if (arr.length === filtered.length) {
    return res.status(404).json({ error: 'Document not found' });
  }
  (db as any)[coll] = filtered;
  saveDb(db);
  res.json({ success: true, deletedId: id });
});

/* ------------------------------------------------------------------ */
/* SPECIFIC COMMERCE & CUSTOM FLOWS                                   */
/* ------------------------------------------------------------------ */

// Logo Branding Config Endpoint
app.post('/api/logo/config', (req, res) => {
  db = ensureDbLoaded();
  if (!req.body) return res.status(400).json({ error: 'Missing body data' });
  db.logoConfig = {
    ...db.logoConfig,
    ...req.body
  };
  saveDb(db);
  res.json(db.logoConfig);
});

// Checkout order creator
app.post('/api/checkout', (req, res) => {
  db = ensureDbLoaded();
  const { buyerUid, items, pricing, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Product items are required' });
  }

  // Generate unique order ID
  const orderId = `order_${1000 + db.orders.length + 1}`;
  const invoiceNo = `CFT-2026-${1000 + db.orders.length + 1}`;

  // Process items, reduce inventory and compute commission ledgerentries
  const processedItems = items.map((cartItem: any) => {
    // Find matching product variant or main product
    const productIndex = db.products.findIndex((p: any) => p.id === cartItem.productId);
    if (productIndex !== -1) {
      const product = db.products[productIndex];
      // Reduce main product stock
      product.inventory = Math.max(0, product.inventory - cartItem.qty);
      product.salesCount += cartItem.qty;
    }
    return {
      ...cartItem,
      commissionPct: 5 // snapshot standard 5%
    };
  });

  // Write Commission Entries in ledger (5% of selling amount per item in Paise)
  processedItems.forEach((item: any) => {
    const itemSubtotal = item.unitPrice * item.qty;
    const commissionAmount = Math.round(itemSubtotal * 0.05);
    
    const commissionId = `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const ledgerEntry = {
      id: commissionId,
      artisanId: item.artisanId,
      type: 'sale',
      orderId,
      productId: item.productId,
      baseAmount: itemSubtotal,
      ratePct: 5,
      amount: commissionAmount,
      status: 'accrued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.commissionLedger.push(ledgerEntry);
  });

  // Adjust coupon if valid
  if (couponCode) {
    const cpIndex = db.coupons.findIndex(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (cpIndex !== -1) {
      db.coupons[cpIndex].usedCount += 1;
    }
  }

  // Write order
  const newOrder = {
    id: orderId,
    buyerUid: buyerUid || 'user_buyer_1',
    items: processedItems,
    pricing,
    shippingAddress,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'cod_pending',
    status: 'confirmed',
    invoiceNo,
    timeline: [
      { status: 'created', at: new Date().toISOString(), note: 'Order placed successfully.' },
      { status: 'confirmed', at: new Date().toISOString(), note: 'Payment validated. Crafting initiated.' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Write notification for Admin
  db.notifications.push({
    id: `not_${Date.now()}`,
    uid: 'user_admin',
    kind: 'order',
    title: 'New Paid Order Confirmed',
    body: `Invoice ${invoiceNo} (₹${(pricing.total / 100).toLocaleString('en-IN')}) placed successfully!`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.status(201).json(newOrder);
});

// Donation creator
app.post('/api/donate', (req, res) => {
  db = ensureDbLoaded();
  const { donorName, donorEmail, campaignId, amount, donorUid } = req.body;

  if (!campaignId || !amount) {
    return res.status(400).json({ error: 'Missing required campaign or amount' });
  }

  const campaignIndex = db.campaigns.findIndex(c => c.id === campaignId);
  if (campaignIndex === -1) {
    return res.status(404).json({ error: 'Campaign welfare target not found' });
  }

  // Update campaign raised and donor counts
  db.campaigns[campaignIndex].raisedAmount += amount;
  db.campaigns[campaignIndex].donorCount += 1;

  const donationId = `don_${Date.now()}`;
  const receiptNo = `80G-2026-${9001 + db.donations.length}`;

  const newDonation = {
    id: donationId,
    donorUid: donorUid || 'user_buyer_1',
    donorName,
    donorEmail,
    campaignId,
    amount,
    receiptNo,
    status: 'paid',
    createdAt: new Date().toISOString()
  };

  db.donations.push(newDonation);

  // Send admin notice
  db.notifications.push({
    id: `not_${Date.now()}`,
    uid: 'user_admin',
    kind: 'donation',
    title: 'New Humanitarian Contribution',
    body: `₹${(amount / 100).toLocaleString('en-IN')} received for ${db.campaigns[campaignIndex].title}! Receipt generated.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.status(201).json(newDonation);
});

/* ------------------------------------------------------------------ */
/* GEMINI AI API SERVICES (REAL TIME PREDICTIVE ANALYTICS & GENERATOR)*/
/* ------------------------------------------------------------------ */

// 1. Predictive Demand Analytics & Trends Forecast Engine
app.get('/api/gemini/analytics', async (req, res) => {
  db = ensureDbLoaded();
  
  if (!ai) {
    // Elegant fallback simulation in offline mod
    return res.json({
      modelUsed: 'mock-offline-predictor',
      forecastSummary: 'Craftifue smart demand forecast (Simulated Local Fallback - verify GEMINI_API_KEY in Secrets).',
      analysisMarkdown: `### 📈 Predictive Sales Trend Insights (Local Analytics)
We parsed the dataset consisting of **${db.orders.length} historical shipments** and **${db.commissionLedger.length} accrued commissions**.

#### 🎯 Strategic Takeaways
- **Dhokra Metalware Demand Rise**: An observed **15% upward trend** in lost-wax brass alloys for festive home decoration.
- **Welfare-Induced Engagement**: Shoppers who checked campaign donation welfare targets displayed a **22% higher Average Order Value (AOV)** checkout conversion.
- **Category Velocity**: Dining (Ceramics) has the highest stock rotation cycle, demanding rapid restocking cycle from our Khurda artisan Gopal.`,
      forecastData: [
        { month: 'Jun 2026', diningSales: 280000, lightingSales: 190000, decorSales: 160000 },
        { month: 'Jul 2026', diningSales: 310000, lightingSales: 240000, decorSales: 210000 },
        { month: 'Aug 2026', diningSales: 340000, lightingSales: 290000, decorSales: 240000 }
      ]
    });
  }

  try {
    const historicalContext = {
      totalProducts: db.products.length,
      orders: db.orders.map(o => ({
        id: o.id,
        items: o.items.map((i: any) => ({ title: i.title, qty: i.qty, pricePaise: i.unitPrice, artisanId: i.artisanId })),
        totalPaise: o.pricing.total,
        date: o.createdAt
      })),
      categories: db.categories.map(c => ({ name: c.name, pillar: c.pillar })),
      unsettledCommissionPaise: db.commissionLedger.reduce((sum, entry) => sum + (entry.status !== 'paid' ? entry.amount : 0), 0)
    };

    const sysInstruction = `You are the master predictive data forecaster for Craftifue, a premium Indian organic handicraft store.
You perform smart demand analytics on historical order metrics and return predictions for the next 3 months (June, July, August 2026).
Respond in a strict JSON object with these EXACT keys:
{
  "forecastSummary": "A concise 1-sentence strategic analysis synthesis.",
  "analysisMarkdown": "Formidable detailed markdown forecasting trends, customer conversion indicators, and supply chain artisan recommendation tables.",
  "forecastData": [
    { "month": "Jun 2026", "diningSales": number, "lightingSales": number, "decorSales": number },
    { "month": "Jul 2026", "diningSales": number, "lightingSales": number, "decorSales": number },
    { "month": "Aug 2026", "diningSales": number, "lightingSales": number, "decorSales": number }
  ]
}`;

    const promptMessage = `Historical orders dataset: ${JSON.stringify(historicalContext)}.
Please forecast future sales velocity, analyze catalog density, and provide structural insights in JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptMessage,
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: 'application/json'
      }
    });

    const resultText = response.text || '';
    const parsed = JSON.parse(resultText);
    res.json({
      modelUsed: 'gemini-3.5-flash',
      ...parsed
    });
  } catch (error: any) {
    console.error('Gemini prediction failure:', error);
    res.status(500).json({ error: 'AI prediction failed', detail: error.message });
  }
});

// 2. Multimodal AI Copywriter (Artisan Story writer, Product desc generator, Outreach email drafter)
app.post('/api/gemini/generate', async (req, res) => {
  const { type, payload } = req.body; // type: 'story' | 'outreach' | 'description' | 'visual_spaces'

  if (!payload) {
    return res.status(400).json({ error: 'Missing generation prompt payload' });
  }

  if (!ai) {
    // High-quality offline fallback templates
    if (type === 'story') {
      return res.json({
        content: `Master Carver ${payload.name || 'Artisan'}-ji resides in Odisha's peaceful craft groves. Harvesting bamboo with strict astrological cycles, they fuse traditional lost-wax processes with contemporary silhouettes, creating exquisite geometric sculptures.`
      });
    } else if (type === 'outreach') {
      return res.json({
        content: `Subject: Invitation to showcase your master craftsmanship on Craftifue\n\nDear ${payload.name || 'Artisan'}-ji,\n\nWe deeply admire your exceptional work in Bastar metal alloys. On Craftifue, we support organic master makers directly. We would love to onboard you into our registry, offer a dedicated profile page, and assign our default 3% onboarding support directly into your personal account ledger.\n\nWarmest regards,\nRD Craftifue India Team`
      });
    } else {
      return res.json({
        content: `Exquisitely hand-sculpted using local clays. Each piece carries organic brush strokes mirroring regional tribal harvest scenes, finished with high-temperature vitrifying glazed seals.`
      });
    }
  }

  try {
    let systemInstruction = '';
    let promptText = '';

    if (type === 'story') {
      systemInstruction = 'You are a warm, traditional arts biographer. Write an elegant 3-sentence editorial backstory describing the artisan and their metallurgic, weaving, or clay calling.';
      promptText = `Write an elegant biographical story for craft maker named ${payload.name} specializing in ${JSON.stringify(payload.specialties)} based in region ${payload.region}. Craft bio context: "${payload.bio}".`;
    } else if (type === 'outreach') {
      systemInstruction = 'You are an outreach manager for Craftifue. Write a warm, professional, respectful onboarding invitation email. Showcase our standard artisan-centric program highlighting 3% onboarding ledgers and direct pricing.';
      promptText = `Draft a personalized outreach letter to handicraft prospect ${payload.name} specializing in ${JSON.stringify(payload.crafts)} in region ${payload.region}.`;
    } else if (type === 'visual_spaces') {
      systemInstruction = 'You are an elite interior architecture AI decorator. Propose color schemes, styling layouts, and accessory variants matching the room description.';
      promptText = `Our premium item is: "${payload.productTitle}". The user uploaded their room image details: "${payload.roomDescription}". Propose how to position the item and what materials fit.`;
    } else {
      systemInstruction = 'You are a luxury editorial copywriter for premium Indian organic crafts. Write a highly tactile, evocative product description detailing manual touches, art formas, and home alignment.';
      promptText = `Draft a rich product description for handicraft called "${payload.title}" styled in art form "${payload.artForm}" using materials "${payload.material}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({
      content: response.text || ''
    });
  } catch (error: any) {
    console.error('Gemini content builder failure:', error);
    res.status(500).json({ error: 'AI generation failed', detail: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* SERVING FRONTEND VITE APP                                          */
/* ------------------------------------------------------------------ */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite dev middlewares
    app.use(vite.middlewares);
  } else {
    // Production asset server
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CRAFTIFUE Full-Stack running on http://localhost:${PORT}`);
  });
}

startServer();
