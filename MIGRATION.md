# Migration: v1 → v2

## What v1 Had (preserved for reference)

**Commits**: 88 total
**Main branch**: `master`
**Backup branch**: `backup-pre-cleanup-20260513`

### Features
- Dashboard with KPI cards
- Kanban board (4 columns)
- Agent cards with pause/resume
- Goals list with task linking
- Projects with detail pages
- Activity feed
- Budget tracking
- Login/logout
- Rate limits page (placeholder)
- Heartbeats page (agent health)
- Org chart

### Architecture (v1 — problematic)
- Started with direct PocketBase SDK on frontend
- Hit SSL issues on mobile
- Hacked in API routes as workaround
- Multiple "fix" and "wip" commits
- Mix of SDK + API code across pages
- No proper types

### Data (survives in PocketBase)
All data is in PocketBase and will remain. v2 connects to the same database.

## What v2 Changes

### Architecture (clean)
- API-first from day one
- No SDK on frontend whatsoever
- Server-side HTTPS client with SSL bypass
- Proper TypeScript types
- Consistent error handling

### Code Quality
- No "wip" or "fix" commits — clean history
- Strict TypeScript
- DRY components
- Documented API routes

## Manual Steps Required

1. **Delete old GitHub repo**
   - Go to `github.com/LunarCreationsAgency/mission-control`
   - Settings → Danger Zone → Delete repository
   - Confirm with repo name

2. **Create new repo**
   - Name: `mission-control`
   - Private or public (your choice)
   - Don't initialize (we'll push from local)

3. **Delete old Vercel project**
   - Go to `vercel.com/dashboard`
   - Find `mission-control` project
   - Settings → General → Delete Project

4. **Create new Vercel project**
   - Import new GitHub repo
   - Set environment variables (see PROJECT.md)
   - Deploy

5. **(Optional) Fix SSL**
   - Install Let's Encrypt on Hostinger VPS
   - Once fixed, remove `rejectUnauthorized: false`
   - More secure, no SSL bypass needed

## Rollback Plan

If v2 fails:
1. The old code is in local backup: `/tmp/mission-control` (branch `backup-pre-cleanup-20260513`)
2. PocketBase data is untouched
3. Can re-deploy v1 by pushing backup branch to new repo

---
*2026-05-13*
