/**
 * Ollama AI Agent — Two-stage generation:
 * 1. Specialist model (qwen3-coder) writes the deliverable
 * 2. Communicator model (deepseek) writes the human-readable report
 *
 * This lets each model focus on what it's best at.
 */

import { request } from "https";

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama-o7r0.srv1625666.hstgr.cloud";

const OLLAMA_TIMEOUT_MS = 8000;

interface OllamaResponse {
  message?: { content?: string; thinking?: string; role?: string };
  done?: boolean;
  error?: string;
}

/** Generic chat with any model */
function ollamaChat(prompt: string, maxTokens = 400, model: string): Promise<string> {
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

/* ───────── Communicator Agent — writes human reports ───────── */

const COMMUNICATOR_MODEL = "deepseek-v4-pro:cloud";
const CODER_MODEL = "qwen3-coder:480b-cloud";

async function generateReport(taskTitle: string, taskType: string, deliverablePreview: string): Promise<string> {
  const prompt = `A developer just finished this deliverable:

Task: ${taskTitle}
Type: ${taskType}
Preview: ${deliverablePreview.substring(0, 500)}

Write a SHORT 2-sentence report in plain English for a non-technical manager. Explain what was built and why it's useful. No code, no technical jargon.`;

  try {
    const result = await ollamaChat(prompt, 120, COMMUNICATOR_MODEL);
    return result.trim();
  } catch {
    return `${taskType} deliverable created for "${taskTitle}". Review the output for details.`;
  }
}

/* ───────── Specialist Generators — focus on deliverable only ───────── */

export async function generateCode(taskTitle: string, description: string): Promise<{ review: string; deliverable: string }> {
  // Step 1: Specialist writes code
  const codePrompt = `Write a React component in TypeScript with Tailwind CSS.

Task: ${taskTitle}
Description: ${description || "Component"}

Output ONLY valid TypeScript React code. No explanations, no markdown code fences.`;

  let code: string;
  try {
    code = await ollamaChat(codePrompt, 800, CODER_MODEL);
    code = code.replace(/```[a-z]*\n?/gi, "").replace(/```\n?/g, "").trim();
  } catch {
    return { review: "Code generation timed out.", deliverable: "// AI generation failed" };
  }

  // Step 2: Communicator writes report
  const review = await generateReport(taskTitle, "React component", code);

  return { review, deliverable: code };
}

export async function generateDesignCSS(
  taskTitle: string,
  description: string,
  tokens: Record<string, string | undefined>
): Promise<{ review: string; deliverable: string }> {
  const cssPrompt = `Write CSS custom properties for a design system.

Task: ${taskTitle}
Colors: primary=${tokens.color_primary || "#3b82f6"}, secondary=${tokens.color_secondary || "#64748b"}, accent=${tokens.color_accent || "#f59e0b"}, bg=${tokens.color_background || "#0a0a0f"}
Fonts: heading=${tokens.font_heading || "Inter"}, body=${tokens.font_body || "Inter"}
Vibe: ${tokens.design_vibe || "modern"}

Output ONLY valid CSS. No explanations, no markdown.`;

  let css: string;
  try {
    css = await ollamaChat(cssPrompt, 600, CODER_MODEL);
    css = css.replace(/```css\n?/gi, "").replace(/```\n?/g, "").trim();
  } catch {
    return { review: "CSS generation timed out.", deliverable: "/* AI generation failed */" };
  }

  const review = await generateReport(taskTitle, "CSS design system", css);
  return { review, deliverable: css };
}

export async function generateContent(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write professional marketing copy.

Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}
Tone: confident, modern, slightly edgy
Target: CTOs and startup founders

Output the copy directly. No explanations.`;

  let content: string;
  try {
    content = await ollamaChat(prompt, 600, COMMUNICATOR_MODEL);
  } catch {
    return { review: "Content generation timed out.", deliverable: "AI generation failed" };
  }

  const review = await generateReport(taskTitle, "Marketing copy", content);
  return { review, deliverable: content };
}

export async function generatePlan(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a JSON project plan.

Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}

Output ONLY valid JSON with: projectName, durationWeeks, phases (array with name, week, duration, deliverables, status). No explanations.`;

  let plan: string;
  try {
    plan = await ollamaChat(prompt, 600, COMMUNICATOR_MODEL);
    plan = plan.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  } catch {
    return { review: "Plan generation timed out.", deliverable: "{}" };
  }

  const review = await generateReport(taskTitle, "Project plan", plan);
  return { review, deliverable: plan };
}

export async function generateShopConfig(taskTitle: string, description: string, projectName?: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a JSON e-commerce configuration.

Task: ${taskTitle}
Description: ${description || ""}
${projectName ? `Project: ${projectName}` : ""}

Output ONLY valid JSON with: paymentMethods, shippingZones, taxRules, currencies. No explanations.`;

  let config: string;
  try {
    config = await ollamaChat(prompt, 500, COMMUNICATOR_MODEL);
    config = config.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  } catch {
    return { review: "Shop config generation timed out.", deliverable: "{}" };
  }

  const review = await generateReport(taskTitle, "E-commerce config", config);
  return { review, deliverable: config };
}

export async function generateDeployNotes(taskTitle: string, description: string): Promise<{ review: string; deliverable: string }> {
  const prompt = `Write a deployment checklist.

Task: ${taskTitle}
Description: ${description || ""}

Output a concise checklist. No explanations.`;

  let notes: string;
  try {
    notes = await ollamaChat(prompt, 300, COMMUNICATOR_MODEL);
  } catch {
    return { review: "Deploy notes generation timed out.", deliverable: "Deployment checklist generation failed" };
  }

  const review = await generateReport(taskTitle, "Deployment checklist", notes);
  return { review, deliverable: notes };
}
