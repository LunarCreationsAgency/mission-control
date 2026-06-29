/**
 * POST /api/ai-generate
 *
 * Manual AI content generation for a specific task.
 * Called from task detail page "Generate with AI" button.
 * Returns enhanced content with review report.
 *
 * Body: { taskId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, apiCall } from "@/lib/pocketbase";
import {
  generateDesignCSS,
  generateCode,
  generateContent,
  generatePlan,
  generateShopConfig,
  generateDeployNotes,
} from "@/lib/ollama-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    const token = await getAdminToken();

    // Get task
    const taskData = await apiCall(`/api/collections/tasks/records/${taskId}`, { token });
    const task = taskData as any;

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get project if linked
    let project = null;
    if (task.project) {
      try {
        const projData = await apiCall(`/api/collections/projects/records/${task.project}`, { token });
        project = projData as any;
      } catch { /* ignore */ }
    }

    // Generate based on task type
    const taskType = task.type || "planning";
    let result: { review: string; deliverable: string };
    const start = Date.now();

    switch (taskType) {
      case "code":
        result = await generateCode(task.title, task.description || "");
        break;
      case "design": {
        const tokens = {
          color_primary: project?.color_primary,
          color_secondary: project?.color_secondary,
          color_accent: project?.color_accent,
          color_background: project?.color_background,
          font_heading: project?.font_heading,
          font_body: project?.font_body,
          design_vibe: project?.design_vibe,
        };
        result = await generateDesignCSS(task.title, task.description || "", tokens);
        break;
      }
      case "content":
        result = await generateContent(task.title, task.description || "", project?.name);
        break;
      case "planning":
        result = await generatePlan(task.title, task.description || "", project?.name);
        break;
      case "shop":
        result = await generateShopConfig(task.title, task.description || "", project?.name);
        break;
      case "deploy":
        result = await generateDeployNotes(task.title, task.description || "");
        break;
      default:
        result = { review: "Unknown task type", deliverable: "" };
    }

    const elapsed = Date.now() - start;

    // Update task with AI output
    await apiCall(`/api/collections/tasks/records/${taskId}`, {
      method: "PATCH",
      token,
      body: {
        review_notes: `AI-enhanced by Mission Control (${elapsed}ms)\n\n${result.review}\n\n--- Output ---\n${result.deliverable}`.substring(0, 5000),
        updated: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      review: result.review,
      deliverable: result.deliverable,
      elapsed_ms: elapsed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
