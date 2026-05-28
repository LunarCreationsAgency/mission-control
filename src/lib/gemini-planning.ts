import { request } from "https";

/**
 * Google Gemini client for the planning wizard.
 * Uses Gemini 2.0 Flash via AI Studio API.
 * Free tier: 1,500 requests/day, 1M TPM, no credit card.
 * https://aistudio.google.com/app/apikey
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason?: string;
  }>;
  error?: { message: string };
}

function geminiChat(messages: GeminiMessage[]): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  // Convert conversation messages to Gemini format
  const contents = messages.map((m) => ({
    role: m.role,
    parts: m.parts,
  }));

  const body = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: "generativelanguage.googleapis.com",
        port: 443,
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
2. CRITICAL: You must ask at least 3-5 questions before setting ready_to_plan to true.
3. If the user says "keep talking", "tell me more", or "not yet", you MUST set ready_to_plan to false.
4. Only set ready_to_plan to true when you have gathered: project type, audience, purpose, key features, and at least one design preference.
5. Output MUST be valid JSON.

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

export async function callGeminiAI(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
  minMessages = 5
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
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Convert to Gemini format
  const geminiMessages: GeminiMessage[] = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.text }],
    })),
  ];

  const response = await geminiChat(geminiMessages);
  
  const content = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

  const json = JSON.parse(content);

  // Override ready_to_plan if conversation is too short
  // Count only actual user messages (exclude system prompt)
  const userMessages = messages.filter(m => m.role === "user" && m.text !== SYSTEM_PROMPT);
  const actualReady = json.ready_to_plan && userMessages.length >= minMessages;

  return {
    reply: json.next_message || "Let's continue.",
    ready_to_plan: actualReady,
    extracted: json.extracted,
    plan: json.plan,
  };
}

export { GEMINI_MODEL };
