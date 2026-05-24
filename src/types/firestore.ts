/**
 * Karigari — Handicrafts & Home-Decor Marketplace
 * Firestore data model (TypeScript types)
 *
 * Conventions
 * - All money is stored in PAISE (integer) to avoid float errors. ₹1,499.00 = 149900.
 * - All timestamps are serializable ISO strings (`string`) for full-stack API compatibility.
 */

export const COLLECTIONS = {
  users: 'users',
  artisans: 'artisans',
  products: 'products',
  categories: 'categories',
  collections: 'collections',
  carts: 'carts',
  orders: 'orders',
  shipments: 'shipments',
  commissionProfiles: 'commissionProfiles',
  commissionLedger: 'commissionLedger',
  payouts: 'payouts',
  campaigns: 'campaigns',
  donations: 'donations',
  aiOutreach: 'aiOutreach',
  reviews: 'reviews',
  coupons: 'coupons',
  notifications: 'notifications',
  spaces: 'spaces', // saved Interior-Studio renders
  lookbooks: 'lookbooks',
} as const;

/* ------------------------------------------------------------------ */
/* ENUMS / UNIONS                                                      */
/* ------------------------------------------------------------------ */

export type UserRole = 'buyer' | 'seller' | 'admin';
export type Material =
  | 'terracotta' | 'ceramic' | 'brass' | 'wood' | 'iron' | 'copper' | 'silver'
  | 'beadwork' | 'thread' | 'fabric' | 'jute';
export type ArtForm =
  | 'warli' | 'madhubani' | 'dhokra' | 'meenakari' | 'pyrography'
  | 'hand-carved' | 'hand-etched' | 'block-print' | 'studio-pottery';

export type OrderStatus =
  | 'created' | 'paid' | 'confirmed' | 'packed' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
export type PaymentMethod = 'razorpay' | 'cod';

export type ShipmentStatus =
  | 'pending' | 'manifested' | 'pickup_scheduled' | 'in_transit'
  | 'out_for_delivery' | 'delivered' | 'rto' | 'exception';

export type CommissionType = 'onboarding' | 'sale';
export type CommissionStatus = 'accrued' | 'payable' | 'paid' | 'reversed';
export type PayoutStatus = 'queued' | 'processing' | 'paid' | 'failed';

export type OnboardingStatus = 'lead' | 'contacted' | 'meeting_scheduled' | 'onboarded' | 'rejected';
export type OutreachStatus = 'found' | 'drafted' | 'contacted' | 'meeting_scheduled' | 'onboarded' | 'declined';

export type CampaignCategory = 'medical' | 'education' | 'disaster_relief' | 'artisan_welfare' | 'other';
export type MilestoneStatus = 'planned' | 'released' | 'verified';
export type DonationStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

/* ------------------------------------------------------------------ */
/* SHARED VALUE OBJECTS                                                */
/* ------------------------------------------------------------------ */

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: 'IN';
  isDefault?: boolean;
  placeId?: string; // Google Places reference
}

export interface Media {
  url: string;       // Cloud Storage or mock CDN URL
  alt?: string;
  type: 'image' | 'video';
  isPrimary?: boolean;
}

export interface Money {
  amount: number;    // PAISE
  currency: 'INR';
}

/* ------------------------------------------------------------------ */
/* USERS                                                               */
/* ------------------------------------------------------------------ */

export interface User {
  uid: string;             // === Firebase Auth uid (doc id)
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  addresses: Address[];
  wishlist: string[];      // product ids
  defaultLocale: 'en-IN';
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* ARTISANS (sellers)                                                  */
/* ------------------------------------------------------------------ */

export interface Artisan {
  id: string;
  ownerUid: string;        // links to a User with role 'seller'
  name: string;            // e.g. "Suman Ji"
  slug: string;
  region: string;          // e.g. "Bastar, Chhattisgarh"
  craftSpecialty: ArtForm[];
  materials: Material[];
  bio: string;
  story?: string;          // long-form, AI-generatable
  portfolio: Media[];
  ratingAvg: number;       // 0–5
  productCount: number;
  onboardingStatus: OnboardingStatus;
  commissionProfileId: string;
  kycVerified: boolean;
  payoutMasked?: string;   // e.g. "•••• 4321"
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* CATEGORIES (drives dynamic nav + listing pages)                     */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null; // null = top-level pillar
  path: string[];          // ['decor','wall-decor','wall-mirrors']
  level: 0 | 1 | 2;
  pillar: 'dining' | 'lighting' | 'decor' | 'garden' | 'jewellery' | 'more';
  banner?: Media;
  sortOrder: number;
  isActive: boolean;
  seo: { title: string; description: string };
}

/* ------------------------------------------------------------------ */
/* PRODUCTS                                                            */
/* ------------------------------------------------------------------ */

export interface ProductVariant {
  sku: string;
  label: string;           // e.g. "Set of 2" / "Matte / 33cm"
  price: number;           // PAISE
  mrp: number;             // PAISE
  inventory: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  artisanId: string;
  categoryPath: string[];  // category slugs, e.g. ['lighting','lamps','pendant-lamps']
  pillar: Category['pillar'];
  material: Material[];
  artForm: ArtForm[];
  colors: string[];
  price: number;           // PAISE (base / default variant)
  mrp: number;             // PAISE
  discountPct: number;     // derived, stored for filtering/sorting
  inventory: number;
  variants: ProductVariant[];
  images: Media[];
  model3dUrl?: string;     // .glb for <model-viewer> + Interior Studio
  dimensionsCm?: { l: number; w: number; h: number };
  weightGrams?: number;
  tags: string[];
  embeddingVector?: number[]; // Vertex AI embedding
  status: ProductStatus;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;      // powers Best-Sellers
  isNew: boolean;          // derived from createdAt
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* COLLECTIONS (curated/seasonal)                                      */
/* ------------------------------------------------------------------ */

export interface Collection {
  id: string;
  title: string;
  slug: string;
  banner?: Media;
  rule:
    | { kind: 'manual'; productIds: string[] }
    | { kind: 'dynamic'; query: { tags?: string[]; pillar?: string; maxPrice?: number; artForm?: ArtForm[] } };
  sortOrder: number;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/* CART & ORDERS                                                       */
/* ------------------------------------------------------------------ */

export interface CartItem {
  productId: string;
  sku: string;
  title: string;
  image: string;
  unitPrice: number;       // PAISE
  qty: number;
  artisanId: string;
  customizationRef?: string; // spaces/{id} if added from Interior Studio
}

export interface Cart {
  id: string;              // === uid for logged-in, or anon cart id
  items: CartItem[];
  giftWrap: boolean;
  note?: string;
  couponCode?: string;
  updatedAt: string;
}

export interface OrderItem extends CartItem {
  commissionPct: number;   // snapshot of per-sale rate at purchase time
}

export interface OrderTimelineEntry {
  status: OrderStatus | ShipmentStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  buyerUid: string;
  items: OrderItem[];
  pricing: {
    subtotal: number;      // PAISE
    discount: number;
    giftWrap: number;
    shipping: number;
    tax: number;
    total: number;
  };
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string; 
  shipmentId?: string;
  awbCode?: string;
  invoiceNo: string;
  invoiceUrl?: string;
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  provider: 'shiprocket' | 'delhivery' | 'nimbuspost';
  awbCode?: string;
  courier?: string;
  labelUrl?: string;
  pickupId?: string;
  status: ShipmentStatus;
  history: { status: ShipmentStatus; location?: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* COMMISSION ENGINE                                                   */
/* ------------------------------------------------------------------ */

export interface CommissionProfile {
  id: string;              // e.g. 'default'
  name: string;
  onboardingPct: number;   // default 3
  perSalePct: number;      // default 5
  onboardingBase: number;  // PAISE
  returnWindowDays: number; // accrued -> payable after this many days
  isActive: boolean;
}

export interface CommissionEntry {
  id: string;
  artisanId: string;
  type: CommissionType;        // 'onboarding' | 'sale'
  orderId?: string;            // present for type 'sale'
  productId?: string;
  baseAmount: number;          // PAISE
  ratePct: number;             // snapshot of the rate applied
  amount: number;              // PAISE = baseAmount * ratePct / 100
  status: CommissionStatus;    // accrued -> payable -> paid (or reversed)
  payoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  artisanId: string;
  entryIds: string[];          // commission entries settled in this payout
  amount: number;              // PAISE
  status: PayoutStatus;
  method: 'razorpayx' | 'bank_transfer';
  reference?: string;
  initiatedBy: string;         // admin uid
  createdAt: string;
  paidAt?: string;
}

/* ------------------------------------------------------------------ */
/* DONATIONS & CAMPAIGNS                                               */
/* ------------------------------------------------------------------ */

export interface DisbursementMilestone {
  stage: string;               // "Round 1 chemotherapy", "Hospital admission"
  amount: number;              // PAISE
  status: MilestoneStatus;     // planned -> released -> verified
  proofUrl?: string;           // receipt / hospital doc
  recipient?: string;          // hospital / NGO / beneficiary
  releasedAt?: string;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  category: CampaignCategory;  // medical, education, etc.
  beneficiarySummary: string;
  story: string;
  cover: Media;
  goalAmount: number;          // PAISE
  raisedAmount: number;        // PAISE
  donorCount: number;
  verifiedDocUrls: string[];   // verification documents
  disbursementMilestones: DisbursementMilestone[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  donorUid?: string;           // optional
  donorName: string;
  donorEmail: string;
  campaignId: string;
  amount: number;              // PAISE
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  receiptNo: string;
  receiptUrl?: string;         // 80G-ready PDF
  status: DonationStatus;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* AI EXPERT-FINDER OUTREACH (human-in-the-loop)                       */
/* ------------------------------------------------------------------ */

export interface AiOutreach {
  id: string;
  query: string;               // admin brief
  candidateName: string;
  candidateRegion?: string;
  candidateCraft?: ArtForm[];
  contactChannel: 'email' | 'phone' | 'other';
  contactValue?: string;
  emailDraft?: string;         // Gemini-drafted, never auto-sent
  meetingId?: string;          // Google Calendar event id
  meetingLink?: string;        // Google Meet link
  status: OutreachStatus;      // found -> drafted -> contacted -> meeting_scheduled -> onboarded
  approvedBy?: string;         // admin uid
  linkedArtisanId?: string;    
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* INTERIOR STUDIO RENDERS & LOOKBOOKS                                 */
/* ------------------------------------------------------------------ */

export interface Space {
  id: string;
  ownerUid: string;
  sourceImageUrl: string;      
  productId: string;
  variantSku?: string;
  renderUrl: string;           // Nano Banana composite result
  prompt?: string;
  createdAt: string;
}

export interface Lookbook {
  id: string;
  title: string;               // "Warli Minimal", "Brass Festive"
  slug: string;
  theme: string;
  heroModel3dUrl?: string;
  productIds: string[];        // "shop the look"
  trendScore: number;          // computed from sales velocity + tags
  refreshedAt: string;
}

/* ------------------------------------------------------------------ */
/* REVIEWS / COUPONS / NOTIFICATIONS                                   */
/* ------------------------------------------------------------------ */

export interface Review {
  id: string;
  productId: string;
  buyerUid: string;
  rating: number;              // 1–5
  title?: string;
  body?: string;
  media?: Media[];
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;                  // === code, uppercased
  code: string;
  type: 'percent' | 'flat';
  value: number;               // percent (0–100) or PAISE
  minOrder?: number;           // PAISE
  maxDiscount?: number;        // PAISE (for percent)
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface Notification {
  id: string;
  uid: string;
  kind: 'order' | 'shipment' | 'payout' | 'donation' | 'system';
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
