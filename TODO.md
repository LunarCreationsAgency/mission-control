# Mission Control v2 — Build Todo

## Phase 1: Foundation

- [ ] Install dependencies (`npm install`)
- [ ] Verify build passes (`npm run build`)
- [ ] Create `.env.local` from `.env.example`
- [ ] Test PocketBase connection

## Phase 2: Global Layout & Styling

- [ ] Create `src/app/globals.css` with glass-morphism design tokens
  - Background: `#050505`
  - Card: `rgba(255,255,255,0.04)` with border
  - Accent: `#2997ff`
  - Success: `#30d158`
  - Warning: `#ff9f0a`
  - Destructive: `#ff375f`
- [ ] Create `src/app/layout.tsx` with Inter + JetBrains Mono fonts
- [ ] Create `src/app/login/page.tsx` simple login form
- [ ] Create `src/app/(app)/layout.tsx` with sidebar + auth gate
- [ ] Create `src/components/layout/sidebar.tsx`
- [ ] Create `src/middleware.ts` for auth redirect

## Phase 3: UI Components

- [ ] `src/components/ui/glass-card.tsx` — primary container
- [ ] `src/components/ui/button.tsx` — primary, secondary, ghost, danger
- [ ] `src/components/ui/input.tsx` — text input
- [ ] `src/components/ui/modal.tsx` — overlay + card
- [ ] `src/components/ui/tag.tsx` — status badges
- [ ] `src/components/ui/progress.tsx` — progress bars

## Phase 4: Dashboard

- [ ] `src/app/(app)/page.tsx` — KPI cards (tasks in progress, goals, agents online, projects)
- [ ] `src/app/(app)/dashboard/page.tsx` — alias for `/`

## Phase 5: Tasks (Kanban)

- [ ] `src/app/(app)/tasks/page.tsx` — 4-column kanban
- [ ] Task cards with status toggle
- [ ] Task detail modal
- [ ] New task button + creation modal

## Phase 6: Agents

- [ ] `src/app/(app)/agents/page.tsx` — agent cards
- [ ] Pause/resume toggle
- [ ] Status indicator with pulse animation

## Phase 7: Goals & Projects

- [ ] `src/app/(app)/goals/page.tsx` — goal list with progress
- [ ] `src/app/(app)/projects/page.tsx` — project cards
- [ ] `src/app/(app)/projects/[id]/page.tsx` — project detail

## Phase 8: Activity & Budgets

- [ ] `src/app/(app)/activity/page.tsx` — activity feed
- [ ] `src/app/(app)/budgets/page.tsx` — cost tracking

## Phase 9: Polish

- [ ] Loading skeletons on all pages
- [ ] Empty states
- [ ] Error handling with retry
- [ ] Mobile responsive pass
- [ ] Dark mode verification

## Phase 10: Deployment

- [ ] Push to GitHub
- [ ] Connect Vercel
- [ ] Set environment variables
- [ ] Test live deployment
- [ ] Verify all API endpoints

---

## Notes

- Keep code DRY — reuse GlassCard, Button, Modal everywhere
- All pages must handle API failures gracefully (show error, don't crash)
- Never use `any` type — strict TypeScript
- API routes return `{ items: [] }` format from PocketBase
