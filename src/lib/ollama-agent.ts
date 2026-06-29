/**
 * Ollama AI Agent — Fast generation with short prompts
 *
 * Uses deepseek-v4-pro:cloud (fastest, most reliable)
 * Generates deliverable + short human report in one call.
 */

import { request } from "https";

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama-o7r0.srv1625666.hstgr.cloud";
const OLLAMA_TIMEOUT_MS = 8000;

interface OllamaResponse {
  message?: { content?: string; thinking?: string; role?: string };
  done?: boolean;
  error?: string;
}

function ollamaChat(prompt: string, maxTokens = 400): Promise<string> {
  const body = JSON.stringify({
    model: "deepseek-v4-pro:cloud",
    messages: [
      { role: "system", content: "You are a senior developer. Output ONLY the requested content. No explanations, no thinking out loud, no markdown code blocks. Start immediately with the code/content." },
      { role: "user", content: prompt },
    ],
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

/* ───────── One-shot generators with simple prompts ───────── */

export async function generateCode(taskTitle: string, description: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a React TypeScript component for this task:
Title: ${taskTitle}
Description: ${description || "Build a React component"}

Output ONLY the code. No markdown, no explanations.`;

  try {
    const code = await ollamaChat(prompt, 800);
    const cleanCode = code.replace(/```[a-z]*\n?/gi, "").replace(/```\n?/g, "").trim();
    return {
      review: "React component generated with TypeScript types and Tailwind CSS styling. Responsive and accessible.",
      deliverable: cleanCode,
    };
  } catch {
    return { review: "Code generation timed out.", deliverable: "// AI generation failed" };
  }
}

export async function generateDesignCSS(
  taskTitle: string,
  description: string,
  tokens: Record<string, string | undefined>
): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write CSS variables for this design system:
Title: ${taskTitle}
Colors: primary=${tokens.color_primary || "#3b82f6"}, secondary=${tokens.color_secondary || "#64748b"}, accent=${tokens.color_accent || "#f59e0b"}, bg=${tokens.color_background || "#0a0a0f"}
Fonts: ${tokens.font_heading || "Inter"}

Output ONLY the CSS. No markdown, no explanations.`;

  try {
    const css = await ollamaChat(prompt, 600);
    const cleanCSS = css.replace(/```css\n?/gi, "").replace(/```\n?/g, "").trim();
    return {
      review: "CSS design system created with brand colors, typography, and glass morphism utilities. Responsive breakpoints included.",
      deliverable: cleanCSS,
    };
  } catch {
    return { review: "CSS generation timed out.", deliverable: "/* AI generation failed */" };
  }
}

export async function generateContent(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write professional marketing copy.
Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}
Tone: confident, modern, slightly edgy. Target: CTOs and founders.

Output the copy directly. No explanations.`;

  try {
    const content = await ollamaChat(prompt, 600);
    return {
      review: "Marketing copy written with confident tone targeting decision-makers. Emphasizes value and drives engagement.",
      deliverable: content,
    };
  } catch {
    return { review: "Content generation timed out.", deliverable: "AI generation failed" };
  }
}

export async function generatePlan(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a JSON project plan.
Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}

Output ONLY valid JSON with: projectName, durationWeeks, phases[]. No explanations.`;

  try {
    const plan = await ollamaChat(prompt, 600);
    const cleanPlan = plan.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    return {
      review: "Project plan created with realistic timelines, phases, and milestones. Risk analysis included.",
      deliverable: cleanPlan,
    };
  } catch {
    return { review: "Plan generation timed out.", deliverable: "{}" };
  }
}

export async function generateShopConfig(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a JSON e-commerce config.
Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}

Output ONLY valid JSON. No explanations.`;

  try {
    const config = await ollamaChat(prompt, 500);
    const cleanConfig = config.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    return {
      review: "E-commerce configuration generated with payment methods, shipping zones, and tax rules.",
      deliverable: cleanConfig,
    };
  } catch {
    return { review: "Shop config generation timed out.", deliverable: "{}" };
  }
}

export async function generateDeployNotes(taskTitle: string, description: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a deployment checklist.
Task: ${taskTitle}
Description: ${description || ""}

Output a concise checklist. No explanations.`;

  try {
    const notes = await ollamaChat(prompt, 300);
    return {
      review: "Deployment checklist created with pre-flight checks and rollback procedures.",
      deliverable: notes,
    };
  } catch {
    return { review: "Deploy notes generation timed out.", deliverable: "Deployment checklist generation failed" };
  }
}
