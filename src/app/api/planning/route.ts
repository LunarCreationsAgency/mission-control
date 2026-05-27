import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory sessions
const sessions = new Map<string, PlanningSession>();

interface PlanningSession {
  id: string;
  messages: Array<{ role: "user" | "assistant"; text: string; timestamp: string }>;
  extracted: Record<string, unknown>;
  status: "discovering" | "ready_to_plan" | "plan_generated" | "approved";
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
  created: string;
  updated: string;
}

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

// ─── TASK GENERATION ENGINE ───

function generatePlan(extracted: Record<string, unknown>): NonNullable<PlanningSession["plan"]> {
  const projectType = (extracted.project_type as string) || "website";
  const projectName = (extracted.project_name as string) || "New Project";
  const isRebuild = !!(extracted.source_url as string);
  const hasAuth = (extracted.auth as boolean) || projectType === "webapp" || projectType === "dashboard";

  const tasks: Array<{ title: string; type: string; description: string; priority: string; estimated_hours: number }> = [];

  // Phase 1: Discovery
  if (isRebuild) {
    tasks.push({
      title: `Audit existing site: ${extracted.source_url}`,
      type: "planning",
      description: `Analyze the current site at ${extracted.source_url}. Document what to keep, what to change, and what to remove.`,
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Create redirect strategy",
      type: "planning",
      description: "Map old URLs to new pages. Ensure no broken links after launch.",
      priority: "high",
      estimated_hours: 2,
    });
  } else {
    tasks.push({
      title: "Define project scope and requirements",
      type: "planning",
      description: "Document all features, pages, and functionality needed. Confirm with stakeholder.",
      priority: "high",
      estimated_hours: 3,
    });
  }

  tasks.push({
    title: "Set up project repository and deployment pipeline",
    type: "code",
    description: "Initialize Next.js project with TypeScript, Tailwind, and shadcn. Configure Vercel deployment.",
    priority: "high",
    estimated_hours: 2,
  });

  // Phase 2: Design
  tasks.push({
    title: "Create design system and component library",
    type: "design",
    description: "Define colors, typography, spacing, and reusable components. Create Figma or code-based design tokens.",
    priority: "high",
    estimated_hours: 6,
  });

  if (projectType === "homepage" || projectType === "landing") {
    tasks.push({
      title: "Design hero section with headline and CTA",
      type: "design",
      description: "Create a compelling above-the-fold section that communicates value proposition and drives action.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Design features/benefits section",
      type: "design",
      description: "Showcase key offerings with icons, illustrations, or screenshots.",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  if (projectType === "shop") {
    tasks.push({
      title: "Design product catalog and product detail pages",
      type: "design",
      description: "Create layouts for browsing products and viewing individual product details with images, pricing, and variants.",
      priority: "high",
      estimated_hours: 6,
    });
    tasks.push({
      title: "Design shopping cart and checkout flow",
      type: "design",
      description: "Create intuitive cart and multi-step checkout with payment integration.",
      priority: "high",
      estimated_hours: 5,
    });
  }

  // Phase 3: Build
  if (projectType === "homepage" || projectType === "landing") {
    tasks.push({
      title: "Build responsive hero section",
      type: "code",
      description: "Implement the hero with headline, subtext, CTA button, and background. Mobile-first responsive.",
      priority: "high",
      estimated_hours: 4,
    });
    tasks.push({
      title: "Build features section with icons and descriptions",
      type: "code",
      description: "Create a grid or list of feature cards with icons, titles, and descriptions.",
      priority: "medium",
      estimated_hours: 3,
    });
    tasks.push({
      title: "Build testimonials or social proof section",
      type: "code",
      description: "Add client logos, quotes, or case studies to build trust.",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  if (projectType === "shop") {
    tasks.push({
      title: "Build product catalog with filtering and search",
      type: "code",
      description: "Implement product grid with category filters, price range, and search functionality.",
      priority: "high",
      estimated_hours: 6,
    });
    tasks.push({
      title: "Build shopping cart with add/remove/update",
      type: "code",
      description: "Create cart state management with add, remove, quantity update, and persist to localStorage.",
      priority: "high",
      estimated_hours: 5,
    });
    tasks.push({
      title: "Integrate payment gateway (Stripe/PayPal)",
      type: "code",
      description: "Set up payment processing with checkout session creation and webhook handling.",
      priority: "high",
      estimated_hours: 6,
    });
  }

  if (hasAuth) {
    tasks.push({
      title: "Implement authentication system",
      type: "code",
      description: "Add login, signup, password reset with JWT or OAuth. Protect private routes.",
      priority: "high",
      estimated_hours: 5,
    });
  }

  tasks.push({
    title: "Build navigation and footer",
    type: "code",
    description: "Create responsive navbar with mobile hamburger menu and footer with links/social.",
    priority: "medium",
    estimated_hours: 3,
  });

  // Phase 4: Content
  tasks.push({
    title: "Write and add all page content",
    type: "content",
    description: "Add headlines, body text, CTAs, meta descriptions, and alt text for all pages.",
    priority: "medium",
    estimated_hours: 4,
  });

  // Phase 5: Polish
  tasks.push({
    title: "Add animations and micro-interactions",
    type: "code",
    description: "Implement scroll animations, hover effects, loading states, and page transitions.",
    priority: "low",
    estimated_hours: 4,
  });

  tasks.push({
    title: "Test responsiveness across devices",
    type: "code",
    description: "Verify layout on mobile, tablet, and desktop. Fix any breakpoints issues.",
    priority: "medium",
    estimated_hours: 2,
  });

  // Phase 6: Launch
  tasks.push({
    title: "Configure SEO and meta tags",
    type: "code",
    description: "Add title, description, Open Graph, Twitter cards, robots.txt, and sitemap.",
    priority: "medium",
    estimated_hours: 2,
  });

  tasks.push({
    title: "Deploy to production and verify",
    type: "deploy",
    description: "Deploy to Vercel, verify all pages load, check console for errors, test all interactions.",
    priority: "high",
    estimated_hours: 2,
  });

  if (isRebuild) {
    tasks.push({
      title: "Implement 301 redirects from old URLs",
      type: "deploy",
      description: `Set up redirects from ${extracted.source_url} paths to new URLs to preserve SEO.`,
      priority: "high",
      estimated_hours: 2,
    });
  }

  return {
    project_name: projectName,
    description: `A ${projectType} project${isRebuild ? ` (rebuild of ${extracted.source_url})` : ""} built with modern tech stack.`,
    tasks,
  };
}

// ─── CONVERSATION ENGINE ───

function processMessage(session: PlanningSession, message: string) {
  const msg = message.toLowerCase();
  let reply = "";
  let ready = false;

  if (msg.includes("home") || msg.includes("landing")) {
    session.extracted.project_type = "homepage";
    reply = "Great! A homepage. Who is this for? (e.g., SaaS customers, local business, personal brand)";
  } else if (msg.includes("shop") || msg.includes("store") || msg.includes("ecommerce")) {
    session.extracted.project_type = "shop";
    reply = "An online shop! What products are you selling?";
  } else if (msg.includes("blog")) {
    session.extracted.project_type = "blog";
    reply = "A blog! What topics will you cover?";
  } else if (msg.includes("app") || msg.includes("dashboard")) {
    session.extracted.project_type = "webapp";
    reply = "A web app! What problem does it solve?";
  } else if (msg.includes("rebuild") || msg.includes("redesign") || msg.includes("update")) {
    session.extracted.project_type = "rebuild";
    reply = "A rebuild! What's the current site URL?";
  } else if (msg.includes("http")) {
    session.extracted.source_url = message.trim();
    reply = "Got the URL. What's the main goal of this rebuild? (e.g., modernize design, add features, improve performance)";
  } else {
    reply = "Got it. What's the main goal of this project? (e.g., get leads, sell products, share content)";
  }

  // Check if we have enough info
  const msgs = session.messages;
  const hasType = !!session.extracted.project_type;
  if (hasType && msgs.length >= 6) {
    ready = true;
    reply = "I think I have enough to draft a plan. Ready to see it?";
  }

  return { reply, ready_to_plan: ready };
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

      // Process with conversation engine
      const result = processMessage(session, message);

      session.messages.push({
        role: "assistant",
        text: result.reply,
        timestamp: new Date().toISOString(),
      });

      if (result.ready_to_plan) {
        session.status = "ready_to_plan";
      }

      session.updated = new Date().toISOString();
      return NextResponse.json(session);
    }

    if (action === "generate" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const plan = generatePlan(session.extracted);
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

      // Create project in PocketBase
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

      // Create tasks in PocketBase
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
