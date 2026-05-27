import { request } from "https";

/**
 * Ollama client for the planning wizard.
 * Calls Ollama running on Hostinger VPS.
 * Uses same SSL bypass pattern as PocketBase.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama-o7r0.srv1625666.hstgr.cloud";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:397b-cloud";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaResponse {
  message: { content: string };
}

function ollamaChat(messages: OllamaMessage[]): Promise<OllamaResponse> {
  const url = new URL("/api/chat", OLLAMA_URL);
  const body = JSON.stringify({
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: { temperature: 0.7, num_predict: 4096 },
  });

  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${json.error || data}`));
            }
          } catch {
            reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const SYSTEM_PROMPT = `You are the Mission Control Orchestrator. Your job is to plan projects through conversation.

RULES:
1. You are having a natural conversation. Be friendly, concise, and ask one question at a time.
2. Based on the conversation, when the user seems ready, generate a structured project plan.
3. When generating a plan, output ONLY valid JSON. No markdown, no explanation.

JSON OUTPUT FORMAT when generating a plan:
{
  "next_message": "Ask a follow-up question OR say 'I have enough info. Ready to generate the plan?'",
  "ready_to_plan": false,
  "extracted": {
    "project_name": "Suggested project name",
    "project_type": "homepage | landing | shop | blog | webapp | portfolio | dashboard",
    "audience": "who this is for",
    "purpose": "what it should do",
    "design_style": "minimal | modern | colorful | professional | playful | dark",
    "tech_stack": ["Next.js", "Tailwind"],
    "timeline": "2 weeks",
    "budget": 500,
    "source_url": "https://... (if rebuilding)"
  }
}

OR when ready to generate the actual task plan:
{
  "next_message": "Here's your project plan!",
  "ready_to_plan": true,
  "plan": {
    "project_name": "...",
    "description": "...",
    "tasks": [
      {
        "title": "Specific, actionable task title",
        "type": "design | code | content | deploy | planning | shop",
        "description": "Clear description of what needs to be done. 1-2 sentences.",
        "priority": "high | medium | low",
        "estimated_hours": 4
      }
    ]
  }
}

TASK RULES:
- Titles should be specific. NOT "Build website" but "Build responsive hero section with headline, subtext, and CTA button"
- Descriptions explain WHY and WHAT. "Create a hero section that communicates our value proposition: we build AI-powered websites."
- Break into phases: Foundation → Build → Launch
- Each task should be doable in 2-8 hours
- For rebuilds, include audit tasks first`;

export async function callPlanningAI(
  messages: Array<{ role: "user" | "assistant"; text: string }>
): Promise<{
  reply: string;
  ready_to_plan: boolean;
  extracted?: Record<string, unknown>;
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
}> {
  const ollamaMessages: OllamaMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.text })),
  ];

  const response = await ollamaChat(ollamaMessages);
  const content = response.message.content.trim();

  // Try to parse JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: just return the text as a message
    return { reply: content, ready_to_plan: false };
  }

  const json = JSON.parse(jsonMatch[0]);

  return {
    reply: json.next_message || "Let's continue.",
    ready_to_plan: json.ready_to_plan || false,
    extracted: json.extracted,
    plan: json.plan,
  };
}

export { OLLAMA_URL, OLLAMA_MODEL };
