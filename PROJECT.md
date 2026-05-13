# Mission Control v2 — Project Document

## Overview
AI Agent Orchestration Dashboard for LunarCreationsAgency. Manages tasks, agents, goals, and projects with a glass-morphism dark UI.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **Database**: PocketBase (self-hosted on Hostinger VPS)
- **Auth**: JWT sessions via jose
- **Icons**: Lucide React

## Architecture

### Core Rule
**Frontend NEVER talks directly to PocketBase.** All data flows through Next.js API routes. This avoids:
- CORS issues
- SSL certificate problems on mobile
- Exposing admin credentials

### SSL Bypass
The Hostinger VPS uses a self-signed certificate. We use Node.js `https` module with `rejectUnauthorized: false` for server-side API calls. This is a known limitation — proper fix is installing a Let's Encrypt cert on the VPS.

### Data Flow
```
Browser → Next.js API Route → Node https (SSL bypass) → PocketBase
```

## Collections (PocketBase)

### tasks
| Field | Type | Required | Default |
|-------|------|----------|---------|
| title | string | yes | - |
| description | string | no | "" |
| status | select | yes | "todo" |
| priority | select | yes | "medium" |
| project | relation | no | null |
| goal | relation | no | null |
| due_date | date | no | null |
| assignee | relation | no | null |

### projects
| Field | Type | Required | Default |
|-------|------|----------|---------|
| name | string | yes | - |
| description | string | no | "" |
| status | select | yes | "active" |
| progress | number | yes | 0 |
| icon | string | no | "" |
| budget | number | no | 0 |

### goals
| Field | Type | Required | Default |
|-------|------|----------|---------|
| name | string | yes | - |
| description | string | no | "" |
| status | select | yes | "active" |
| progress | number | yes | 0 |
| target_date | date | no | null |
| project | relation | no | null |

### agents
| Field | Type | Required | Default |
|-------|------|----------|---------|
| name | string | yes | - |
| role | string | yes | - |
| status | select | yes | "active" |
| description | string | no | "" |
| avatar | string | no | "" |
| paused | bool | yes | false |
| last_heartbeat | date | no | null |

### activity_logs
| Field | Type | Required | Default |
|-------|------|----------|---------|
| action | string | yes | - |
| entity_type | string | yes | - |
| entity_id | string | yes | - |
| entity_name | string | no | "" |
| details | string | no | "" |

### company_settings
| Field | Type | Required | Default |
|-------|------|----------|---------|
| company_name | string | yes | - |
| currency | string | yes | "EUR" |
| timezone | string | yes | "Europe/Berlin" |
| logo_url | string | no | "" |

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/tasks` | GET, POST | List or create tasks |
| `/api/tasks/[id]` | PATCH, DELETE | Update or delete task |
| `/api/projects` | GET, POST | List or create projects |
| `/api/goals` | GET, POST | List or create goals |
| `/api/agents` | GET | List agents |
| `/api/agents/[id]` | PATCH | Update agent (pause/resume) |
| `/api/activity-logs` | GET | List activity logs |
| `/api/auth/login` | POST | Create session |
| `/api/auth/logout` | POST | Clear session |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/login` if no session, else `/dashboard` |
| `/login` | Login page |
| `/dashboard` | KPI overview, agent status, recent activity |
| `/tasks` | Kanban board (todo, in_progress, review, done) |
| `/agents` | Agent cards with pause/resume |
| `/goals` | Goal list with progress |
| `/projects` | Project list with task counts |
| `/projects/[id]` | Project detail with tasks |
| `/activity` | Activity feed |
| `/budgets` | Cost tracking |
| `/settings` | Company settings |

## Environment Variables

```
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-qsk9.srv1625666.hstgr.cloud
POCKETBASE_ADMIN_EMAIL=dustin.wulf@web.de
POCKETBASE_ADMIN_PASSWORD=Du_752100!66
JWT_SECRET=random-secret-for-jwt-signing
```

## Deployment

1. Push to GitHub
2. Connect Vercel to repo
3. Set environment variables in Vercel dashboard
4. Auto-deploy on push to main

## Data Setup (PocketBase)

All collections must be created manually in PocketBase admin UI:
1. Log into `https://pocketbase-qsk9.srv1625666.hstgr.cloud/_/` with admin credentials
2. Create each collection with fields listed above
3. Set appropriate API rules (allow admin read/write for now)

## Current Data (as of 2026-05-13)

- **Tasks**: 8 (5 real ones with dates, goals, projects)
- **Projects**: 1 (Mission Control)
- **Goals**: 3 (Launch v1, Marketplace, Onboarding)
- **Agents**: 7 (Cortana, Architect, Atlas, Forge, Pixel, Sentry, Relay)
- **Activity Logs**: 5
- **Company Settings**: 1

---
*Last updated: 2026-05-13*
