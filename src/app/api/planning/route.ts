import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";
import { autoAssignTask } from "@/lib/auto-assign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface WizardSession {
  answers: Record<string, unknown>;
  status: "discovering" | "plan_generated" | "approved";
  plan?: {
    project_name: string;
    description: string;
    tasks: Array<{
      title: string;
      type: string;
      description: string;
      priority: string;
      estimated_hours: number;
    }>;
  };
}

type Task = NonNullable<WizardSession["plan"]>["tasks"][number];

// ─── TASK GENERATION ───

function generatePlan(answers: Record<string, unknown>) {
  const type = (answers.project_type as string) || "homepage";
  const projectName = (answers.project_name as string) || "New Project";
  const brandName = (answers.brand_name as string) || "";
  const timeline = (answers.timeline as string) || "medium";

  const tasks: Task[] = [];

  const addTask = (task: Task) => tasks.push(task);

  // ═══════════════════════════════════════════
  // UNIVERSAL TASKS (all project types)
  // ═══════════════════════════════════════════

  const hasLogo = answers.logo_status === "yes_file" || answers.logo_status === "yes_text";
  const needsLogoDesign = answers.logo_status === "design";
  const brandColors = answers.brand_colors as string;
  const languages = (answers.languages as string) || "de";
  const legalPages = (answers.legal_pages as string[]) || [];
  const competitorUrls = (answers.competitor_urls as string) || "";
  const existingContent = answers.existing_content as string;
  const domainStatus = answers.domain_status as string;
  const timelineMap: Record<string, number> = { asap: 1, short: 2, medium: 3, flexible: 4 };

  // Domain check
  if (domainStatus === "buy") {
    addTask({ title: "Research and register domain", type: "planning", description: "Find available domains matching the brand. Purchase and configure DNS.", priority: "high", estimated_hours: 2 });
  } else if (domainStatus === "unsure") {
    addTask({ title: "Domain consultation and registration", type: "planning", description: "Advise on best domain choice, register, and configure DNS.", priority: "high", estimated_hours: 2 });
  }

  // Logo
  if (needsLogoDesign) {
    addTask({ title: "Design logo and brand identity", type: "design", description: "Create logo concepts, color palette, and typography. Deliver in SVG, PNG formats.", priority: "high", estimated_hours: 8 });
  } else if (answers.logo_status === "later") {
    addTask({ title: "Create placeholder logo for launch", type: "design", description: "Design a temporary logo. Client to provide final logo later.", priority: "medium", estimated_hours: 3 });
  }

  // Brand colors
  if (brandColors && brandColors.trim()) {
    addTask({ title: "Implement brand colors", type: "design", description: `Apply brand colors: ${brandColors}. Create CSS variables for consistent use.`, priority: "medium", estimated_hours: 2 });
  }

  // Legal pages
  if (legalPages.length > 0) {
    addTask({ title: "Create Impressum (Legal Notice)", type: "content", description: "German legal notice with company name, address, contact, trade register, VAT ID.", priority: "high", estimated_hours: 1 });
  }
  if (legalPages.includes("privacy")) {
    addTask({ title: "Create Datenschutzerklärung (Privacy Policy)", type: "content", description: "GDPR-compliant privacy policy covering data processing, cookies, user rights.", priority: "high", estimated_hours: 2 });
  }
  if (legalPages.includes("agb")) {
    addTask({ title: "Create AGB (Terms & Conditions)", type: "content", description: "General terms and conditions covering contracts, liabilities, dispute resolution.", priority: "high", estimated_hours: 2 });
  }
  if (legalPages.includes("cancellation")) {
    addTask({ title: "Create Widerrufsbelehrung (Cancellation Policy)", type: "content", description: "14-day withdrawal notice for German e-commerce compliance.", priority: "high", estimated_hours: 1 });
  }
  if (legalPages.includes("cookies")) {
    addTask({ title: "Implement Cookie Consent Banner", type: "code", description: "GDPR-compliant cookie banner with opt-in, preference management, and documentation.", priority: "high", estimated_hours: 3 });
  }

  // Multilingual
  if (languages === "de_en" || languages === "other") {
    addTask({ title: "Set up multilingual support", type: "code", description: `Implement language switching with ${languages === "de_en" ? "German + English" : "multiple languages"}. Use next-intl or similar.`, priority: "high", estimated_hours: 8 });
  }

  // Competitor reference
  if (competitorUrls) {
    addTask({ title: "Analyze competitor sites for design inspiration", type: "planning", description: `Review: ${competitorUrls.split(",")[0]}`, priority: "low", estimated_hours: 2 });
  }

  // Content migration
  if (existingContent === "full" || existingContent === "partial") {
    addTask({ title: "Migrate content from existing site", type: "content", description: "Transfer all text and media from old site. Format for new design.", priority: "high", estimated_hours: 5 });
  } else if (existingContent === "help") {
    addTask({ title: "Write all site content", type: "content", description: "Create headlines, body copy, CTAs, and meta descriptions for all pages.", priority: "high", estimated_hours: 8 });
  }

  // Core setup always
  addTask({ title: "Set up Next.js project with TypeScript and Tailwind", type: "code", description: "Initialize Next.js repo with TypeScript, Tailwind, and shadcn/ui. Configure ESLint, Prettier, and Git.", priority: "high", estimated_hours: 3 });
  addTask({ title: "Create design system (colors, typography, spacing)", type: "design", description: "Define CSS variables for colors, typography scale, spacing system, and component styles.", priority: "high", estimated_hours: 4 });
  addTask({ title: "Build responsive navigation with mobile menu", type: "code", description: "Create sticky navbar with logo, links, and hamburger menu for mobile.", priority: "high", estimated_hours: 4 });
  addTask({ title: "Build footer with links and social media", type: "code", description: "Create footer with sitemap links, legal pages, and social icons.", priority: "medium", estimated_hours: 3 });
  addTask({ title: "Add scroll animations and micro-interactions", type: "code", description: "Implement fade-in animations, hover effects, and page transitions.", priority: "low", estimated_hours: 4 });
  addTask({ title: "Test across devices and browsers", type: "code", description: "Verify responsive behavior on mobile, tablet, desktop. Test Chrome, Safari, Firefox.", priority: "high", estimated_hours: 4 });
  addTask({ title: "SEO: meta tags, Open Graph, sitemap, robots.txt", type: "code", description: "Add meta titles, descriptions, structured data, XML sitemap, and robots.txt.", priority: "high", estimated_hours: 3 });

  // Analytics setup
  const analyticsChoice = (answers.analytics_choice as string) || "none";
  if (analyticsChoice === "plausible") {
    addTask({ title: "Set up Plausible Analytics (privacy-friendly)", type: "code", description: "Privacy-focused analytics without cookies. Track page views and goals.", priority: "medium", estimated_hours: 2 });
  } else if (analyticsChoice === "ga4") {
    addTask({ title: "Set up Google Analytics 4", type: "code", description: "GA4 tracking with events and conversions. Cookie consent required.", priority: "medium", estimated_hours: 2 });
  } else if (analyticsChoice === "fathom") {
    addTask({ title: "Set up Fathom Analytics", type: "code", description: "Privacy-focused analytics with event tracking.", priority: "medium", estimated_hours: 2 });
  }

  // Maintenance documentation
  const maintenanceOwner = (answers.maintenance_owner as string) || "";
  if (maintenanceOwner === "non_tech") {
    addTask({ title: "Set up headless CMS for easy content management", type: "code", description: "CMS (e.g., Sanity, Contentful) so non-technical staff can update content.", priority: "high", estimated_hours: 6 });
    addTask({ title: "Create content editing guide", type: "content", description: "Documentation on how to update text, images, and pages.", priority: "medium", estimated_hours: 2 });
  } else if (maintenanceOwner === "tech") {
    addTask({ title: "Set up headless CMS with developer documentation", type: "code", description: "CMS with clear data model and API docs for technical team.", priority: "medium", estimated_hours: 4 });
  } else if (maintenanceOwner === "you") {
    addTask({ title: "Set up maintenance agreement and monitoring", type: "planning", description: "Define maintenance scope, SLAs, and monitoring alerts.", priority: "medium", estimated_hours: 2 });
  } else if (maintenanceOwner === "unsure") {
    addTask({ title: "Set up headless CMS (recommended for all users)", type: "code", description: "CMS so anyone can update content regardless of technical skill.", priority: "high", estimated_hours: 6 });
  }

  addTask({ title: "Deploy to Vercel and configure domain", type: "deploy", description: "Deploy to production, configure custom domain and SSL.", priority: "high", estimated_hours: 2 });

  // ═══════════════════════════════════════════
  // HOMEPAGE SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "homepage") {
    const sections = (answers.sections as string[]) || (answers.main_sections as string[]) || [];
    const businessPitch = (answers.business_pitch as string) || "";
    const hasImages = answers.has_images as string;
    const contactForm = answers.contact_form as string;
    const googleMaps = answers.google_maps as string;
    const socialLinks = (answers.social_links as string[]) || [];
    const newsletter = answers.newsletter_signup as string;
    const openingHours = answers.opening_hours as string;

    // Hero section
    if (sections.includes("hero")) {
      addTask({ title: "Build hero section", type: "design", description: `Hero with headline, subtext, and CTA. Pitch: "${businessPitch}"`, priority: "high", estimated_hours: 5 });
    }

    // About
    if (sections.includes("about")) {
      addTask({ title: "Build About Us section", type: "code", description: "Create about section with story, values, and key information.", priority: "high", estimated_hours: 4 });
    }

    // Services
    if (sections.includes("services")) {
      addTask({ title: "Build services/offerings section", type: "code", description: "Service cards with icons, titles, and descriptions.", priority: "high", estimated_hours: 4 });
    }

    // Team
    if (sections.includes("team")) {
      addTask({ title: "Build team/staff section", type: "code", description: "Team grid with photos, names, roles, and bios.", priority: "medium", estimated_hours: 4 });
    }

    // Testimonials
    if (sections.includes("testimonials")) {
      addTask({ title: "Build testimonials section", type: "code", description: "Client quotes, ratings display, and review carousel.", priority: "medium", estimated_hours: 3 });
    }

    // Gallery
    if (sections.includes("gallery")) {
      addTask({ title: "Build photo gallery with lightbox", type: "code", description: "Responsive image gallery with click-to-enlarge lightbox.", priority: "medium", estimated_hours: 4 });
    }

    // FAQ
    if (sections.includes("faq")) {
      addTask({ title: "Build FAQ accordion section", type: "code", description: "Expandable FAQ with animated accordion.", priority: "low", estimated_hours: 3 });
    }

    // Contact/Map/Hours
    if (sections.includes("contact") || contactForm !== "no") {
      addTask({ title: "Build contact section", type: "code", description: "Contact form and info section.", priority: "high", estimated_hours: 4 });
    }

    // News
    if (sections.includes("news")) {
      addTask({ title: "Build news/updates section", type: "code", description: "Latest posts with dates and preview cards.", priority: "medium", estimated_hours: 4 });
    }

    // Partners
    if (sections.includes("partners")) {
      addTask({ title: "Build partner logos section", type: "code", description: "Logo grid or carousel for partner/client logos.", priority: "low", estimated_hours: 2 });
    }

    // Pricing
    if (sections.includes("pricing")) {
      addTask({ title: "Build pricing section", type: "code", description: "Pricing cards with feature comparison.", priority: "medium", estimated_hours: 4 });
    }

    // Events
    if (sections.includes("events")) {
      addTask({ title: "Build events/calendar section", type: "code", description: "Event listings with dates, descriptions, and registration.", priority: "medium", estimated_hours: 5 });
    }

    // Images
    if (hasImages === "stock") {
      addTask({ title: "Source stock photos", type: "design", description: "Select and license high-quality stock photos for site.", priority: "medium", estimated_hours: 2 });
    } else if (hasImages === "photo_shoot") {
      addTask({ title: "Plan and execute photography", type: "design", description: "Schedule photo shoot for site imagery.", priority: "medium", estimated_hours: 8 });
    } else if (hasImages === "yes_needs_work") {
      addTask({ title: "Edit and optimize existing images", type: "design", description: "Resize, compress, and optimize existing photos.", priority: "medium", estimated_hours: 3 });
    }

    // Google Maps
    if (googleMaps === "yes") {
      addTask({ title: "Embed Google Maps", type: "code", description: "Add map with location marker and styled appearance.", priority: "medium", estimated_hours: 2 });
    }

    // Social links
    if (socialLinks.length > 0) {
      addTask({ title: "Add social media links", type: "code", description: `Add links and icons for: ${socialLinks.join(", ")}`, priority: "low", estimated_hours: 1 });
    }

    // Newsletter
    if (newsletter === "yes") {
      addTask({ title: "Add newsletter signup form", type: "code", description: "Email signup form with integration to email provider.", priority: "medium", estimated_hours: 3 });
    }

    // Opening hours
    if (openingHours === "yes") {
      addTask({ title: "Add opening hours widget", type: "code", description: "Show current open/closed status based on business hours.", priority: "low", estimated_hours: 2 });
    }
  }

  // ═══════════════════════════════════════════
  // LANDING PAGE SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "landing") {
    const sections = (answers.sections as string[]) || [];
    const offering = (answers.offering as string) || "";
    const proposition = (answers.unique_proposition as string) || "";
    const goal = (answers.conversion_goal as string) || "signup";
    const hasTestimonials = answers.has_testimonials as string;
    const hasVideo = answers.has_video as string;
    const pricingTiers = answers.pricing_tiers as string;
    const leadCapture = answers.lead_capture as string;
    const designStyle = answers.design_style as string;

    addTask({ title: `Build hero optimized for ${goal}`, type: "design", description: `Hero with headline, value prop: "${proposition}", and CTA: ${goal}`, priority: "high", estimated_hours: 5 });

    if (sections.includes("benefits") || sections.includes("features")) {
      addTask({ title: "Build benefits/features section", type: "code", description: `Feature cards highlighting: "${offering}"`, priority: "high", estimated_hours: 4 });
    }

    if (sections.includes("how_it_works")) {
      addTask({ title: "Build 'How It Works' section", type: "code", description: "3-4 step process with icons and descriptions.", priority: "medium", estimated_hours: 3 });
    }

    if (sections.includes("testimonials") && hasTestimonials !== "no") {
      addTask({ title: "Build testimonials section", type: "code", description: "Client quotes with photos and company names.", priority: "medium", estimated_hours: 3 });
    }

    if (sections.includes("logos")) {
      addTask({ title: "Build client logo section", type: "code", description: "Logo grid for social proof.", priority: "medium", estimated_hours: 2 });
    }

    if (sections.includes("pricing") && pricingTiers !== "pending") {
      addTask({ title: "Build pricing table", type: "design", description: `${pricingTiers === "single" ? "Single price" : pricingTiers === "multiple" ? "2-3 tiers" : "4+ comparison tiers"} pricing display`, priority: "high", estimated_hours: 4 });
    }

    if (sections.includes("faq")) {
      addTask({ title: "Build FAQ section", type: "code", description: "Address objections and common questions.", priority: "medium", estimated_hours: 3 });
    }

    if (sections.includes("comparison")) {
      addTask({ title: "Build competitor comparison table", type: "code", description: "Compare features vs competitors with checkmarks.", priority: "medium", estimated_hours: 3 });
    }

    if (sections.includes("video") && hasVideo !== "no") {
      addTask({ title: "Embed video section", type: "code", description: "Video player with play button and thumbnail.", priority: "medium", estimated_hours: 2 });
    }

    if (sections.includes("stats")) {
      addTask({ title: "Build stats/numbers section", type: "code", description: "Animated counters for key metrics (users, ratings, etc.).", priority: "medium", estimated_hours: 3 });
    }

    if (sections.includes("final_cta")) {
      addTask({ title: "Build final CTA section", type: "code", description: "Strong closing CTA with urgency elements.", priority: "high", estimated_hours: 2 });
    }

    if (leadCapture !== "no") {
      addTask({ title: "Build lead capture form", type: "code", description: "Email collection with magnetic offer.", priority: "high", estimated_hours: 4 });
    }

    if (designStyle) {
      addTask({ title: `Apply ${designStyle} design style`, type: "design", description: `Custom styling for ${designStyle} aesthetic.`, priority: "medium", estimated_hours: 4 });
    }
  }

  // ═══════════════════════════════════════════
  // ONLINE SHOP SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "shop") {
    const shopType = answers.shop_type as string;
    const categories = (answers.product_categories as string) || "";
    const productCount = answers.product_count as string;
    const hasImages = answers.has_product_images as string;
    const hasDescriptions = answers.has_descriptions as string;
    const variants = (answers.product_variants as string[]) || [];
    const inventory = answers.inventory_tracking as string;
    const shopFeatures = (answers.shop_features as string[]) || [];
    const paymentMethods = (answers.payment_methods as string[]) || [];
    const orderNotifications = answers.order_notifications as string;
    const invoiceGen = answers.invoice_generation as string;
    const taxCalc = answers.tax_calculation as string;
    const shippingZones = answers.shipping_zones as string;
    const shippingCarriers = (answers.shipping_carriers as string[]) || [];
    const shippingRates = answers.shipping_rates as string;
    const returnPolicy = answers.return_policy as string;
    const customerAccounts = answers.customer_accounts as string;
    const abandonedCart = answers.abandoned_cart as string;
    const shopSeo = answers.shop_seo as string;
    const businessReg = (answers.business_reg as string) || "";

    addTask({ title: "Design product catalog and category structure", type: "design", description: `Categories: ${categories}. Layout for ${productCount} products.`, priority: "high", estimated_hours: 6 });

    // Product images
    if (hasImages === "stock") {
      addTask({ title: "Source product stock images", type: "design", description: "Find and license professional product photos.", priority: "medium", estimated_hours: 4 });
    } else if (hasImages === "provide") {
      addTask({ title: "Receive and organize product images from client", type: "content", description: "Collect images from client and organize for upload.", priority: "medium", estimated_hours: 3 });
    } else if (hasImages === "yes_edit") {
      addTask({ title: "Edit and resize product images", type: "design", description: "Process and optimize product photos for web.", priority: "medium", estimated_hours: 4 });
    }

    // Product descriptions
    if (hasDescriptions === "help") {
      addTask({ title: "Write SEO product descriptions", type: "content", description: "Create compelling product descriptions with keywords.", priority: "high", estimated_hours: 6 });
    } else if (hasDescriptions === "edit") {
      addTask({ title: "Edit existing product descriptions", type: "content", description: "Polish and optimize current product text.", priority: "medium", estimated_hours: 3 });
    }

    addTask({ title: "Build product listing page with filters", type: "code", description: `Grid view with category nav, ${shopFeatures.includes("filters") ? "filter sidebar" : "basic sorting"}.`, priority: "high", estimated_hours: 5 });

    addTask({ title: "Build product detail page with gallery", type: "code", description: `Image gallery, ${variants.length > 0 ? "variant selector" : "simple product info"}, add-to-cart.`, priority: "high", estimated_hours: 5 });

    // Variants
    if (variants.includes("size") || variants.includes("color")) {
      addTask({ title: "Build product variant selector", type: "code", description: `Variant options: ${variants.join(", ")}. Image switching on selection.`, priority: "high", estimated_hours: 5 });
    }

    // Inventory
    if (inventory === "yes") {
      addTask({ title: "Build inventory tracking system", type: "code", description: "Stock levels, low-stock alerts, backorder support.", priority: "high", estimated_hours: 5 });
    }

    // Shop features
    if (shopFeatures.includes("categories")) {
      addTask({ title: "Build category navigation system", type: "code", description: "Category sidebar, breadcrumbs, and filter pages.", priority: "high", estimated_hours: 4 });
    }
    if (shopFeatures.includes("filters")) {
      addTask({ title: "Build advanced product filters", type: "code", description: "Filter by size, color, price range, and attributes.", priority: "high", estimated_hours: 5 });
    }
    if (shopFeatures.includes("search")) {
      addTask({ title: "Build product search", type: "code", description: "Instant search with autocomplete and results highlighting.", priority: "high", estimated_hours: 4 });
    }
    if (shopFeatures.includes("reviews")) {
      addTask({ title: "Build product reviews and ratings", type: "code", description: "Star ratings, review form, and moderation.", priority: "medium", estimated_hours: 4 });
    }
    if (shopFeatures.includes("wishlist")) {
      addTask({ title: "Build wishlist/favorites", type: "code", description: "Save products for later with wishlist page.", priority: "medium", estimated_hours: 4 });
    }
    if (shopFeatures.includes("coupons")) {
      addTask({ title: "Build discount code system", type: "code", description: "Promo codes with percentage/fixed discounts.", priority: "medium", estimated_hours: 4 });
    }
    if (shopFeatures.includes("upselling")) {
      addTask({ title: "Build related products and upselling", type: "code", description: "'You might also like' and 'Frequently bought together'.", priority: "medium", estimated_hours: 3 });
    }
    if (shopFeatures.includes("recently_viewed")) {
      addTask({ title: "Build recently viewed products", type: "code", description: "Track and display recently viewed items.", priority: "low", estimated_hours: 3 });
    }
    if (shopFeatures.includes("comparison")) {
      addTask({ title: "Build product comparison feature", type: "code", description: "Compare features side by side.", priority: "low", estimated_hours: 4 });
    }
    if (shopFeatures.includes("back_in_stock")) {
      addTask({ title: "Build back-in-stock notifications", type: "code", description: "Email signup when out-of-stock items return.", priority: "medium", estimated_hours: 3 });
    }
    if (shopFeatures.includes("order_history")) {
      addTask({ title: "Build order history in account", type: "code", description: "View past orders with reorder capability.", priority: "medium", estimated_hours: 4 });
    }

    addTask({ title: "Build shopping cart", type: "code", description: "Cart with quantity management, persistence, and totals.", priority: "high", estimated_hours: 5 });
    addTask({ title: "Build checkout flow", type: "design", description: "Multi-step checkout: cart → address → payment → confirm.", priority: "high", estimated_hours: 6 });

    // Payments
    if (paymentMethods.includes("stripe")) {
      addTask({ title: "Integrate Stripe payment processing", type: "code", description: "Stripe checkout with cards and saved payment methods.", priority: "high", estimated_hours: 6 });
    }
    if (paymentMethods.includes("paypal")) {
      addTask({ title: "Integrate PayPal checkout", type: "code", description: "PayPal button and redirect payment flow.", priority: "medium", estimated_hours: 3 });
    }
    if (paymentMethods.includes("bank")) {
      addTask({ title: "Add SEPA bank transfer option", type: "code", description: "Bank transfer with manual fulfillment.", priority: "medium", estimated_hours: 3 });
    }
    if (paymentMethods.includes("klarna")) {
      addTask({ title: "Integrate Klarna buy-now-pay-later", type: "code", description: "Klarna payment installments.", priority: "medium", estimated_hours: 4 });
    }
    if (paymentMethods.includes("wallet")) {
      addTask({ title: "Add Apple Pay / Google Pay", type: "code", description: "Express checkout with digital wallets.", priority: "medium", estimated_hours: 3 });
    }
    if (paymentMethods.includes("invoice")) {
      addTask({ title: "Add invoice/pay later (B2B)", type: "code", description: "Invoice payment with terms for B2B customers.", priority: "medium", estimated_hours: 3 });
    }

    // Notifications
    if (orderNotifications === "both" || orderNotifications === "admin") {
      addTask({ title: "Set up order notification emails", type: "code", description: `Email to ${orderNotifications === "both" ? "customer + admin" : "admin only"} on order.`, priority: "high", estimated_hours: 3 });
    }

    // Invoice
    if (invoiceGen !== "no") {
      addTask({ title: `Set up ${invoiceGen === "yes_german" ? "German legal" : "standard"} invoice generation`, type: "code", description: "Auto-generate PDF invoices with invoice numbers.", priority: "high", estimated_hours: 5 });
    }

    // Tax
    if (taxCalc !== "none") {
      addTask({ title: "Configure tax calculation", type: "code", description: `${taxCalc === "de_vat" ? "German VAT (19%/7%)" : taxCalc === "eu_vat" ? "EU VAT by country" : "US sales tax"} calculation.`, priority: "high", estimated_hours: 4 });
    }

    // Shipping
    if (shippingZones !== "digital" && shippingZones !== "pickup") {
      addTask({ title: `Set up shipping for ${shippingZones}`, type: "code", description: `Shipping zones: ${shippingZones}. Carriers: ${shippingCarriers.join(", ") || "standard"}.`, priority: "high", estimated_hours: 5 });

      if (shippingRates === "flat") {
        addTask({ title: "Configure flat shipping rates", type: "code", description: "Single flat rate for all orders.", priority: "medium", estimated_hours: 2 });
      } else if (shippingRates === "weight") {
        addTask({ title: "Configure weight-based shipping rates", type: "code", description: "Rates by weight bands.", priority: "medium", estimated_hours: 3 });
      } else if (shippingRates === "value") {
        addTask({ title: "Configure value-based shipping (free over threshold)", type: "code", description: "Free shipping above order value threshold.", priority: "medium", estimated_hours: 3 });
      } else if (shippingRates === "realtime") {
        addTask({ title: "Integrate real-time carrier shipping rates", type: "code", description: "Live rates from carriers at checkout.", priority: "medium", estimated_hours: 5 });
      }
    }

    // Return policy
    if (returnPolicy !== "no_returns") {
      addTask({ title: "Create return/refund policy page", type: "content", description: `Policy: ${returnPolicy} days return window.`, priority: "medium", estimated_hours: 2 });
      addTask({ title: "Build return request flow", type: "code", description: "Customers can request returns online.", priority: "medium", estimated_hours: 4 });
    }

    // Customer accounts
    if (customerAccounts === "yes") {
      addTask({ title: "Build customer accounts with login", type: "code", description: "Registration, login, profile, and order history.", priority: "high", estimated_hours: 6 });
    } else {
      addTask({ title: "Configure guest checkout", type: "code", description: "Checkout without account creation.", priority: "high", estimated_hours: 3 });
    }

    // Abandoned cart
    if (abandonedCart === "yes") {
      addTask({ title: "Set up abandoned cart emails", type: "code", description: "Automated email reminders for abandoned carts.", priority: "medium", estimated_hours: 5 });
    }

    // SEO
    if (shopSeo === "yes") {
      addTask({ title: "Implement product SEO", type: "code", description: "Meta titles, descriptions, structured data per product.", priority: "high", estimated_hours: 5 });
    }

    // Business registration
    if (businessReg) {
      addTask({ title: "Add business registration to legal pages", type: "content", description: `Include: ${businessReg}`, priority: "low", estimated_hours: 1 });
    }
  }

  // ═══════════════════════════════════════════
  // BLOG SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "blog") {
    const blogType = answers.blog_type as string;
    const topics = (answers.blog_topics as string) || "";
    const existingArticles = answers.existing_articles as string;
    const workflow = answers.editorial_workflow as string;
    const blogFeatures = (answers.blog_features as string[]) || [];
    const authorCount = answers.author_count as string;
    const commentMod = answers.comment_moderation as string;

    addTask({ title: "Design blog layout and article template", type: "design", description: `Blog: ${blogType}. Topics: ${topics}. Responsive design.`, priority: "high", estimated_hours: 6 });

    addTask({ title: "Build blog listing page with pagination", type: "code", description: "Blog index with featured posts, card layout, and pagination.", priority: "high", estimated_hours: 5 });

    addTask({ title: "Build article page template", type: "code", description: "Article template with rich text, images, code blocks.", priority: "high", estimated_hours: 5 });

    // Articles migration
    if (existingArticles === "migrate") {
      addTask({ title: "Migrate existing articles from old platform", type: "content", description: "Transfer all blog posts to new CMS.", priority: "high", estimated_hours: 5 });
    } else if (existingArticles === "no") {
      addTask({ title: "Write initial set of blog articles", type: "content", description: "Create first batch of content for launch.", priority: "medium", estimated_hours: 6 });
    }

    // Features
    if (blogFeatures.includes("categories")) {
      addTask({ title: "Build category and tag system", type: "code", description: "Category pages, tag clouds, and filtering.", priority: "high", estimated_hours: 4 });
    }
    if (blogFeatures.includes("search")) {
      addTask({ title: "Build blog search", type: "code", description: "Search posts by title and content.", priority: "high", estimated_hours: 4 });
    }
    if (blogFeatures.includes("authors")) {
      addTask({ title: "Build author profile pages", type: "code", description: "Author pages with photo, bio, and article list.", priority: "medium", estimated_hours: 4 });
    }
    if (blogFeatures.includes("comments")) {
      addTask({ title: `Build comments (${commentMod} moderation)`, type: "code", description: commentMod === "moderated" ? "Comment form with admin approval" : "Open commenting system.", priority: "medium", estimated_hours: 5 });
    }
    if (blogFeatures.includes("newsletter")) {
      addTask({ title: "Add newsletter subscription", type: "code", description: "Email signup with provider integration.", priority: "medium", estimated_hours: 3 });
    }
    if (blogFeatures.includes("related")) {
      addTask({ title: "Build related posts section", type: "code", description: "Related articles based on categories/tags.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("reading")) {
      addTask({ title: "Add reading time and progress bar", type: "code", description: "Reading time estimate and scroll progress.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("sharing")) {
      addTask({ title: "Add social sharing buttons", type: "code", description: "Share to Twitter, LinkedIn, Facebook, copy link.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("seo")) {
      addTask({ title: "Implement article SEO", type: "code", description: "Meta descriptions, keywords, Article schema.", priority: "high", estimated_hours: 4 });
    }
    if (blogFeatures.includes("rss")) {
      addTask({ title: "Generate RSS/Atom feed", type: "code", description: "RSS feed for subscribers and feed readers.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("popular")) {
      addTask({ title: "Build popular posts widget", type: "code", description: "Most read posts sidebar widget.", priority: "low", estimated_hours: 3 });
    }
    if (blogFeatures.includes("archive")) {
      addTask({ title: "Build archive by date", type: "code", description: "Archive pages organized by year/month.", priority: "low", estimated_hours: 3 });
    }

    // Multi-author workflow
    if (authorCount !== "single" || workflow !== "solo") {
      addTask({ title: "Build editorial workflow system", type: "code", description: `${workflow === "solo" ? "Solo" : workflow === "review" ? "Draft → Review → Publish" : "Multi-author with editor"} workflow.`, priority: "high", estimated_hours: 6 });
    }
  }

  // ═══════════════════════════════════════════
  // WEB APPLICATION SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "webapp") {
    const appName = (answers.app_name as string) || "";
    const appPurpose = (answers.app_purpose as string) || "";
    const appType = answers.app_type as string;
    const primaryUsers = answers.primary_users as string;
    const userRoles = answers.user_roles as string;
    const authMethod = answers.auth_method as string;
    const dataEntities = (answers.data_entities as string[]) || [];
    const customEntity = answers.custom_entity as string;
    const fileUploads = (answers.file_uploads as string[]) || [];
    const realtime = answers.realtime_features as string;
    const emailNotifications = (answers.email_notifications as string[]) || [];
    const webhooksApi = answers.webhooks_api as string;
    const appFeatures = (answers.app_features as string[]) || [];
    const billing = answers.billing_needed as string;
    const mobileApp = answers.mobile_app as string;

    // Auth
    if (authMethod === "email" || authMethod === "both") {
      addTask({ title: "Build email/password authentication", type: "code", description: "Login, signup, password reset with secure hashing.", priority: "high", estimated_hours: 5 });
    }
    if (authMethod === "social" || authMethod === "both") {
      addTask({ title: "Integrate social login (Google, GitHub)", type: "code", description: "OAuth login flow for social providers.", priority: "high", estimated_hours: 4 });
    }
    if (authMethod === "sso") {
      addTask({ title: "Implement SSO (SAML/OIDC)", type: "code", description: "Enterprise single sign-on integration.", priority: "high", estimated_hours: 8 });
    }

    // Roles
    if (userRoles !== "none") {
      addTask({ title: `Build role-based access (${userRoles})`, type: "code", description: userRoles === "admin_user" ? "Admin + regular user roles with permissions" : "Multi-role system with custom permissions.", priority: "high", estimated_hours: 5 });
    }

    addTask({ title: "Build dashboard layout and navigation", type: "code", description: `Shell with sidebar, header, breadcrumbs for: ${appPurpose}`, priority: "high", estimated_hours: 5 });

    // Data entities → CRUD
    for (const entity of dataEntities) {
      const entityNames: Record<string, string> = {
        users: "Users/Contacts", projects: "Projects/Workspaces", tasks: "Tasks/Todos",
        orders: "Orders/Invoices", products: "Products/Catalog", content: "Content/Pages",
        files: "Files/Documents", messages: "Messages/Notifications", bookings: "Bookings/Reservations",
        leads: "Leads/Opportunities", subscriptions: "Subscriptions/Plans", reports: "Reports/Analytics",
      };
      const name = entityNames[entity] || entity;
      addTask({ title: `Build ${name} list view`, type: "code", description: `Data table with sorting, filtering, pagination for ${name}.`, priority: "high", estimated_hours: 5 });
      addTask({ title: `Build ${name} create/edit form`, type: "code", description: `Form with validation for ${name}.`, priority: "high", estimated_hours: 4 });
      addTask({ title: `Build ${name} detail view`, type: "code", description: `Single record view with all fields for ${name}.`, priority: "medium", estimated_hours: 3 });
    }

    // Custom entity
    if (customEntity && customEntity.trim()) {
      addTask({ title: `Build custom data module: ${customEntity}`, type: "code", description: "Custom CRUD for unique data needs.", priority: "high", estimated_hours: 6 });
    }

    // File uploads
    for (const uploadType of fileUploads) {
      const uploadLabel: Record<string, string> = { images: "image uploads", documents: "document uploads", large: "large file uploads" };
      if (uploadLabel[uploadType]) {
        addTask({ title: `Build ${uploadLabel[uploadType]}`, type: "code", description: "Drag-drop upload with progress and preview.", priority: "medium", estimated_hours: 5 });
      }
    }

    // Real-time
    if (realtime === "yes" || realtime === "chat") {
      addTask({ title: "Implement real-time updates (WebSockets)", type: "code", description: realtime === "chat" ? "Live chat/messaging system" : "Live data updates without page refresh.", priority: "high", estimated_hours: 8 });
    }

    // Email notifications
    for (const notification of emailNotifications) {
      const notifLabels: Record<string, string> = {
        welcome: "welcome emails", password: "password reset emails",
        updates: "task/project update emails", digest: "daily/weekly digest",
      };
      if (notifLabels[notification]) {
        addTask({ title: `Set up ${notifLabels[notification]}`, type: "code", description: "Email templates and sending logic.", priority: "medium", estimated_hours: 4 });
      }
    }

    // API
    if (webhooksApi === "api" || webhooksApi === "both") {
      addTask({ title: "Build REST API endpoints", type: "code", description: "API for external integrations.", priority: "high", estimated_hours: 8 });
    }
    if (webhooksApi === "webhooks" || webhooksApi === "both") {
      addTask({ title: "Set up webhooks for events", type: "code", description: "Webhook triggers for external services.", priority: "medium", estimated_hours: 5 });
    }

    // App features
    if (appFeatures.includes("charts")) {
      addTask({ title: "Build charts and data visualization", type: "code", description: "Dashboard widgets with line, bar, pie charts.", priority: "medium", estimated_hours: 6 });
    }
    if (appFeatures.includes("export")) {
      addTask({ title: "Add CSV/PDF export", type: "code", description: "Export data tables to CSV and PDF.", priority: "medium", estimated_hours: 4 });
    }
    if (appFeatures.includes("search")) {
      addTask({ title: "Implement full-text search", type: "code", description: "Global search with fuzzy matching.", priority: "medium", estimated_hours: 5 });
    }
    if (appFeatures.includes("dark_mode")) {
      addTask({ title: "Implement dark mode toggle", type: "code", description: "Theme switching with system preference detection.", priority: "low", estimated_hours: 3 });
    }
    if (appFeatures.includes("calendar")) {
      addTask({ title: "Build calendar/timeline view", type: "code", description: "Calendar with events and date navigation.", priority: "medium", estimated_hours: 6 });
    }
    if (appFeatures.includes("kanban")) {
      addTask({ title: "Build kanban board view", type: "code", description: "Drag-drop kanban for task management.", priority: "medium", estimated_hours: 6 });
    }
    if (appFeatures.includes("mobile")) {
      addTask({ title: "Optimize for mobile responsiveness", type: "code", description: "Touch-friendly mobile layout.", priority: "medium", estimated_hours: 5 });
    }
    if (appFeatures.includes("audit")) {
      addTask({ title: "Build audit log system", type: "code", description: "Track who changed what when.", priority: "medium", estimated_hours: 5 });
    }

    // Billing
    if (billing !== "no") {
      const billingLabels: Record<string, string> = { subscriptions: "monthly/yearly subscriptions", per_seat: "per-seat pricing", one_time: "one-time payments" };
      addTask({ title: `Set up ${billingLabels[billing]}`, type: "code", description: "Payment processing and subscription management.", priority: "high", estimated_hours: 8 });
    }

    // Mobile app
    if (mobileApp === "yes") {
      addTask({ title: "API design for future mobile app", type: "planning", description: "Ensure web app API supports mobile clients.", priority: "medium", estimated_hours: 3 });
    }
  }

  // ═══════════════════════════════════════════
  // PORTFOLIO SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "portfolio") {
    const portfolioType = answers.portfolio_type as string;
    const skills = (answers.portfolio_skills as string) || "";
    const projectCount = answers.project_count as string;
    const hasProjectImages = answers.has_project_images as string;
    const caseStudies = answers.case_studies as string;
    const portfolioFeatures = (answers.portfolio_features as string[]) || [];
    const testimonials = answers.testimonials as string;

    addTask({ title: "Design portfolio layout", type: "design", description: `${portfolioType} portfolio for showcasing work. Skills: ${skills}.`, priority: "high", estimated_hours: 6 });

    if (portfolioFeatures.includes("gallery") || portfolioFeatures.includes("case_studies")) {
      addTask({ title: "Build project gallery grid", type: "code", description: "Filterable project grid with hover effects.", priority: "high", estimated_hours: 5 });
    }

    if (portfolioFeatures.includes("case_studies")) {
      addTask({ title: "Build case study detail pages", type: "code", description: "Detailed project pages with challenge/solution/results.", priority: "high", estimated_hours: 6 });
      if (caseStudies === "no" || caseStudies === "help") {
        addTask({ title: "Write case study content", type: "content", description: "Create project stories with challenge, solution, results.", priority: "medium", estimated_hours: 6 });
      }
    }

    if (portfolioFeatures.includes("categories")) {
      addTask({ title: "Build category filtering", type: "code", description: "Filter projects by category/tag.", priority: "medium", estimated_hours: 3 });
    }

    if (portfolioFeatures.includes("about")) {
      addTask({ title: "Build about/bio section", type: "code", description: "Personal profile with bio and philosophy.", priority: "medium", estimated_hours: 4 });
    }

    if (portfolioFeatures.includes("skills")) {
      addTask({ title: "Build skills/services section", type: "code", description: `Skills: ${skills}`, priority: "medium", estimated_hours: 3 });
    }

    if (portfolioFeatures.includes("testimonials") && testimonials !== "no") {
      addTask({ title: "Build testimonials section", type: "code", description: "Client quotes with photos.", priority: "medium", estimated_hours: 3 });
    }

    if (portfolioFeatures.includes("contact")) {
      addTask({ title: "Build contact/hire form", type: "code", description: "Contact form with availability status.", priority: "high", estimated_hours: 4 });
    }

    if (portfolioFeatures.includes("resume")) {
      addTask({ title: "Add resume/CV download", type: "code", description: "PDF download and experience timeline.", priority: "low", estimated_hours: 2 });
    }

    if (portfolioFeatures.includes("social")) {
      addTask({ title: "Add social media links", type: "code", description: "Links to social profiles.", priority: "low", estimated_hours: 1 });
    }

    if (portfolioFeatures.includes("lightbox")) {
      addTask({ title: "Build image lightbox", type: "code", description: "Fullscreen image viewer.", priority: "medium", estimated_hours: 3 });
    }

    if (portfolioFeatures.includes("filters")) {
      addTask({ title: "Build filter by year/client", type: "code", description: "Date and client filters for projects.", priority: "low", estimated_hours: 2 });
    }

    // Images
    if (hasProjectImages === "placeholder") {
      addTask({ title: "Create placeholder project visuals", type: "design", description: "CSS-based project thumbnails until real images provided.", priority: "low", estimated_hours: 2 });
    } else if (hasProjectImages === "edit") {
      addTask({ title: "Edit project screenshots", type: "design", description: "Resize and enhance project images.", priority: "medium", estimated_hours: 4 });
    }
  }

  // ═══════════════════════════════════════════
  // REBUILD SPECIFIC
  // ═══════════════════════════════════════════

  if (type === "rebuild") {
    const sourceUrl = (answers.source_url as string) || "";
    const rebuildReasons = (answers.rebuild_reasons as string[]) || [];
    const whatWorks = (answers.what_works as string) || "";
    const whatDoesntWork = (answers.what_doesnt_work as string) || "";
    const cmsAccess = answers.cms_access as string;
    const contentToMigrate = (answers.content_to_migrate as string[]) || [];
    const preserveSeo = answers.preserve_seo as string;
    const currentTraffic = answers.current_traffic as string;
    const newFeatures = (answers.new_features as string[]) || [];
    const emailPreservation = answers.email_preservation as string;

    // Audit
    addTask({ title: `Audit existing site: ${sourceUrl}`, type: "planning", description: "Analyze structure, content, performance, SEO. Document findings.", priority: "high", estimated_hours: 4 });

    if (whatWorks) {
      addTask({ title: "Document what to keep from current site", type: "planning", description: `Keep: ${whatWorks}`, priority: "medium", estimated_hours: 2 });
    }

    if (whatDoesntWork) {
      addTask({ title: "Document issues to fix", type: "planning", description: `Fix: ${whatDoesntWork}`, priority: "medium", estimated_hours: 2 });
    }

    // Access
    if (cmsAccess === "partial" || cmsAccess === "no") {
      addTask({ title: "Assess content recovery options", type: "planning", description: "Determine what's accessible and how to migrate.", priority: "medium", estimated_hours: 2 });
    }

    // SEO preservation
    if (preserveSeo !== "no") {
      addTask({ title: "Map old URLs to new structure", type: "planning", description: preserveSeo === "yes" ? "Full URL mapping for all pages" : "Selective URL redirects for important pages.", priority: "high", estimated_hours: 3 });
      addTask({ title: "Implement 301 redirects", type: "code", description: "Set up redirects from old URLs to new pages.", priority: "high", estimated_hours: 3 });
    }

    // Migration
    if (contentToMigrate.includes("all") || contentToMigrate.includes("text")) {
      addTask({ title: "Migrate text content from old site", type: "content", description: "Transfer all text to new CMS/pages.", priority: "high", estimated_hours: 5 });
    }
    if (contentToMigrate.includes("all") || contentToMigrate.includes("images")) {
      addTask({ title: "Migrate images and media", type: "content", description: "Download and reformat images from old site.", priority: "medium", estimated_hours: 4 });
    }
    if (contentToMigrate.includes("blog")) {
      addTask({ title: "Migrate blog articles", type: "content", description: "Transfer articles with proper URL structure.", priority: "high", estimated_hours: 5 });
    }

    // Rebuild reasons → tasks
    if (rebuildReasons.includes("mobile")) {
      addTask({ title: "Implement mobile-first responsive design", type: "design", description: "Redesign with mobile-first approach. Test all breakpoints.", priority: "high", estimated_hours: 5 });
    }
    if (rebuildReasons.includes("performance")) {
      addTask({ title: "Optimize performance (Core Web Vitals)", type: "code", description: "Images, lazy loading, code splitting. Target 90+ Lighthouse.", priority: "high", estimated_hours: 5 });
    }
    if (rebuildReasons.includes("seo")) {
      addTask({ title: "Full SEO overhaul", type: "code", description: "Meta tags, structured data, sitemap, robots.txt, canonical URLs.", priority: "high", estimated_hours: 4 });
    }
    if (rebuildReasons.includes("security")) {
      addTask({ title: "Security hardening", type: "code", description: "HTTPS, CSP headers, input sanitization, dependency updates.", priority: "high", estimated_hours: 4 });
    }
    if (rebuildReasons.includes("maintenance") || rebuildReasons.includes("platform")) {
      addTask({ title: "Set up modern CMS for easy updates", type: "code", description: "Headless CMS or admin panel so non-technical staff can update content.", priority: "high", estimated_hours: 8 });
    }

    // Current traffic → SEO priority
    if (currentTraffic === "high") {
      addTask({ title: "Priority: preserve all SEO during rebuild", type: "planning", description: "High traffic site — any SEO loss is critical. Full URL mapping, 301 redirects, structured data preservation.", priority: "high", estimated_hours: 4 });
    } else if (currentTraffic === "medium") {
      addTask({ title: "Preserve key pages SEO during rebuild", type: "planning", description: "Medium traffic — map top 20 pages and set up redirects for important URLs.", priority: "high", estimated_hours: 3 });
    }

    // New features
    const featureMap: Record<string, Task> = {
      responsive: { title: "Mobile-first responsive redesign", type: "design", description: "Modern responsive design.", priority: "high", estimated_hours: 5 },
      contact_form: { title: "Build contact form", type: "code", description: "Form with validation and email.", priority: "high", estimated_hours: 4 },
      cms: { title: "Integrate CMS for content management", type: "code", description: "Admin panel for easy content updates.", priority: "high", estimated_hours: 8 },
      blog: { title: "Add blog/news section", type: "code", description: "Blog with listing and article pages.", priority: "medium", estimated_hours: 6 },
      shop: { title: "Add e-commerce functionality", type: "shop", description: "Product catalog, cart, checkout, payments.", priority: "high", estimated_hours: 12 },
      auth: { title: "Add user login and members area", type: "code", description: "Auth, profiles, members-only content.", priority: "high", estimated_hours: 6 },
      social: { title: "Add social media integration", type: "code", description: "Social feeds, share buttons, profile links.", priority: "low", estimated_hours: 3 },
      i18n: { title: "Add multilingual support", type: "code", description: "Language switching and translations.", priority: "medium", estimated_hours: 6 },
      analytics: { title: "Set up analytics", type: "code", description: "Plausible/GA integration with events.", priority: "low", estimated_hours: 3 },
      seo: { title: "Implement SEO improvements", type: "code", description: "Meta tags, structured data, sitemap.", priority: "medium", estimated_hours: 4 },
      performance: { title: "Performance optimization", type: "code", description: "Speed improvements and Core Web Vitals.", priority: "medium", estimated_hours: 5 },
      gdpr: { title: "GDPR / Cookie compliance", type: "code", description: "Cookie banner, privacy policy, data handling.", priority: "high", estimated_hours: 4 },
    };

    for (const feature of newFeatures) {
      if (featureMap[feature]) addTask(featureMap[feature]);
    }

    // Email preservation
    if (emailPreservation === "yes") {
      addTask({ title: "Configure email for domain", type: "deploy", description: "Set up email accounts and DNS for domain.", priority: "high", estimated_hours: 2 });
    }

    // Redirects + DNS
    addTask({ title: "Set up redirects and update DNS", type: "deploy", description: `Deploy new site and set up ${preserveSeo !== "no" ? "301 redirects from old URLs" : "DNS"}.`, priority: "high", estimated_hours: 3 });
  }

  // ─── DESCRIPTION ───

  const typeLabels: Record<string, string> = {
    homepage: "homepage", landing: "landing page", shop: "online shop",
    blog: "blog", webapp: "web application", portfolio: "portfolio", rebuild: "website rebuild",
  };

  const baseDesc = brandName
    ? `Brand: ${brandName}. ${typeLabels[type] || type} with ${tasks.length} tasks.`
    : `${typeLabels[type] || type} with ${tasks.length} tasks.`;

  return {
    project_name: projectName,
    description: baseDesc,
    tasks,
  };
}

// ─── API ROUTES ───

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, session, stepId, answer } = body;

    if (action === "start") {
      const newSession: WizardSession = { answers: {}, status: "discovering" };
      return NextResponse.json({ session: newSession });
    }

    if (action === "answer" && session) {
      const currentSession = session as WizardSession;
      if (stepId) currentSession.answers[stepId] = answer;
      return NextResponse.json({ session: currentSession });
    }

    if (action === "generate" && session) {
      const currentSession = session as WizardSession;
      currentSession.status = "plan_generated";
      currentSession.plan = generatePlan(currentSession.answers);
      return NextResponse.json({ session: currentSession, plan: currentSession.plan });
    }

    if (action === "approve" && session && session.plan) {
      const currentSession = session as WizardSession;
      const plan = currentSession.plan!;

      const token = await getAdminToken();
      const project = await apiCall("/api/collections/projects/records", {
        method: "POST",
        token,
        body: { name: plan.project_name, description: plan.description, status: "active", progress: 0 },
      });

      const createdTasks = [];
      const taskAssignments = { assigned: 0, unassigned: 0 };

      for (const task of plan.tasks) {
        const created = await apiCall("/api/collections/tasks/records", {
          method: "POST",
          token,
          body: { title: task.title, description: task.description, type: task.type, status: "todo", priority: task.priority, project: project.id },
        });
        createdTasks.push(created);

        // Auto-assign the task
        try {
          const assignResult = await autoAssignTask(created.id as string, task.type);
          if (assignResult.assigned) {
            taskAssignments.assigned++;
          } else {
            taskAssignments.unassigned++;
          }
        } catch (e) {
          console.error("Auto-assign failed for task", created.id, e);
          taskAssignments.unassigned++;
        }
      }

      currentSession.status = "approved";
      return NextResponse.json({ project, tasks: createdTasks, assignments: taskAssignments, session: currentSession });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Planning API error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}