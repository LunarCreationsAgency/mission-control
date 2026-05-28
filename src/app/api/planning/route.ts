import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── BRANCHING ONBOARDING WIZARD API ───
// Step 1 picks project type → remaining steps are type-specific.
// The steps definition is on the client side; this API just stores answers + generates plans.

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

// ─── TASK GENERATION ───

function generatePlan(answers: Record<string, unknown>) {
  const type = (answers.project_type as string) || "homepage";
  const projectName = (answers.project_name as string) || "New Project";

  const tasks: NonNullable<WizardSession["plan"]>["tasks"] = [];

  // ─── COMMON: Foundation ───
  if (type === "rebuild") {
    const sourceUrl = (answers.source_url as string) || "current site";
    tasks.push({
      title: `Audit existing site: ${sourceUrl}`,
      type: "planning",
      description: "Analyze current site structure, content, performance, and SEO. Document what to keep, change, and remove.",
      priority: "high",
      estimated_hours: 4,
    });
    const keepContent = (answers.keep_content as string[]) || [];
    if (keepContent.includes("urls")) {
      tasks.push({
        title: "Create URL mapping and 301 redirect strategy",
        type: "planning",
        description: "Map every old URL to the new structure. Set up 301 redirects to preserve SEO rankings.",
        priority: "high",
        estimated_hours: 3,
      });
    }
    if (keepContent.includes("content")) {
      tasks.push({
        title: "Migrate existing content to new site",
        type: "content",
        description: "Transfer all text, images, and media from the old site. Reformat and optimize for the new design.",
        priority: "high",
        estimated_hours: 5,
      });
    }
  } else {
    tasks.push({
      title: "Define project scope and requirements",
      type: "planning",
      description: "Document all features, pages, and functionality. Define success metrics and confirm scope.",
      priority: "high",
      estimated_hours: 3,
    });
  }

  tasks.push({
    title: "Set up Next.js project with TypeScript and Tailwind",
    type: "code",
    description: "Initialize repo with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. Configure linting, formatting, and Git.",
    priority: "high",
    estimated_hours: 2,
  });

  tasks.push({
    title: "Create design system and component library",
    type: "design",
    description: "Define color palette, typography scale, spacing system, and reusable components.",
    priority: "high",
    estimated_hours: 5,
  });

  // ─── HOMEPAGE ───
  if (type === "homepage") {
    const sections = (answers.sections as string[]) || [];
    if (sections.includes("hero")) {
      tasks.push({ title: "Build hero section with headline and CTA", type: "design", description: "Create compelling above-the-fold section with headline, subtext, and primary call-to-action.", priority: "high", estimated_hours: 4 });
    }
    if (sections.includes("about")) {
      tasks.push({ title: "Build About Us section", type: "code", description: "Create about section with story, values, and key information.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("services")) {
      tasks.push({ title: "Build services/offerings section", type: "code", description: "Create grid of service cards with icons, titles, and descriptions.", priority: "high", estimated_hours: 3 });
    }
    if (sections.includes("team")) {
      tasks.push({ title: "Build team/staff section with photos", type: "code", description: "Create team grid with photos, names, roles, and short bios.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("testimonials")) {
      tasks.push({ title: "Build testimonials/reviews section", type: "code", description: "Add client testimonials, reviews, or quotes for credibility.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("gallery")) {
      tasks.push({ title: "Build photo gallery with lightbox", type: "code", description: "Create responsive image gallery with click-to-enlarge lightbox.", priority: "medium", estimated_hours: 4 });
    }
    if (sections.includes("faq")) {
      tasks.push({ title: "Build FAQ accordion section", type: "code", description: "Create expandable FAQ section with animated accordion.", priority: "low", estimated_hours: 2 });
    }
    if (sections.includes("contact")) {
      tasks.push({ title: "Build contact section with map and hours", type: "code", description: "Create contact section with Google Maps embed, opening hours, and address.", priority: "high", estimated_hours: 4 });
    }
    if (sections.includes("news")) {
      tasks.push({ title: "Build news/updates section", type: "code", description: "Create latest news feed with dates and preview cards.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("partners")) {
      tasks.push({ title: "Build partner logos section", type: "code", description: "Create logo grid or carousel for partner/client logos.", priority: "low", estimated_hours: 2 });
    }
  }

  // ─── LANDING PAGE ───
  if (type === "landing") {
    const sections = (answers.sections as string[]) || [];
    const goal = (answers.conversion_goal as string) || "signup";
    tasks.push({ title: `Build hero section optimized for ${goal}`, type: "design", description: `Create high-converting hero with headline, subtext, and CTA focused on ${goal}.`, priority: "high", estimated_hours: 4 });
    if (sections.includes("benefits")) {
      tasks.push({ title: "Build benefits/features section", type: "code", description: "Create compelling benefit cards highlighting key value propositions.", priority: "high", estimated_hours: 3 });
    }
    if (sections.includes("testimonials")) {
      tasks.push({ title: "Build social proof section", type: "code", description: "Add testimonials, logos, or stats to build trust and credibility.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("pricing")) {
      tasks.push({ title: "Build pricing table", type: "code", description: "Create clear pricing tiers with feature comparison.", priority: "high", estimated_hours: 4 });
    }
    if (sections.includes("faq")) {
      tasks.push({ title: "Build FAQ section to overcome objections", type: "code", description: "Create FAQ addressing common buyer hesitations.", priority: "medium", estimated_hours: 2 });
    }
    if (sections.includes("comparison")) {
      tasks.push({ title: "Build competitor comparison section", type: "code", description: "Create comparison table showing advantages over alternatives.", priority: "medium", estimated_hours: 3 });
    }
    if (sections.includes("video")) {
      tasks.push({ title: "Build video/demo embed section", type: "code", description: "Add video section with embedded demo or explainer.", priority: "medium", estimated_hours: 2 });
    }
    if (sections.includes("final_cta")) {
      tasks.push({ title: "Build final CTA section", type: "code", description: "Create strong closing CTA section with urgency elements.", priority: "high", estimated_hours: 2 });
    }
  }

  // ─── SHOP ───
  if (type === "shop") {
    const shopFeatures = (answers.shop_features as string[]) || [];
    const payment = (answers.payment as string[]) || [];
    const shipping = (answers.shipping as string) || "none";

    tasks.push({ title: "Design product catalog layout", type: "design", description: "Create browseable product grid with clean layout and visual hierarchy.", priority: "high", estimated_hours: 5 });
    tasks.push({ title: "Build product detail pages with image gallery", type: "code", description: "Implement product pages with image carousel, pricing, and add-to-cart.", priority: "high", estimated_hours: 5 });

    if (shopFeatures.includes("categories")) {
      tasks.push({ title: "Build product category navigation", type: "code", description: "Create category sidebar, breadcrumbs, and category pages.", priority: "high", estimated_hours: 4 });
    }
    if (shopFeatures.includes("filters")) {
      tasks.push({ title: "Build product filters and search", type: "code", description: "Implement price range, attribute filters, and full-text search.", priority: "high", estimated_hours: 5 });
    }
    if (shopFeatures.includes("variants")) {
      tasks.push({ title: "Build product variant selector (size, color)", type: "code", description: "Create variant picker with image switching and stock display.", priority: "high", estimated_hours: 4 });
    }
    if (shopFeatures.includes("reviews")) {
      tasks.push({ title: "Build product reviews and ratings", type: "code", description: "Add star ratings, review form, and review display.", priority: "medium", estimated_hours: 4 });
    }
    if (shopFeatures.includes("wishlist")) {
      tasks.push({ title: "Build wishlist/favorites feature", type: "code", description: "Create save-for-later functionality with wishlist page.", priority: "low", estimated_hours: 3 });
    }
    if (shopFeatures.includes("coupons")) {
      tasks.push({ title: "Build discount code system", type: "code", description: "Implement promo code input, validation, and discount calculation.", priority: "medium", estimated_hours: 4 });
    }
    if (shopFeatures.includes("upselling")) {
      tasks.push({ title: "Build related products and upselling", type: "code", description: "Add 'You might also like' and 'Frequently bought together' sections.", priority: "medium", estimated_hours: 3 });
    }
    if (shopFeatures.includes("inventory")) {
      tasks.push({ title: "Build inventory tracking system", type: "code", description: "Create stock management with low-stock alerts and backorder support.", priority: "medium", estimated_hours: 5 });
    }
    if (shopFeatures.includes("account")) {
      tasks.push({ title: "Build customer accounts with order history", type: "code", description: "Create login, profile, and order history pages.", priority: "high", estimated_hours: 5 });
    }

    tasks.push({ title: "Build shopping cart with quantity management", type: "code", description: "Create cart drawer/page with add, remove, update quantity, and persistence.", priority: "high", estimated_hours: 4 });
    tasks.push({ title: "Build checkout flow (address, review, confirm)", type: "design", description: "Create multi-step checkout with shipping address, order review, and confirmation.", priority: "high", estimated_hours: 5 });

    if (payment.includes("stripe")) {
      tasks.push({ title: "Integrate Stripe payment processing", type: "code", description: "Set up Stripe checkout sessions, payment intents, and webhook handling.", priority: "high", estimated_hours: 5 });
    }
    if (payment.includes("paypal")) {
      tasks.push({ title: "Integrate PayPal checkout", type: "code", description: "Add PayPal as alternative payment method.", priority: "medium", estimated_hours: 3 });
    }
    if (payment.includes("bank")) {
      tasks.push({ title: "Add bank transfer / invoice payment option", type: "code", description: "Add manual payment with invoice generation for bank transfers.", priority: "medium", estimated_hours: 3 });
    }
    if (payment.includes("klarna")) {
      tasks.push({ title: "Integrate Klarna buy-now-pay-later", type: "code", description: "Add Klarna as payment option for installment payments.", priority: "medium", estimated_hours: 3 });
    }

    if (shipping === "domestic" || shipping === "international") {
      tasks.push({ title: "Build shipping calculator and options", type: "code", description: `Create shipping zone config, rate calculation, and delivery estimates.${shipping === "international" ? " Include international zones and customs." : ""}`, priority: "high", estimated_hours: 4 });
    }
  }

  // ─── BLOG ───
  if (type === "blog") {
    const blogFeatures = (answers.blog_features as string[]) || [];
    const authors = (answers.authors as string) || "single";

    tasks.push({ title: "Build blog listing page with pagination", type: "code", description: "Create blog index with featured posts, card layout, and pagination.", priority: "high", estimated_hours: 4 });
    tasks.push({ title: "Build article page with rich content layout", type: "code", description: "Create article template with headings, images, code blocks, and embeds.", priority: "high", estimated_hours: 5 });

    if (blogFeatures.includes("categories")) {
      tasks.push({ title: "Build category and tag system", type: "code", description: "Create category pages, tag clouds, and filtering.", priority: "high", estimated_hours: 3 });
    }
    if (blogFeatures.includes("search")) {
      tasks.push({ title: "Build full-text search", type: "code", description: "Implement search with instant results and highlighting.", priority: "medium", estimated_hours: 4 });
    }
    if (blogFeatures.includes("authors")) {
      tasks.push({ title: "Build author profile pages", type: "code", description: "Create author pages with photo, bio, and article list.", priority: "medium", estimated_hours: 3 });
    }
    if (blogFeatures.includes("comments")) {
      tasks.push({ title: "Build comments/discussion system", type: "code", description: "Add comment form, threading, and moderation.", priority: "medium", estimated_hours: 5 });
    }
    if (blogFeatures.includes("newsletter")) {
      tasks.push({ title: "Build newsletter subscription", type: "code", description: "Create signup form and integrate with email service (Mailchimp, ConvertKit).", priority: "medium", estimated_hours: 3 });
    }
    if (blogFeatures.includes("related")) {
      tasks.push({ title: "Build related posts section", type: "code", description: "Add related article suggestions based on categories/tags.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("reading")) {
      tasks.push({ title: "Add reading time and progress bar", type: "code", description: "Calculate reading time and add scroll progress indicator.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("sharing")) {
      tasks.push({ title: "Add social sharing buttons", type: "code", description: "Add share to Twitter, LinkedIn, Facebook, and copy link.", priority: "low", estimated_hours: 2 });
    }
    if (blogFeatures.includes("seo")) {
      tasks.push({ title: "Implement blog SEO (schema, OG tags, sitemap)", type: "code", description: "Add Article schema markup, Open Graph tags, and blog sitemap.", priority: "high", estimated_hours: 3 });
    }
    if (blogFeatures.includes("rss")) {
      tasks.push({ title: "Generate RSS/Atom feed", type: "code", description: "Create RSS feed for subscribers and feed readers.", priority: "low", estimated_hours: 2 });
    }

    if (authors !== "single") {
      tasks.push({ title: "Build multi-author CMS with roles", type: "code", description: "Create admin interface for managing authors, drafts, and publishing workflow.", priority: "high", estimated_hours: 5 });
    }
  }

  // ─── WEBAPP ───
  if (type === "webapp") {
    const auth = (answers.auth as string) || "none";
    const roles = (answers.roles as string) || "none";
    const dataEntities = (answers.data_entities as string[]) || [];
    const webappFeatures = (answers.webapp_features as string[]) || [];

    if (auth !== "none") {
      tasks.push({ title: `Implement authentication (${auth === "both" ? "email + social" : auth})`, type: "code", description: `Build login, signup, password reset${auth === "social" || auth === "both" ? ", and OAuth providers (Google, GitHub)" : ""}.`, priority: "high", estimated_hours: 5 });
    }
    if (roles !== "none") {
      tasks.push({ title: `Implement role-based access control (${roles === "multi" ? "multiple roles" : "admin + user"})`, type: "code", description: "Create role middleware, permission checks, and admin/user views.", priority: "high", estimated_hours: 4 });
    }

    tasks.push({ title: "Build main dashboard layout and navigation", type: "code", description: "Create responsive dashboard shell with sidebar, header, and content area.", priority: "high", estimated_hours: 4 });

    for (const entity of dataEntities) {
      const entityNames: Record<string, string> = { users: "Users/Contacts", products: "Products/Items", orders: "Orders/Transactions", content: "Content/Articles", files: "Files/Media", messages: "Messages/Notifications", tasks: "Tasks/Projects", custom: "Custom Data" };
      tasks.push({ title: `Build CRUD for ${entityNames[entity] || entity}`, type: "code", description: `Create list, create, edit, and delete views for ${entityNames[entity] || entity}. Include validation and error handling.`, priority: "high", estimated_hours: 5 });
      tasks.push({ title: `Build data table for ${entityNames[entity] || entity} with sorting/filtering`, type: "code", description: `Implement sortable, filterable data table with pagination and search for ${entityNames[entity] || entity}.`, priority: "high", estimated_hours: 4 });
    }

    if (webappFeatures.includes("realtime")) {
      tasks.push({ title: "Implement real-time updates with WebSockets", type: "code", description: "Add live data updates using WebSocket connections.", priority: "high", estimated_hours: 5 });
    }
    if (webappFeatures.includes("charts")) {
      tasks.push({ title: "Build charts and data visualization dashboard", type: "code", description: "Create dashboard widgets with charts (line, bar, pie) for key metrics.", priority: "medium", estimated_hours: 5 });
    }
    if (webappFeatures.includes("upload")) {
      tasks.push({ title: "Build file upload with drag-and-drop", type: "code", description: "Create file upload zone with drag-drop, progress bar, and preview.", priority: "medium", estimated_hours: 4 });
    }
    if (webappFeatures.includes("email")) {
      tasks.push({ title: "Set up email notification system", type: "code", description: "Configure transactional emails with templates (welcome, notification, digest).", priority: "medium", estimated_hours: 4 });
    }
    if (webappFeatures.includes("api")) {
      tasks.push({ title: "Build API with webhook support", type: "code", description: "Create REST API endpoints and webhook configuration for integrations.", priority: "medium", estimated_hours: 5 });
    }
    if (webappFeatures.includes("export")) {
      tasks.push({ title: "Add CSV/PDF export functionality", type: "code", description: "Implement data export for all tables to CSV and PDF formats.", priority: "low", estimated_hours: 3 });
    }
    if (webappFeatures.includes("search")) {
      tasks.push({ title: "Implement full-text search across all data", type: "code", description: "Add global search with fuzzy matching and instant results.", priority: "medium", estimated_hours: 4 });
    }
    if (webappFeatures.includes("dark_mode")) {
      tasks.push({ title: "Implement dark mode toggle with persistence", type: "code", description: "Add theme switching with system preference detection and localStorage.", priority: "low", estimated_hours: 2 });
    }
  }

  // ─── PORTFOLIO ───
  if (type === "portfolio") {
    const portfolioFeatures = (answers.portfolio_features as string[]) || [];

    if (portfolioFeatures.includes("gallery")) {
      tasks.push({ title: "Build project gallery with filtering", type: "code", description: "Create filterable project grid with hover effects and category buttons.", priority: "high", estimated_hours: 5 });
    }
    if (portfolioFeatures.includes("case_studies")) {
      tasks.push({ title: "Build case study detail pages", type: "code", description: "Create detailed project pages with challenge, solution, and results.", priority: "high", estimated_hours: 5 });
    }
    if (portfolioFeatures.includes("categories")) {
      tasks.push({ title: "Build category filtering system", type: "code", description: "Add category tags and filter buttons for project types.", priority: "medium", estimated_hours: 2 });
    }
    if (portfolioFeatures.includes("about")) {
      tasks.push({ title: "Build about/bio section", type: "code", description: "Create personal profile with bio, philosophy, and background story.", priority: "medium", estimated_hours: 3 });
    }
    if (portfolioFeatures.includes("skills")) {
      tasks.push({ title: "Build skills/services section", type: "code", description: "Create skills grid or service cards with proficiency indicators.", priority: "medium", estimated_hours: 3 });
    }
    if (portfolioFeatures.includes("testimonials")) {
      tasks.push({ title: "Build client testimonials section", type: "code", description: "Add client quotes and project success stories.", priority: "medium", estimated_hours: 2 });
    }
    if (portfolioFeatures.includes("contact")) {
      tasks.push({ title: "Build contact/hire me section with form", type: "code", description: "Create contact form with availability status and call-to-action.", priority: "high", estimated_hours: 3 });
    }
    if (portfolioFeatures.includes("resume")) {
      tasks.push({ title: "Add resume/CV download", type: "code", description: "Add PDF download button and experience timeline.", priority: "low", estimated_hours: 2 });
    }
  }

  // ─── REBUILD extras ───
  if (type === "rebuild") {
    const rebuildReasons = (answers.rebuild_reason as string[]) || [];
    const newFeatures = (answers.new_features as string[]) || [];

    if (rebuildReasons.includes("mobile")) {
      tasks.push({ title: "Implement mobile-first responsive design", type: "design", description: "Redesign with mobile-first approach. Test on all breakpoints.", priority: "high", estimated_hours: 4 });
    }
    if (rebuildReasons.includes("performance")) {
      tasks.push({ title: "Optimize performance and Core Web Vitals", type: "code", description: "Optimize images, lazy loading, code splitting. Target 90+ Lighthouse.", priority: "high", estimated_hours: 4 });
    }
    if (rebuildReasons.includes("seo")) {
      tasks.push({ title: "Implement SEO best practices", type: "code", description: "Add meta tags, structured data, sitemap, robots.txt, and canonical URLs.", priority: "high", estimated_hours: 3 });
    }
    if (rebuildReasons.includes("maintenance")) {
      tasks.push({ title: "Set up CMS for easy content management", type: "code", description: "Integrate headless CMS (Sanity/Contentful) so team can edit content independently.", priority: "high", estimated_hours: 5 });
    }
    for (const feat of newFeatures) {
      const featTasks: Record<string, { title: string; type: string; description: string; priority: string; estimated_hours: number }> = {
        contact_form: { title: "Add contact form", type: "code", description: "Create contact form with validation and email integration.", priority: "medium", estimated_hours: 3 },
        cms: { title: "Integrate CMS for content editing", type: "code", description: "Connect headless CMS so non-technical staff can update content.", priority: "high", estimated_hours: 5 },
        blog: { title: "Add blog/news section", type: "code", description: "Create blog section with listing, detail, and category pages.", priority: "medium", estimated_hours: 5 },
        shop: { title: "Add e-commerce functionality", type: "shop", description: "Build product catalog, cart, checkout, and payment integration.", priority: "high", estimated_hours: 10 },
        auth: { title: "Add user login and members area", type: "code", description: "Build authentication, user profiles, and members-only content.", priority: "high", estimated_hours: 5 },
        social: { title: "Add social media integration", type: "code", description: "Add social feeds, share buttons, and profile links.", priority: "low", estimated_hours: 2 },
        i18n: { title: "Add multilingual support", type: "code", description: "Implement language switching and translation management.", priority: "medium", estimated_hours: 4 },
        analytics: { title: "Set up analytics and tracking", type: "code", description: "Integrate analytics (Plausible/Google Analytics) with event tracking.", priority: "low", estimated_hours: 2 },
      };
      if (featTasks[feat]) {
        tasks.push(featTasks[feat]);
      }
    }
  }

  // ─── COMMON: Navigation + Footer + Content + Polish + Deploy ───
  tasks.push({ title: "Build responsive navigation with mobile menu", type: "code", description: "Create sticky navbar with logo, links, and hamburger menu for mobile.", priority: "high", estimated_hours: 3 });
  tasks.push({ title: "Build footer with links and social media", type: "code", description: "Create footer with sitemap links, social icons, and copyright.", priority: "low", estimated_hours: 2 });
  tasks.push({ title: "Write and integrate all page content", type: "content", description: "Write headlines, body copy, CTAs, and meta descriptions. Ensure consistent tone.", priority: "medium", estimated_hours: 4 });
  tasks.push({ title: "Add scroll animations and micro-interactions", type: "code", description: "Implement fade-in animations, hover effects, and page transitions.", priority: "low", estimated_hours: 4 });
  tasks.push({ title: "Test across devices and browsers", type: "code", description: "Verify responsive behavior on mobile, tablet, desktop. Test Chrome, Safari, Firefox.", priority: "high", estimated_hours: 3 });
  tasks.push({ title: "Configure SEO, Open Graph, and analytics", type: "code", description: "Add meta tags, structured data, sitemap, robots.txt.", priority: "medium", estimated_hours: 2 });
  tasks.push({ title: "Deploy to production and verify", type: "deploy", description: "Deploy to Vercel, verify all routes, test forms and interactions.", priority: "high", estimated_hours: 2 });

  if (type === "rebuild") {
    const sourceUrl = (answers.source_url as string) || "";
    if (sourceUrl) {
      tasks.push({ title: "Implement 301 redirects and update DNS", type: "deploy", description: `Set up redirects from ${sourceUrl} paths. Update DNS and verify SSL.`, priority: "high", estimated_hours: 2 });
    }
  }

  // Build description
  const typeLabels: Record<string, string> = { homepage: "homepage", landing: "landing page", shop: "online shop", blog: "blog", webapp: "web application", portfolio: "portfolio", rebuild: "website rebuild" };
  const description = type === "rebuild"
    ? `Complete rebuild of ${(answers.source_url as string) || "existing site"}${(answers.rebuild_reason as string[])?.length ? ` — reasons: ${(answers.rebuild_reason as string[]).join(", ")}` : ""}.`
    : `A ${typeLabels[type] || type} with ${tasks.length} tasks covering design, development, content, and deployment.`;

  return { project_name: projectName, description, tasks };
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
      for (const task of plan.tasks) {
        const created = await apiCall("/api/collections/tasks/records", {
          method: "POST",
          token,
          body: { title: task.title, description: task.description, type: task.type, status: "todo", priority: task.priority, project: project.id },
        });
        createdTasks.push(created);
      }

      currentSession.status = "approved";
      return NextResponse.json({ project, tasks: createdTasks, session: currentSession });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Planning API error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}