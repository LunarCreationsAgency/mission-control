import { NextResponse } from "next/server";
import { pbGetTasks, pbGetProjects, pbGetGoals } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    if (!q) return NextResponse.json({ results: [] });

    const [tasksRes, projectsRes, goalsRes] = await Promise.all([
      pbGetTasks(),
      pbGetProjects(),
      pbGetGoals(),
    ]);

    const tasks = (tasksRes.items || []) as Array<Record<string, unknown>>;
    const projects = (projectsRes.items || []) as Array<Record<string, unknown>>;
    const goals = (goalsRes.items || []) as Array<Record<string, unknown>>;

    const results = [];

    for (const t of tasks) {
      const title = (t.title || "") as string;
      const desc = (t.description || "") as string;
      if (title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
        results.push({
          type: "task",
          id: t.id as string,
          title: title,
          subtitle: desc,
          status: t.status as string,
          href: `/tasks/${t.id}`,
        });
      }
    }

    for (const p of projects) {
      const name = (p.name || "") as string;
      const desc = (p.description || "") as string;
      if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
        results.push({
          type: "project",
          id: p.id as string,
          title: name,
          subtitle: desc,
          status: p.status as string,
          href: `/projects/${p.id}`,
        });
      }
    }

    for (const g of goals) {
      const name = (g.name || "") as string;
      const desc = (g.description || "") as string;
      if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
        results.push({
          type: "goal",
          id: g.id as string,
          title: name,
          subtitle: desc,
          status: g.status as string,
          href: `/goals/${g.id}`,
        });
      }
    }

    return NextResponse.json({ results, query: q });
  } catch (e) {
    console.error("GET /api/search:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
