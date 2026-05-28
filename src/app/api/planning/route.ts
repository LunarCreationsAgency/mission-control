import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── ONBOARDING WIZARD API ───
// Step-based planning with multiple-choice questions.
// Replaces chat with a guided onboarding flow.

export interface WizardStep {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multi" | "text" | "url" | "number" | "select";
  options?: Array<{ label: string; value: string; icon?: string }>;
  required?: boolean;
}

interface WizardSession {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, unknown>;
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
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "project_type",
    question: "What are you building?",
    description: "Choose the type of project you want to create",
    type: "single",
    required: true,
    options: [
      { label: "Homepage", value: "homepage", icon: "🏠" },
      { label: "Landing Page", value: "landing", icon: "🎯" },
      { label: "Online Shop", value: "shop", icon: "🛒" },
      { label: "Blog", value: "blog", icon: "📝" },
      { label: "Web Application", value: "webapp", icon: "⚙️" },
      { label: "Portfolio", value: "portfolio", icon: "🎨" },
      { label: "Rebuild / Redesign", value: "rebuild", icon: "🔄" },
    ],
  },
  {
    id: "audience",
    question: "Who is this for?",
    description: "Your target audience helps us tailor the design and features",
    type: "single",
    required: true,
    options: [
      { label: "Small Business / Freelancers", value: "small_business", icon: "🏢" },
      { label: "Community / Club / Non-Profit", value: "community", icon: "🤝" },
      { label: "E-commerce Customers", value: "shoppers", icon: "🛍️" },
      { label: "Personal / Creative", value: "personal", icon: "👤" },
      { label: "Enterprise / Corporate", value: "enterprise", icon: "🏭" },
      { label: "Other", value: "other", icon: "✨" },
    ],
  },
  {
    id: "purpose",
    question: "What's the main goal?",
    description: "What problem should this solve?",
    type: "single",
    required: true,
    options: [
      { label: "Attract New Customers / Members", value: "attract", icon: "🧲" },
      { label: "Modernize / Update Existing Site", value: "modernize", icon: "✨" },
      { label: "Sell Products Online", value: "sell", icon: "💰" },
      { label: "Build Community / Engagement", value: "community", icon: "💬" },
      { label: "Improve SEO / Visibility", value: "seo", icon: "🔍" },
      { label: "Showcase Work / Portfolio", value: "showcase", icon: "📸" },
      { label: "Other", value: "other", icon: "🎯" },
    ],
  },
  {
    id: "requirements",
    question: "Any specific requirements?",
    description: "Select all that apply — you can add more later",
    type: "multi",
    required: false,
    options: [
      { label: "Mobile-First Design", value: "mobile_first", icon: "📱" },
      { label: "Dark Mode Support", value: "dark_mode", icon: "🌙" },
      { label: "User Login / Accounts", value: "auth", icon: "🔐" },
      { label: "Payment Integration", value: "payments", icon: "💳" },
      { label: "Content Management (CMS)", value: "cms", icon: "📄" },
      { label: "Contact Form", value: "contact", icon: "📧" },
      { label: "Social Media Integration", value: "social", icon: "🔗" },
      { label: "Multilingual Support", value: "i18n", icon: "🌍" },
      { label: "Blog / News Section", value: "blog", icon: "📰" },
      { label: "Analytics / Tracking", value: "analytics", icon: "📊" },
    ],
  },
  {
    id: "source_url",
    question: "Current website URL (if rebuilding)",
    description: "We'll audit the existing site and plan the migration",
    type: "url",
    required: false,
  },
  {
    id: "timeline",
    question: "What's your timeline?",
    description: "This helps us prioritize and scope the project",
    type: "select",
    required: false,
    options: [
      { label: "ASAP (1-2 weeks)", value: "asap", icon: "⚡" },
      { label: "Short-term (2-4 weeks)", value: "short", icon: "📅" },
      { label: "Medium-term (1-2 months)", value: "medium", icon: "📆" },
      { label: "Flexible / Not Sure", value: "flexible", icon: "🤷" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget?",
    description: "We'll suggest features that fit your budget",
    type: "select",
    required: false,
    options: [
      { label: "Under €500", value: "under_500", icon: "💶" },
      { label: "€500 - €2,000", value: "500_2000", icon: "💶" },
      { label: "€2,000 - €5,000", value: "2000_5000", icon: "💶" },
      { label: "€5,000+", value: "over_5000", icon: "💶" },
      { label: "Not Sure / Flexible", value: "flexible", icon: "🤷" },
    ],
  },
];

// ─── TASK GENERATION ENGINE ───

function generatePlan(answers: Record<string, unknown>) {
  const type = (answers.project_type as string) || "website";
  const audience = (answers.audience as string) || "users";
  const purpose = (answers.purpose as string) || "online presence";
  const reqs = (answers.requirements as string[]) || [];
  const sourceUrl = (answers.source_url as string) || "";

  const audienceLabel: Record<string, string> = {
    small_business: "small businesses",
    community: "community members",
    shoppers: "online shoppers",
    personal: "personal visitors",
    enterprise: "enterprise clients",
    other: "users",
  };

  const purposeLabel: Record<string, string> = {
    attract: "attract new customers and grow the audience",
    modernize: "modernize the online presence",
    sell: "sell products and process payments online",
    community: "build community and engagement",
    seo: "improve search visibility and rankings",
    showcase: "showcase work and attract opportunities",
    other: "achieve business goals",
  };

  const isRebuild = type === "rebuild";
  const isShop = type === "shop";
  const isBlog = type === "blog";
  const isWebapp = type === "webapp";
  const isLanding = type === "landing";
  const isHomepage = type === "homepage";
  const isPortfolio = type === "portfolio";

  let projectName = "";
  if (sourceUrl) {
    try {
      const domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
      projectName = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Rebuild`;
    } catch {
      projectName = "Website Rebuild";
    }
  } else {
    const typeNames: Record<string, string> = {
      homepage: "Homepage",
      landing: "Landing Page",
      shop: "Online Shop",
      blog: "Blog",
      webapp: "Web Application",
      portfolio: "Portfolio",
      rebuild: "Website Rebuild",
    };
    projectName = `${audienceLabel[audience] || "User"} ${typeNames[type] || "Website"}`;
  }

  const tasks: NonNullable<WizardSession["plan"]>["tasks"] = [];

  tasks.push({
    title: isRebuild
      ? `Audit existing site: ${sourceUrl || "current site"}`
      : "Define project scope and requirements",
    type: "planning",
    description: isRebuild
      ? "Analyze the current site structure, content, and performance. Document what to keep, change, and remove."
      : "Document all features, pages, and functionality. Define success metrics and confirm scope.",
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

  tasks.push({
    title: "Create design system and component library",
    type: "design",
    description: `Define color palette, typography scale, spacing system, and reusable components aligned with ${audienceLabel[audience] || "user"} expectations.`,
    priority: "high",
    estimated_hours: 5,
  });

  if (isHomepage || isLanding) {
    tasks.push({
      title: "Design and build hero section with headline and CTA",
      type: "design",
      description: `Create compelling above-the-fold section communicating the value proposition for ${audienceLabel[audience] || "users"}. Include headline, subtext, and primary CTA.`,
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

  // Requirement-specific tasks
  if (reqs.includes("auth")) {
    tasks.push({
      title: "Implement user authentication (login/signup)",
      type: "code",
      description: "Build secure login, registration, and password reset functionality.",
      priority: "high",
      estimated_hours: 4,
    });
  }

  if (reqs.includes("payments")) {
    tasks.push({
      title: "Integrate payment gateway (Stripe/PayPal)",
      type: "code",
      description: "Set up secure payment processing with checkout flow and webhook handling.",
      priority: "high",
      estimated_hours: 5,
    });
  }

  if (reqs.includes("cms")) {
    tasks.push({
      title: "Set up content management system",
      type: "code",
      description: "Integrate a headless CMS (e.g., Sanity, Contentful) or build a custom admin panel.",
      priority: "medium",
      estimated_hours: 5,
    });
  }

  if (reqs.includes("contact")) {
    tasks.push({
      title: "Build contact form with email integration",
      type: "code",
      description: "Create contact form with validation and integrate with email service (e.g., Resend, SendGrid).",
      priority: "medium",
      estimated_hours: 3,
    });
  }

  if (reqs.includes("i18n")) {
    tasks.push({
      title: "Add multilingual support",
      type: "code",
      description: "Implement language switching, translated content, and locale-based routing.",
      priority: "medium",
      estimated_hours: 4,
    });
  }

  if (reqs.includes("analytics")) {
    tasks.push({
      title: "Set up analytics and tracking",
      type: "code",
      description: "Integrate Google Analytics, Plausible, or similar. Configure events and goals tracking.",
      priority: "low",
      estimated_hours: 2,
    });
  }

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

  tasks.push({
    title: "Write and integrate all page content",
    type: "content",
    description: `Write headlines, body copy, CTAs, and meta descriptions optimized for ${audienceLabel[audience] || "users"}. Ensure consistent tone and messaging.`,
    priority: "medium",
    estimated_hours: 4,
  });

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

  if (isRebuild && sourceUrl) {
    tasks.push({
      title: "Implement 301 redirects and update DNS",
      type: "deploy",
      description: `Set up redirects from ${sourceUrl} paths. Update DNS and verify SSL certificate.`,
      priority: "high",
      estimated_hours: 2,
    });
  }

  const budgetMap: Record<string, number> = {
    under_500: 500,
    500_2000: 2000,
    2000_5000: 5000,
    over_5000: 8000,
    flexible: 0,
  };

  return {
    project_name: projectName,
    description: `A ${type === "rebuild" ? "complete rebuild" : type} designed for ${audienceLabel[audience] || "users"} to ${purposeLabel[purpose] || "achieve business goals"}.${reqs.length > 0 ? ` Key features: ${reqs.join(", ")}.` : ""}${sourceUrl ? ` Current site: ${sourceUrl}.` : ""}`,
    tasks,
    budget: budgetMap[(answers.budget as string) || ""] || 0,
  };
}

// ─── API ROUTES ───

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, session, stepId, answer } = body;

    // ─── START: Initialize wizard session ───
    if (action === "start") {
      const newSession: WizardSession = {
        currentStep: 0,
        totalSteps: WIZARD_STEPS.length,
        answers: {},
        status: "discovering",
      };
      return NextResponse.json({
        session: newSession,
        step: WIZARD_STEPS[0],
        progress: { current: 1, total: WIZARD_STEPS.length },
      });
    }

    // ─── ANSWER: Process answer and return next step or plan ───
    if (action === "answer" && session) {
      const currentSession = session as WizardSession;
      const currentStep = WIZARD_STEPS.find((s) => s.id === stepId);
      if (!currentStep) {
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
      }

      // Store answer
      currentSession.answers[stepId] = answer;

      // Check if there are more steps
      const nextStepIndex = currentSession.currentStep + 1;

      // Skip source_url step if not a rebuild
      let actualNextIndex = nextStepIndex;
      if (WIZARD_STEPS[nextStepIndex]?.id === "source_url" && currentSession.answers.project_type !== "rebuild") {
        actualNextIndex = nextStepIndex + 1;
        currentSession.answers.source_url = "";
      }

      if (actualNextIndex < WIZARD_STEPS.length) {
        currentSession.currentStep = actualNextIndex;
        return NextResponse.json({
          session: currentSession,
          step: WIZARD_STEPS[actualNextIndex],
          progress: { current: actualNextIndex + 1, total: WIZARD_STEPS.length },
        });
      }

      // No more steps — generate plan
      currentSession.status = "plan_generated";
      currentSession.plan = generatePlan(currentSession.answers);

      return NextResponse.json({
        session: currentSession,
        plan: currentSession.plan,
        progress: { current: WIZARD_STEPS.length, total: WIZARD_STEPS.length },
      });
    }

    // ─── GENERATE: Force plan generation from current answers ───
    if (action === "generate" && session) {
      const currentSession = session as WizardSession;
      currentSession.status = "plan_generated";
      currentSession.plan = generatePlan(currentSession.answers);
      return NextResponse.json({
        session: currentSession,
        plan: currentSession.plan,
      });
    }

    // ─── APPROVE: Create project + tasks ───
    if (action === "approve" && session && session.plan) {
      const currentSession = session as WizardSession;
      const plan = currentSession.plan!;

      const token = await getAdminToken();
      const project = await apiCall("/api/collections/projects/records", {
        method: "POST",
        token,
        body: {
          name: plan.project_name,
          description: plan.description,
          status: "active",
          progress: 0,
          budget: (currentSession.answers.budget as number) || 0,
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

      currentSession.status = "approved";
      return NextResponse.json({ project, tasks: createdTasks, session: currentSession });
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
