/**
 * Ollama AI Agent — Real content/code/design generation
 *
 * Uses qwen3-coder:480b-cloud (fastest cloud model that works with Ollama API)
 * Falls back to templates if Ollama fails/times out.
 */

import { request } from "https";

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama-o7r0.srv1625666.hstgr.cloud";
const OLLAMA_MODEL = "qwen3-coder:480b-cloud";
const OLLAMA_TIMEOUT_MS = 8000;

interface OllamaResponse {
  message?: { content?: string; role?: string };
  done?: boolean;
  error?: string;
}

function ollamaChat(prompt: string, maxTokens = 400): Promise<string> {
  const body = JSON.stringify({
    model: OLLAMA_MODEL,
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
            resolve(content);
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

/* ───────── Task-specific prompts ───────── */

export async function generateDesignCSS(taskTitle: string, description: string, tokens: Record<string, string | undefined>): Promise<string> {
  const prompt = `Generate CSS custom properties for a website design system.

Task: ${taskTitle}
Description: ${description || "Design system"}
Brand Colors:
- Primary: ${tokens.color_primary || "#3b82f6"}
- Secondary: ${tokens.color_secondary || "#64748b"}
- Accent: ${tokens.color_accent || "#f59e0b"}
- Background: ${tokens.color_background || "#0a0a0f"}
- Heading Font: ${tokens.font_heading || "Inter, sans-serif"}
- Body Font: ${tokens.font_body || "Inter, sans-serif"}
- Vibe: ${tokens.design_vibe || "modern"}

Generate:
1. CSS variables (:root) for colors, fonts, spacing
2. Glass morphism utilities
3. Button component styles
4. Card/container styles
5. Responsive breakpoints

Output ONLY valid CSS, no markdown, no explanations.`;

  try {
    const css = await ollamaChat(prompt, 800);
    // Clean up markdown code blocks if present
    return css.replace(/```css\n?/g, "").replace(/```\n?/g, "").trim();
  } catch {
    return "/* AI generation failed — review manually */";
  }
}

export async function generateCode(taskTitle: string, description: string): Promise<string> {
  const prompt = `Write a React + Next.js component for this task.

Task: ${taskTitle}
Description: ${description || "Component implementation"}

Requirements:
- TypeScript with proper types
- Tailwind CSS classes
- Responsive design
- Accessibility (ARIA labels, keyboard navigation)
- Export default function

Output ONLY the code, no explanations, no markdown code blocks.`;

  try {
    const code = await ollamaChat(prompt, 800);
    return code.replace(/```tsx?\n?/g, "").replace(/```\n?/g, "").trim();
  } catch {
    return "// AI generation failed — review manually";
  }
}

export async function generateContent(taskTitle: string, description: string, projectName?: string): Promise<string> {
  const prompt = `Write professional content/copy for a website.

Task: ${taskTitle}
Description: ${description || "Content creation"}
${projectName ? `Project: ${projectName}` : ""}

Requirements:
- Confident, modern, slightly edgy tone
- Target audience: CTOs and startup founders
- Concise and punchy
- Professional quality

Output ONLY the content text, no explanations, no markdown.`;

  try {
    return await ollamaChat(prompt, 500);
  } catch {
    return "AI generation failed — review manually";
  }
}

export async function generatePlan(taskTitle: string, description: string, projectName?: string): Promise<string> {
  const prompt = `Create a structured project plan.

Task: ${taskTitle}
Description: ${description || "Project planning"}
${projectName ? `Project: ${projectName}` : ""}

Generate a JSON object with:
- phases: array of {name, duration, deliverables[], status}
- milestones: array of {name, target, blocker}
- risks: array of {description, mitigation}
- recommendations: array of action items

Output ONLY valid JSON, no markdown, no explanations.`;

  try {
    const plan = await ollamaChat(prompt, 600);
    return plan.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  } catch {
    return "{}";
  }
}

export async function generateShopConfig(taskTitle: string, description: string, projectName?: string): Promise<string> {
  const prompt = `Create an e-commerce configuration document.

Task: ${taskTitle}
Description: ${description || "Shop setup"}
${projectName ? `Project: ${projectName}` : ""}

Generate a JSON object with:
- products: {categories[], variants_enabled, inventory_tracking}
- payments: {stripe, paypal, bank_transfer} with enabled/test_mode flags
- shipping: {flat_rate, free_threshold}
- taxes: {vat_enabled, vat_rate, included_in_price}
- checkout: {guest_checkout, cart_abandonment, email_notifications}
- recommendations: array of setup steps

Output ONLY valid JSON, no markdown, no explanations.`;

  try {
    const config = await ollamaChat(prompt, 600);
    return config.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  } catch {
    return "{}";
  }
}

export async function generateDeployNotes(taskTitle: string, description: string): Promise<string> {
  const prompt = `Write deployment checklist and configuration notes.

Task: ${taskTitle}
Description: ${description || "Deployment"}

Generate a structured deployment plan covering:
1. Pre-deployment checks
2. Environment variables
3. Build configuration
4. Post-deployment verification
5. Rollback plan

Output ONLY the notes, no markdown, no explanations.`;

  try {
    return await ollamaChat(prompt, 400);
  } catch {
    return "Deployment notes generation failed";
  }
}
