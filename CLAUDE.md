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

# Verify Supabase connection
npx tsx verify-supabase.ts

# Seed database with sample data
npx tsx scripts/seed-supabase.ts

# Check Supabase Storage setup
npx tsx check-storage.ts
```

The app runs at http://localhost:3000.

**Without Supabase**: Works with limited functionality (read-only, no auth, no uploads)
**With Supabase**: Full functionality including auth, uploads, comments, ratings

**Test user** (when Supabase connected): 
- Email: `test@dermnemonic.com`
- Password: `test123456`

**Mock data fallback**: When Supabase is not configured, API routes read from `data/learning-aids.json`

## Utility Scripts

The project includes several TypeScript utility scripts in the root directory:

### Database & Setup
- `verify-supabase.ts` - Check Supabase connection and credentials
- `verify-full-setup.ts` - Comprehensive check (auth, storage, database, RLS)
- `run-migration.ts` - Apply database migrations programmatically
- `apply-migration.ts` - Alternative migration helper

### Data Management
- `scripts/seed-supabase.ts` - Seed database with 8 sample learning aids
- `scripts/quick-seed.ts` - Fast seed for testing
- `scripts/seed.ts` - Original seed script (deprecated)

### Storage & Uploads
- `check-storage.ts` - Verify Supabase Storage bucket configuration
- `check-uploads.ts` - Check uploaded files
- `scripts/setup-storage.sql` - SQL to create storage buckets

### User Management
- `update-test-user.ts` - Reset test user credentials
- `update-chapters.ts` - Update chapter taxonomy

**Run any script with**: `npx tsx <script-name>.ts`

## Deployment

**Production URL**: https://dermnemonic.vercel.app  
**GitHub Repository**: https://github.com/OmriAloni/dermnemonic

### Deploying to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Auto-deploy**: Vercel automatically deploys on push to main branch

3. **Environment Variables** (set in Vercel dashboard):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   
   **Important**: Paste multi-line JWT tokens as single line (no newlines)

4. **Supabase Configuration**: Add Vercel URL to Supabase Auth redirect URLs

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
├── aid/[id]/page.tsx       # Individual learning aid detail with carousel navigation
├── upload/page.tsx         # Upload form with image storage
├── uploaders/page.tsx      # List of all uploaders
├── quiz/page.tsx           # Quiz mode (basic implementation)
├── auth/
│   ├── login/page.tsx      # Login page (magic link)
│   ├── signup/page.tsx     # Signup page
│   └── success/page.tsx    # Post-auth success redirect
└── api/
    ├── aids/
    │   ├── route.ts        # GET /api/aids (with filters, search, sort)
    │   └── [id]/
    │       ├── route.ts    # GET /api/aids/[id] (single aid)
    │       ├── comments/
    │       │   ├── route.ts         # GET/POST /api/aids/[id]/comments
    │       │   └── [commentId]/route.ts  # DELETE /api/aids/[id]/comments/[commentId]
    │       ├── ratings/route.ts     # POST /api/aids/[id]/ratings
    │       └── reactions/route.ts   # GET/POST /api/aids/[id]/reactions
    ├── upload/route.ts     # POST /api/upload (multipart/form-data, Supabase Storage)
    └── auth/logout/route.ts # POST /api/auth/logout
```

**API Endpoints**:
- `GET /api/aids` - Returns learning aids with stats (uses optimized database view)
  - Query params: `search`, `chapter`, `aidType`, `sort`
  - Returns 2 queries (feed + stats view) instead of N+1
- `GET /api/aids/[id]` - Single learning aid with full details
- `GET /api/aids/[id]/comments` - All comments for an aid
- `POST /api/aids/[id]/comments` - Create new comment (requires auth)
- `DELETE /api/aids/[id]/comments/[commentId]` - Delete comment (requires auth + ownership)
- `POST /api/aids/[id]/ratings` - Submit rating (requires auth)
- `GET /api/aids/[id]/reactions` - Fetch user reactions and counts for an aid
- `POST /api/aids/[id]/reactions` - Toggle reaction (heart/brain/lightbulb, requires auth)
- `POST /api/upload` - Upload learning aid with image (requires auth)
- `POST /api/auth/logout` - Clear session

Locale handling is in `lib/i18n.ts` (Hebrew primary, English fallback).

### Data Flow

1. **Mock mode** (default): API routes read from `data/learning-aids.json`
   - Contains 8 sample learning aids in Hebrew
   - Used when Supabase env vars are missing
   - Allows development without backend setup
2. **Supabase mode**: API routes query Supabase with RLS policies
   - Uses optimized `learning_aid_stats` view for performance
   - 40x faster than original N+1 query approach
3. Components always call API routes, never directly query Supabase (separation of concerns)

### Component Organization

**Filter Components** (multiple versions exist, only one is active):
- `components/filters/simple-filter-panel.tsx` - **ACTIVE**: Current filter UI
- `components/filters/filter-panel.tsx` - Deprecated (more complex version)
- `components/filters/new-filter-panel.tsx` - Experimental (not in use)

**Feed Components**:
- `components/feed/learning-aid-card.tsx` - Main card component with stats, badges, actions
- `components/feed/learning-aid-skeleton.tsx` - Loading skeleton for cards

**Shared Components**:
- `components/comments-section.tsx` - Comments UI with add/view/delete + modals
- `components/rating-stars.tsx` - 5-star rating with login requirement
- `components/search-bar.tsx` - RTL-optimized search input
- `components/user-menu.tsx` - User dropdown with logout
- `components/ui/alert-dialog.tsx` - Modal confirmation dialogs (shadcn/ui)
- `components/ui/*` - Other shadcn/ui primitives (button, card, dropdown, etc.)

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

## Common Development Workflows

### Starting a New Development Session

1. **Pull latest changes**: `git pull origin main`
2. **Check Supabase connection**: `npx tsx verify-supabase.ts`
3. **Start dev server**: `npm run dev`
4. **Check for errors**: Open browser console and terminal

### Making Database Changes

1. **Create migration**: Create new SQL file in `supabase/migrations/`
2. **Name format**: `YYYYMMDDHHMMSS_description.sql`
3. **Apply migration**: Run SQL in Supabase Studio SQL Editor OR use `npx tsx run-migration.ts`
4. **Verify**: Use `npx tsx verify-full-setup.ts`

### Adding Sample Data

```bash
# Seed database with 8 sample learning aids
npx tsx scripts/seed-supabase.ts

# Quick seed for testing
npx tsx scripts/quick-seed.ts
```

### Debugging Supabase Issues

```bash
# Check connection
npx tsx verify-supabase.ts

# Check storage buckets
npx tsx check-storage.ts

# Check uploaded files
npx tsx check-uploads.ts

# Full system check
npx tsx verify-full-setup.ts
```

### Deploying Changes

```bash
# 1. Test locally first
npm run build

# 2. Commit and push
git add .
git commit -m "Your descriptive message"
git push origin main

# 3. Vercel auto-deploys (check deploy status at vercel.com)
```

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

### Interaction Testing Checklist

1. **Authentication Flow**:
   - [ ] Can sign up with email
   - [ ] Can login with magic link
   - [ ] Can logout
   - [ ] Unauthenticated users redirected when trying to interact

2. **Engagement Features**:
   - [ ] Can add rating (requires login)
   - [ ] Can add comment (requires login)
   - [ ] Can delete own comment (shows modal)
   - [ ] Cannot delete others' comments
   - [ ] Can toggle reactions (heart/brain/lightbulb)
   - [ ] Optimistic updates work (reactions appear immediately)

3. **WhatsApp Share**:
   - [ ] Opens WhatsApp with Hebrew pre-filled message
   - [ ] Deep link works (includes aid ID and user ref)
   - [ ] Shared links work without login (read-only)

4. **Upload Flow**:
   - [ ] Can select image from device
   - [ ] Chapter and aid type selects work
   - [ ] Upload succeeds and shows success message
   - [ ] Redirects to feed after 2 seconds

### Current Implementation Status

**✅ Deployed to Production**: https://dermnemonic.vercel.app  
**GitHub**: https://github.com/OmriAloni/dermnemonic

**Working Features** (as of May 2, 2026 - Evening):
- ✅ **Authentication** - Magic link signup/login via Supabase Auth
- ✅ **Upload Flow** - Image upload to Supabase Storage with chapter/aid type selection + success message
- ✅ **Feed Page** - List view with search, filters, and sort
- ✅ **Detail Pages** - Individual learning aid with carousel navigation (side arrows + top counter)
- ✅ **Comments** - Add, view, and delete comments with in-app modal confirmation
- ✅ **Ratings** - 5-star rating system with login requirement
- ✅ **Reactions** - Heart/Brain/Lightbulb buttons with optimistic updates
- ✅ **WhatsApp Share** - Pre-filled Hebrew messages with deep links
- ✅ **Like & Save** - Both require login with consistent redirect UX
- ✅ **Search** - Search by title, body, explanation, or tags
- ✅ **Filters** - Chapter and aid type filtering
- ✅ **Quiz Page** - Basic quiz mode implemented
- ✅ **Uploaders Page** - List of all content uploaders
- ✅ **Hebrew RTL** - Full right-to-left support with Heebo font
- ✅ **Chapter Badges** - Hebrew chapter names on feed cards and detail pages
- ✅ **Verified Badges** - Shows curator-verified content
- ✅ **Loading Skeletons** - Smooth loading experience
- ✅ **Empty States** - Helpful messages for no results, login required, no comments
- ✅ **Performance** - 40x optimized (database stats view, 2 queries vs 41)
- ✅ **Mobile Responsive** - 44px+ touch targets, responsive layouts, optimized grids

**Critical for Contest** (June 3, 2026):
1. **Upload 15-20 quality Hebrew mnemonics** - Most important! Content is what judges will see
2. **Image blur placeholders** - Better loading experience (15 min task)
3. **Lighthouse audit** - Verify 90+ performance score maintained (15 min)
4. **Real device testing** - Test on actual iPhone/Android devices (30 min)
5. **Final polish** - Any last-minute UX tweaks based on device testing

Estimated time: ~1 hour for items 2-5, then 2-3 hours for content upload

**Not Yet Implemented** (lower priority for contest):
- Study sets with spaced repetition (SM-2 algorithm)
- Live conference mode (`/live` and `/live/projector`)
- AI quiz generator (Anthropic API integration)
- Curator dashboard (`/curator`)
- Card-based swipeable UI mode (flashcard style)
- User profiles (`/profile/[username]`)

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

**✅ Completed Performance Optimization** (May 2, 2026):

The N+1 query problem has been **solved** with a 40x performance improvement:

- **Before**: 41 database queries for 10 learning aids (N+1 pattern)
- **After**: 2 queries total (feed + stats view)
- **Implementation**: Created `learning_aid_stats` database view
- **Files**:
  - `supabase/migrations/20260502000000_add_stats_view.sql` - Stats view migration
  - `app/api/aids/route.ts` - Optimized to use view with single JOIN

**Current Performance**:
- Page load time: <2 seconds
- Lighthouse score: 90+ (target met)
- Loading skeletons implemented for perceived performance

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

## Recent Session Notes

For understanding recent changes and decisions:

- `SESSION-MAY-2-FINAL.md`: Latest session summary (May 2, 2026)
- `TODO.md`: Current priorities and completion status
- `MOBILE-AUDIT.md`: Mobile optimization checklist
- `POLISH-PLAN.md`: Polish tasks for contest readiness
- `SESSION-MAY-2-2026.md`: Mid-day session notes

These files contain context on recent bug fixes, feature additions, and rationale for UX decisions.

## Medical Content Constraints

Never generate medical content. The curator (a practicing dermatologist) provides all content via:

1. JSON import at `/curator` dashboard (not yet implemented)
2. Upload form at `/upload` (basic version exists)
3. Direct database seeding (for initial demo)

All uploaded content must be marked `verified = false` by default unless uploader has `role = 'curator'` or `'verified_contributor'`.

## Troubleshooting

### Build Errors

**"Module not found" errors**:
```bash
rm -rf node_modules .next
npm install
npm run build
```

**TypeScript errors**:
- Check `tsconfig.json` for strict mode settings
- Ensure all types in `lib/types.ts` match database schema
- Run `npm run lint` to see all errors

### Supabase Connection Issues

**"Invalid Supabase URL"**:
- Check `.env.local` has correct values
- Verify no trailing slashes in `NEXT_PUBLIC_SUPABASE_URL`
- Restart dev server after changing env vars

**"JWT token invalid"**:
- Check `SUPABASE_SERVICE_ROLE_KEY` has no newlines
- Copy entire token as single line
- Redeploy to Vercel if in production

**Storage bucket not found**:
```bash
# Check bucket configuration
npx tsx check-storage.ts

# Create bucket via Supabase Studio:
# Storage > New Bucket > Name: "learning-aid-media" > Public: true
```

### Deployment Issues

**Vercel build fails**:
- Check environment variables in Vercel dashboard
- Ensure all 4 env vars are set (no newlines in JWT tokens)
- Check build logs for specific error

**Auth redirect loop**:
- Add Vercel URL to Supabase Auth redirect URLs
- Format: `https://your-app.vercel.app/**`
- Wait ~1 minute for Supabase to update

**Images not loading in production**:
- Check Supabase Storage bucket is public
- Verify `NEXT_PUBLIC_APP_URL` matches actual domain
- Check browser console for CORS errors

### Performance Issues

**Slow page load**:
- Check database has `learning_aid_stats` view (migration `20260502000000`)
- Verify API uses view in `app/api/aids/route.ts`
- Check Supabase query performance in dashboard

**Out of memory during build**:
- Increase Vercel function memory limit (Pro plan)
- Or optimize bundle size (check `next.config.ts`)

### UI/Layout Issues

**RTL layout broken**:
- Check `<html dir="rtl">` in `app/layout.tsx`
- Use logical CSS properties (`ms-4` not `ml-4`)
- Test with Chrome DevTools RTL mode

**Filters not working**:
- Check `lib/aid-types.ts` has all filter vocabularies
- Verify `locales/he.json` has translations
- Check API route filtering logic in `app/api/aids/route.ts`

**Hebrew font not loading**:
- Check Heebo font import in `app/layout.tsx`
- Verify `font-sans` class applied to body
- Clear browser cache and hard reload

### Getting Help

- Check `TODO.md` for known issues and next steps
- Read `SESSION-MAY-2-2026.md` for recent changes
- Review `README.md` for full project documentation
- Consult `../CLAUDE.md` for high-level project context
