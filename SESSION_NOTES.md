# Session Notes - 2026-05-01

## Current State (What's Working)

### ✅ Core Features Implemented
- **Feed page** (`/`)
  - List view with learning aid cards
  - Real-time stats from Supabase (ratings, comments, reactions, saves)
  - Search functionality (searches title, body, explanation, tags)
  - Filter by chapter and aid type
  - Chapter badges display Hebrew names (e.g., "פסוריאזיס", "אקזמה")
  
- **Detail page** (`/aid/[id]`)
  - Full learning aid view with media
  - Interactive 5-star rating system
  - Comments section with add/view functionality
  - Chapter display in Hebrew
  - Uploader info with avatar

- **Authentication**
  - Signup with profile creation (display_name, hospital, year_of_residency)
  - Login flow
  - User menu with logout
  - Test user: test@dermnemonic.com / test123456

- **Upload**
  - Basic upload form
  - Supabase Storage integration
  - Image uploads working

- **Database**
  - Supabase connected and working
  - All migrations run successfully
  - Sample data populated (8 learning aids with Hebrew content)
  - Chapter values mapped to Hebrew names via CHAPTERS constant

### 🎨 UI/UX
- Hebrew RTL support throughout
- Warm color palette (#FAF6F2 background, #E97C7C primary)
- Responsive design (mobile-first)
- shadcn/ui components
- Heebo font for Hebrew text

## 🐌 Known Performance Issues

### Slow Loading (Priority: HIGH)
The feed page is slow to load. Root causes:

1. **Stats calculation in GET /api/aids**
   - Currently runs 4 separate queries PER learning aid:
     ```typescript
     // For EACH aid in the array:
     - Query ratings table
     - Query comments table (with count)
     - Query reactions table (with count)
     - Query study_set_items table (with count)
     ```
   - With 8 aids, that's 32+ database queries per page load
   - **Fix needed**: Use a single JOIN query or database view with aggregated stats

2. **No caching**
   - API routes have no caching headers
   - Frontend has no SWR or React Query
   - Every navigation refetches everything

3. **No image optimization**
   - Images from Supabase Storage not optimized
   - No blur placeholders
   - No lazy loading on feed

### Recommended Performance Fixes (Next Session)

**High Priority:**
1. Create database view for aggregated stats:
   ```sql
   CREATE VIEW learning_aid_stats AS
   SELECT 
     la.id,
     COALESCE(AVG(r.stars), 0) as rating_avg,
     COUNT(DISTINCT r.id) as rating_count,
     COUNT(DISTINCT c.id) as comment_count,
     COUNT(DISTINCT re.id) as reaction_count,
     COUNT(DISTINCT s.id) as save_count
   FROM learning_aids la
   LEFT JOIN ratings r ON la.id = r.aid_id
   LEFT JOIN comments c ON la.id = c.aid_id
   LEFT JOIN reactions re ON la.id = re.aid_id
   LEFT JOIN study_set_items s ON la.id = s.aid_id
   GROUP BY la.id;
   ```

2. Update GET /api/aids to use the view (single query instead of N+1)

3. Add cache headers to API routes:
   ```typescript
   return NextResponse.json(aids, {
     headers: {
       'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
     }
   })
   ```

4. Install and configure SWR for client-side caching:
   ```bash
   npm install swr
   ```

**Medium Priority:**
5. Add image blur placeholders
6. Implement lazy loading for images in feed
7. Add loading skeleton states

## 📋 Feature Roadmap

### Quick Wins (1-2 hours)
- [ ] **Delete Comments** - Let users delete their own comments
- [ ] **Reaction Buttons** - Add heart/brain/lightbulb reactions to aids

### Medium Features (2-4 hours each)
- [ ] **User Profiles** (`/profile/[username]`)
- [ ] **Study Sets** - Collections with save/bookmark
- [ ] **Share Functionality** - WhatsApp sharing with deep links
- [ ] **Leaderboard** - Gamification and badges

### Advanced Features (4+ hours each)
- [ ] **Quiz Mode** - Spaced repetition with SM-2 algorithm
- [ ] **Live Conference Mode** (`/live` and `/live/projector`)
- [ ] **Curator Dashboard** (`/curator`) - Bulk verification, pinning
- [ ] **AI Quiz Generator** - MCQ generation from images (Anthropic API)

## 🚀 Deployment Checklist

### Before Git Push
- [ ] Create `.gitignore` (exclude `.env.local`, `node_modules/`, `.next/`)
- [ ] Remove any hardcoded secrets or test credentials
- [ ] Update README.md with:
  - Project description
  - Setup instructions
  - Environment variables needed
  - Deployment guide
- [ ] Run `npm run build` locally to verify production build works
- [ ] Run `npm run lint` and fix any issues

### Vercel Deployment
1. **Create Vercel project**
   - Connect GitHub repo
   - Set framework preset: Next.js
   - Root directory: `dermnemonic/` (if in monorepo) or `./`

2. **Environment Variables** (add in Vercel dashboard)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://pgzveeykjxpqwakazedc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ANTHROPIC_API_KEY=(when ready for AI features)
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **Supabase Configuration**
   - Add Vercel domain to Supabase "Allowed Redirect URLs"
   - Add Vercel domain to Supabase "Site URL"
   - Enable "Confirm email" in Supabase Auth settings (production)

4. **Deploy**
   - Push to main branch (auto-deploys)
   - Or use `vercel --prod` CLI

### Post-Deployment
- [ ] Test authentication flow on production
- [ ] Test image uploads
- [ ] Test all CRUD operations
- [ ] Run Lighthouse audit (target: 90+ performance, 95+ accessibility)
- [ ] Test on mobile device (iOS/Android)

## 🗂️ File Structure

```
dermnemonic/
├── app/
│   ├── layout.tsx                 # Root layout (RTL, Heebo font)
│   ├── page.tsx                   # Feed with filters & search
│   ├── aid/[id]/page.tsx          # Detail page
│   ├── upload/page.tsx            # Upload form
│   ├── auth/
│   │   ├── signup/page.tsx
│   │   └── login/page.tsx
│   └── api/
│       ├── aids/
│       │   ├── route.ts           # GET/POST learning aids
│       │   └── [id]/
│       │       ├── route.ts       # GET single aid
│       │       ├── comments/route.ts
│       │       └── ratings/route.ts
│       └── upload/route.ts        # Image upload to Supabase Storage
├── components/
│   ├── feed/
│   │   └── learning-aid-card.tsx  # Card component
│   ├── filters/
│   │   └── simple-filter-panel.tsx
│   ├── ui/                        # shadcn components
│   ├── comments-section.tsx
│   ├── rating-stars.tsx
│   ├── search-bar.tsx
│   └── user-menu.tsx
├── lib/
│   ├── types.ts                   # TypeScript interfaces
│   ├── chapters.ts                # Chapter definitions (Hebrew/English)
│   ├── aid-types.ts               # Filter vocabularies
│   └── supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server client
│       └── middleware.ts          # Middleware client
├── supabase/
│   └── migrations/
│       └── 20260501000000_initial_schema.sql
├── data/
│   └── learning-aids.json         # Mock data (fallback)
├── .env.local                     # NOT in git
├── CLAUDE.md                      # Development guide
└── SESSION_NOTES.md               # This file
```

## 🔑 Key Technical Decisions

1. **Supabase client architecture**: Three separate clients (browser, server, middleware) to avoid auth context issues

2. **Chapter system**: Store slugs ('psoriasis', 'eczema') in database, map to Hebrew via CHAPTERS constant for display

3. **Stats calculation**: Currently N+1 queries (needs optimization via database view)

4. **Authentication**: Supabase Auth with fallback user for development

5. **File uploads**: Supabase Storage with pattern `userId/timestamp.ext`

6. **Hebrew RTL**: 
   - Use logical CSS properties (`ms-*`, `me-*` instead of `ml-*`, `mr-*`)
   - Wrap English medical terms in `<span dir="ltr">` when needed
   - Root layout has `dir="rtl"`

## 🐛 Known Issues

1. **Performance**: Feed loads slowly (see Performance Issues section above)
2. **No loading states**: No skeleton loaders while fetching
3. **No error boundaries**: Runtime errors crash the whole page
4. **No offline support**: No PWA setup yet
5. **Card view mode**: Feed has "cards" button but only list view is implemented
6. **Study sets**: Database tables exist but UI not implemented
7. **Live mode**: Not implemented yet

## 📝 Notes for Next Session

### Immediate Priorities
1. **Fix performance** - This is blocking deployment
   - Add stats view to database
   - Update API route to use view
   - Add SWR for client caching
   
2. **Complete quick wins**
   - Delete comments functionality
   - Reaction buttons (heart/brain/lightbulb)

3. **Git & Vercel setup**
   - Create proper .gitignore
   - Update README
   - Deploy to Vercel
   - Test in production

### Context for Next Claude
- All Supabase credentials are in `.env.local` (don't regenerate)
- Test user: test@dermnemonic.com / test123456
- Database has 8 sample learning aids with real Hebrew content
- Chapters are stored as value slugs, displayed via CHAPTERS lookup
- The app works but is SLOW - performance is the #1 issue

### Medical Content Note
Never generate medical content. The curator (practicing dermatologist) will provide all content. Current sample data is for development only and should be marked as pending verification before production.

## 🎯 Success Criteria for Production

Before showing to contest judges:
- [ ] Feed loads in <2 seconds
- [ ] Mobile-optimized and tested on iPhone/Android
- [ ] All Hebrew text displays correctly (RTL)
- [ ] Authentication works reliably
- [ ] Images load quickly with good UX
- [ ] Lighthouse score: 90+ performance, 95+ accessibility
- [ ] No console errors
- [ ] Works in production (Vercel)
- [ ] Curator can upload content easily
- [ ] At least 20 high-quality learning aids loaded

## 🔗 Important Files to Reference

In parent directory (`../`):
- `CLAUDE.md` - Full project requirements
- `dermnemonic-meta-prompt.md` - Complete technical spec
- `טריקים ושטיקים לבולוניה.xlsx` - Real mnemonics (content gold standard)
- `TIPS_AND_MNEMONICS.md` - Extracted examples
- WhatsApp images - Design pattern examples

Current project:
- `/CLAUDE.md` - Development guide (comprehensive)
- `/SESSION_NOTES.md` - This file
- `/data/learning-aids.json` - Sample data structure
- `/supabase/migrations/` - Database schema
