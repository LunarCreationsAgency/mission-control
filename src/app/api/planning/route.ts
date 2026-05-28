import { NextResponse } from "next/server";
import { callGeminiAI } from "@/lib/gemini-planning";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory sessions
const sessions = new Map<string, PlanningSession>();

interface PlanningSession {
  id: string;
  messages: Array<{ role: "user" | "assistant"; text: string; timestamp: string }>;
  extracted: ExtractedInfo;
  status: "discovering" | "ready_to_plan" | "plan_generated" | "approved";
  plan?: ProjectPlan;
  created: string;
  updated: string;
}

interface ExtractedInfo {
  project_type?: string;
  project_name?: string;
  audience?: string;
  purpose?: string;
  design_style?: string;
  features?: string[];
  timeline?: string;
  budget?: number;
  source_url?: string;
  has_auth?: boolean;
  has_payment?: boolean;
  has_blog?: boolean;
  has_contact?: boolean;
  domain?: string;
  competitor?: string;
}

interface ProjectPlan {
  project_name: string;
  description: string;
  tasks: Array<{
    title: string;
    type: string;
    description: string;
    priority: string;
    estimated_hours: number;
  }>;
}

// ─── PROJECT TYPE DETECTION ───

const PROJECT_TYPES = [
  { keywords: ["homepage", "home page", "front page", "start page", "landing"], type: "homepage", name: "Homepage" },
  { keywords: ["landing page", "single page", "one page", "sales page", "squeeze page"], type: "landing", name: "Landing Page" },
  { keywords: ["shop", "store", "ecommerce", "e-commerce", "online shop", "product", "selling", "cart", "checkout"], type: "shop", name: "Online Shop" },
  { keywords: ["blog", "article", "posts", "content", "news", "magazine"], type: "blog", name: "Blog" },
  { keywords: ["webapp", "web app", "application", "dashboard", "portal", "tool", "saas", "platform"], type: "webapp", name: "Web Application" },
  { keywords: ["portfolio", "showcase", "gallery", "work", "projects"], type: "portfolio", name: "Portfolio" },
  { keywords: ["rebuild", "redesign", "update", "refresh", "revamp", "migrate", "modernize", "recreate", "make new", "new version", "overhaul", "looks old", "very old", "outdated"], type: "rebuild", name: "Rebuild" },
];

function detectProjectType(text: string): { type: string; name: string } | null {
  const lower = text.toLowerCase();
  for (const pt of PROJECT_TYPES) {
    for (const kw of pt.keywords) {
      if (lower.includes(kw)) {
        return { type: pt.type, name: pt.name };
      }
    }
  }
  return null;
}

// ─── SMART EXTRACTION ───

function extractInfo(text: string, current: ExtractedInfo): Partial<ExtractedInfo> {
  const lower = text.toLowerCase();
  const extracted: Partial<ExtractedInfo> = {};

  // URL detection
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    extracted.source_url = urlMatch[0];
    try {
      extracted.domain = new URL(urlMatch[0]).hostname.replace(/^www\./, "");
    } catch {}
  }

  // Organization/audience detection (e.g., "my club", "Prenzlauer Carnevalclub")
  const orgMatch = text.match(/(?:my|our|the)\s+([A-Z][A-Za-z\s]+(?:club|e\.V\.|org|association|team|company|business))/);
  if (orgMatch && !current.audience) {
    extracted.audience = orgMatch[1].trim();
  }

  // Budget detection
  const budgetMatch = text.match(/(?:budget|cost|price|spend)[\s:]*(?:€|$|EUR)?\s*(\d[\d\s,.]*(?:k)?)/i);
  if (budgetMatch) {
    let budget = budgetMatch[1].replace(/[\s,]/g, "");
    if (budget.endsWith("k")) budget = String(parseInt(budget) * 1000);
    extracted.budget = parseInt(budget);
  }

  // Timeline detection
  const timeMatch = text.match(/(\d+\s*(?:day|week|month|year)s?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})/i);
  if (timeMatch) {
    extracted.timeline = timeMatch[0];
  }

  // Audience detection
  if (lower.includes("for ") || lower.includes("target") || lower.includes("audience")) {
    const audienceMatch = text.match(/(?:for|target|audience)\s+([^,.]+)/i);
    if (audienceMatch) extracted.audience = audienceMatch[1].trim();
  }

  // Purpose detection
  if (lower.includes("modern") || lower.includes("modernize") || lower.includes("make new")) {
    extracted.purpose = "modernize design and improve user experience";
  }
  if (lower.includes("seo")) {
    extracted.purpose = (extracted.purpose || current.purpose || "") + " improve SEO";
  }
  if (lower.includes("ux") || lower.includes("user experience")) {
    extracted.purpose = (extracted.purpose || current.purpose || "") + " improve UX";
  }

  // Auth detection
  if (lower.includes("login") || lower.includes("sign in") || lower.includes("user account") || lower.includes("auth")) {
    extracted.has_auth = true;
  }

  // Payment detection
  if (lower.includes("payment") || lower.includes("stripe") || lower.includes("paypal") || lower.includes("checkout")) {
    extracted.has_payment = true;
  }

  // Blog detection
  if (lower.includes("article") || lower.includes("content") || lower.includes("cms")) {
    extracted.has_blog = true;
  }

  // Design style detection
  if (lower.includes("color palette") || lower.includes("keep colors") || lower.includes("brand colors")) {
    extracted.design_style = "brand-aligned";
  }

  // Source content detection
  if (lower.includes("scrape") || lower.includes("facebook") || lower.includes("album")) {
    extracted.features = [...(current.features || []), "Facebook album image scraping"];
  }

  return extracted;
}

// ─── CONVERSATION ENGINE ───

function getNextQuestion(extracted: ExtractedInfo, messageCount: number): { reply: string; ready: boolean } {
  const type = extracted.project_type;

  // First exchange — after detecting type, always ask for audience/purpose
  if (messageCount <= 2) {
    if (!extracted.audience) {
      return {
        reply: `Got it — a ${type === "rebuild" ? "rebuild" : (type || "project")}! Who is this for? (e.g., members, customers, local community)`,
        ready: false,
      };
    }
    if (!extracted.purpose) {
      return {
        reply: `Perfect, targeting ${extracted.audience}. What's the main goal? (e.g., modernize design, improve SEO, attract new members)`,
        ready: false,
      };
    }
  }

  // Second exchange — type-specific questions
  if (messageCount === 3) {
    if (type === "rebuild") {
      return {
        reply: "Do you have the current website URL? And what are the main pain points? (e.g., slow, not mobile-friendly, outdated design)",
        ready: false,
      };
    }
    if (type === "homepage" || type === "landing") {
      return {
        reply: "What sections do you need? (e.g., hero, features, testimonials, pricing, contact)",
        ready: false,
      };
    }
    if (type === "shop") {
      return {
        reply: "How many products are you starting with? And do you need categories/filtering?",
        ready: false,
      };
    }
    if (type === "blog") {
      return {
        reply: "Will you write the content yourself, or do you need a CMS for multiple authors?",
        ready: false,
      };
    }
    if (type === "webapp") {
      return {
        reply: "Do users need accounts/login? And what kind of data will you be managing?",
        ready: false,
      };
    }
    return {
      reply: "What key features or sections should this include?",
      ready: false,
    };
  }

  // Third exchange — ask for timeline or any missing info
  if (messageCount === 4) {
    if (!extracted.timeline) {
      return {
        reply: "What\'s your timeline? (e.g., '2 weeks', 'by end of month', 'ASAP')",
        ready: false,
      };
    }
    if (!extracted.budget) {
      return {
        reply: "Do you have a budget in mind? (e.g., €500, €2000, 'as cheap as possible')",
        ready: false,
      };
    }
  }

  // Ready when we have type + audience + purpose
  if (type && extracted.audience && extracted.purpose) {
    return {
      reply: `I have a good picture of this ${type === "rebuild" ? "rebuild" : type}. Ready to generate your project plan?`,
      ready: true,
    };
  }

  // Catch-all to prevent infinite loops
  return {
    reply: "I think I have enough to draft a plan. Ready to see it?",
    ready: true,
  };
}

// ─── TASK GENERATION ENGINE ───

function generateSmartPlan(extracted: ExtractedInfo): ProjectPlan {
  const type = extracted.project_type || "website";
  const audience = extracted.audience || "users";
  const purpose = extracted.purpose || "online presence";

  let projectName = extracted.project_name || "";
  if (!projectName) {
    if (extracted.domain) {
      projectName = `${extracted.domain.charAt(0).toUpperCase() + extracted.domain.slice(1)} ${type === "rebuild" ? "Rebuild" : "Website"}`;
    } else {
      const typeLabel = type === "rebuild" ? "Rebuild" : (type.charAt(0).toUpperCase() + type.slice(1));
      projectName = `${audience.charAt(0).toUpperCase() + audience.slice(1)} ${typeLabel}`;
    }
  }

  const isRebuild = type === "rebuild";
  const isShop = type === "shop";
  const isBlog = type === "blog";
  const isWebapp = type === "webapp";
  const isLanding = type === "landing";
  const isHomepage = type === "homepage";
  const isPortfolio = type === "portfolio";

  const tasks: ProjectPlan["tasks"] = [];

  // Phase 1: Foundation & Planning
  tasks.push({
    title: isRebuild ? `Audit existing site: ${extracted.source_url || "current site"}` : "Define project scope and requirements",
    type: "planning",
    description: isRebuild
      ? `Analyze the current site structure, content, and performance. Document what to keep, change, and remove for the rebuild.`
      : `Document all features, pages, and functionality for ${audience}. Define success metrics and confirm scope.`,
    priority: "high",
    estimated_hours: 3,
  });

  if (isRebuild) {
    tasks.push({
      title: "Create content migration and redirect strategy",
      type: "planning",
      description: "Map old URLs to new structure. Plan content transfer and set up 301 redirects to preserve SEO.",
      priority: "high",
      estimated_hours: 2,
    });
  }

  tasks.push({
    title: "Set up Next.js project with TypeScript and Tailwind",
    type: "code",
    description: "Initialize repository with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. Configure linting, formatting, and Git.",
    priority: "high",
    estimated_hours: 2,
  });

  // Phase 2: Design System
  tasks.push({
    title: "Create design system and component library",
    type: "design",
    description: `Define color palette, typography scale, spacing system, and reusable components aligned with ${audience} expectations.`,
    priority: "high",
    estimated_hours: 5,
  });

  // Phase 3: Page-specific Design & Build
  if (isHomepage || isLanding) {
    tasks.push({
      title: "Design and build hero section with headline and CTA",
      type: "design",
      description: `Create compelling above-the-fold section communicating the value proposition for ${audience}. Include headline, subtext, and primary CTA.`,
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Build features/benefits section",
      type: "code",
      description: "Create grid of feature cards with icons, titles, and descriptions highlighting key offerings.",
      priority: "medium",
      estimated_hours: 3,
    });
    tasks.push({
      title: "Build social proof section (testimonials, logos, stats)",
      type: "code",
      description: "Add client testimonials, company logos, or statistics to build credibility and trust.",
      priority: "medium",
      estimated_hours: 3,
    });
    if (isLanding) {
      tasks.push({
        title: "Build pricing or comparison section",
        type: "code",
        description: "Create pricing table or feature comparison to drive conversions.",
        priority: "medium",
        estimated_hours: 3,
      });
    }
  }

  if (isShop) {
    tasks.push({
      title: "Design product catalog layout with filtering",
      type: "design",
      description: "Create browseable product grid with category filters, search, and sorting options.",
      priority: "high",
      estimated_hours: 5,
    });
    tasks.push({
      title: "Build product detail pages with image gallery",
      type: "code",
      description: "Implement product pages with image carousel, variants, pricing, and add-to-cart functionality.",
      priority: "high",
      estimated_hours: 5,
    });
    tasks.push({
      title: "Build shopping cart with add/remove/update",
      type: "code",
      description: "Create cart drawer/page with quantity management, item removal, and persistence.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Design and build checkout flow",
      type: "design",
      description: "Create multi-step checkout with shipping, payment, and order confirmation.",
      priority: "high",
      estimated_hours: 5,
    });
    tasks.push({
      title: "Integrate Stripe payment processing",
      type: "code",
      description: "Set up Stripe checkout sessions, payment intents, and webhook handling for order fulfillment.",
      priority: "high",
      estimated_hours: 5,
    });
  }

  if (isBlog) {
    tasks.push({
      title: "Build blog post listing page with pagination",
      type: "code",
      description: "Create blog index with featured posts, category filtering, and pagination.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Build individual blog post layout with CMS integration",
      type: "code",
      description: "Create article pages with rich text content, author info, related posts, and social sharing.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Add category and tag filtering system",
      type: "code",
      description: "Implement category pages, tag clouds, and related content suggestions.",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  if (isWebapp) {
    tasks.push({
      title: "Implement user authentication and authorization",
      type: "code",
      description: "Build login, signup, password reset with JWT or OAuth. Add role-based access control.",
      priority: "high",
      estimated_hours: 5,
    });
    tasks.push({
      title: "Build main dashboard layout and navigation",
      type: "code",
      description: "Create responsive dashboard shell with sidebar nav, header, and content area.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Build data tables with sorting and filtering",
      type: "code",
      description: "Implement sortable, filterable data tables with pagination and search.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Create CRUD forms for data management",
      type: "code",
      description: "Build create, read, update, delete forms with validation and error handling.",
      priority: "medium",
      estimated_hours: 4,
    });
  }

  if (isPortfolio) {
    tasks.push({
      title: "Build project showcase gallery with filtering",
      type: "code",
      description: "Create filterable project grid with hover effects, categories, and case study links.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Build about/bio section with skills",
      type: "code",
      description: "Create personal or team profile with bio, skills, experience timeline.",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  // Phase 4: Common Sections
  tasks.push({
    title: "Build responsive navigation with mobile menu",
    type: "code",
    description: "Create sticky navbar with logo, links, and hamburger menu for mobile. Add active state indicators.",
    priority: "high",
    estimated_hours: 3,
  });

  tasks.push({
    title: "Build footer with links and social media",
    type: "code",
    description: "Create comprehensive footer with sitemap links, social icons, and copyright.",
    priority: "low",
    estimated_hours: 2,
  });

  if (extracted.has_contact !== false) {
    tasks.push({
      title: "Build contact section or page with form",
      type: "code",
      description: "Create contact form with name, email, message fields and form validation. Integrate with email service.",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  // Phase 5: Content
  tasks.push({
    title: "Write and integrate all page content",
    type: "content",
    description: `Write headlines, body copy, CTAs, and meta descriptions optimized for ${audience}. Ensure consistent tone and messaging.`,
    priority: "medium",
    estimated_hours: 4,
  });

  // Phase 6: Polish & Launch
  tasks.push({
    title: "Add scroll animations and micro-interactions",
    type: "code",
    description: "Implement fade-in scroll animations, hover effects, loading states, and page transitions.",
    priority: "low",
    estimated_hours: 4,
  });

  tasks.push({
    title: "Test across devices and browsers",
    type: "code",
    description: "Verify responsive behavior on mobile, tablet, and desktop. Test Chrome, Safari, Firefox.",
    priority: "high",
    estimated_hours: 3,
  });

  tasks.push({
    title: "Optimize performance and Core Web Vitals",
    type: "code",
    description: "Optimize images, implement lazy loading, improve LCP and CLS scores. Target 90+ Lighthouse score.",
    priority: "medium",
    estimated_hours: 3,
  });

  tasks.push({
    title: "Configure SEO, Open Graph, and analytics",
    type: "code",
    description: "Add meta tags, structured data, sitemap, robots.txt. Integrate Google Analytics or Plausible.",
    priority: "medium",
    estimated_hours: 2,
  });

  tasks.push({
    title: "Deploy to production and verify",
    type: "deploy",
    description: "Deploy to Vercel, verify all routes, test forms and interactions, check for console errors.",
    priority: "high",
    estimated_hours: 2,
  });

  if (isRebuild && extracted.source_url) {
    tasks.push({
      title: "Implement 301 redirects and update DNS",
      type: "deploy",
      description: `Set up redirects from ${extracted.source_url} paths. Update DNS and verify SSL certificate.`,
      priority: "high",
      estimated_hours: 2,
    });
  }

  const description = isRebuild
    ? `A complete rebuild of ${extracted.source_url || "the existing site"}, modernizing the design and functionality for ${audience} to better achieve ${purpose}.`
    : `A ${type} designed for ${audience} to ${purpose}. Built with modern tech stack including responsive design, performance optimization, and SEO best practices.`;

  return {
    project_name: projectName,
    description,
    tasks,
  };
}

// ─── API ROUTES ───

function createSession(): PlanningSession {
  const id = Math.random().toString(36).substring(2, 15);
  return {
    id,
    messages: [{
      role: "assistant",
      text: "Hey! Let's plan your project together. What are you building? (e.g., homepage, webapp, shop, blog, landing page, or tell me about an existing site you want to rebuild)",
      timestamp: new Date().toISOString(),
    }],
    extracted: {},
    status: "discovering",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, sessionId, message } = body;

    if (action === "start") {
      const session = createSession();
      sessions.set(session.id, session);
      return NextResponse.json(session);
    }

    if (action === "message" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      session.messages.push({
        role: "user",
        text: message,
        timestamp: new Date().toISOString(),
      });

      // Extract info from message
      const extracted = extractInfo(message, session.extracted);
      session.extracted = { ...session.extracted, ...extracted };

      // Detect project type if not already set
      if (!session.extracted.project_type) {
        const detected = detectProjectType(message);
        if (detected) {
          session.extracted.project_type = detected.type;
        }
      }

      // Try Groq first, fallback to smart scripted engine
      let reply: string;
      let ready = false;

      try {
        const aiResult = await callGeminiAI(session.messages);
        reply = aiResult.reply;
        ready = aiResult.ready_to_plan || false;
        if (aiResult.extracted) {
          session.extracted = { ...session.extracted, ...aiResult.extracted };
        }
      } catch {
        const result = getNextQuestion(session.extracted, session.messages.filter(m => m.role === "assistant").length + 1);
        reply = result.reply;
        ready = result.ready;
      }

      session.messages.push({
        role: "assistant",
        text: reply,
        timestamp: new Date().toISOString(),
      });

      if (ready) {
        session.status = "ready_to_plan";
      }

      session.updated = new Date().toISOString();
      return NextResponse.json(session);
    }

    if (action === "generate" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      let plan: ProjectPlan;

      try {
        session.messages.push({
          role: "user",
          text: "Generate the complete project plan with specific tasks.",
          timestamp: new Date().toISOString(),
        });

        const aiResult = await callGeminiAI(session.messages);

        session.messages.push({
          role: "assistant",
          text: aiResult.reply || "Here's your project plan!",
          timestamp: new Date().toISOString(),
        });

        if (aiResult.plan) {
          plan = aiResult.plan;
        } else {
          plan = generateSmartPlan(session.extracted);
        }
      } catch {
        plan = generateSmartPlan(session.extracted);
      }

      session.plan = plan;
      session.status = "plan_generated";
      session.updated = new Date().toISOString();
      return NextResponse.json(session);
    }

    if (action === "approve" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const plan = session.plan;
      if (!plan) return NextResponse.json({ error: "No plan generated" }, { status: 400 });

      const token = await getAdminToken();
      const project = await apiCall("/api/collections/projects/records", {
        method: "POST",
        token,
        body: {
          name: plan.project_name,
          description: plan.description,
          status: "active",
          progress: 0,
          budget: (session.extracted.budget as number) || 0,
        },
      });

      const createdTasks = [];
      for (const task of plan.tasks) {
        const created = await apiCall("/api/collections/tasks/records", {
          method: "POST",
          token,
          body: {
            title: task.title,
            description: task.description,
            type: task.type,
            status: "todo",
            priority: task.priority,
            project: project.id,
          },
        });
        createdTasks.push(created);
      }

      session.status = "approved";
      sessions.delete(sessionId);

      return NextResponse.json({ project, tasks: createdTasks });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Planning API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const session = sessions.get(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json(session);
}
