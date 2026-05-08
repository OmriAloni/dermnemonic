# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Context**: This is the development guide for the Next.js app. The parent directory (`../CLAUDE.md`) contains high-level project requirements and design patterns. Read that first for full context.

## Essential Commands

```bash
# Development
npm run dev                              # Start dev server (http://localhost:3000)
npm run build                            # Build for production
npm run lint                             # Run linter

# Quiz management
npx tsx scripts/extract-pdf-questions.ts    # Extract questions from PDFs
npx tsx scripts/attach-quiz-images.ts       # Attach images to questions

# Supabase verification
npx tsx verify-supabase.ts              # Check connection
npx tsx scripts/seed-supabase.ts        # Seed 8 sample learning aids
npx tsx verify-full-setup.ts            # Full system check (auth, storage, RLS)

# Troubleshooting
npx tsx check-storage.ts                # Fix storage bucket issues
rm -rf .next && npm run dev             # Clear cache and restart
```

## Quiz System (158 Questions)

The quiz system uses static JSON files for questions and images:

**File locations:**
- `public/quiz-questions.json` - 158 questions (145 Israeli Board + 13 Hebrew)
- `public/quiz-images/` - 39 clinical images from board exam
- `lib/quiz-questions.ts` - QuizQuestion interface and utilities

**Question structure:**
```typescript
interface QuizQuestion {
  id: string              // e.g., "american-board-001"
  chapter: string         // Bolognia chapter (e.g., "psoriasis")
  question: string        // Question text (Hebrew)
  options: string[]       // 4 options
  correctAnswer: number   // Index 0-3
  explanation: string     // Answer explanation (can be empty)
  imageUrl?: string       // Optional: "/quiz-images/american-board-001.png"
}
```

**Adding new questions:**
1. Edit `public/quiz-questions.json` directly, or
2. Use extraction scripts for PDF sources

**Adding images:**
1. Place images in `public/quiz-images/`
2. Add `imageUrl` field to corresponding question in JSON
3. Format: `/quiz-images/question-id.png`

## Quick Start

1. **Install**: `npm install`
2. **Configure**: Copy `.env.local.example` to `.env.local` and add Supabase credentials (see below)
3. **Verify**: `npx tsx verify-supabase.ts`
4. **Seed**: `npx tsx scripts/seed-supabase.ts`
5. **Run**: `npm run dev`

**Test credentials**: `test@dermnemonic.com` / `test123456`

**Graceful degradation**: App works without Supabase (read-only mode using `data/learning-aids.json`)

### Setting up .env.local

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then fill in values from your Supabase project settings:

```env
# Get these from Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get from Supabase Dashboard → Project Settings → API → service_role (DO NOT expose in browser!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Vercel URL (or http://localhost:3000 for local dev)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Critical notes**: 
- JWT keys must be on a single line (no newlines)
- Never commit `.env.local` to git (already in `.gitignore`)
- Service role key is for server-side only (API routes, server components)
- Restart dev server after changing env vars

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

### Adding authenticated API routes

Pattern for protecting API routes:

```typescript
// app/api/your-route/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your logic here using user.id
  const body = await request.json()
  const { data, error } = await supabase
    .from('your_table')
    .insert({ ...body, user_id: user.id })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

**Critical notes**:
- Always use `await createClient()` from `lib/supabase/server.ts` in API routes
- Never use the browser client in API routes
- Always check `authError` before using `user` (user can be null even without error)
- Use `user.id` for database operations, not email or other fields

### When to use 'use client' vs server components

Next.js 16 defaults to Server Components. Add `'use client'` only when needed:

**Use Server Components (default) when:**
- Fetching data from database
- Reading cookies/headers
- No user interaction (static content)
- SEO-critical content

```typescript
// app/aid/[id]/page.tsx (Server Component - no 'use client')
export default async function AidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: aid } = await supabase
    .from('learning_aids')
    .select('*')
    .eq('id', id)
    .single()
  
  return <div>{aid.title}</div>
}
```

**Use Client Components when:**
- Using React hooks (useState, useEffect, useCallback)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring browser context

```typescript
'use client'
import { useState } from 'react'

// components/search-bar.tsx (Client Component)
export function SearchBar() {
  const [query, setQuery] = useState('')
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === '/') {
          e.preventDefault()
        }
      }}
    />
  )
}
```

**Hybrid pattern (recommended):**
```typescript
// app/bookmarks/page.tsx (Server Component)
export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: bookmarks } = await supabase.from('bookmarks').select('*')
  
  // Pass data to client component
  return <BookmarksList initialBookmarks={bookmarks} />
}

// components/bookmarks-list.tsx (Client Component)
'use client'
export function BookmarksList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  
  const handleDelete = (id: string) => {
    // Interactive logic here
  }
  
  return <div>{/* ... */}</div>
}
```

**Decision tree:**
1. Does it need interactivity or hooks? → `'use client'`
2. Does it need to read cookies/headers? → Server Component
3. Does it fetch data? → Server Component (fetch at page level, pass to client components)
4. Is it purely presentational with no state? → Server Component (faster, smaller bundle)

## Current Implementation Status

**Production URL**: https://dermassociations.vercel.app  
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

### Adding new RLS policies

When adding features that require database access control:

**1. Understand the three policy types:**
- SELECT: Who can read rows
- INSERT: Who can create rows
- DELETE: Who can remove rows (UPDATE is similar)

**2. Use this template:**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_your_feature.sql

-- Enable RLS on your table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy for reading (SELECT)
CREATE POLICY "users_can_read_their_items"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for creating (INSERT)
CREATE POLICY "authenticated_users_can_create"
  ON your_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for deleting (DELETE)
CREATE POLICY "users_can_delete_their_items"
  ON your_table FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_your_table_user_id ON your_table(user_id);
```

**3. Common policy patterns:**
- Public read: `USING (true)`
- Authenticated only: `USING (auth.uid() IS NOT NULL)`
- Curators only: `USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'curator'))`
- Owner only: `USING (auth.uid() = user_id)`
- Owner or curator: `USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'curator'))`

**4. Testing RLS policies:**
```typescript
// Test as different users
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Should return only rows user can access
// Check error for permission denied
```

## Common Development Tasks

### Adding a new page route

**Step-by-step example (bookmarks page):**

**1. Create page file** `app/bookmarks/page.tsx`:
```typescript
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTranslation } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'הסימניות שלי | Dermnemonic',
  description: 'כל עזרי הלמידה שסימנת'
}

export default async function BookmarksPage() {
  const supabase = await createClient()
  const t = await getTranslation('he')
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>{t('auth.loginRequired')}</div>
  }
  
  // Fetch data
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*, learning_aids(*)')
    .eq('user_id', user.id)
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t('bookmarks.title')}</h1>
      {/* Your content */}
    </div>
  )
}
```

**2. Add navigation link** in `components/user-menu.tsx` or layout:
```typescript
<Link href="/bookmarks">
  {t('nav.bookmarks')}
</Link>
```

**3. Add translations** to `locales/he.json`:
```json
{
  "bookmarks": {
    "title": "הסימניות שלי"
  },
  "nav": {
    "bookmarks": "סימניות"
  }
}
```

**4. Test:**
- Visit `/bookmarks` in browser
- Check page title in browser tab
- Verify RTL layout
- Test with and without authentication

### Modifying filters

**Active filter component**: `components/filters/simple-filter-panel.tsx` (chapter + aid type only)

**To add a new filter category (e.g., "diagnosis"):**

**1. Update TypeScript types** in `lib/types.ts`:
```typescript
export type TagCategory = 
  | 'diagnosis'  // ← Add this
  | 'sign'
  | 'pathology'
  // ... existing categories
```

**2. Add vocabulary** in `lib/aid-types.ts`:
```typescript
export const DIAGNOSIS_TYPES = [
  'psoriasis',
  'melanoma',
  'lupus',
  // ... more diagnoses
] as const

export type DiagnosisType = typeof DIAGNOSIS_TYPES[number]
```

**3. Add Hebrew translations** in `locales/he.json`:
```json
{
  "filters": {
    "diagnosis": {
      "label": "אבחנה",
      "all": "כל האבחנות",
      "psoriasis": "פסוריאזיס",
      "melanoma": "מלנומה",
      "lupus": "לופוס"
    }
  }
}
```

**4. Update filter UI** in `components/filters/simple-filter-panel.tsx`:
```typescript
import { DIAGNOSIS_TYPES } from '@/lib/aid-types'

// Add dropdown
<select onChange={(e) => setDiagnosisFilter(e.target.value)}>
  <option value="">{t('filters.diagnosis.all')}</option>
  {DIAGNOSIS_TYPES.map(type => (
    <option key={type} value={type}>
      {t(`filters.diagnosis.${type}`)}
    </option>
  ))}
</select>
```

**5. Update API filtering** in `app/api/aids/route.ts`:
```typescript
// Add to URL params
const diagnosis = searchParams.get('diagnosis')

// Add to query
let query = supabase.from('learning_aids').select('*')

if (diagnosis) {
  query = query.contains('tags', [diagnosis])
}
```

**6. Test:**
- Select filter on feed page
- Verify results update correctly
- Check URL params update
- Test with multiple filters combined

### Working with Hebrew RTL

**Critical rules**:
- Use **logical CSS properties**: `ms-4` (not `ml-4`), `me-4` (not `mr-4`)
- Directional icons need rotation: `className="rtl:rotate-180"`
- English medical terms: wrap in `<span dir="ltr" className="inline-block">`
- Font stack: Heebo (Hebrew) + Inter (English fallback)

**Testing RTL layout:**
- Use Chrome DevTools → Elements → Computed → Direction
- Test on actual Hebrew content (not Lorem Ipsum)
- Check arrow icons, margins, text alignment
- Verify English medical terms display LTR within RTL text

### Adding Hebrew UI strings

**Workflow for new UI text:**

**1. Add to `locales/he.json`:**
```json
{
  "bookmarks": {
    "title": "הסימניות שלי",
    "empty": "אין לך סימניות עדיין",
    "add": "הוסף לסימניות",
    "remove": "הסר מסימניות",
    "added": "נוסף לסימניות",
    "removed": "הוסר מסימניות"
  }
}
```

**2. Use in client components:**
```typescript
'use client'
import { useTranslation } from '@/lib/i18n'

export function BookmarksButton({ aidId }: { aidId: string }) {
  const { t } = useTranslation('he')
  const [bookmarked, setBookmarked] = useState(false)
  
  return (
    <button>
      {bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
    </button>
  )
}
```

**3. Use in server components:**
```typescript
import { getTranslation } from '@/lib/i18n'

export default async function BookmarksPage() {
  const t = await getTranslation('he')
  
  return (
    <div>
      <h1>{t('bookmarks.title')}</h1>
      <p className="text-muted-foreground">{t('bookmarks.empty')}</p>
    </div>
  )
}
```

**Translation guidelines:**
- Use informal Hebrew (דיבור רגיל) not formal/biblical
- Keep strings short and mobile-friendly
- Medical terms stay in English: `<span dir="ltr">Psoriasis</span>`
- Action buttons use verbs: "הוסף" (add), "ערוך" (edit), "מחק" (delete)
- Error messages should be helpful: "משהו השתבש. נסה שוב" not just "שגיאה"
- Numbers and dates: use Hebrew formatting (`new Intl.NumberFormat('he-IL')`)

### Making database changes

**Step-by-step workflow:**

**1. Create migration file:**
```bash
# Use format: YYYYMMDDHHMMSS_descriptive_name.sql
# Get timestamp: date +%Y%m%d%H%M%S
touch supabase/migrations/20260508120000_add_bookmarks.sql
```

**2. Write SQL with this structure:**
```sql
-- supabase/migrations/20260508120000_add_bookmarks.sql

-- Add table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, aid_id)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (see "Adding new RLS policies" section above)
CREATE POLICY "users_can_read_their_bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_aid_id ON bookmarks(aid_id);

-- Add helpful comments
COMMENT ON TABLE bookmarks IS 'User bookmarks for learning aids';
```

**3. Apply migration:**
- **Recommended**: Copy SQL into Supabase Studio → SQL Editor → Run
- **Alternative**: `npx tsx run-migration.ts` (requires editing file path in script)

**4. Verify:**
```bash
npx tsx verify-full-setup.ts
```

**5. Test locally:**
```typescript
// Create test data
const { data, error } = await supabase
  .from('bookmarks')
  .insert({ aid_id: 'some-uuid' })

// Verify RLS works (try as different users)
// Check indexes: EXPLAIN ANALYZE SELECT * FROM bookmarks WHERE user_id = 'uuid'
```

**Migration best practices:**
- One migration per feature/change
- Include rollback comments for complex changes
- Test RLS policies thoroughly (try accessing as different users)
- Add indexes for foreign keys and commonly queried columns
- Use `ON DELETE CASCADE` for child tables to prevent orphans

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

## Common gotchas and debugging

### Next.js 16 specific issues

**"Dynamic server usage" error:**
```
Error: Route /your-route used dynamic rendering (cookies, headers, searchParams)
```

**Fix**: Add `export const dynamic = 'force-dynamic'` to the page:
```typescript
export const dynamic = 'force-dynamic'

export default async function YourPage() {
  // Now you can use cookies(), headers(), etc.
}
```

**Async params/searchParams:**
```typescript
// ❌ Wrong (Next.js 16)
export default async function Page({ params }) {
  const id = params.id  // Error!
}

// ✅ Correct (Next.js 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### Supabase common issues

**"Failed to fetch" or 401 errors:**
1. Check `.env.local` has correct credentials
2. Verify you're using the right client (server vs browser)
3. Check RLS policies allow the operation
4. Restart dev server after env changes

**RLS policy not working:**
```typescript
// Debug: Check what user Supabase sees
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user?.id)

// Check policy in SQL:
SELECT * FROM your_table WHERE auth.uid() = user_id;
```

**Image uploads failing:**
```bash
# Check storage bucket exists and is public
npx tsx check-storage.ts

# Verify bucket name matches code
# Code uses: 'learning-aid-media'
# Supabase Studio: Storage → Buckets
```

### React/TypeScript issues

**"Rendered more hooks than previous render":**
- Caused by conditional hooks (useState, useEffect in if statements)
- Fix: Move hooks to top level, use variables for conditionals

**TypeScript "Type 'null' is not assignable":**
```typescript
// ❌ Problem
const user = await getUser()
const name = user.name  // Error if user can be null

// ✅ Solution 1: Optional chaining
const name = user?.name

// ✅ Solution 2: Early return
if (!user) return null
const name = user.name

// ✅ Solution 3: Type guard
if (user) {
  const name = user.name
}
```

### Performance debugging

**Slow API routes:**
```typescript
// Add timing logs
console.time('query')
const { data } = await supabase.from('aids').select('*')
console.timeEnd('query')  // Shows: query: 1234ms
```

**Check if stats view is being used:**
```sql
-- In Supabase Studio SQL Editor
EXPLAIN ANALYZE 
SELECT * FROM learning_aid_stats 
WHERE id = 'some-uuid';

-- Should show "Seq Scan on learning_aid_stats" not multiple joins
```

**Bundle size issues:**
```bash
# Build and check bundle
npm run build

# Look for "First Load JS" in output
# Page should be < 200kB
# If larger, check for:
# - Heavy client components
# - Unused dependencies
# - Large icons/images
```

## Troubleshooting

### Build errors

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
