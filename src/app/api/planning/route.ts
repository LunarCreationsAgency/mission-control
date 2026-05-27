import { NextResponse } from "next/server";
import { callPlanningAI } from "@/lib/ollama-planning";
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

      // Call Ollama AI
      const aiResult = await callPlanningAI(session.messages);

      // Add AI response
      session.messages.push({
        role: "assistant",
        text: aiResult.reply,
        timestamp: new Date().toISOString(),
      });

      // Update extracted info
      if (aiResult.extracted) {
        session.extracted = { ...session.extracted, ...aiResult.extracted };
      }

      // Check if ready to plan
      if (aiResult.ready_to_plan && aiResult.plan) {
        session.status = "ready_to_plan";
        session.plan = aiResult.plan;
      }

      session.updated = new Date().toISOString();
      return NextResponse.json(session);
    }

    if (action === "generate" && sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      // Force AI to generate the plan
      const generatePrompt = "The user has confirmed they want to see the plan. Generate the complete task list as JSON with ready_to_plan: true.";
      session.messages.push({
        role: "user",
        text: generatePrompt,
        timestamp: new Date().toISOString(),
      });

      const aiResult = await callPlanningAI(session.messages);

      session.messages.push({
        role: "assistant",
        text: aiResult.reply,
        timestamp: new Date().toISOString(),
      });

      if (aiResult.plan) {
        session.plan = aiResult.plan;
        session.status = "plan_generated";
      }

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
