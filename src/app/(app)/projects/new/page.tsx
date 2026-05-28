"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ArrowLeft, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

interface WizardStep {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multi" | "text" | "url";
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

// ─── STEP DEFINITIONS (client-side) ───

const COMMON_FIRST_STEP: WizardStep = {
  id: "project_type",
  question: "What are you building?",
  description: "This determines which questions we'll ask next",
  type: "single",
  required: true,
  options: [
    { label: "Homepage", value: "homepage", icon: "🏠" },
    { label: "Landing Page", value: "landing", icon: "🎯" },
    { label: "Online Shop", value: "shop", icon: "🛒" },
    { label: "Blog / Magazine", value: "blog", icon: "📝" },
    { label: "Web Application", value: "webapp", icon: "⚙️" },
    { label: "Portfolio / Showcase", value: "portfolio", icon: "🎨" },
    { label: "Rebuild / Redesign", value: "rebuild", icon: "🔄" },
  ],
};

const TYPE_STEPS: Record<string, WizardStep[]> = {
  homepage: [
    { id: "audience", question: "Who is this homepage for?", description: "Helps us tailor content, tone, and design", type: "single", required: true, options: [
      { label: "Small Business / Freelancer", value: "small_business", icon: "🏢" },
      { label: "Club / Association / Non-Profit", value: "community", icon: "🤝" },
      { label: "Agency / Studio", value: "agency", icon: "💡" },
      { label: "Restaurant / Café / Bar", value: "hospitality", icon: "🍽️" },
      { label: "Personal / Family", value: "personal", icon: "👤" },
      { label: "Other", value: "other", icon: "✨" },
    ]},
    { id: "sections", question: "Which sections do you need?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Hero / Banner", value: "hero", icon: "🖼️" },
      { label: "About Us", value: "about", icon: "📖" },
      { label: "Services / Offerings", value: "services", icon: "⚡" },
      { label: "Team / Staff", value: "team", icon: "👥" },
      { label: "Testimonials / Reviews", value: "testimonials", icon: "💬" },
      { label: "Gallery / Photos", value: "gallery", icon: "📸" },
      { label: "FAQ", value: "faq", icon: "❓" },
      { label: "Contact / Map / Hours", value: "contact", icon: "📍" },
      { label: "News / Updates", value: "news", icon: "📰" },
      { label: "Partner Logos", value: "partners", icon: "🤝" },
    ]},
    { id: "purpose", question: "What's the primary goal?", type: "single", required: true, options: [
      { label: "Establish Online Presence", value: "presence", icon: "🌐" },
      { label: "Attract New Customers / Members", value: "attract", icon: "🧲" },
      { label: "Provide Information & Contact", value: "inform", icon: "ℹ️" },
      { label: "Modernize Outdated Site", value: "modernize", icon: "✨" },
    ]},
    { id: "features", question: "Any additional features?", description: "Optional — select all that apply", type: "multi", required: false, options: [
      { label: "Contact Form", value: "contact_form", icon: "📧" },
      { label: "Google Maps Integration", value: "maps", icon: "🗺️" },
      { label: "Social Media Links / Feed", value: "social", icon: "🔗" },
      { label: "Newsletter Signup", value: "newsletter", icon: "📬" },
      { label: "Opening Hours Widget", value: "hours", icon: "🕐" },
      { label: "Dark Mode", value: "dark_mode", icon: "🌙" },
      { label: "Multilingual", value: "i18n", icon: "🌍" },
      { label: "Analytics / Tracking", value: "analytics", icon: "📊" },
    ]},
    { id: "project_name", question: "What's the project called?", description: "This will be the project name in Mission Control", type: "text", placeholder: "e.g., Prenzlauer Carnevalclub Website", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (1-2 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (2-4 weeks)", value: "short", icon: "📅" },
      { label: "Relaxed (1-2 months)", value: "medium", icon: "📆" },
      { label: "No Rush", value: "flexible", icon: "🤷" },
    ]},
  ],
  landing: [
    { id: "audience", question: "Who is the target audience?", type: "single", required: true, options: [
      { label: "B2B / Business Clients", value: "b2b", icon: "💼" },
      { label: "B2C / Consumers", value: "b2c", icon: "🛍️" },
      { label: "Event Attendees", value: "event", icon: "🎫" },
      { label: "App / Product Users", value: "product", icon: "📱" },
      { label: "Other", value: "other", icon: "✨" },
    ]},
    { id: "conversion_goal", question: "What's the conversion goal?", description: "What should visitors do?", type: "single", required: true, options: [
      { label: "Sign Up / Register", value: "signup", icon: "✍️" },
      { label: "Buy a Product", value: "buy", icon: "💰" },
      { label: "Book a Demo / Call", value: "demo", icon: "📞" },
      { label: "Download / Subscribe", value: "download", icon: "📥" },
      { label: "Contact Us", value: "contact", icon: "📧" },
    ]},
    { id: "sections", question: "Which sections do you need?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Hero with CTA", value: "hero", icon: "🖼️" },
      { label: "Benefits / Features", value: "benefits", icon: "⚡" },
      { label: "Social Proof / Testimonials", value: "testimonials", icon: "💬" },
      { label: "Pricing Table", value: "pricing", icon: "💶" },
      { label: "FAQ", value: "faq", icon: "❓" },
      { label: "Comparison / vs Competitors", value: "comparison", icon: "⚖️" },
      { label: "Video / Demo Section", value: "video", icon: "🎬" },
      { label: "Final CTA / Footer", value: "final_cta", icon: "🎯" },
    ]},
    { id: "design_style", question: "What's the design direction?", type: "single", required: false, options: [
      { label: "Bold & Colorful", value: "bold", icon: "🎨" },
      { label: "Clean & Minimal", value: "minimal", icon: "✨" },
      { label: "Professional / Corporate", value: "corporate", icon: "💼" },
      { label: "Playful / Creative", value: "playful", icon: "🎭" },
      { label: "Dark / Techy", value: "dark", icon: "🌙" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., SaaS Landing Page Q3", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (1 week)", value: "asap", icon: "⚡" },
      { label: "Soon (2-3 weeks)", value: "short", icon: "📅" },
      { label: "Flexible", value: "flexible", icon: "🤷" },
    ]},
  ],
  shop: [
    { id: "shop_type", question: "What kind of shop?", type: "single", required: true, options: [
      { label: "Physical Products", value: "physical", icon: "📦" },
      { label: "Digital Products / Downloads", value: "digital", icon: "💾" },
      { label: "Services / Bookings", value: "services", icon: "📅" },
      { label: "Mixed (Products + Services)", value: "mixed", icon: "🔀" },
    ]},
    { id: "product_count", question: "How many products to start with?", type: "single", required: true, options: [
      { label: "1-10 products", value: "small", icon: "📦" },
      { label: "10-50 products", value: "medium", icon: "📦📦" },
      { label: "50-200 products", value: "large", icon: "📦📦📦" },
      { label: "200+ products", value: "xl", icon: "🏪" },
    ]},
    { id: "shop_features", question: "What shop features do you need?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Product Categories", value: "categories", icon: "🏷️" },
      { label: "Product Filters / Search", value: "filters", icon: "🔍" },
      { label: "Product Variants (size, color)", value: "variants", icon: "🎨" },
      { label: "Product Reviews / Ratings", value: "reviews", icon: "⭐" },
      { label: "Wishlist / Favorites", value: "wishlist", icon: "❤️" },
      { label: "Discount Codes / Coupons", value: "coupons", icon: "🎟️" },
      { label: "Related Products / Upselling", value: "upselling", icon: "📈" },
      { label: "Inventory Tracking", value: "inventory", icon: "📋" },
      { label: "Order History / Account", value: "account", icon: "👤" },
    ]},
    { id: "payment", question: "Which payment methods?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Credit Card (Stripe)", value: "stripe", icon: "💳" },
      { label: "PayPal", value: "paypal", icon: "🅿️" },
      { label: "Bank Transfer / Invoice", value: "bank", icon: "🏦" },
      { label: "Cash on Delivery", value: "cod", icon: "💵" },
      { label: "Klarna / Buy Now Pay Later", value: "klarna", icon: "🧾" },
    ]},
    { id: "shipping", question: "Do you need shipping options?", type: "single", required: false, options: [
      { label: "Yes — domestic shipping", value: "domestic", icon: "🇩🇪" },
      { label: "Yes — domestic + international", value: "international", icon: "🌍" },
      { label: "No — digital / pickup only", value: "none", icon: "💻" },
    ]},
    { id: "audience", question: "Who are your customers?", type: "single", required: true, options: [
      { label: "General Consumers (B2C)", value: "b2c", icon: "🛍️" },
      { label: "Businesses (B2B)", value: "b2b", icon: "💼" },
      { label: "Niche / Specialty Market", value: "niche", icon: "🎯" },
      { label: "Local / Regional", value: "local", icon: "📍" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., T-Shirt Online Shop", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (2-3 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (1 month)", value: "short", icon: "📅" },
      { label: "Relaxed (2-3 months)", value: "medium", icon: "📆" },
      { label: "No Rush", value: "flexible", icon: "🤷" },
    ]},
  ],
  blog: [
    { id: "blog_type", question: "What kind of blog?", type: "single", required: true, options: [
      { label: "Personal Blog", value: "personal", icon: "✍️" },
      { label: "Company / Business Blog", value: "company", icon: "🏢" },
      { label: "Magazine / Editorial", value: "magazine", icon: "📰" },
      { label: "Niche / Topic Blog", value: "niche", icon: "🎯" },
    ]},
    { id: "blog_features", question: "What features do you need?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Categories & Tags", value: "categories", icon: "🏷️" },
      { label: "Search", value: "search", icon: "🔍" },
      { label: "Author Profiles", value: "authors", icon: "👤" },
      { label: "Comments / Discussion", value: "comments", icon: "💬" },
      { label: "Newsletter / Subscription", value: "newsletter", icon: "📬" },
      { label: "Related Posts", value: "related", icon: "🔗" },
      { label: "Reading Time / Progress", value: "reading", icon: "⏱️" },
      { label: "Social Sharing Buttons", value: "sharing", icon: "📤" },
      { label: "SEO Optimization", value: "seo", icon: "🔍" },
      { label: "RSS Feed", value: "rss", icon: "📡" },
    ]},
    { id: "authors", question: "How many authors will write?", type: "single", required: true, options: [
      { label: "Just me (1 author)", value: "single", icon: "👤" },
      { label: "Small team (2-5)", value: "small_team", icon: "👥" },
      { label: "Large team (5+)", value: "large_team", icon: "🏢" },
      { label: "Guest authors / Open submissions", value: "guest", icon: "✉️" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., Tech Insights Blog", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (2 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (3-4 weeks)", value: "short", icon: "📅" },
      { label: "Flexible", value: "flexible", icon: "🤷" },
    ]},
  ],
  webapp: [
    { id: "webapp_type", question: "What kind of web application?", type: "single", required: true, options: [
      { label: "Dashboard / Admin Panel", value: "dashboard", icon: "📊" },
      { label: "SaaS / Subscription Platform", value: "saas", icon: "☁️" },
      { label: "CRM / Management Tool", value: "crm", icon: "📇" },
      { label: "Portal / Community Platform", value: "portal", icon: "🌐" },
      { label: "Internal Tool", value: "internal", icon: "🔧" },
      { label: "Other", value: "other", icon: "✨" },
    ]},
    { id: "auth", question: "What authentication do you need?", type: "single", required: true, options: [
      { label: "Email + Password", value: "email", icon: "📧" },
      { label: "Social Login (Google, GitHub)", value: "social", icon: "🔐" },
      { label: "Both Email + Social", value: "both", icon: "🔑" },
      { label: "No Login Needed", value: "none", icon: "🚫" },
    ]},
    { id: "roles", question: "Do you need user roles?", type: "single", required: true, options: [
      { label: "Yes — Admin + User", value: "admin_user", icon: "👑" },
      { label: "Yes — Multiple Roles", value: "multi", icon: "👥" },
      { label: "No — Everyone same access", value: "none", icon: "🚫" },
    ]},
    { id: "data_entities", question: "What data will users manage?", description: "Select all that apply — these become your CRUD views", type: "multi", required: true, options: [
      { label: "Users / Contacts", value: "users", icon: "👤" },
      { label: "Products / Items", value: "products", icon: "📦" },
      { label: "Orders / Transactions", value: "orders", icon: "🧾" },
      { label: "Content / Articles", value: "content", icon: "📝" },
      { label: "Files / Media", value: "files", icon: "📁" },
      { label: "Messages / Notifications", value: "messages", icon: "💬" },
      { label: "Tasks / Projects", value: "tasks", icon: "📋" },
      { label: "Custom", value: "custom", icon: "✨" },
    ]},
    { id: "webapp_features", question: "Any advanced features?", description: "Select all that apply", type: "multi", required: false, options: [
      { label: "Real-time Updates / WebSockets", value: "realtime", icon: "⚡" },
      { label: "Charts / Data Visualization", value: "charts", icon: "📈" },
      { label: "File Upload / Storage", value: "upload", icon: "📤" },
      { label: "Email Notifications", value: "email", icon: "📧" },
      { label: "API / Webhooks", value: "api", icon: "🔗" },
      { label: "Export to CSV / PDF", value: "export", icon: "📄" },
      { label: "Search / Full-Text", value: "search", icon: "🔍" },
      { label: "Dark Mode", value: "dark_mode", icon: "🌙" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., Client Management Portal", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (3-4 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (1-2 months)", value: "short", icon: "📅" },
      { label: "Relaxed (2-3 months)", value: "medium", icon: "📆" },
      { label: "No Rush", value: "flexible", icon: "🤷" },
    ]},
  ],
  portfolio: [
    { id: "portfolio_type", question: "What kind of portfolio?", type: "single", required: true, options: [
      { label: "Design / Creative Work", value: "design", icon: "🎨" },
      { label: "Development / Code Projects", value: "dev", icon: "💻" },
      { label: "Photography", value: "photo", icon: "📷" },
      { label: "Writing / Journalism", value: "writing", icon: "✍️" },
      { label: "Mixed / General", value: "mixed", icon: "🔀" },
    ]},
    { id: "portfolio_features", question: "What features do you need?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Project Gallery / Grid", value: "gallery", icon: "🖼️" },
      { label: "Case Studies / Detail Pages", value: "case_studies", icon: "📄" },
      { label: "Category Filtering", value: "categories", icon: "🏷️" },
      { label: "About / Bio Section", value: "about", icon: "📖" },
      { label: "Skills / Services List", value: "skills", icon: "⚡" },
      { label: "Client Testimonials", value: "testimonials", icon: "💬" },
      { label: "Contact / Hire Me", value: "contact", icon: "📧" },
      { label: "Resume / CV Download", value: "resume", icon: "📋" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., My Design Portfolio", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (1-2 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (2-3 weeks)", value: "short", icon: "📅" },
      { label: "Flexible", value: "flexible", icon: "🤷" },
    ]},
  ],
  rebuild: [
    { id: "source_url", question: "What's the current website URL?", description: "We'll audit the existing site and plan the migration", type: "url", placeholder: "https://example.com", required: true },
    { id: "rebuild_reason", question: "Why are you rebuilding?", description: "Select all that apply", type: "multi", required: true, options: [
      { label: "Outdated Design", value: "design", icon: "🎨" },
      { label: "Not Mobile-Friendly", value: "mobile", icon: "📱" },
      { label: "Slow Performance", value: "performance", icon: "⚡" },
      { label: "Hard to Maintain / Update", value: "maintenance", icon: "🔧" },
      { label: "Missing Features", value: "features", icon: "📋" },
      { label: "Bad SEO", value: "seo", icon: "🔍" },
      { label: "Security Concerns", value: "security", icon: "🔒" },
      { label: "Platform Migration (WordPress → Next.js)", value: "migration", icon: "🔄" },
    ]},
    { id: "keep_content", question: "What should we keep from the old site?", description: "Select all that apply", type: "multi", required: false, options: [
      { label: "All Existing Content / Text", value: "content", icon: "📝" },
      { label: "Brand Colors / Logo", value: "branding", icon: "🎨" },
      { label: "Images / Media", value: "images", icon: "📸" },
      { label: "URL Structure / SEO Rankings", value: "urls", icon: "🔗" },
      { label: "Contact / Booking Integrations", value: "integrations", icon: "🔌" },
      { label: "Nothing — Fresh Start", value: "fresh", icon: "✨" },
    ]},
    { id: "new_features", question: "What new features do you want?", description: "Select all that apply", type: "multi", required: false, options: [
      { label: "Modern Responsive Design", value: "responsive", icon: "📱" },
      { label: "Contact Form", value: "contact_form", icon: "📧" },
      { label: "CMS / Easy Content Editing", value: "cms", icon: "📄" },
      { label: "Blog / News Section", value: "blog", icon: "📰" },
      { label: "Online Shop", value: "shop", icon: "🛒" },
      { label: "User Login / Members Area", value: "auth", icon: "🔐" },
      { label: "Social Media Integration", value: "social", icon: "🔗" },
      { label: "Multilingual", value: "i18n", icon: "🌍" },
      { label: "Analytics / Tracking", value: "analytics", icon: "📊" },
    ]},
    { id: "project_name", question: "Project name?", type: "text", placeholder: "e.g., Club Website Rebuild", required: true },
    { id: "timeline", question: "When do you need this?", type: "single", required: false, options: [
      { label: "ASAP (2-3 weeks)", value: "asap", icon: "⚡" },
      { label: "Soon (1 month)", value: "short", icon: "📅" },
      { label: "Relaxed (2-3 months)", value: "medium", icon: "📆" },
      { label: "No Rush", value: "flexible", icon: "🤷" },
    ]},
  ],
};

export default function NewProjectWizard() {
  const router = useRouter();
  const [session, setSession] = useState<WizardSession | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Current answer state
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());
  const [textAnswer, setTextAnswer] = useState("");

  // Get the full step list (common first + type-specific)
  const projectType = (session?.answers.project_type as string) || null;
  const allSteps = projectType && TYPE_STEPS[projectType]
    ? [COMMON_FIRST_STEP, ...TYPE_STEPS[projectType]]
    : [COMMON_FIRST_STEP];
  const currentStep = allSteps[stepIndex] || null;
  const progress = allSteps.length > 1
    ? { current: stepIndex + 1, total: allSteps.length }
    : { current: 1, total: 1 };

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
    if (currentStep.type === "single") answer = selectedSingle;
    else if (currentStep.type === "multi") answer = Array.from(selectedMulti);
    else answer = textAnswer.trim() || undefined;

    if (currentStep.required && !answer) {
      setError("Please make a selection before continuing");
      return;
    }

    setLoading(true);
    setError(null);

    // Save answer locally + to API
    const newAnswers = { ...session.answers, [currentStep.id]: answer };
    const newSession = { ...session, answers: newAnswers };
    setSession(newSession);

    try {
      await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", session, stepId: currentStep.id, answer }),
      });

      // Move to next step or generate plan
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
      // Restore previous answer
      if (prevStep && session) {
        const prevAnswer = session.answers[prevStep.id];
        if (prevStep.type === "single") setSelectedSingle((prevAnswer as string) || null);
        else if (prevStep.type === "multi") setSelectedMulti(new Set((prevAnswer as string[]) || []));
        else setTextAnswer((prevAnswer as string) || "");
      }
      setError(null);
    } else {
      router.push("/projects");
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
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      } else {
        throw new Error("Project created but no ID returned");
      }
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
  const isText = currentStep?.type === "text" || currentStep?.type === "url";
  const hasAnswer = isMulti ? selectedMulti.size > 0 : isText ? textAnswer.trim().length > 0 : selectedSingle !== null;

  // ─── NOT STARTED ───
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center page-enter">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-[var(--primary-light)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">New Project</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-8">
            Answer a few questions and we'll generate a complete project plan with tailored tasks.
          </p>
          <button onClick={startWizard} disabled={loading} className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-8 py-4 text-sm transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</> : <><Sparkles className="h-4 w-4" /> Start Project Wizard</>}
          </button>
          <button onClick={() => router.push("/projects")} className="mt-4 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
          {error && <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-red-400 shrink-0" /><p className="text-xs text-red-400">{error}</p></div>}
        </div>
      </div>
    );
  }

  // ─── PLAN GENERATED ───
  if (session.plan) {
    const plan = session.plan;
    return (
      <div className="min-h-[calc(100vh-64px)] page-enter">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push("/projects")} className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Your Project Plan</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">Review the generated plan. You can edit tasks after the project is created.</p>
          {error && <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-red-400 shrink-0" /><p className="text-xs text-red-400">{error}</p></div>}
          <div className="liquid-glass p-5 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{plan.project_name}</h2>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">{plan.description}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/[0.04]">
              <div className="text-center"><p className="text-xl font-bold text-[var(--foreground)]">{plan.tasks.length}</p><p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Tasks</p></div>
              <div className="text-center"><p className="text-xl font-bold text-[var(--foreground)]">{plan.tasks.reduce((a, t) => a + t.estimated_hours, 0)}h</p><p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Est. Hours</p></div>
            </div>
          </div>
          <div className="space-y-2 mb-8">
            {plan.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-lg shrink-0">{getTypeIcon(task.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                  <p className="text-xs text-[var(--foreground-tertiary)] mt-0.5">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeColor(task.type)}`}>{task.type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${task.priority === "high" ? "bg-red-500/10 text-red-400" : task.priority === "medium" ? "bg-orange-500/10 text-orange-400" : "bg-slate-500/10 text-slate-400"}`}>{task.priority}</span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">~{task.estimated_hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={approvePlan} disabled={creating} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--success)] hover:bg-emerald-600 text-white font-medium px-6 py-4 text-sm transition-all disabled:opacity-50">
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Check className="h-4 w-4" /> Approve & Create Project</>}
            </button>
            <button onClick={() => router.push("/projects")} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-4 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── WIZARD STEP ───
  if (!currentStep) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] page-enter">
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
          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">{currentStep.question}</h2>
          {currentStep.description && <p className="text-sm text-[var(--foreground-secondary)]">{currentStep.description}</p>}
        </div>

        {error && <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3"><AlertTriangle className="h-4 w-4 text-red-400 shrink-0" /><p className="text-xs text-red-400">{error}</p></div>}

        {/* Options */}
        {currentStep.options && (
          <div className="space-y-3 mb-8">
            {currentStep.options.map((opt) => {
              const isSelected = isMulti ? selectedMulti.has(opt.value) : selectedSingle === opt.value;
              return (
                <button key={opt.value} onClick={() => { if (isMulti) toggleMulti(opt.value); else setSelectedSingle(opt.value); setError(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${isSelected ? "border-[var(--primary)]/40 bg-[var(--primary)]/10" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
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
            <input type={currentStep.type === "url" ? "url" : "text"} value={textAnswer} onChange={(e) => { setTextAnswer(e.target.value); setError(null); }}
              placeholder={currentStep.placeholder || "Type your answer..."}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={submitAnswer} disabled={loading || (currentStep.required && !hasAnswer)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-6 py-4 text-sm transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : (
              progress.current === progress.total
                ? <>Generate Plan <Sparkles className="h-4 w-4" /></>
                : <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {/* Skip button for optional steps */}
        {!currentStep.required && hasAnswer === false && (
          <button onClick={() => { setSelectedSingle("__skip__"); submitAnswer(); }} disabled={loading}
            className="w-full mt-3 text-center text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors py-2">
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}