"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ArrowLeft, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

interface WizardStep {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multi" | "text" | "url" | "url_multi";
  options?: Array<{ label: string; value: string; icon?: string }>;
  placeholder?: string;
  required?: boolean;
}

interface PlanTask {
  title: string;
  type: string;
  description: string;
  priority: string;
  estimated_hours: number;
}

interface Plan {
  project_name: string;
  description: string;
  tasks: PlanTask[];
}

interface WizardSession {
  answers: Record<string, unknown>;
  status: "discovering" | "plan_generated" | "approved";
  plan?: Plan;
}

// ─── UNIVERSAL STEPS (shared across all types) ───

const UNIVERSAL_STEPS: WizardStep[] = [
  {
    id: "brand_name",
    question: "What is the brand or business name?",
    description: "This will be used in the header, SEO, and branding throughout the site.",
    type: "text",
    placeholder: "e.g., Prenzlauer Carnevalclub",
    required: true,
  },
  {
    id: "logo_status",
    question: "Do you have a logo?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — I have a logo file", value: "yes_file", icon: "✅" },
      { label: "Yes — I need a text-based logo", value: "yes_text", icon: "🔤" },
      { label: "No — please design one", value: "design", icon: "🎨" },
      { label: "No — I'll provide later", value: "later", icon: "⏳" },
    ],
  },
  {
    id: "brand_colors",
    question: "Do you have brand colors?",
    description: "Share hex codes if you have existing colors (e.g., #FF5733).",
    type: "text",
    placeholder: "Hex codes or color names (e.g., Navy Blue, Gold, White)",
    required: false,
  },
  {
    id: "domain_status",
    question: "Do you have a domain?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — I own the domain", value: "own", icon: "🌐" },
      { label: "Need to buy one", value: "buy", icon: "🛒" },
      { label: "Not sure — need advice", value: "unsure", icon: "❓" },
      { label: "Using a subdomain", value: "subdomain", icon: "🔗" },
    ],
  },
  {
    id: "languages",
    question: "Which languages does the site need?",
    type: "single",
    required: true,
    options: [
      { label: "German only", value: "de", icon: "🇩🇪" },
      { label: "German + English", value: "de_en", icon: "🇩🇪🇬🇧" },
      { label: "English only", value: "en", icon: "🇬🇧" },
      { label: "Other (specify below)", value: "other", icon: "🌍" },
    ],
  },
  {
    id: "legal_pages",
    question: "Which legal pages do you need?",
    description: "Required for German websites operating commercially.",
    type: "multi",
    required: false,
    options: [
      { label: "Impressum (Legal Notice)", value: "impressum", icon: "📋" },
      { label: "Datenschutzerklärung (Privacy Policy)", value: "privacy", icon: "🔒" },
      { label: "AGB (Terms & Conditions)", value: "agb", icon: "📄" },
      { label: "Widerrufsbelehrung (Cancellation Policy)", value: "cancellation", icon: "↩️" },
      { label: "Cookie Consent Banner", value: "cookies", icon: "🍪" },
    ],
  },
  {
    id: "competitor_urls",
    question: "Any competitor or inspiration websites?",
    description: "URLs of sites you like (optional — helps us understand your taste).",
    type: "text",
    placeholder: "https://example.com, https://example2.com",
    required: false,
  },
  {
    id: "existing_content",
    question: "Do you have existing content to migrate?",
    description: "Text, images, PDFs from an old site or printed materials.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — full site content ready", value: "full", icon: "📦" },
      { label: "Yes — partial (some content)", value: "partial", icon: "📦" },
      { label: "No — I'll provide new content", value: "new", icon: "✨" },
      { label: "No — need help creating content", value: "help", icon: "🤝" },
    ],
  },
  {
    id: "maintenance_owner",
    question: "Who will maintain this after launch?",
    description: "Determines if we need a CMS, documentation, or ongoing support.",
    type: "single",
    required: true,
    options: [
      { label: "Me / my team (non-technical)", value: "non_tech", icon: "👤" },
      { label: "Me / my team (technical)", value: "tech", icon: "👨‍💻" },
      { label: "You — ongoing support", value: "you", icon: "🤝" },
      { label: "Not sure yet", value: "unsure", icon: "❓" },
    ],
  },
  {
    id: "analytics_choice",
    question: "Which analytics do you want?",
    type: "single",
    required: true,
    options: [
      { label: "Plausible (privacy-friendly, no cookies)", value: "plausible", icon: "🔒" },
      { label: "Google Analytics 4", value: "ga4", icon: "📊" },
      { label: "Fathom Analytics", value: "fathom", icon: "📈" },
      { label: "None — no tracking", value: "none", icon: "🚫" },
    ],
  },
  {
    id: "project_name",
    question: "What should we call this project?",
    description: "Internal name in Mission Control (e.g., 'PCC Website', 'Q3 Landing Page')",
    type: "text",
    placeholder: "e.g., Prenzlauer Carnevalclub Website",
    required: true,
  },
  {
    id: "timeline",
    question: "When do you need this live?",
    type: "single",
    required: true,
    options: [
      { label: "ASAP (1-2 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (2-4 weeks)", value: "short", icon: "📅" },
      { label: "Relaxed (1-2 months)", value: "medium", icon: "📆" },
      { label: "No rush", value: "flexible", icon: "🤷" },
    ],
  },
];

// ─── HOMEPAGE STEPS ───

const HOMEPAGE_STEPS: WizardStep[] = [
  {
    id: "business_pitch",
    question: "What does the business do in one sentence?",
    description: "e.g., 'A family-owned Italian restaurant serving homemade pasta since 1985' or 'A climbing gym for all ages and skill levels'",
    type: "text",
    placeholder: "e.g., A local climbing gym offering courses and open climbing for all levels",
    required: true,
  },
  {
    id: "main_sections",
    question: "Which sections do you need?",
    description: "Select all that apply — these become the main pages/sections.",
    type: "multi",
    required: true,
    options: [
      { label: "Hero / Banner", value: "hero", icon: "🖼️" },
      { label: "About Us", value: "about", icon: "📖" },
      { label: "Services / Offerings", value: "services", icon: "⚡" },
      { label: "Team / Staff", value: "team", icon: "👥" },
      { label: "Testimonials / Reviews", value: "testimonials", icon: "💬" },
      { label: "Gallery / Photos", value: "gallery", icon: "📸" },
      { label: "FAQ", value: "faq", icon: "❓" },
      { label: "Contact / Map / Hours", value: "contact", icon: "📍" },
      { label: "News / Updates / Blog", value: "news", icon: "📰" },
      { label: "Partner / Client Logos", value: "partners", icon: "🤝" },
      { label: "Pricing", value: "pricing", icon: "💶" },
      { label: "Events / Calendar", value: "events", icon: "📆" },
    ],
  },
  {
    id: "has_images",
    question: "Do you have photos/images for the site?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — I have high-quality images", value: "yes_good", icon: "📷" },
      { label: "Yes — but they need work (resize/edit)", value: "yes_needs_work", icon: "🔧" },
      { label: "No — need stock photos", value: "stock", icon: "🖼️" },
      { label: "No — need professional photography", value: "photo_shoot", icon: "📸" },
    ],
  },
  {
    id: "contact_form",
    question: "Do you need a contact form?",
    description: "For visitors to send you messages directly.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — basic (name, email, message)", value: "basic", icon: "📧" },
      { label: "Yes — with subject/department selection", value: "advanced", icon: "📋" },
      { label: "No — just display email/phone", value: "no", icon: "❌" },
    ],
  },
  {
    id: "google_maps",
    question: "Google Maps integration?",
    description: "Show your location with an embedded map.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have a physical location", value: "yes", icon: "📍" },
      { label: "No — no physical location", value: "no", icon: "🌐" },
    ],
  },
  {
    id: "social_links",
    question: "Social media links?",
    description: "Which platforms? Leave blank if not needed.",
    type: "multi",
    required: false,
    options: [
      { label: "Instagram", value: "instagram", icon: "📸" },
      { label: "Facebook", value: "facebook", icon: "👥" },
      { label: "Twitter / X", value: "twitter", icon: "🐦" },
      { label: "LinkedIn", value: "linkedin", icon: "💼" },
      { label: "YouTube", value: "youtube", icon: "▶️" },
      { label: "TikTok", value: "tiktok", icon: "🎵" },
      { label: "WhatsApp", value: "whatsapp", icon: "💬" },
    ],
  },
  {
    id: "newsletter_signup",
    question: "Newsletter signup?",
    description: "Email collection for updates and promotions.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — with email list", value: "yes", icon: "📬" },
      { label: "No — not needed", value: "no", icon: "❌" },
    ],
  },
  {
    id: "opening_hours",
    question: "Opening hours widget?",
    description: "Show current open/closed status based on time.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have regular hours", value: "yes", icon: "🕐" },
      { label: "No — 24/7 or no hours", value: "no", icon: "❌" },
    ],
  },
];

// ─── LANDING PAGE STEPS ───

const LANDING_STEPS: WizardStep[] = [
  {
    id: "offering",
    question: "What are you selling or offering?",
    description: "Describe the product, service, or event in a few words.",
    type: "text",
    placeholder: "e.g., Project Management Software for Teams",
    required: true,
  },
  {
    id: "unique_proposition",
    question: "What is your unique value proposition?",
    description: "Why should people choose you over competitors? One clear statement.",
    type: "text",
    placeholder: "e.g., The only project tool that actually reduces meetings",
    required: true,
  },
  {
    id: "conversion_goal",
    question: "What is the main conversion action?",
    description: "What should visitors do when they land?",
    type: "single",
    required: true,
    options: [
      { label: "Sign Up / Register", value: "signup", icon: "✍️" },
      { label: "Buy a Product", value: "buy", icon: "💰" },
      { label: "Book a Demo / Call", value: "demo", icon: "📞" },
      { label: "Download / Get a Free Trial", value: "download", icon: "📥" },
      { label: "Subscribe to Newsletter", value: "subscribe", icon: "📬" },
      { label: "Contact Us", value: "contact", icon: "📧" },
      { label: "Attend an Event", value: "event", icon: "🎫" },
    ],
  },
  {
    id: "sections",
    question: "Which sections do you need on the landing page?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Hero with CTA", value: "hero", icon: "🖼️" },
      { label: "Benefits / Features", value: "benefits", icon: "⚡" },
      { label: "How It Works / Steps", value: "how_it_works", icon: "📋" },
      { label: "Testimonials / Reviews", value: "testimonials", icon: "💬" },
      { label: "Client Logos / Social Proof", value: "logos", icon: "🤝" },
      { label: "Pricing Table", value: "pricing", icon: "💶" },
      { label: "FAQ", value: "faq", icon: "❓" },
      { label: "Comparison vs Competitors", value: "comparison", icon: "⚖️" },
      { label: "Video / Demo Section", value: "video", icon: "🎬" },
      { label: "Stats / Numbers (300+ clients, 99% uptime)", value: "stats", icon: "📊" },
      { label: "Final CTA Section", value: "final_cta", icon: "🎯" },
      { label: "Footer with Links", value: "footer", icon: "📄" },
    ],
  },
  {
    id: "has_testimonials",
    question: "Do you have testimonials or reviews?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have quotes", value: "yes", icon: "💬" },
      { label: "Yes — with photos", value: "yes_photo", icon: "📸" },
      { label: "No — need to collect", value: "collect", icon: "📝" },
      { label: "No — use stats instead", value: "stats_only", icon: "📊" },
    ],
  },
  {
    id: "has_video",
    question: "Do you have an explainer video?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have a video URL", value: "yes", icon: "🎬" },
      { label: "No — need one created", value: "create", icon: "🎬" },
      { label: "No — images will do", value: "no", icon: "🖼️" },
    ],
  },
  {
    id: "pricing_tiers",
    question: "How many pricing tiers do you have?",
    type: "single",
    required: false,
    options: [
      { label: "1 (single price)", value: "single", icon: "💶" },
      { label: "2-3 tiers", value: "multiple", icon: "💶💶💶" },
      { label: "4+ tiers / comparison table", value: "table", icon: "📊" },
      { label: "No pricing yet (Coming Soon)", value: "pending", icon: "⏳" },
    ],
  },
  {
    id: "lead_capture",
    question: "Lead capture needed?",
    description: "Collect emails before giving something (ebook, discount, etc.)",
    type: "single",
    required: false,
    options: [
      { label: "Yes — with a lead magnet", value: "yes_magnet", icon: "🧲" },
      { label: "Yes — just collect emails", value: "yes_simple", icon: "📧" },
      { label: "No — just CTA buttons", value: "no", icon: "❌" },
    ],
  },
  {
    id: "design_style",
    question: "Preferred design style?",
    type: "single",
    required: false,
    options: [
      { label: "Bold & Colorful", value: "bold", icon: "🎨" },
      { label: "Clean & Minimal", value: "minimal", icon: "✨" },
      { label: "Professional / Corporate", value: "corporate", icon: "💼" },
      { label: "Playful / Creative", value: "playful", icon: "🎭" },
      { label: "Dark / Techy / Premium", value: "dark", icon: "🌙" },
      { label: "Nature / Organic / Earthy", value: "nature", icon: "🌿" },
    ],
  },
];

// ─── ONLINE SHOP STEPS ───

const SHOP_STEPS: WizardStep[] = [
  {
    id: "shop_type",
    question: "What kind of products do you sell?",
    type: "single",
    required: true,
    options: [
      { label: "Physical Products (shipped)", value: "physical", icon: "📦" },
      { label: "Digital Products (downloads)", value: "digital", icon: "💾" },
      { label: "Services / Bookings", value: "services", icon: "📅" },
      { label: "Mixed (Products + Services)", value: "mixed", icon: "🔀" },
      { label: "Dropshipping", value: "dropshipping", icon: "🚚" },
    ],
  },
  {
    id: "product_categories",
    question: "What are your product categories?",
    description: "e.g., Clothing, Accessories, Food & Drink, Digital Downloads",
    type: "text",
    placeholder: "e.g., T-Shirts, Hoodies, Caps, Stickers",
    required: true,
  },
  {
    id: "product_count",
    question: "How many products to start with?",
    type: "single",
    required: true,
    options: [
      { label: "1-10 products", value: "small", icon: "📦" },
      { label: "10-50 products", value: "medium", icon: "📦📦" },
      { label: "50-200 products", value: "large", icon: "📦📦📦" },
      { label: "200+ products", value: "xl", icon: "🏪" },
    ],
  },
  {
    id: "has_product_images",
    question: "Do you have product photos?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — high-quality photos ready", value: "yes_good", icon: "📷" },
      { label: "Yes — need editing/resizing", value: "yes_edit", icon: "🔧" },
      { label: "No — will provide product list", value: "provide", icon: "📝" },
      { label: "No — need stock product images", value: "stock", icon: "🖼️" },
    ],
  },
  {
    id: "has_descriptions",
    question: "Do you have product descriptions?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — all written", value: "yes", icon: "✅" },
      { label: "Yes — need editing", value: "edit", icon: "✏️" },
      { label: "No — need help writing", value: "help", icon: "🤝" },
      { label: "No — descriptions not needed", value: "no", icon: "❌" },
    ],
  },
  {
    id: "sku_system",
    question: "Do you have a SKU or stock number system?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have SKUs", value: "yes", icon: "🏷️" },
      { label: "No — starting fresh", value: "no", icon: "✨" },
    ],
  },
  {
    id: "product_variants",
    question: "Do products have variants?",
    description: "e.g., sizes (S/M/L), colors, materials.",
    type: "multi",
    required: false,
    options: [
      { label: "Size (S, M, L, XL)", value: "size", icon: "📏" },
      { label: "Color", value: "color", icon: "🎨" },
      { label: "Material / Texture", value: "material", icon: "🧵" },
      { label: "Weight / Size options", value: "weight", icon: "⚖️" },
      { label: "No variants — simple products", value: "none", icon: "❌" },
    ],
  },
  {
    id: "inventory_tracking",
    question: "Inventory tracking needed?",
    description: "Track stock levels and get low-stock alerts.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — track stock levels", value: "yes", icon: "📊" },
      { label: "No — don't need tracking", value: "no", icon: "❌" },
    ],
  },
  {
    id: "shop_features",
    question: "What shop features do you need?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Product Categories", value: "categories", icon: "🏷️" },
      { label: "Product Filters (size, color, price)", value: "filters", icon: "🔍" },
      { label: "Search", value: "search", icon: "🔍" },
      { label: "Product Reviews / Ratings", value: "reviews", icon: "⭐" },
      { label: "Wishlist / Favorites", value: "wishlist", icon: "❤️" },
      { label: "Discount Codes / Coupons", value: "coupons", icon: "🎟️" },
      { label: "Related Products / Upselling", value: "upselling", icon: "📈" },
      { label: "Recently Viewed", value: "recently_viewed", icon: "👁️" },
      { label: "Product Comparison", value: "comparison", icon: "⚖️" },
      { label: "Back in Stock Notifications", value: "back_in_stock", icon: "🔔" },
      { label: "Order History in Account", value: "order_history", icon: "📜" },
    ],
  },
  {
    id: "payment_methods",
    question: "Which payment methods?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Credit/Debit Card (Stripe)", value: "stripe", icon: "💳" },
      { label: "PayPal", value: "paypal", icon: "🅿️" },
      { label: "Bank Transfer / SEPA", value: "bank", icon: "🏦" },
      { label: "Cash on Delivery", value: "cod", icon: "💵" },
      { label: "Klarna / Buy Now Pay Later", value: "klarna", icon: "🧾" },
      { label: "Apple Pay / Google Pay", value: "wallet", icon: "📱" },
      { label: "Invoice / Pay Later (B2B)", value: "invoice", icon: "📋" },
    ],
  },
  {
    id: "order_notifications",
    question: "Order notifications?",
    description: "Emails sent when orders are placed.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — to customer + admin", value: "both", icon: "📧" },
      { label: "Yes — to admin only", value: "admin", icon: "📋" },
      { label: "No notifications needed", value: "no", icon: "❌" },
    ],
  },
  {
    id: "invoice_generation",
    question: "Invoice generation needed?",
    description: "Automatically generate PDF invoices for orders.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — German legal invoices", value: "yes_german", icon: "🇩🇪" },
      { label: "Yes — standard invoices", value: "yes_standard", icon: "📄" },
      { label: "No — manual invoicing", value: "no", icon: "❌" },
    ],
  },
  {
    id: "tax_calculation",
    question: "Tax calculation setup?",
    description: "For German/EU compliance.",
    type: "single",
    required: false,
    options: [
      { label: "German VAT (19% / 7%)", value: "de_vat", icon: "🇩🇪" },
      { label: "EU VAT (varies by country)", value: "eu_vat", icon: "🇪🇺" },
      { label: "US Sales Tax", value: "us_tax", icon: "🇺🇸" },
      { label: "No tax (outside scope)", value: "none", icon: "❌" },
    ],
  },
  {
    id: "shipping_zones",
    question: "Shipping zones?",
    type: "single",
    required: true,
    options: [
      { label: "Germany only", value: "de", icon: "🇩🇪" },
      { label: "Germany + EU", value: "eu", icon: "🇪🇺" },
      { label: "Europe (including UK)", value: "europe", icon: "🌍" },
      { label: "Worldwide", value: "worldwide", icon: "🌎" },
      { label: "Digital products only — no shipping", value: "digital", icon: "💾" },
      { label: "Local pickup only", value: "pickup", icon: "📍" },
    ],
  },
  {
    id: "shipping_carriers",
    question: "Which shipping carriers?",
    description: "Select all that apply.",
    type: "multi",
    required: false,
    options: [
      { label: "DHL", value: "dhl", icon: "📦" },
      { label: "Hermes", value: "hermes", icon: "📦" },
      { label: "DPD", value: "dpd", icon: "📦" },
      { label: "UPS", value: "ups", icon: "📦" },
      { label: "FedEx", value: "fedex", icon: "📦" },
      { label: "Deutsche Post", value: "dp", icon: "📮" },
      { label: "Local courier", value: "local", icon: "📍" },
      { label: "Self pickup", value: "pickup", icon: "🏃" },
    ],
  },
  {
    id: "shipping_rates",
    question: "Shipping rate model?",
    type: "single",
    required: false,
    options: [
      { label: "Flat rate (same for all)", value: "flat", icon: "💶" },
      { label: "By weight bands", value: "weight", icon: "⚖️" },
      { label: "By order value (free over X)", value: "value", icon: "📊" },
      { label: "Real-time carrier rates", value: "realtime", icon: "📦" },
      { label: "Local pickup only", value: "pickup", icon: "📍" },
    ],
  },
  {
    id: "return_policy",
    question: "Return/refund policy?",
    type: "single",
    required: false,
    options: [
      { label: "14 days — standard", value: "14_days", icon: "↩️" },
      { label: "30 days — generous", value: "30_days", icon: "↩️" },
      { label: "No returns (digital/eating)", value: "no_returns", icon: "❌" },
      { label: "Custom policy (describe below)", value: "custom", icon: "✏️" },
    ],
  },
  {
    id: "customer_accounts",
    question: "Customer accounts?",
    description: "Allow customers to log in and see order history.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — full account area", value: "yes", icon: "👤" },
      { label: "No — guest checkout only", value: "no", icon: "🚫" },
    ],
  },
  {
    id: "abandoned_cart",
    question: "Abandoned cart recovery?",
    description: "Email customers who left items in their cart.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — automated emails", value: "yes", icon: "📧" },
      { label: "No — not needed", value: "no", icon: "❌" },
    ],
  },
  {
    id: "shop_seo",
    question: "SEO for products?",
    description: "Meta titles, descriptions, structured data per product.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — full SEO setup", value: "yes", icon: "🔍" },
      { label: "No — not a priority", value: "no", icon: "❌" },
    ],
  },
  {
    id: "business_reg",
    question: "Business registration number",
    description: "For legal pages (Impressum). e.g., HRB 12345, Steuernummer.",
    type: "text",
    placeholder: "e.g., HRB 12345, USt-IdNr.: DE123456789",
    required: false,
  },
];

// ─── BLOG STEPS ───

const BLOG_STEPS: WizardStep[] = [
  {
    id: "blog_name",
    question: "What is the blog or publication called?",
    type: "text",
    placeholder: "e.g., Tech Insights, Kitchen Stories",
    required: true,
  },
  {
    id: "blog_type",
    question: "What kind of blog?",
    type: "single",
    required: true,
    options: [
      { label: "Personal Blog", value: "personal", icon: "✍️" },
      { label: "Company / Business Blog", value: "company", icon: "🏢" },
      { label: "Magazine / Editorial", value: "magazine", icon: "📰" },
      { label: "Niche / Topic Blog", value: "niche", icon: "🎯" },
      { label: "News / Journalism", value: "news", icon: "📰" },
    ],
  },
  {
    id: "blog_topics",
    question: "What topics will you cover?",
    description: "e.g., Technology, Recipes, Travel, Fitness",
    type: "text",
    placeholder: "e.g., Local events, restaurant reviews, food culture",
    required: true,
  },
  {
    id: "existing_articles",
    question: "Do you have existing articles?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — I have content ready", value: "yes", icon: "📝" },
      { label: "Yes — need to migrate from old site", value: "migrate", icon: "🔄" },
      { label: "No — starting fresh", value: "no", icon: "✨" },
    ],
  },
  {
    id: "editorial_workflow",
    question: "Editorial workflow?",
    description: "How articles go from draft to published.",
    type: "single",
    required: false,
    options: [
      { label: "Solo — I write and publish", value: "solo", icon: "👤" },
      { label: "Draft → Review → Publish (1 reviewer)", value: "review", icon: "👥" },
      { label: "Multi-author with editor", value: "multi", icon: "🏢" },
      { label: "Guest posts allowed", value: "guest", icon: "✉️" },
    ],
  },
  {
    id: "blog_features",
    question: "What features do you need?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Categories & Tags", value: "categories", icon: "🏷️" },
      { label: "Search", value: "search", icon: "🔍" },
      { label: "Author Profiles", value: "authors", icon: "👤" },
      { label: "Comments / Discussion", value: "comments", icon: "💬" },
      { label: "Newsletter / Email Subscription", value: "newsletter", icon: "📬" },
      { label: "Related Posts", value: "related", icon: "🔗" },
      { label: "Reading Time / Progress Bar", value: "reading", icon: "⏱️" },
      { label: "Social Sharing Buttons", value: "sharing", icon: "📤" },
      { label: "SEO (meta descriptions, schema)", value: "seo", icon: "🔍" },
      { label: "RSS Feed", value: "rss", icon: "📡" },
      { label: "Popular Posts Widget", value: "popular", icon: "🔥" },
      { label: "Archive by Date", value: "archive", icon: "📅" },
    ],
  },
  {
    id: "author_count",
    question: "How many authors will write?",
    type: "single",
    required: true,
    options: [
      { label: "Just me (1 author)", value: "single", icon: "👤" },
      { label: "Small team (2-5)", value: "small", icon: "👥" },
      { label: "Large team (5+)", value: "large", icon: "🏢" },
      { label: "Guest authors", value: "guest", icon: "✉️" },
    ],
  },
  {
    id: "comment_moderation",
    question: "Comment moderation?",
    type: "single",
    required: false,
    options: [
      { label: "Open — all comments show", value: "open", icon: "💬" },
      { label: "Moderated — approve first", value: "moderated", icon: "✅" },
      { label: "Disabled — no comments", value: "disabled", icon: "❌" },
    ],
  },
];

// ─── WEBAPP STEPS ───

const WEBAPP_STEPS: WizardStep[] = [
  {
    id: "app_name",
    question: "What is the application called?",
    type: "text",
    placeholder: "e.g., Client Portal, Team Tracker",
    required: true,
  },
  {
    id: "app_purpose",
    question: "What problem does it solve?",
    description: "In one sentence — what do users get from it?",
    type: "text",
    placeholder: "e.g., Helps agencies manage client projects and track time",
    required: true,
  },
  {
    id: "app_type",
    question: "What kind of application?",
    type: "single",
    required: true,
    options: [
      { label: "Dashboard / Admin Panel", value: "dashboard", icon: "📊" },
      { label: "SaaS / Subscription Platform", value: "saas", icon: "☁️" },
      { label: "CRM / Contact Management", value: "crm", icon: "📇" },
      { label: "Project / Task Management", value: "project", icon: "📋" },
      { label: "Portal / Member Area", value: "portal", icon: "🌐" },
      { label: "Booking / Scheduling System", value: "booking", icon: "📅" },
      { label: "Inventory / Stock Management", value: "inventory", icon: "📦" },
      { label: "Internal Tool / Operations", value: "internal", icon: "🔧" },
    ],
  },
  {
    id: "primary_users",
    question: "Who are the primary users?",
    type: "single",
    required: true,
    options: [
      { label: "Internal staff (your team)", value: "internal", icon: "🏢" },
      { label: "External customers/clients", value: "external", icon: "👥" },
      { label: "Both — staff + customers", value: "both", icon: "🔀" },
      { label: "Public (anyone can sign up)", value: "public", icon: "🌐" },
    ],
  },
  {
    id: "user_roles",
    question: "Do you need user roles/permissions?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — Admin + Regular Users", value: "admin_user", icon: "👑" },
      { label: "Yes — Multiple Roles (manager, editor, viewer)", value: "multi", icon: "👥" },
      { label: "No — everyone same access", value: "none", icon: "🚫" },
    ],
  },
  {
    id: "auth_method",
    question: "How should users log in?",
    type: "single",
    required: true,
    options: [
      { label: "Email + Password", value: "email", icon: "📧" },
      { label: "Social Login (Google, GitHub)", value: "social", icon: "🔐" },
      { label: "Both Email + Social", value: "both", icon: "🔑" },
      { label: "SSO / Enterprise (SAML, OIDC)", value: "sso", icon: "🏢" },
      { label: "No login needed (public)", value: "none", icon: "🌐" },
    ],
  },
  {
    id: "data_entities",
    question: "What data will users manage?",
    description: "These become your CRUD views (create, read, update, delete).",
    type: "multi",
    required: true,
    options: [
      { label: "Users / Contacts / Clients", value: "users", icon: "👤" },
      { label: "Projects / Workspaces", value: "projects", icon: "📁" },
      { label: "Tasks / Todos / Items", value: "tasks", icon: "✅" },
      { label: "Orders / Invoices / Quotes", value: "orders", icon: "🧾" },
      { label: "Products / Catalog", value: "products", icon: "📦" },
      { label: "Content / Pages / Posts", value: "content", icon: "📝" },
      { label: "Files / Documents / Images", value: "files", icon: "📁" },
      { label: "Messages / Notifications", value: "messages", icon: "💬" },
      { label: "Bookings / Reservations", value: "bookings", icon: "📅" },
      { label: "Leads / Opportunities", value: "leads", icon: "🎯" },
      { label: "Subscriptions / Plans", value: "subscriptions", icon: "🔄" },
      { label: "Reports / Analytics", value: "reports", icon: "📊" },
    ],
  },
  {
    id: "custom_entity",
    question: "Any custom data beyond the standard types?",
    description: "Describe any unique data needs.",
    type: "text",
    placeholder: "e.g., Equipment tracking with serial numbers and maintenance logs",
    required: false,
  },
  {
    id: "file_uploads",
    question: "File upload needed?",
    description: "Users uploading images, documents, or other files.",
    type: "multi",
    required: false,
    options: [
      { label: "Image uploads (avatars, photos)", value: "images", icon: "🖼️" },
      { label: "Document uploads (PDF, Word)", value: "documents", icon: "📄" },
      { label: "Large files (video, archives)", value: "large", icon: "📦" },
      { label: "No file uploads needed", value: "none", icon: "❌" },
    ],
  },
  {
    id: "realtime_features",
    question: "Real-time features?",
    description: "Live updates without refreshing.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — live notifications/updates", value: "yes", icon: "⚡" },
      { label: "Yes — live chat/messaging", value: "chat", icon: "💬" },
      { label: "No — standard page reloads", value: "no", icon: "❌" },
    ],
  },
  {
    id: "email_notifications",
    question: "Email notifications?",
    description: "Automated emails for events.",
    type: "multi",
    required: false,
    options: [
      { label: "Welcome / onboarding emails", value: "welcome", icon: "👋" },
      { label: "Password reset", value: "password", icon: "🔑" },
      { label: "Task/project updates", value: "updates", icon: "📋" },
      { label: "Daily/weekly digest", value: "digest", icon: "📊" },
      { label: "No emails needed", value: "none", icon: "❌" },
    ],
  },
  {
    id: "webhooks_api",
    question: "API / Webhooks needed?",
    description: "Connect with other tools or allow external integrations.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — REST API for integrations", value: "api", icon: "🔗" },
      { label: "Yes — webhooks for events", value: "webhooks", icon: "🪝" },
      { label: "Both API + webhooks", value: "both", icon: "🔗🪝" },
      { label: "No external integrations", value: "no", icon: "❌" },
    ],
  },
  {
    id: "app_features",
    question: "Any advanced features?",
    description: "Select all that apply.",
    type: "multi",
    required: false,
    options: [
      { label: "Charts / Data Visualization", value: "charts", icon: "📈" },
      { label: "Export to CSV / PDF", value: "export", icon: "📄" },
      { label: "Full-text search", value: "search", icon: "🔍" },
      { label: "Dark mode", value: "dark_mode", icon: "🌙" },
      { label: "Calendar / Timeline view", value: "calendar", icon: "📅" },
      { label: "Kanban board view", value: "kanban", icon: "📊" },
      { label: "Mobile responsive", value: "mobile", icon: "📱" },
      { label: "Audit log (who changed what)", value: "audit", icon: "📜" },
    ],
  },
  {
    id: "billing_needed",
    question: "Subscription / billing needed?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — monthly/yearly subscriptions", value: "subscriptions", icon: "🔄" },
      { label: "Yes — per-seat pricing", value: "per_seat", icon: "👥" },
      { label: "Yes — one-time payments", value: "one_time", icon: "💰" },
      { label: "No — free or internal tool", value: "no", icon: "❌" },
    ],
  },
  {
    id: "mobile_app",
    question: "Mobile app later?",
    description: "Native iOS/Android app in the future?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — mobile app planned", value: "yes", icon: "📱" },
      { label: "No — web only", value: "no", icon: "💻" },
    ],
  },
];

// ─── PORTFOLIO STEPS ───

const PORTFOLIO_STEPS: WizardStep[] = [
  {
    id: "portfolio_type",
    question: "What kind of portfolio?",
    type: "single",
    required: true,
    options: [
      { label: "Design / Creative Work", value: "design", icon: "🎨" },
      { label: "Development / Code Projects", value: "dev", icon: "💻" },
      { label: "Photography", value: "photo", icon: "📷" },
      { label: "Writing / Journalism", value: "writing", icon: "✍️" },
      { label: "Architecture / Interior", value: "architecture", icon: "🏛️" },
      { label: "Music / Audio", value: "music", icon: "🎵" },
      { label: "Mixed / General", value: "mixed", icon: "🔀" },
    ],
  },
  {
    id: "portfolio_skills",
    question: "What services do you offer?",
    description: "Your skills and services.",
    type: "text",
    placeholder: "e.g., Brand Identity, Web Design, UI/UX, Motion Graphics",
    required: false,
  },
  {
    id: "project_count",
    question: "How many projects to showcase initially?",
    type: "single",
    required: true,
    options: [
      { label: "1-5 projects", value: "small", icon: "🖼️" },
      { label: "6-15 projects", value: "medium", icon: "🖼️🖼️" },
      { label: "15-30 projects", value: "large", icon: "🖼️🖼️🖼️" },
      { label: "30+ projects", value: "xl", icon: "🏪" },
    ],
  },
  {
    id: "has_project_images",
    question: "Do you have project images/screenshots?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — all ready", value: "yes", icon: "✅" },
      { label: "Yes — need editing", value: "edit", icon: "🔧" },
      { label: "No — will provide later", value: "later", icon: "⏳" },
      { label: "No — need placeholder approach", value: "placeholder", icon: "🖼️" },
    ],
  },
  {
    id: "case_studies",
    question: "Do you have case studies written?",
    description: "Detailed project stories with challenge/solution/results.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — detailed case studies ready", value: "yes", icon: "📝" },
      { label: "Yes — brief descriptions only", value: "brief", icon: "📄" },
      { label: "No — just project titles/screenshots", value: "no", icon: "🖼️" },
      { label: "No — need help writing them", value: "help", icon: "🤝" },
    ],
  },
  {
    id: "portfolio_features",
    question: "What features do you need?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Project Gallery / Grid", value: "gallery", icon: "🖼️" },
      { label: "Case Study Detail Pages", value: "case_studies", icon: "📄" },
      { label: "Category / Tag Filtering", value: "categories", icon: "🏷️" },
      { label: "About / Bio Section", value: "about", icon: "📖" },
      { label: "Skills / Services Grid", value: "skills", icon: "⚡" },
      { label: "Client Testimonials", value: "testimonials", icon: "💬" },
      { label: "Contact / Hire Me Form", value: "contact", icon: "📧" },
      { label: "Resume / CV Download", value: "resume", icon: "📋" },
      { label: "Social Media Links", value: "social", icon: "🔗" },
      { label: "Lightbox / Fullscreen Images", value: "lightbox", icon: "🔍" },
      { label: "Filter by year / client", value: "filters", icon: "📅" },
    ],
  },
  {
    id: "testimonials",
    question: "Do you have client testimonials?",
    type: "single",
    required: false,
    options: [
      { label: "Yes — written quotes ready", value: "yes", icon: "💬" },
      { label: "Yes — with photos", value: "yes_photo", icon: "📸" },
      { label: "No — collect later", value: "collect", icon: "📝" },
      { label: "No — stats/numbers instead", value: "stats", icon: "📊" },
    ],
  },
];

// ─── REBUILD STEPS ───

const REBUILD_STEPS: WizardStep[] = [
  {
    id: "source_url",
    question: "What is the current website URL?",
    description: "We'll audit this site and plan the migration.",
    type: "url",
    placeholder: "https://current-website.com",
    required: true,
  },
  {
    id: "rebuild_reasons",
    question: "Why are you rebuilding?",
    description: "Select all that apply.",
    type: "multi",
    required: true,
    options: [
      { label: "Outdated design", value: "design", icon: "🎨" },
      { label: "Not mobile-friendly", value: "mobile", icon: "📱" },
      { label: "Slow performance", value: "performance", icon: "⚡" },
      { label: "Hard to maintain/update", value: "maintenance", icon: "🔧" },
      { label: "Missing features I need", value: "features", icon: "📋" },
      { label: "Bad SEO / rankings", value: "seo", icon: "🔍" },
      { label: "Security vulnerabilities", value: "security", icon: "🔒" },
      { label: "Platform end-of-life (WordPress, etc.)", value: "platform", icon: "🔄" },
      { label: "Rebranding", value: "rebrand", icon: "✨" },
    ],
  },
  {
    id: "what_works",
    question: "What works well on the current site?",
    description: "What should we keep?",
    type: "text",
    placeholder: "e.g., The blog section has good SEO rankings, contact form works well",
    required: false,
  },
  {
    id: "what_doesnt_work",
    question: "What doesn't work?",
    description: "What should we fix or remove?",
    type: "text",
    placeholder: "e.g., Mobile menu is broken, checkout takes too long, images are slow",
    required: false,
  },
  {
    id: "cms_access",
    question: "Do you have access to the current CMS/hosting?",
    type: "single",
    required: true,
    options: [
      { label: "Yes — full access", value: "yes", icon: "✅" },
      { label: "Partial access", value: "partial", icon: "🔐" },
      { label: "No — need to start fresh", value: "no", icon: "❌" },
    ],
  },
  {
    id: "content_to_migrate",
    question: "What content should we migrate?",
    type: "multi",
    required: false,
    options: [
      { label: "All text and images", value: "all", icon: "📦" },
      { label: "Text content only", value: "text", icon: "📝" },
      { label: "Images/media only", value: "images", icon: "🖼️" },
      { label: "Blog / articles only", value: "blog", icon: "📰" },
      { label: "Nothing — fresh start", value: "fresh", icon: "✨" },
    ],
  },
  {
    id: "preserve_seo",
    question: "Preserve SEO rankings?",
    description: "Set up 301 redirects from old URLs to new pages.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — preserve all rankings", value: "yes", icon: "🔍" },
      { label: "Yes — preserve most (selective)", value: "partial", icon: "🔍" },
      { label: "No — new structure, start fresh", value: "no", icon: "❌" },
    ],
  },
  {
    id: "current_traffic",
    question: "What's the current site traffic?",
    description: "Helps prioritize SEO preservation.",
    type: "single",
    required: false,
    options: [
      { label: "High — thousands of visitors/month", value: "high", icon: "📊" },
      { label: "Medium — hundreds/month", value: "medium", icon: "📊" },
      { label: "Low — mostly direct traffic", value: "low", icon: "📊" },
      { label: "Don't know", value: "unknown", icon: "❓" },
    ],
  },
  {
    id: "new_features",
    question: "What new features do you want?",
    description: "Select all that apply.",
    type: "multi",
    required: false,
    options: [
      { label: "Modern responsive design", value: "responsive", icon: "📱" },
      { label: "Contact form", value: "contact_form", icon: "📧" },
      { label: "CMS / easy content editing", value: "cms", icon: "📄" },
      { label: "Blog / news section", value: "blog", icon: "📰" },
      { label: "Online shop / e-commerce", value: "shop", icon: "🛒" },
      { label: "User login / members area", value: "auth", icon: "🔐" },
      { label: "Social media integration", value: "social", icon: "🔗" },
      { label: "Multilingual support", value: "i18n", icon: "🌍" },
      { label: "Analytics / tracking", value: "analytics", icon: "📊" },
      { label: "SEO improvements", value: "seo", icon: "🔍" },
      { label: "Performance optimization", value: "performance", icon: "⚡" },
      { label: "Cookie consent / GDPR", value: "gdpr", icon: "🍪" },
    ],
  },
  {
    id: "email_preservation",
    question: "Do you use email on the current site?",
    description: "e.g., hello@yourdomain.com — need to keep these.",
    type: "single",
    required: false,
    options: [
      { label: "Yes — important emails to preserve", value: "yes", icon: "📧" },
      { label: "No — no email through site", value: "no", icon: "❌" },
      { label: "Not sure — need advice", value: "unsure", icon: "❓" },
    ],
  },
];

// ─── PROJECT TYPE SELECTOR ───

const PROJECT_TYPE_STEP: WizardStep = {
  id: "project_type",
  question: "What are you building?",
  description: "This determines the questions we ask next.",
  type: "single",
  required: true,
  options: [
    { label: "Homepage", value: "homepage", icon: "🏠" },
    { label: "Landing Page", value: "landing", icon: "🎯" },
    { label: "Online Shop", value: "shop", icon: "🛒" },
    { label: "Blog / Magazine", value: "blog", icon: "📝" },
    { label: "Web Application", value: "webapp", icon: "⚙️" },
    { label: "Portfolio", value: "portfolio", icon: "🎨" },
    { label: "Rebuild / Redesign", value: "rebuild", icon: "🔄" },
  ],
};

const TYPE_STEPS_MAP: Record<string, WizardStep[]> = {
  homepage: HOMEPAGE_STEPS,
  landing: LANDING_STEPS,
  shop: SHOP_STEPS,
  blog: BLOG_STEPS,
  webapp: WEBAPP_STEPS,
  portfolio: PORTFOLIO_STEPS,
  rebuild: REBUILD_STEPS,
};

export default function NewProjectWizard() {
  const router = useRouter();
  const [session, setSession] = useState<WizardSession | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());
  const [textAnswer, setTextAnswer] = useState("");

  // Build the full step list based on project type
  const projectType = (session?.answers.project_type as string) || null;
  const allSteps = useMemo(() => {
    if (!projectType) return [PROJECT_TYPE_STEP];
    return [PROJECT_TYPE_STEP, ...(TYPE_STEPS_MAP[projectType] || []), ...UNIVERSAL_STEPS];
  }, [projectType]);
  const totalSteps = allSteps.length;

  const currentStep = allSteps[stepIndex] || null;
  const progress = { current: stepIndex + 1, total: totalSteps };

  const startWizard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentStep || loading) return;

    let answer: unknown;
    if (currentStep.type === "multi") answer = Array.from(selectedMulti);
    else if (currentStep.type === "text" || currentStep.type === "url" || currentStep.type === "url_multi") answer = textAnswer.trim() || undefined;
    else answer = selectedSingle;

    if (currentStep.required && (answer === undefined || answer === null)) {
      setError("Please make a selection before continuing");
      return;
    }

    setLoading(true);
    setError(null);

    const newAnswers = { ...session.answers, [currentStep.id]: answer };
    const newSession = { ...session, answers: newAnswers };
    setSession(newSession);

    try {
      await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", session, stepId: currentStep.id, answer }),
      });

      const isTypeStep = currentStep.id === "project_type";
      if (isTypeStep) {
        // Type was just selected — allSteps will rebuild on next render
        setStepIndex(1);
        setSelectedSingle(null);
        setSelectedMulti(new Set());
        setTextAnswer("");
      } else {
        const nextIndex = stepIndex + 1;
        if (nextIndex < allSteps.length) {
          setStepIndex(nextIndex);
          setSelectedSingle(null);
          setSelectedMulti(new Set());
          setTextAnswer("");
        } else {
          // All steps done — generate plan
          const res = await fetch("/api/planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate", session: newSession }),
          });
          if (!res.ok) throw new Error(`API error ${res.status}`);
          const data = await res.json();
          setSession(data.session);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      const prevStep = allSteps[stepIndex - 1];
      if (prevStep && session) {
        const prevAnswer = session.answers[prevStep.id] as string | string[] | undefined;
        if (prevStep.type === "multi") setSelectedMulti(new Set(prevAnswer as string[] || []));
        else if (prevStep.type === "single") setSelectedSingle((prevAnswer as string) || null);
        else setTextAnswer((prevAnswer as string) || "");
      }
      setError(null);
    } else {
      setSession(null);
      setStepIndex(0);
    }
  };

  const approvePlan = async () => {
    if (!session?.plan || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", session }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.project?.id) router.push(`/projects/${data.project.id}`);
      else throw new Error("Project created but no ID returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
      setCreating(false);
    }
  };

  const toggleMulti = (value: string) => {
    const next = new Set(selectedMulti);
    if (next.has(value)) next.delete(value); else next.add(value);
    setSelectedMulti(next);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = { design: "bg-purple-500/20 text-purple-300", code: "bg-blue-500/20 text-blue-300", content: "bg-emerald-500/20 text-emerald-300", deploy: "bg-orange-500/20 text-orange-300", planning: "bg-slate-500/20 text-slate-300", shop: "bg-pink-500/20 text-pink-300" };
    return colors[type] || "bg-slate-500/20 text-slate-300";
  };
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { design: "🎨", code: "💻", content: "📝", deploy: "🚀", planning: "📋", shop: "🛒" };
    return icons[type] || "📋";
  };

  const isMulti = currentStep?.type === "multi";
  const isText = currentStep?.type === "text" || currentStep?.type === "url" || currentStep?.type === "url_multi";
  const hasAnswer = isMulti ? selectedMulti.size > 0 : isText ? textAnswer.trim().length > 0 : selectedSingle !== null;

  // NOT STARTED
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center ">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-[var(--primary-light)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">New Project</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-8">
            Answer a few questions and we'll generate a complete project plan with all the tasks you need.
          </p>
          <button onClick={startWizard} disabled={loading} className="flex items-center justify-center gap-2 mx-auto rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--foreground)] font-medium px-8 py-4 text-sm transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</> : <><Sparkles className="h-4 w-4" /> Start Project Wizard</>}
          </button>
          <button onClick={() => router.push("/projects")} className="mt-4 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
          {error && <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-[var(--destructive)] shrink-0" /><p className="text-xs text-[var(--destructive)]">{error}</p></div>}
        </div>
      </div>
    );
  }

  // PLAN GENERATED
  if (session.plan) {
    const plan = session.plan;
    return (
      <div className="min-h-[calc(100vh-64px)] ">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push("/projects")} className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Your Project Plan</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">Review the generated plan. You can edit tasks after the project is created.</p>
          {error && <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-[var(--destructive)] shrink-0" /><p className="text-xs text-[var(--destructive)]">{error}</p></div>}
          <div className="surface-elevated p-5 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{plan.project_name}</h2>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">{plan.description}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-center"><p className="text-xl font-bold text-[var(--foreground)]">{plan.tasks.length}</p><p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Tasks</p></div>
              <div className="text-center"><p className="text-xl font-bold text-[var(--foreground)]">{plan.tasks.reduce((a, t) => a + t.estimated_hours, 0)}h</p><p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Est. Hours</p></div>
            </div>
          </div>
          <div className="space-y-2 mb-8">
            {plan.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-lg shrink-0">{getTypeIcon(task.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                  <p className="text-xs text-[var(--foreground-tertiary)] mt-0.5">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeColor(task.type)}`}>{task.type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${task.priority === "high" ? "bg-red-500/10 text-[var(--destructive)]" : task.priority === "medium" ? "bg-orange-500/10 text-orange-400" : "bg-slate-500/10 text-slate-400"}`}>{task.priority}</span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">~{task.estimated_hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={approvePlan} disabled={creating} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--success)] hover:bg-emerald-600 text-[var(--foreground)] font-medium px-6 py-4 text-sm transition-all disabled:opacity-50">
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Check className="h-4 w-4" /> Approve & Create Project</>}
            </button>
            <button onClick={() => router.push("/projects")} className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] transition-all">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // WIZARD STEP
  if (!currentStep) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] ">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--foreground-tertiary)]">Step {progress.current} of {progress.total}</span>
            <span className="text-xs text-[var(--primary-light)] font-medium">{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">{currentStep.question}</h2>
          {currentStep.description && <p className="text-sm text-[var(--foreground-secondary)]">{currentStep.description}</p>}
        </div>

        {error && <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-[var(--destructive)] shrink-0" /><p className="text-xs text-[var(--destructive)]">{error}</p></div>}

        {/* Options */}
        {currentStep.options && (
          <div className="space-y-3 mb-8">
            {currentStep.options.map((opt) => {
              const isSelected = isMulti ? selectedMulti.has(opt.value) : selectedSingle === opt.value;
              return (
                <button key={opt.value} onClick={() => { if (isMulti) toggleMulti(opt.value); else setSelectedSingle(opt.value); setError(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${isSelected ? "border-[var(--primary)]/40 bg-[var(--primary-subtle)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"}`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-[var(--primary-light)] ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Text Input */}
        {isText && (
          <div className="mb-8">
            <input type={currentStep.type === "url" || currentStep.type === "url_multi" ? "url" : "text"} value={textAnswer} onChange={(e) => { setTextAnswer(e.target.value); setError(null); }}
              placeholder={currentStep.placeholder || "Type your answer..."}
              className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-all" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={submitAnswer} disabled={loading || (currentStep.required && !hasAnswer)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--foreground)] font-medium px-6 py-4 text-sm transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : (
              progress.current === progress.total
                ? <>Generate Plan <Sparkles className="h-4 w-4" /></>
                : <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {!currentStep.required && !hasAnswer && (
          <button onClick={() => { if (isMulti) setSelectedMulti(new Set(["__none__"])); else setSelectedSingle("__none__"); submitAnswer(); }} disabled={loading}
            className="w-full mt-3 text-center text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors py-2">
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}