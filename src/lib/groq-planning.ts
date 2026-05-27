import { request } from "https";

/**
 * Groq client for the planning wizard.
 * Free tier: 1M tokens/day, 20 req/min.
 * https://console.groq.com
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

function groqChat(messages: GroqMessage[]): Promise<GroqResponse> {
  const body = JSON.stringify({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: "api.groq.com",
        port: 443,
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Length": Buffer.byteLength(body),
        },
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
              reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || data}`));
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

const SYSTEM_PROMPT = `You are the Mission Control Orchestrator. You plan web projects through conversation.

RULES:
1. You are having a natural, friendly conversation. Ask ONE question at a time.
2. Based on the conversation, generate a structured project plan when the user seems ready.
3. Output MUST be valid JSON.

JSON FORMAT:
{
  "next_message": "Your reply to the user",
  "ready_to_plan": false,
  "extracted": {
    "project_name": "Suggested name",
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

OR when generating the actual task plan:
{
  "next_message": "Here's your plan!",
  "ready_to_plan": true,
  "plan": {
    "project_name": "...",
    "description": "...",
    "tasks": [
      {
        "title": "Specific, actionable task title",
        "type": "design | code | content | deploy | planning | shop",
        "description": "Clear description of what needs to be done",
        "priority": "high | medium | low",
        "estimated_hours": 4
      }
    ]
  }
}

TASK RULES:
- Titles: specific, NOT generic. E.g., "Build responsive hero section with headline, subtext, and CTA" not "Build website"
- Descriptions: explain WHY and WHAT
- Break into phases: Foundation → Design → Build → Content → Polish → Launch
- Each task: 2-8 hours
- For rebuilds: include audit and redirect tasks first`;

export async function callGroqAI(
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
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const groqMessages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.text })),
  ];

  const response = await groqChat(groqMessages);
  const content = response.choices[0]?.message?.content?.trim() || "{}";

  const json = JSON.parse(content);

  return {
    reply: json.next_message || "Let's continue.",
    ready_to_plan: json.ready_to_plan || false,
    extracted: json.extracted,
    plan: json.plan,
  };
}

export { GROQ_MODEL };
