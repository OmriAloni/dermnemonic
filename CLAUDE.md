# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Context

**Read the parent directory's CLAUDE.md first** (`../CLAUDE.md`) for full project context, requirements, and design patterns. This file focuses on practical development tasks specific to the Next.js codebase.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (works without Supabase - uses graceful degradation)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

The app runs at http://localhost:3000.

**Without Supabase**: Works with limited functionality (read-only, no auth, no uploads)
**With Supabase**: Full functionality including auth, uploads, comments, ratings

**Test user** (when Supabase connected): 
- Email: `test@dermnemonic.com`
- Password: `test123456`

## Supabase Setup (Optional)

The app gracefully degrades when Supabase is not configured. To enable real database:

1. Copy `.env.local.example` to `.env.local`
2. Fill in Supabase credentials from your project dashboard
3. Run migration: `supabase db push` (or manually via Supabase SQL Editor)

The middleware (`middleware.ts`) automatically skips Supabase auth if env vars are missing.

## Architecture Patterns

### Supabase Client Usage

Three client types, used in different contexts:

- **Browser client** (`lib/supabase/client.ts`): Use in client components and API routes
- **Server client** (`lib/supabase/server.ts`): Use in server components and server actions
- **Middleware client** (`lib/supabase/middleware.ts`): Use only in `middleware.ts`

Never import the browser client in server components or vice versa.

### Route Structure

App Router (Hebrew-first, RTL throughout):

```
app/
├── layout.tsx              # Root layout (RTL, Heebo font, globals.css)
├── page.tsx                # Main feed with filters
├── aid/[id]/page.tsx       # Individual learning aid detail
├── upload/page.tsx         # Upload form with image storage
├── uploaders/page.tsx      # List of all uploaders
├── quiz/page.tsx           # Quiz mode
├── auth/
│   ├── login/page.tsx      # Login page (magic link)
│   ├── signup/page.tsx     # Signup page
│   └── success/page.tsx    # Post-auth success redirect
└── api/
    ├── aids/
    │   ├── route.ts        # GET /api/aids with filtering
    │   └── [id]/
    │       ├── route.ts    # GET individual aid
    │       ├── comments/route.ts  # POST/GET comments
    │       └── ratings/route.ts   # POST ratings
    ├── upload/route.ts     # POST /api/upload (multipart/form-data)
    └── auth/logout/route.ts # POST logout
```

Locale handling is in `lib/i18n.ts` (Hebrew primary, English fallback).

### Data Flow

1. **Mock mode** (default): API routes read from `data/learning-aids.json`
2. **Supabase mode**: API routes query Supabase with RLS policies
3. Components always call API routes, never directly query Supabase (separation of concerns)

### Filter Architecture

Filters use controlled vocabularies defined in `lib/aid-types.ts`:

- Each category has predefined options (diagnosis, sign, pathology, treatment, risk_factors, aid_type)
- Hebrew translations in `locales/he.json` under `filters.*`
- Filter state lives in URL search params (shareable, bookmarkable)
- `app/api/aids/route.ts` handles all filter logic

### Chapter System

The app uses a Hebrew-first chapter taxonomy from the Bolognia dermatology textbook:

- `lib/chapters.ts`: Comprehensive chapter list with Hebrew names (100+ chapters)
- Structure: `{ id: string, name_he: string, name_en: string, parent?: string }`
- Hierarchical organization (parent chapters with sub-chapters)
- Used in filters as "chapter" category
- Tags reference chapters via `chapter_id` foreign key

**When adding content:**
1. Look up chapter in `chapters.ts` (e.g., "Psoriasis" → פסוריאזיס)
2. Use chapter `id` when creating tags
3. Hebrew name displays in UI automatically

## Key Files

### Type Definitions

- `lib/types.ts`: Core TypeScript interfaces (LearningAid, User, Tag, etc.)
- `lib/aid-types.ts`: Filter vocabularies and tag categories
- `lib/chapters.ts`: **Complete Bolognia chapter taxonomy with Hebrew names**
- All types match the database schema in `supabase/migrations/20260501000000_initial_schema.sql`

### Supabase Integration

- `lib/supabase/client.ts`: Browser client (use in client components and API routes)
- `lib/supabase/server.ts`: Server client (use in server components and server actions)
- `lib/supabase/middleware.ts`: Middleware client (use only in `middleware.ts`)
- `middleware.ts`: Auth middleware with graceful Supabase degradation

**Never import the browser client in server components or vice versa.**

### Internationalization

- `locales/he.json`: Hebrew UI strings (primary)
- `locales/en.json`: English fallback
- `lib/i18n.ts`: Simple translation helper
- Convention: English medical terms render LTR inside Hebrew text (use `<span dir="ltr">` when needed)

### Database

- Schema: `supabase/migrations/20260501000000_initial_schema.sql`
- Mock data fallback: `data/learning-aids.json` (used when Supabase not configured)
- Scripts directory exists but seed script not yet implemented

## Common Development Tasks

### Adding a New Route

1. Create `app/[route-name]/page.tsx`
2. Use `export const metadata` for page title
3. Import and use Hebrew translations from `locales/he.json`
4. Set `dir="rtl"` on the main container (inherited from layout, but verify)

### Adding a New Filter Category

1. Add to `TagCategory` type in `lib/types.ts`
2. Add vocabulary to appropriate array in `lib/aid-types.ts`
3. Add Hebrew translations to `locales/he.json` under `filters.[category]`
4. Update filter UI in `components/filters/filter-panel.tsx`
5. Update API route filtering logic in `app/api/aids/route.ts`

### Adding a New Component

- UI primitives: Use existing shadcn/ui components in `components/ui/`
- Feed components: Add to `components/feed/`
- Filter components: Add to `components/filters/`
- Follow existing patterns: TypeScript strict mode, Tailwind CSS, RTL-aware spacing

### Working with Hebrew RTL

Critical rules:

- Use **logical CSS properties** in Tailwind: `ms-4` not `ml-4`, `me-4` not `mr-4`
- Icons that imply direction (arrows, chevrons) may need rotation: `className="rtl:rotate-180"`
- Text direction is handled by `dir="rtl"` on root layout
- English medical terms inside Hebrew: wrap in `<span dir="ltr" className="inline-block">`
- Font stack: Heebo (Hebrew) with Inter fallback (English)

## Database Schema Notes

### Core Tables

- `users`: Extends Supabase auth.users with role, hospital, year_of_residency
- `learning_aids`: Main content table with verified flag, pinned flag, media_url
- `tags`: Controlled vocabulary (6 categories)
- `learning_aid_tags`: Many-to-many junction
- `ratings`, `reactions`, `comments`: Engagement
- `study_sets`, `study_set_items`: Collections with spaced repetition (SM-2 algorithm)

### Role Permissions

- **curator**: Can verify, pin, edit all content, access `/curator` dashboard
- **verified_contributor**: Uploads auto-verified
- **contributor**: Uploads pending verification

RLS policies enforce these rules at the database level.

## Environment Variables

Required in `.env.local` for full functionality:

```env
# Supabase (required for auth, database, storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL (for WhatsApp sharing, OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://your-app.vercel.app

# AI Features (optional, for quiz generator when implemented)
ANTHROPIC_API_KEY=your_anthropic_key_here
```

The app gracefully degrades when Supabase variables are missing (middleware automatically skips auth checks).

## Testing the App

### Visual Testing Checklist

1. **RTL Layout**: All text aligns right, margins/paddings flow correctly
2. **Filters**: Apply multiple filters, verify URL params update, check badge count
3. **Cards**: Verify stats display (ratings, reactions, comments, saves)
4. **Responsive**: Test mobile viewport (primary target), tablet, desktop
5. **Colors**: Warm palette (#FAF6F2 background, #E97C7C primary) applied consistently

### Current Implementation Status

**Working Features**:
- ✅ Authentication (magic link signup/login via Supabase Auth)
- ✅ Upload flow with image storage to Supabase Storage
- ✅ Comments and ratings (full CRUD via API routes)
- ✅ Search and filters (6 filter categories + text search)
- ✅ Detail pages with full learning aid view
- ✅ Quiz page (basic version)
- ✅ Uploaders listing page
- ✅ Hebrew RTL throughout with Heebo font

**Not Yet Implemented**:
- Study sets with spaced repetition (SM-2 algorithm)
- Live conference mode (`/live` and `/live/projector`)
- AI quiz generator (Anthropic API integration)
- WhatsApp share functionality with deep links
- Curator dashboard (`/curator`)
- Card-based swipeable UI mode (flashcard style)
- User profiles (`/profile/[username]`)
- Reaction buttons (heart/brain/lightbulb)
- Delete comments functionality

## Design System

Colors (defined in `app/globals.css`):

```css
--background: 36 40% 97%;        /* #FAF6F2 warm cream */
--primary: 0 76% 70%;            /* #E97C7C soft coral */
--card: 36 40% 97%;
/* ... see globals.css for full palette */
```

Typography:
- Headings: `font-bold` with appropriate text sizes
- Body: `font-normal`
- Font family: Heebo (loaded in `layout.tsx`)

Spacing:
- Use Tailwind's spacing scale (4, 6, 8, 12, 16, 24)
- Cards: `p-6` standard padding
- Sections: `space-y-6` or `space-y-8` vertical rhythm

## Critical Implementation Notes

### Next.js 16.x Breaking Changes

This project uses Next.js 16.2.4, which has breaking changes from Next.js 14 and earlier versions. Refer to `node_modules/next/dist/docs/` for up-to-date API documentation. Common changes:

- App Router is stable and default
- Server Components are default (add `'use client'` when needed)
- Metadata API is the standard way to set page titles
- Route handlers use Web APIs (Request/Response)

### Performance Considerations

**Known Performance Issues** (documented in TODO.md):

- **Feed page performance**: Current implementation makes 32+ database queries per page load
- Each learning aid triggers separate queries for stats aggregation (N+1 query problem)
- **Fix required before production**: Create database view for stats aggregation
- Target: <2 second load time

**Planned Optimizations**:
1. Database view for `learning_aid_stats` (rating_avg, rating_count, comment_count, reaction_count, save_count)
2. Single JOIN query in `/app/api/aids/route.ts` instead of N+1 loop
3. Add SWR caching for client-side data fetching
4. Implement skeleton loaders during data fetch

**General Best Practices**:
- Learning aid images should be lazy-loaded with blur placeholders
- Feed should implement infinite scroll with virtualization for >100 items
- Supabase queries should use appropriate indexes (defined in migration)
- Target: Lighthouse score 90+ mobile performance, 95+ accessibility

### Accessibility

- All images require `alt` text (enforced during upload)
- Keyboard navigation for all interactive elements
- Sufficient contrast ratios (WCAG AA minimum)
- Screen reader tested with Hebrew content
- Proper heading hierarchy (h1 → h2 → h3)

## Out of Scope

Do not implement unless explicitly requested:

- Email digests or notifications
- Admin panel beyond curator dashboard
- Monetization or payment features
- Native mobile apps (PWA is sufficient)
- AI content moderation (manual flag-and-review only)
- Complex analytics beyond basic leaderboard stats

## Reference Files in Parent Directory

- `../CLAUDE.md`: Full project requirements and strategy
- `../dermnemonic-meta-prompt.md`: Complete technical spec
- `../dermatology-curriculum.txt`: Bolognia textbook topic list (for tag taxonomy)
- `../טריקים ושטיקים לבולוניה.xlsx`: Real Hebrew mnemonics from residents (gold standard for content style)
- `../dermnemonic/TIPS_AND_MNEMONICS.md`: Extracted mnemonic examples
- Example images (WhatsApp screenshots): Visual design patterns to follow

## Medical Content Constraints

Never generate medical content. The curator (a practicing dermatologist) provides all content via:

1. JSON import at `/curator` dashboard (not yet implemented)
2. Upload form at `/upload` (basic version exists)
3. Direct database seeding (for initial demo)

All uploaded content must be marked `verified = false` by default unless uploader has `role = 'curator'` or `'verified_contributor'`.
