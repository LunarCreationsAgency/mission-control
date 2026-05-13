# Mission Control v2

AI Agent Orchestration Dashboard — rebuilt from scratch.

## Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server Components default |
| Styling | Tailwind CSS v4 | Custom glass-morphism design tokens |
| Database | PocketBase | Self-hosted on Hostinger VPS |
| Auth | JWT + middleware | Server-side session validation |
| API | Next.js API Routes | All DB calls go through `/api/*` |
| Icons | Lucide React | Consistent iconography |

## Project Structure

```
src/
├── app/
│   ├── (app)/                 # Authenticated app shell
│   │   ├── layout.tsx         # Sidebar + auth gate
│   │   ├── page.tsx           # Dashboard (default route)
│   │   ├── tasks/
│   │   ├── agents/
│   │   ├── goals/
│   │   ├── projects/
│   │   ├── activity/
│   │   ├── budgets/
│   │   └── settings/
│   ├── api/
│   │   ├── tasks/             # CRUD for tasks
│   │   ├── agents/            # CRUD for agents
│   │   ├── goals/             # CRUD for goals
│   │   ├── projects/          # CRUD for projects
│   │   ├── activity-logs/     # Read-only activity
│   │   └── auth/              # Login/logout/me
│   ├── login/
│   └── layout.tsx             # Root layout (fonts, dark mode)
├── components/
│   ├── ui/                    # GlassCard, Button, Input, Modal
│   └── layout/                # Sidebar, Header
├── lib/
│   ├── pocketbase.ts          # HTTPS client (SSL bypass)
│   ├── data.ts                # Frontend API helpers
│   └── auth.ts                # JWT + session
└── types/
    └── index.ts               # Shared TypeScript types
```

## Key Decisions

1. **API-first**: Frontend NEVER talks directly to PocketBase. All data flows through Next.js API routes.
2. **HTTPS bypass**: Custom Node.js `https` client with `rejectUnauthorized: false` handles the self-signed SSL cert.
3. **No SDK on frontend**: The `pocketbase` package is only used server-side in API routes.
4. **Graceful degradation**: Every page loads independently. If goals API fails, tasks still show.
5. **Strict TypeScript**: No `any` types. Proper interfaces for all data.

## Collections (PocketBase)

| Collection | Fields | Notes |
|-----------|--------|-------|
| `tasks` | title, description, status, priority, project, goal, due_date, assignee, created, updated | Main work unit |
| `projects` | name, description, status, progress, icon, budget | Grouping unit |
| `goals` | name, description, status, progress, target_date, project | Strategic objective |
| `agents` | name, role, status, description, avatar, paused, last_heartbeat | AI team members |
| `activity_logs` | action, entity_type, entity_id, entity_name, details | Audit trail |
| `company_settings` | company_name, currency, timezone, logo_url | App config |

## Setup Steps

1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `NEXT_PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
4. `npm run dev`
5. Open `http://localhost:3000`

## Deployment

1. Push to GitHub
2. Connect Vercel to repo
3. Set environment variables in Vercel dashboard
4. Auto-deploy on push

## Features (Phase Roadmap)

### Phase 1: Core (Now)
- [ ] Dashboard with KPIs
- [ ] Task kanban board (create, read, update status)
- [ ] Agent status cards
- [ ] Activity feed

### Phase 2: Workflow
- [ ] Task creation modal with full fields
- [ ] Inline task editing
- [ ] Agent assignment to tasks
- [ ] Goal linking

### Phase 3: Polish
- [ ] Drag-and-drop kanban
- [ ] Project detail pages
- [ ] Budget tracking
- [ ] Search (Cmd+K)

### Phase 4: Advanced
- [ ] GitHub integration
- [ ] Webhooks
- [ ] Agent-to-agent messaging

---

*Built by Cortana for LunarCreationsAgency.*
