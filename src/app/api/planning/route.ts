import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory sessions (for now). In production: Redis or DB table.
const sessions = new Map<string, PlanningSession>();

interface PlanningSession {
  id: string;
  messages: Array<{ role: "user" | "assistant"; text: string; timestamp: string }>;
  extracted: ExtractedInfo;
  status: "discovering" | "ready_to_plan" | "plan_generated" | "approved";
  created: string;
  updated: string;
}

interface ExtractedInfo {
  projectType?: string;       // homepage, webapp, shop, blog, landing, etc.
  audience?: string;
  purpose?: string;
  features?: string[];
  designStyle?: string;
  techStack?: string[];
  timeline?: string;
  budget?: number;
  pages?: string[];
  integrations?: string[];
  content?: string;           // who provides copy/images
  auth?: boolean;             // needs login?
  payment?: boolean;          // needs payments?
  domain?: string;            // existing domain?
  deadline?: string;
  questionsAsked?: string[];  // track which questions we've asked
}

function createSession(): PlanningSession {
  const id = Math.random().toString(36).substring(2, 15);
  return {
    id,
    messages: [{
      role: "assistant",
      text: "Hey! Let's plan your project together. What are you building? (e.g., homepage, webapp, shop, blog, landing page)",
      timestamp: new Date().toISOString(),
    }],
    extracted: { questionsAsked: ["project_type"] },
    status: "discovering",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

function extractInfoFromAnswer(answer: string, current: ExtractedInfo): Partial<ExtractedInfo> {
  const lower = answer.toLowerCase();
  const extracted: Partial<ExtractedInfo> = {};

  // Detect project type
  if (!current.projectType) {
    if (lower.includes("homepage") || lower.includes("home page")) extracted.projectType = "homepage";
    else if (lower.includes("landing")) extracted.projectType = "landing";
    else if (lower.includes("shop") || lower.includes("store") || lower.includes("ecommerce") || lower.includes("e-commerce")) extracted.projectType = "shop";
    else if (lower.includes("blog")) extracted.projectType = "blog";
    else if (lower.includes("webapp") || lower.includes("web app") || lower.includes("application") || lower.includes("app")) extracted.projectType = "webapp";
    else if (lower.includes("portfolio")) extracted.projectType = "portfolio";
    else if (lower.includes("dashboard")) extracted.projectType = "dashboard";
    else extracted.projectType = "website";
  }

  // Detect audience
  if (lower.includes("client") || lower.includes("customer")) extracted.audience = "customers";
  else if (lower.includes("employer") || lower.includes("job") || lower.includes("hire")) extracted.audience = "employers";
  else if (lower.includes("investor")) extracted.audience = "investors";
  else if (lower.includes("internal") || lower.includes("team")) extracted.audience = "internal team";

  // Detect purpose
  if (lower.includes("sell") || lower.includes("product")) extracted.purpose = "sell products";
  else if (lower.includes("lead") || lower.includes("contact") || lower.includes("form")) extracted.purpose = "generate leads";
  else if (lower.includes("showcase") || lower.includes("portfolio")) extracted.purpose = "showcase work";
  else if (lower.includes("inform") || lower.includes("blog") || lower.includes("article")) extracted.purpose = "share information";
  else if (lower.includes("tool") || lower.includes("manage")) extracted.purpose = "provide tools";

  // Detect features (webapp/shop specific)
  const features: string[] = [];
  if (lower.includes("login") || lower.includes("auth") || lower.includes("sign in")) {
    features.push("user authentication");
    extracted.auth = true;
  }
  if (lower.includes("payment") || lower.includes("stripe") || lower.includes("checkout") || lower.includes("buy")) {
    features.push("payments");
    extracted.payment = true;
  }
  if (lower.includes("admin") || lower.includes("dashboard") || lower.includes("backoffice")) features.push("admin panel");
  if (lower.includes("search")) features.push("search");
  if (lower.includes("filter") || lower.includes("sort")) features.push("filtering/sorting");
  if (lower.includes("api") || lower.includes("integration")) features.push("API integration");
  if (lower.includes("email") || lower.includes("newsletter") || lower.includes("mail")) features.push("email/notification");
  if (lower.includes("chat") || lower.includes("message")) features.push("messaging/chat");
  if (lower.includes("upload") || lower.includes("file")) features.push("file upload");
  if (features.length > 0) extracted.features = [...(current.features || []), ...features];

  // Detect pages
  const pages: string[] = [];
  if (lower.includes("home")) pages.push("home");
  if (lower.includes("about")) pages.push("about");
  if (lower.includes("contact")) pages.push("contact");
  if (lower.includes("service")) pages.push("services");
  if (lower.includes("product")) pages.push("products");
  if (lower.includes("blog") || lower.includes("article")) pages.push("blog");
  if (lower.includes("faq")) pages.push("faq");
  if (lower.includes("pricing")) pages.push("pricing");
  if (pages.length > 0) extracted.pages = [...(current.pages || []), ...pages];

  // Detect design style
  if (lower.includes("minimal") || lower.includes("clean") || lower.includes("simple")) extracted.designStyle = "minimal";
  else if (lower.includes("modern") || lower.includes("sleek")) extracted.designStyle = "modern";
  else if (lower.includes("colorful") || lower.includes("vibrant") || lower.includes("bold")) extracted.designStyle = "colorful";
  else if (lower.includes("professional") || lower.includes("corporate")) extracted.designStyle = "professional";
  else if (lower.includes("playful") || lower.includes("fun") || lower.includes("creative")) extracted.designStyle = "playful";
  else if (lower.includes("dark") || lower.includes("black")) extracted.designStyle = "dark";

  // Detect tech stack
  const techStack: string[] = [];
  if (lower.includes("next.js") || lower.includes("nextjs")) techStack.push("Next.js");
  if (lower.includes("react")) techStack.push("React");
  if (lower.includes("vue")) techStack.push("Vue");
  if (lower.includes("svelte")) techStack.push("Svelte");
  if (lower.includes("tailwind")) techStack.push("Tailwind CSS");
  if (lower.includes("typescript") || lower.includes("ts")) techStack.push("TypeScript");
  if (lower.includes("stripe")) techStack.push("Stripe");
  if (lower.includes("supabase")) techStack.push("Supabase");
  if (lower.includes("pocketbase")) techStack.push("PocketBase");
  if (lower.includes("node") || lower.includes("express")) techStack.push("Node.js");
  if (lower.includes("python")) techStack.push("Python");
  if (techStack.length > 0) extracted.techStack = [...(current.techStack || []), ...techStack];

  // Detect timeline
  const timelineMatch = answer.match(/(\d+)\s*(week|day|month|w|d|m)/i);
  if (timelineMatch) {
    const num = timelineMatch[1];
    const unit = timelineMatch[2].toLowerCase();
    if (unit.startsWith("w")) extracted.timeline = `${num} week${num !== "1" ? "s" : ""}`;
    else if (unit.startsWith("d")) extracted.timeline = `${num} day${num !== "1" ? "s" : ""}`;
    else if (unit.startsWith("m")) extracted.timeline = `${num} month${num !== "1" ? "s" : ""}`;
  }

  // Detect budget
  const budgetMatch = answer.match(/€?\$?(\d+)/);
  if (budgetMatch && !current.budget) {
    const amount = parseInt(budgetMatch[1]);
    if (amount > 100) extracted.budget = amount; // Filter out small numbers (could be anything)
  }

  // Detect domain
  if (lower.includes("domain") || lower.includes("url") || lower.includes("website address")) {
    const domainMatch = answer.match(/[a-z0-9-]+\.[a-z]{2,}/i);
    if (domainMatch) extracted.domain = domainMatch[0];
  }

  // Detect content provider
  if (lower.includes("i write") || lower.includes("i have") || lower.includes("i provide")) extracted.content = "client provided";
  else if (lower.includes("you write") || lower.includes("need copy") || lower.includes("need content")) extracted.content = "needs creation";

  return extracted;
}

function generateNextQuestion(extracted: ExtractedInfo): string | null {
  const asked = extracted.questionsAsked || [];
  const type = extracted.projectType;

  // Always ask these first if not yet asked
  if (!asked.includes("audience")) {
    asked.push("audience");
    return "Who is this for? (e.g., potential customers, employers, your team, general public)";
  }

  if (!asked.includes("purpose")) {
    asked.push("purpose");
    return "What should visitors do on this site? (e.g., buy something, contact you, read articles, use a tool)";
  }

  // Type-specific questions
  if (type === "homepage" || type === "landing") {
    if (!asked.includes("sections")) {
      asked.push("sections");
      return "What sections should the page have? (e.g., hero, services, testimonials, contact, portfolio)";
    }
  }

  if (type === "webapp" || type === "dashboard") {
    if (!asked.includes("features")) {
      asked.push("features");
      return "What are the main features? (e.g., user accounts, dashboards, data tables, search, notifications)";
    }
    if (!asked.includes("auth")) {
      asked.push("auth");
      return "Do users need to log in? If yes, how? (email, Google, magic link)";
    }
  }

  if (type === "shop") {
    if (!asked.includes("products")) {
      asked.push("products");
      return "What kind of products? Physical items, digital downloads, services?";
    }
    if (!asked.includes("payment")) {
      asked.push("payment");
      return "How should customers pay? (Stripe, PayPal, bank transfer, invoice)";
    }
    if (!asked.includes("inventory")) {
      asked.push("inventory");
      return "Do you need inventory tracking? Or is it made-to-order?";
    }
  }

  if (type === "blog") {
    if (!asked.includes("cms")) {
      asked.push("cms");
      return "How will you write posts? Built-in editor, or external (Notion, WordPress)?";
    }
    if (!asked.includes("categories")) {
      asked.push("categories");
      return "What topics will you cover? This helps design the category structure.";
    }
  }

  // General follow-ups
  if (!asked.includes("design")) {
    asked.push("design");
    return "Any design preferences? (minimal, modern, colorful, professional, playful, dark)";
  }

  if (!asked.includes("content")) {
    asked.push("content");
    return "Do you have text/copy and images ready, or do we need to create them?";
  }

  if (!asked.includes("tech")) {
    asked.push("tech");
    return "Any tech preferences? (Next.js, React, Vue, Tailwind, or 'you decide')";
  }

  if (!asked.includes("timeline")) {
    asked.push("timeline");
    return "When do you need this live? (e.g., 2 weeks, 1 month, no rush)";
  }

  if (!asked.includes("budget")) {
    asked.push("budget");
    return "What's your budget? This helps me scope the project right.";
  }

  if (!asked.includes("domain")) {
    asked.push("domain");
    return "Do you have a domain already, or do we need to get one?";
  }

  if (!asked.includes("anything_else")) {
    asked.push("anything_else");
    return "Anything else I should know? Special requirements, competitors to beat, existing brand?";
  }

  // If we've asked everything, we're ready to plan
  return null;
}

function generatePlan(extracted: ExtractedInfo): { tasks: Array<Partial<Record<string, unknown>>>; projectName: string; description: string } {
  const tasks: Array<Partial<Record<string, unknown>>> = [];
  const type = extracted.projectType || "website";
  const pages = extracted.pages || [];
  const features = extracted.features || [];

  // Project name suggestion
  const projectName = `${extracted.audience || "Project"} ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  // --- FOUNDATION PHASE ---
  tasks.push({
    title: "Define project scope and goals",
    type: "planning",
    description: `Purpose: ${extracted.purpose || "TBD"}. Audience: ${extracted.audience || "TBD"}.`,
    status: "todo",
    priority: "high",
  });

  if (!extracted.content || extracted.content === "needs creation") {
    tasks.push({
      title: "Create content strategy",
      type: "content",
      description: "Plan all text, images, and media needed.",
      status: "todo",
      priority: "high",
    });
  }

  tasks.push({
    title: "Design brand identity",
    type: "design",
    description: `Style: ${extracted.designStyle || "modern"}. Colors, typography, logo.`,
    status: "todo",
    priority: "high",
  });

  // --- BUILD PHASE ---
  if (type === "homepage" || type === "landing" || type === "portfolio") {
    if (pages.includes("home") || pages.length === 0) {
      tasks.push({
        title: "Build hero section",
        type: "code",
        description: "Main headline, subtext, call-to-action button.",
        status: "todo",
        priority: "high",
      });
    }
    if (pages.includes("services") || type === "homepage") {
      tasks.push({
        title: "Build services/features section",
        type: "code",
        description: "Show what you offer.",
        status: "todo",
        priority: "medium",
      });
    }
    if (pages.includes("about")) {
      tasks.push({
        title: "Build about section",
        type: "code",
        description: "Who you are, your story, team.",
        status: "todo",
        priority: "medium",
      });
    }
    if (pages.includes("contact")) {
      tasks.push({
        title: "Build contact form",
        type: "code",
        description: "Form + validation + email integration.",
        status: "todo",
        priority: "medium",
      });
    }
    if (type === "portfolio") {
      tasks.push({
        title: "Build portfolio showcase",
        type: "code",
        description: "Grid/list of work with images and descriptions.",
        status: "todo",
        priority: "high",
      });
    }
  }

  if (type === "webapp" || type === "dashboard") {
    tasks.push({
      title: "Set up project scaffolding",
      type: "code",
      description: `${extracted.techStack?.[0] || "Next.js"} + ${extracted.techStack?.[1] || "Tailwind"} setup.`,
      status: "todo",
      priority: "high",
    });

    if (extracted.auth) {
      tasks.push({
        title: "Implement authentication",
        type: "code",
        description: "Login, signup, password reset, protected routes.",
        status: "todo",
        priority: "high",
      });
    }

    tasks.push({
      title: "Build core UI layout",
      type: "code",
      description: "Navigation, sidebar, main content area, responsive.",
      status: "todo",
      priority: "high",
    });

    features.forEach((feature) => {
      tasks.push({
        title: `Build: ${feature}`,
        type: "code",
        description: `Implement ${feature} functionality.`,
        status: "todo",
        priority: "medium",
      });
    });

    if (features.length === 0) {
      tasks.push({
        title: "Build main feature screens",
        type: "code",
        description: "Core user flows and screens.",
        status: "todo",
        priority: "high",
      });
    }
  }

  if (type === "shop") {
    tasks.push({
      title: "Set up shop framework",
      type: "code",
      description: `${extracted.techStack?.[0] || "Next.js"} + e-commerce setup.`,
      status: "todo",
      priority: "high",
    });

    tasks.push({
      title: "Build product catalog",
      type: "code",
      description: "Product grid, detail pages, categories, search.",
      status: "todo",
      priority: "high",
    });

    if (extracted.payment) {
      tasks.push({
        title: "Implement checkout and payments",
        type: "code",
        description: "Cart, checkout flow, Stripe/PayPal integration.",
        status: "todo",
        priority: "high",
      });
    }

    tasks.push({
      title: "Build order management",
      type: "code",
      description: "Order history, status tracking, admin view.",
      status: "todo",
      priority: "medium",
    });
  }

  if (type === "blog") {
    tasks.push({
      title: "Set up CMS",
      type: "code",
      description: `${extracted.techStack?.[0] || "Next.js"} + content management setup.`,
      status: "todo",
      priority: "high",
    });

    tasks.push({
      title: "Build post list and detail pages",
      type: "code",
      description: "Blog index, categories, individual post layout.",
      status: "todo",
      priority: "high",
    });

    tasks.push({
      title: "Build content editor",
      type: "code",
      description: "Write, edit, publish posts.",
      status: "todo",
      priority: "medium",
    });
  }

  // --- LAUNCH PHASE ---
  tasks.push({
    title: "Responsive design check",
    type: "design",
    description: "Mobile, tablet, desktop testing.",
    status: "todo",
    priority: "medium",
  });

  tasks.push({
    title: "SEO and meta tags",
    type: "content",
    description: "Page titles, descriptions, OpenGraph, sitemap.",
    status: "todo",
    priority: "medium",
  });

  tasks.push({
    title: "Performance optimization",
    type: "code",
    description: "Image optimization, lazy loading, bundle size.",
    status: "todo",
    priority: "medium",
  });

  tasks.push({
    title: "Deploy to production",
    type: "deploy",
    description: extracted.domain ? `Deploy to ${extracted.domain}` : "Deploy and configure domain.",
    status: "todo",
    priority: "high",
  });

  tasks.push({
    title: "Final review and launch",
    type: "planning",
    description: "QA, broken links check, cross-browser test.",
    status: "todo",
    priority: "high",
  });

  return { tasks, projectName, description: `${type} for ${extracted.audience || "general audience"}. ${extracted.purpose || ""}` };
}

// ─── API ROUTES ───

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

      // Add user message
      session.messages.push({
        role: "user",
        text: message,
        timestamp: new Date().toISOString(),
      });

      // Extract info
      const extracted = extractInfoFromAnswer(message, session.extracted);
      session.extracted = { ...session.extracted, ...extracted };

      // Generate next question
      const nextQuestion = generateNextQuestion(session.extracted);

      if (nextQuestion) {
        session.messages.push({
          role: "assistant",
          text: nextQuestion,
          timestamp: new Date().toISOString(),
        });
      } else {
        session.status = "ready_to_plan";
        session.messages.push({
          role: "assistant",
          text: "I think I have enough to draft a plan. Ready to see it?",
          timestamp: new Date().toISOString(),
        });
      }

      session.updated = new Date().toISOString();
      return NextResponse.json(session);
    }

    if (action === "generate" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const plan = generatePlan(session.extracted);
      session.status = "plan_generated";
      session.updated = new Date().toISOString();
      return NextResponse.json({ ...session, plan });
    }

    if (action === "approve" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const plan = generatePlan(session.extracted);

      // Create project in PocketBase
      const token = await getAdminToken();
      const project = await apiCall("/api/collections/projects/records", {
        method: "POST",
        token,
        body: {
          name: plan.projectName,
          description: plan.description,
          status: "active",
          progress: 0,
          budget: session.extracted.budget || 0,
        },
      });

      // Create tasks in PocketBase
      const createdTasks = [];
      for (const task of plan.tasks) {
        const created = await apiCall("/api/collections/tasks/records", {
          method: "POST",
          token,
          body: {
            ...task,
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
