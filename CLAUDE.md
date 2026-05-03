# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Context**: This is the development guide for the Next.js app. The parent directory (`../CLAUDE.md`) contains high-level project requirements and design patterns. Read that first for full context.

## Essential Commands

```bash
# Development
npm run dev                              # Start dev server (http://localhost:3000)
npm run build                            # Build for production
npm run lint                             # Run linter

# Supabase verification
npx tsx verify-supabase.ts              # Check connection
npx tsx scripts/seed-supabase.ts        # Seed 8 sample learning aids
npx tsx verify-full-setup.ts            # Full system check (auth, storage, RLS)

# Troubleshooting
npx tsx check-storage.ts                # Fix storage bucket issues
rm -rf .next && npm run dev             # Clear cache and restart
```

## Quick Start

1. **Install**: `npm install`
2. **Configure**: Copy `.env.local.example` to `.env.local` and add Supabase credentials
3. **Verify**: `npx tsx verify-supabase.ts`
4. **Seed**: `npx tsx scripts/seed-supabase.ts`
5. **Run**: `npm run dev`

**Test credentials**: `test@dermnemonic.com` / `test123456`

**Graceful degradation**: App works without Supabase (read-only mode using `data/learning-aids.json`)

## Tech Stack & Architecture

- **Framework**: Next.js 16.2.4 (App Router, Server Components default)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Language**: TypeScript (strict mode)
- **Deployment**: Vercel (auto-deploy on `git push origin main`)
- **i18n**: Hebrew (primary, RTL) + English fallback

### Route Structure

```
app/
├── layout.tsx                   # Root layout (RTL, Heebo font)
├── page.tsx                     # Feed with filters, search, sort
├── globals.css                  # Tailwind config + custom styles
├── aid/[id]/page.tsx           # Detail view with carousel nav
├── upload/page.tsx              # Upload form
├── uploaders/page.tsx           # List of content creators
├── quiz/page.tsx                # Quiz mode
├── auth/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── success/page.tsx
└── api/
    ├── aids/route.ts            # GET /api/aids (with filters)
    ├── aids/[id]/route.ts       # GET single aid
    ├── aids/[id]/comments/route.ts              # GET/POST comments
    ├── aids/[id]/comments/[commentId]/route.ts  # DELETE comment
    ├── aids/[id]/ratings/route.ts               # POST rating
    ├── aids/[id]/reactions/route.ts             # GET/POST reactions
    ├── upload/route.ts          # POST image upload
    └── auth/logout/route.ts     # POST logout
```

### Key Directories

```
components/
├── ui/                          # shadcn/ui primitives
├── feed/                        # learning-aid-card, skeleton
├── filters/                     # simple-filter-panel (chapter + aid type)
├── comments-section.tsx
├── rating-stars.tsx
├── search-bar.tsx
└── user-menu.tsx

lib/
├── supabase/
│   ├── client.ts               # Browser client (client components, API routes)
│   ├── server.ts               # Server client (server components, actions)
│   └── middleware.ts           # Auth middleware client
├── types.ts                     # TypeScript interfaces
├── aid-types.ts                 # Filter vocabularies
├── chapters.ts                  # 159 Bolognia chapters with Hebrew names
├── i18n.ts                      # Translation helper
├── image-utils.ts               # Image compression
└── utils.ts                     # Tailwind class merging

locales/
├── he.json                      # Hebrew UI strings (primary)
└── en.json                      # English fallback

scripts/
├── seed-supabase.ts             # Seed 8 learning aids
├── quick-seed.ts                # Fast seed for testing
└── setup-storage.sql            # Storage bucket SQL

supabase/migrations/
└── 20260501000000_initial_schema.sql     # Full schema + RLS
```

## Supabase Client Usage

**Critical**: Never import the wrong client type!

- **Browser client** (`lib/supabase/client.ts`): Client components, API routes
- **Server client** (`lib/supabase/server.ts`): Server components, server actions
- **Middleware client** (`lib/supabase/middleware.ts`): Only in `middleware.ts`

## Current Implementation Status

**Production URL**: https://dermnemonic.vercel.app  
**Status**: ✅ Feature-complete, zero bugs, ready for content upload

### Working Features

- ✅ **Authentication** - Magic link signup/login
- ✅ **Upload** - Image upload to Supabase Storage with auto-filled profile data
- ✅ **Feed** - Search, filters (chapter, aid type), sort, "saved only" mode
- ✅ **Detail Pages** - Carousel navigation with keyboard shortcuts (←/→)
- ✅ **Engagement** - Comments (add/view/delete with modal), 5-star ratings, reactions (❤️/👏/💡)
- ✅ **WhatsApp Share** - Pre-filled Hebrew messages with deep links
- ✅ **Chapter System** - 159 Bolognia chapters with English names and numbers
- ✅ **Badges** - Verified (curator-approved), Recent (48 hours), chapter tags
- ✅ **Performance** - 40x optimized (database stats view, 2 queries vs 41)
- ✅ **Mobile UX** - 44px+ touch targets, responsive layouts, RTL throughout
- ✅ **Loading States** - Skeletons, blur placeholders, button loading text
- ✅ **Error Handling** - Friendly messages, retry options, modal confirmations
- ✅ **Keyboard Shortcuts** - ←/→ navigation, / for search, Esc for modals
- ✅ **Image Optimization** - Auto-compression before upload, shimmer placeholders

### Not Yet Implemented

- User profiles (`/profile/[username]`)
- Study sets with spaced repetition (SM-2 algorithm)
- Live conference mode (`/live`, `/live/projector`)
- AI quiz generator (Anthropic API)
- Curator dashboard (`/curator`)
- Card-based swipeable UI (flashcard mode)

**Critical for Contest (June 3, 2026)**: Upload 15-20 quality Hebrew mnemonics from `../טריקים ושטיקים לבולוניה.xlsx`

## Database Schema

### Core Tables

- `users` - Extends auth.users with role (curator/verified_contributor/contributor), hospital, year_of_residency
- `learning_aids` - Content with media_url, media_type, verified flag, pinned, featured_until
- `tags` - Controlled vocabulary (6 categories: diagnosis, sign, pathology, treatment, risk_factors, aid_type)
- `learning_aid_tags` - Many-to-many junction
- `ratings`, `reactions`, `comments` - Engagement data
- `study_sets`, `study_set_items` - Collections (not yet used)
- `follows` - User relationships (not yet used)

### Performance Optimization

The feed uses a materialized view (`learning_aid_stats`) for stats aggregation:
- **Before**: 41 queries for 10 learning aids (N+1 problem)
- **After**: 2 queries (feed + stats JOIN)
- **Result**: 40x faster

Migration: `supabase/migrations/20260502000000_add_stats_view.sql`

### Role Permissions (RLS)

- **Curator**: Verify, pin, edit all content, access `/curator`
- **Verified Contributor**: Uploads auto-verified
- **Contributor**: Uploads pending verification

## Common Development Tasks

### Adding a New Route

1. Create `app/[route-name]/page.tsx`
2. Use `export const metadata` for SEO
3. Import Hebrew translations from `locales/he.json`
4. Set `dir="rtl"` if overriding layout (usually inherited)

### Modifying Filters

**Active filter component**: `components/filters/simple-filter-panel.tsx` (chapter + aid type only)

To add/modify filters:
1. Update `TagCategory` in `lib/types.ts`
2. Add vocabulary to `lib/aid-types.ts`
3. Add Hebrew translations to `locales/he.json` under `filters.[category]`
4. Update `simple-filter-panel.tsx` UI
5. Update API filtering logic in `app/api/aids/route.ts`

### Working with Hebrew RTL

**Critical rules**:
- Use **logical CSS properties**: `ms-4` (not `ml-4`), `me-4` (not `mr-4`)
- Directional icons need rotation: `className="rtl:rotate-180"`
- English medical terms: wrap in `<span dir="ltr" className="inline-block">`
- Font stack: Heebo (Hebrew) + Inter (English fallback)

### Making Database Changes

1. Create SQL file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Apply via Supabase Studio SQL Editor OR `npx tsx run-migration.ts`
3. Verify: `npx tsx verify-full-setup.ts`

### Deploying to Vercel

1. **Test locally**: `npm run build`
2. **Commit**: `git add . && git commit -m "message" && git push origin main`
3. **Auto-deploys** to Vercel
4. **Environment variables** (set in Vercel dashboard):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   **Important**: Paste JWT tokens as single line (no newlines)
5. **Supabase config**: Add Vercel URL to Auth redirect URLs (`https://your-app.vercel.app/**`)

## Troubleshooting

### Build Errors

**Module not found**:
```bash
rm -rf node_modules .next
npm install
npm run build
```

**TypeScript errors**:
- Check `tsconfig.json` strict mode settings
- Ensure types in `lib/types.ts` match database schema
- Run `npm run lint`

### Supabase Issues

**Invalid Supabase URL**:
- Check `.env.local` for correct values (no trailing slashes)
- Restart dev server after changing env vars

**JWT token invalid**:
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is single line (no newlines)
- Redeploy to Vercel if in production

**Storage bucket not found**:
```bash
npx tsx check-storage.ts
# Or create manually in Supabase Studio:
# Storage > New Bucket > Name: "learning-aid-media" > Public: true
```

### Deployment Issues

**Vercel build fails**:
- Verify all 4 env vars set in Vercel dashboard
- Check build logs for specific errors
- Ensure JWT tokens have no newlines

**Auth redirect loop**:
- Add Vercel URL to Supabase Auth redirect URLs
- Wait ~1 minute for Supabase to update

**Images not loading**:
- Check Storage bucket is public
- Verify `NEXT_PUBLIC_APP_URL` matches actual domain
- Check browser console for CORS errors

### Performance Issues

**Slow page load**:
- Verify `learning_aid_stats` view exists (migration `20260502000000`)
- Check API uses view in `app/api/aids/route.ts`
- Monitor Supabase query performance in dashboard

### UI Issues

**RTL layout broken**:
- Check `<html dir="rtl">` in `app/layout.tsx`
- Use logical CSS properties (`ms-4` not `ml-4`)
- Test with Chrome DevTools RTL mode

**Hebrew font not loading**:
- Verify Heebo font import in `app/layout.tsx`
- Check `font-sans` class on body
- Clear browser cache

## Design System

**Colors** (defined in `app/globals.css`):
- Background: `#FAF6F2` (warm cream)
- Primary: `#E97C7C` (soft coral)
- Full palette in CSS custom properties

**Typography**:
- Headings: `font-bold` with appropriate sizes
- Body: `font-normal`
- Font: Heebo (loaded in `layout.tsx`)

**Spacing**:
- Use Tailwind scale: 4, 6, 8, 12, 16, 24
- Cards: `p-6` standard
- Sections: `space-y-6` or `space-y-8`

## Medical Content Constraints

**Never generate medical content**. Curator provides all content via:
1. Upload form at `/upload`
2. JSON import (when curator dashboard is built)
3. Direct database seeding (for demos)

All content defaults to `verified = false` unless uploader is curator/verified_contributor.

## Testing

⚠️ **No test framework configured**. To add testing:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
# Add scripts to package.json:
# "test": "vitest"
# "test:ui": "vitest --ui"
```

## Utility Scripts Reference

**Most frequently used**:
- `verify-supabase.ts` - Check connection (run this first!)
- `scripts/seed-supabase.ts` - Seed 8 sample learning aids
- `check-storage.ts` - Verify Storage bucket

**Other scripts**:
- `verify-full-setup.ts` - Comprehensive check (auth, storage, RLS)
- `update-test-user.ts` - Reset test user credentials
- `update-chapters.ts` - Update chapter taxonomy
- `check-uploads.ts` - List uploaded files
- `run-migration.ts` / `apply-migration.ts` - Apply migrations programmatically
- `scripts/quick-seed.ts` - Fast seed for testing
- `scripts/setup-storage.sql` - Create storage buckets

**Run any script**: `npx tsx <script-name>.ts`

## Out of Scope

Do not implement unless explicitly requested:
- Email digests
- Admin panel beyond curator dashboard
- Monetization/payments
- Native mobile apps (PWA sufficient)
- AI content moderation (manual review only)
- Analytics dashboards beyond leaderboard

## Important Documentation Files

Check these for recent changes and context:
- `TODO.md` - Current priorities and completion status ⭐ **Check this first!**
- `README.md` - User-facing documentation
- `SESSION-MAY-2-POLISH.md` - Latest polish improvements
- `PERFORMANCE-FIXES.md` - 40x performance optimization details
- `MOBILE-AUDIT.md` - Mobile optimization checklist

## Reference Files (Parent Directory)

- `../CLAUDE.md` - Full project requirements and strategy
- `../dermnemonic-meta-prompt.md` - Complete technical spec
- `../dermatology-curriculum.txt` - Bolognia topic list (for tag taxonomy)
- `../טריקים ושטיקים לבולוניה.xlsx` - Real Hebrew mnemonics (gold standard for content)
- Example images (WhatsApp screenshots) - Visual design patterns

## Next.js 16 Breaking Changes

This project uses **Next.js 16.2.4** with breaking changes from v14:
- App Router is stable and default
- Server Components are default (add `'use client'` when needed)
- Metadata API for page titles
- Route handlers use Web APIs (Request/Response)
- Async params/searchParams (use `await` in components)

Refer to `node_modules/next/dist/docs/` for up-to-date API docs.
