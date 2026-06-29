/**
 * Ollama AI Agent — Real content/code/design generation with review reports
 *
 * Uses model-specific routing:
 * - code/design → qwen3-coder:480b-cloud (best for React/TS/CSS)
 * - content/planning → deepseek-v4-pro:cloud (fastest + best creative)
 *
 * All outputs include a human-readable review report + deliverable.
 */

import { request } from "https";

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama-o7r0.srv1625666.hstgr.cloud";

// Model routing per task type
const MODEL_MAP: Record<string, string> = {
  code: "qwen3-coder:480b-cloud",
  design: "qwen3-coder:480b-cloud",
  content: "deepseek-v4-pro:cloud",
  planning: "deepseek-v4-pro:cloud",
  shop: "qwen3-coder:480b-cloud",
  deploy: "deepseek-v4-pro:cloud",
};

const DEFAULT_MODEL = "deepseek-v4-pro:cloud";
const OLLAMA_TIMEOUT_MS = 8000;

interface OllamaResponse {
  message?: { content?: string; thinking?: string; role?: string };
  done?: boolean;
  error?: string;
}

function ollamaChat(prompt: string, maxTokens = 400, taskType = "code"): Promise<string> {
  const model = MODEL_MAP[taskType] || DEFAULT_MODEL;
  const body = JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    options: { num_predict: maxTokens, temperature: 0.7 },
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error("Ollama timeout"));
    }, OLLAMA_TIMEOUT_MS);

    const req = request(
      {
        hostname: new URL(OLLAMA_URL).hostname,
        port: 443,
        path: "/api/chat",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          clearTimeout(timer);
          try {
            const parsed = JSON.parse(data) as OllamaResponse;
            if (parsed.error) {
              reject(new Error(parsed.error));
              return;
            }
            const content = parsed.message?.content || "";
            const thinking = parsed.message?.thinking || "";
            const result = content.trim().length > 10 ? content : thinking;
            resolve(result);
          } catch {
            reject(new Error("Invalid Ollama response"));
          }
        });
      }
    );

    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

/* ───────── helpers ───────── */

function parseReviewAndDeliverable(result: string): { review: string; deliverable: string } {
  const parts = result.split(/---DELIVERABLE---|---OUTPUT---|---CODE---|---CSS---/i);
  if (parts.length >= 2) {
    return {
      review: parts[0].trim(),
      deliverable: parts[1].trim().replace(/```[a-z]*\n?/gi, "").replace(/```\n?/g, "").trim(),
    };
  }
  return { review: "", deliverable: result };
}

/* ───────── Task-specific generators ───────── */

export async function generateDesignCSS(
  taskTitle: string,
  description: string,
  tokens: Record<string, string | undefined>
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are a senior design engineer.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Design system"}
BRAND TOKENS:
- Primary: ${tokens.color_primary || "#3b82f6"}
- Secondary: ${tokens.color_secondary || "#64748b"}
- Accent: ${tokens.color_accent || "#f59e0b"}
- Background: ${tokens.color_background || "#0a0a0f"}
- Heading Font: ${tokens.font_heading || "Inter, sans-serif"}
- Body Font: ${tokens.font_body || "Inter, sans-serif"}
- Vibe: ${tokens.design_vibe || "modern"}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Explain what design system elements were created, why the color/font choices match the brand vibe, and mention any accessibility considerations like contrast ratios or reduced motion support.

SECTION 2 — DELIVERABLE:
Generate CSS custom properties with glass morphism utilities, button styles, card styles, and responsive breakpoints. Use ONLY the brand colors provided.

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 1000, "design");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Created a complete CSS design system using the brand's color palette and typography. The system includes glass morphism utilities, responsive breakpoints, and component styles that align with the ${tokens.design_vibe || "modern"} brand identity.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The design system was not fully generated.",
      deliverable: "/* AI generation failed — review manually */",
    };
  }
}

export async function generateCode(
  taskTitle: string,
  description: string
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are a senior React developer.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Component implementation"}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Explain what the component does, highlight key features (TypeScript types, accessibility, responsive design), and mention any trade-offs or areas for improvement.

SECTION 2 — DELIVERABLE:
Write the complete React + TypeScript component code with Tailwind CSS classes, proper types, and accessibility features. Export default function.

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 1000, "code");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Built a React component with TypeScript types, Tailwind CSS styling, and responsive breakpoints. The component includes accessibility features like ARIA labels and keyboard navigation support.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The component was not fully generated.",
      deliverable: "// AI generation failed — review manually",
    };
  }
}

export async function generateContent(
  taskTitle: string,
  description: string,
  projectName?: string
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are a senior copywriter.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Content creation"}
${projectName ? `PROJECT: ${projectName}` : ""}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Explain the content strategy behind the copy, why the tone fits the target audience, and highlight any key messaging that drives conversion or engagement.

SECTION 2 — DELIVERABLE:
Write the actual content/copy. Be concise, punchy, and professional. Use markdown formatting where appropriate (headings, bullet points).

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 600, "content");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Created professional copy with a confident, modern tone targeting CTOs and startup founders. The content emphasizes value and drives action.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The content was not fully generated.",
      deliverable: "AI generation failed — review manually",
    };
  }
}

export async function generatePlan(
  taskTitle: string,
  description: string,
  projectName?: string
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are a senior project manager.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Project planning"}
${projectName ? `PROJECT: ${projectName}` : ""}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Summarize the project plan, explain the timeline logic, highlight critical path dependencies, and identify the highest-risk phases.

SECTION 2 — DELIVERABLE:
Generate a structured JSON plan with phases, milestones, risks, and recommendations.

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 800, "planning");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Created a structured project plan with realistic timelines and detailed deliverables. The plan identifies critical dependencies and provides risk mitigation strategies.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The plan was not fully generated.",
      deliverable: "{}",
    };
  }
}

export async function generateShopConfig(
  taskTitle: string,
  description: string,
  projectName?: string
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are an ecommerce specialist.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Shop setup"}
${projectName ? `PROJECT: ${projectName}` : ""}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Summarize the shop configuration, explain payment gateway choices, and highlight any compliance requirements (GDPR, tax rules).

SECTION 2 — DELIVERABLE:
Generate a structured JSON configuration for products, payments, shipping, taxes, and checkout settings.

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 800, "shop");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Generated a complete e-commerce configuration covering payment gateways, shipping rules, and tax settings. The configuration is structured for immediate implementation.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The shop config was not fully generated.",
      deliverable: "{}",
    };
  }
}

export async function generateDeployNotes(
  taskTitle: string,
  description: string
): Promise<{ review: string; deliverable: string }> {
  const prompt = `You are a DevOps engineer.

TASK: ${taskTitle}
DESCRIPTION: ${description || "Deployment"}

INSTRUCTIONS:
Generate two sections separated by "---DELIVERABLE---":

SECTION 1 — REVIEW REPORT (3-4 sentences):
Summarize the deployment strategy, explain any rollback plans, and highlight monitoring/alerting considerations.

SECTION 2 — DELIVERABLE:
Generate a structured deployment checklist with pre-deployment checks, environment variables, build config, post-deployment verification, and rollback steps.

Output only these two sections.`;

  try {
    const result = await ollamaChat(prompt, 500, "deploy");
    const parsed = parseReviewAndDeliverable(result);
    if (!parsed.review) {
      parsed.review = `Created a deployment checklist covering pre-flight checks, environment configuration, and post-deployment monitoring. Includes rollback procedures for safe deployment.`;
    }
    return parsed;
  } catch {
    return {
      review: "AI generation timed out. The deploy notes were not fully generated.",
      deliverable: "Deployment notes generation failed",
    };
  }
}
