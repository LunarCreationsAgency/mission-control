# Mission Control — Orchestrator Planning Mode

## Vision

No templates. No rigid structures. Every project starts as a **conversation**.

You say: *"I want a website for my agency"*
The orchestrator asks: *"What kind? Portfolio? Landing page? Full multi-page site?"*
You answer. Back and forth. Until we have a complete plan.

Then the plan becomes tasks. Tasks become a kanban board. You execute.

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT CREATION FLOW                     │
│                                                             │
│  1. START          2. DISCOVER         3. PLAN              │
│     │                  │                  │                 │
│     ▼                  ▼                  ▼                 │
│  ┌────────┐      ┌──────────┐      ┌──────────┐         │
│  │ "I want│─────►│ Q&A Loop │─────►│ Task List│         │
│  │ a site"│      │ 5-10 min │      │ Generated│         │
│  └────────┘      └──────────┘      └──────────┘         │
│                                                             │
│  4. EXECUTE         5. TRACK                              │
│     │                  │                                    │
│     ▼                  ▼                                    │
│  ┌────────┐      ┌──────────┐                               │
│  │ Kanban │─────►│ Progress │                               │
│  │ Board  │      │ & Review│                               │
│  └────────┘      └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. The Planning Conversation

### How It Works

**Step 1: Trigger**
You click "New Project" → Instead of a form, a **chat interface** opens.

**Step 2: Discovery Questions**
The orchestrator asks structured questions to understand the project:

| Question | Why |
|----------|-----|
| "What are you building?" | Understand the deliverable |
| "Who is it for?" | Audience → features, tone, design |
| "What problem does it solve?" | Purpose → content, structure |
| "What's the timeline?" | Urgency → priority, milestones |
| "What's the budget?" | Scope → complexity, features |
| "Any specific tech preferences?" | Stack → tasks, skills needed |
| "What does success look like?" | Goals → metrics, definition of done |

**Step 3: Clarification Loop**
The orchestrator suggests follow-ups based on your answers:

- *"You mentioned a shop. Do you need inventory tracking or just a product showcase?"*
- *"For €500 budget, I'd recommend a landing page with contact form. A full shop would be €2k+. Stick with landing page?"*
- *"Timeline is 2 weeks. I'll suggest an MVP approach — core pages first, extras later. Sound good?"*

**Step 4: Plan Generation**
After the conversation, the orchestrator generates:
1. **Project summary** (name, description, scope)
2. **Task list** (broken down by phase)
3. **Milestones** (key checkpoints)
4. **Suggested budget** (based on scope)
5. **Timeline estimate**

You review, edit, approve. Then the project is created.

---

## 2. The Planning UI

### Two-Panel Layout

```
┌──────────────────────────────────────────┐
│  New Project Wizard                       │
├──────────────────┬───────────────────────┤
│                  │                       │
│  CHAT PANEL      │   PLAN PREVIEW PANEL │
│                  │                       │
│  ┌────────────┐  │  ┌────────────────┐ │
│  │ You:       │  │  │ 📋 Project      │ │
│  │ "I want a  │  │  │    Name: ...    │ │
│  │  website"  │  │  │                 │ │
│  └────────────┘  │  │ 📋 Tasks (0)    │ │
│                  │  │  │                 │ │
│  ┌────────────┐  │  │ 📋 Milestones    │ │
│  │ Cortana:   │  │  │                 │ │
│  │ "What kind │  │  │ 💰 Budget: --   │ │
│  │  of site?" │  │  │                 │ │
│  └────────────┘  │  │ 📅 Timeline: -- │ │
│                  │  │  └────────────────┘ │
│  [Type message]  │                       │
│  [Start Planning]  │  [Edit] [Approve]    │
└──────────────────┴───────────────────────┘
```

### Chat Panel Features
- Message history (like Telegram/WhatsApp)
- Structured input: text, quick-reply buttons, number inputs
- Context aware: remembers previous answers
- Suggestion chips: *"Landing page"*, *"Multi-page"*, *"Shop"*

### Plan Preview Panel
- **Live updates** as you chat — tasks appear, budget adjusts
- **Editable** — you can add/remove tasks, adjust timeline
- **Approval button** — "Create Project" when ready

---

## 3. Task Generation Logic

Based on conversation, the orchestrator creates tasks. Examples:

### Example: Landing Page for Agency
**Discovery:**
- What: Landing page for agency
- Who: Potential clients
- Problem: Need to show work and get leads
- Timeline: 2 weeks
- Budget: €500
- Stack: Next.js, Tailwind

**Generated Plan:**
```
Phase 1: Foundation (Week 1)
  • Define brand voice and messaging
  • Write hero section copy
  • Pick color scheme and typography
  • Create logo variations

Phase 2: Build (Week 1-2)
  • Set up Next.js project
  • Build hero section with CTA
  • Add services section
  • Add portfolio showcase
  • Add contact form
  • Responsive design check

Phase 3: Launch (Week 2)
  • SEO meta and OpenGraph
  • Deploy to Vercel
  • Connect domain
  • Final review and tweaks
```

### Example: E-commerce Shop
**Discovery:**
- What: T-shirt shop
- Who: 18-35 fashion buyers
- Problem: Sell designs online
- Timeline: 1 month
- Budget: €2000
- Stack: Next.js + Stripe

**Generated Plan:**
```
Phase 1: Design (Week 1)
  • Competitor research
  • Brand identity (logo, colors)
  • Design system (components)
  • Product page mockups

Phase 2: Build (Week 2-3)
  • Set up Next.js + Stripe
  • Build product catalog
  • Build product detail pages
  • Shopping cart functionality
  • Checkout flow with Stripe
  • User accounts and order history

Phase 3: Content (Week 3)
  • Product photography guidelines
  • Write product descriptions
  • Add 10 initial products
  • SEO for all pages

Phase 4: Launch (Week 4)
  • Test purchase flow
  • Deploy
  • Analytics setup
  • Post-launch monitoring
```

---

## 4. Implementation Plan

### Phase 1: Planning UI (The Wizard)
- [ ] New "New Project" flow — chat-based instead of form
- [ ] Two-panel layout (chat + live plan preview)
- [ ] Message types: text, quick-reply buttons, chips
- [ ] Context memory (remembers conversation)
- [ ] "Generate Plan" button after sufficient info

### Phase 2: Plan Generation Engine
- [ ] Prompt engineering for task generation
- [ ] Budget estimator based on scope
- [ ] Timeline estimator based on task count
- [ ] Phase grouping (Foundation → Build → Launch)
- [ ] Task type detection (design/code/content/deploy)

### Phase 3: Plan Approval & Creation
- [ ] Live plan preview (editable)
- [ ] Task reordering, editing, deletion
- [ ] "Add task" button
- [ ] Budget adjustment
- [ ] Timeline adjustment
- [ ] "Create Project" → creates project + all tasks in PocketBase

### Phase 4: Execution Integration
- [ ] Project workspace with tabs
- [ ] Kanban board for generated tasks
- [ ] Progress tracking against plan
- [ ] Milestone check-ins

---

## 5. Technical Architecture

### State Management
```typescript
interface PlanningSession {
  id: string;
  userId: string;
  messages: Message[];
  extractedInfo: {
    name?: string;
    description?: string;
    type?: string;
    audience?: string;
    timeline?: string;
    budget?: number;
    stack?: string[];
  };
  generatedPlan?: {
    tasks: Partial<Task>[];
    milestones: Milestone[];
    budget: number;
    timeline: string;
  };
  status: "discovering" | "planning" | "reviewing" | "approved";
  created: string;
  updated: string;
}
```

### API Routes
- `POST /api/planning/start` — Start a new session
- `POST /api/planning/message` — Send a message, get response
- `GET /api/planning/:id` — Get session state
- `POST /api/planning/generate` — Generate plan from session
- `POST /api/planning/approve` — Approve plan → create project + tasks

### AI Integration
- Uses the current model (kimi-k2.6) via OpenClaw
- Prompt includes: conversation history, project planning guidelines, budget/timeline heuristics
- Returns structured JSON: tasks, milestones, budget, timeline

---

## 6. UX Flow

```
[Dashboard]
   │
   ▼
[Click "New Project"]
   │
   ▼
┌──────────────────────────────────────┐
│         Planning Wizard               │
│                                       │
│  ┌────────┐      ┌──────────────┐   │
│  │ Chat   │─────►│ Live Plan     │   │
│  │ Panel  │      │ Preview       │   │
│  │        │      │               │   │
│  │ Q:     │      │ 📋 12 Tasks   │   │
│  │ "What  │      │ 💰 €500       │   │
│  │  are   │      │ 📅 2 weeks    │   │
│  │  you   │      │               │   │
│  │ build- │      │ [Edit]        │   │
│  │ ing?"  │      │ [Approve]     │   │
│  └────────┘      └──────────────┘   │
└──────────────────────────────────────┘
   │
   ▼ (Approve)
[Project Created]
   │
   ▼
[Project Workspace]
   │
   ▼
[Kanban Board with Generated Tasks]
```

---

## 7. Prompt Engineering (Orchestrator System Prompt)

```
You are the Mission Control Orchestrator. Your job is to help the user plan
projects through conversation. You are NOT building — you are PLANNING.

RULES:
1. Ask ONE question at a time. Wait for answer.
2. Suggest 2-3 quick-reply options when possible.
3. After 5-8 questions, you should have enough to generate a plan.
4. Be concise. No essays. One sentence per question.
5. Adjust scope based on budget/timeline constraints.
6. When generating tasks, break into phases: Foundation → Build → Launch.
7. Each task should be doable in 2-8 hours.
8. Include design tasks, code tasks, content tasks, deploy tasks.

QUESTIONS TO ASK (in order):
1. "What are you building?"
2. "Who is it for?"
3. "What problem does it solve?"
4. "What's your timeline?"
5. "What's your budget?"
6. "Any specific tech preferences?"
7. "What does success look like?"
8. "Anything else I should know?"

OUTPUT FORMAT (when generating plan):
{
  "project_name": "...",
  "description": "...",
  "phases": [
    {
      "name": "Foundation",
      "tasks": [
        { "title": "...", "type": "design|code|content|deploy", "estimated_hours": 4 }
      ]
    }
  ],
  "budget": 500,
  "timeline": "2 weeks"
}
```

---

## 8. Immediate Next Steps

**Build the Planning Wizard:**

1. **UI Layout** — Two-panel chat + preview
2. **Chat Component** — Message history, input, quick-reply buttons
3. **Session State** — Store conversation, extracted info
4. **Plan Preview** — Live task list, budget, timeline
5. **Approve Flow** — Generate project + tasks in PocketBase

**Start with:**
- Hardcoded Q&A flow (question 1 → answer → question 2 → ...)
- Static plan generation (based on accumulated answers)
- One-button "Create Project" that creates everything

Then make it dynamic with AI responses.

---

*Plan v3.0 — Orchestrator Planning Mode — 2026-05-27*
