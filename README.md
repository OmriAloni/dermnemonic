# Dermnemonic - פלטפורמת עזרי למידה לרופאי עור

Mobile-first collaborative platform for Israeli dermatology residents to share and study learning aids.

Built for the Israeli Dermatology Conference contest (June 3, 2026).

## ✨ Features

### ✅ Working Features
- **Hebrew RTL** - Full right-to-left support with Heebo font
- **Feed Page** - List view with learning aid cards
- **Search** - Search by title, body, explanation, or tags
- **Filters** - Filter by chapter (with Hebrew names) and aid type
- **Detail Page** - Full learning aid view with media
- **Interactive Ratings** - 5-star rating system
- **Comments** - Add and view comments on learning aids
- **Authentication** - Signup/login with Supabase Auth
- **Upload** - Image upload to Supabase Storage
- **Chapter Display** - Hebrew chapter badges (e.g., "פסוריאזיס", "אקזמה", "מלנומה")
- **Stats** - Real-time counts (ratings, comments, reactions, saves)
- **Mobile-optimized UI** - Warm color palette (#FAF6F2 background, #E97C7C primary)

### 🚧 Coming Soon
- Performance improvements (feed loading optimization)
- Delete comments functionality
- Reaction buttons (heart/brain/lightbulb)
- User profiles
- Study sets with spaced repetition
- Live conference mode
- AI quiz generator
- WhatsApp sharing with deep links

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Deployment**: Vercel
- **Font**: Heebo (Google Fonts)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- (Optional) Anthropic API key for AI features

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your keys
3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

**Option A: Using Supabase CLI (recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Option B: Manual setup**

1. Go to your Supabase dashboard > SQL Editor
2. Copy the content of `supabase/migrations/20260501000000_initial_schema.sql`
3. Paste and run it

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Dermnemonic feed with 3 mock learning aids in Hebrew!

## 📁 Project Structure

```
dermnemonic/
├── app/
│   ├── layout.tsx          # Root layout with Hebrew RTL + Heebo font
│   ├── page.tsx            # Main feed page with filters
│   └── globals.css         # Tailwind v4 CSS configuration
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── feed/              # Feed-related components
│   │   └── learning-aid-card.tsx
│   └── filters/           # Filter components
│       └── filter-panel.tsx
├── lib/
│   ├── types.ts           # TypeScript types
│   ├── i18n.ts            # Internationalization utilities
│   └── supabase/          # Supabase client configuration
├── locales/
│   ├── he.json            # Hebrew translations
│   └── en.json            # English translations
├── supabase/
│   └── migrations/        # Database schema
└── scripts/
    └── seed.ts            # Seed data script (not yet implemented)
```

## 📊 Database Schema

Key tables:
- `users` - User profiles with roles (curator/verified_contributor/contributor)
- `learning_aids` - Mnemonics, illustrations, videos, etc.
- `tags` - Controlled vocabulary for filtering (6 categories)
- `learning_aid_tags` - Junction table for many-to-many relationship
- `ratings`, `reactions`, `comments` - Engagement data
- `study_sets`, `study_set_items` - User collections with spaced repetition
- `follows` - User relationships

See `supabase/migrations/20260501000000_initial_schema.sql` for full schema with RLS policies.

## 🎯 Current Data

The database is populated with 8 sample learning aids including:
- **"5 P's של Lichen Planus"** - Classic mnemonic (Lichen Planus chapter)
- **"Sweet's Syndrome"** - Diagnostic criteria (Neutrophilic Dermatoses)
- **"Blueberry Muffin DDX"** - Visual differential diagnosis (Hemangiomas)
- **"ABCDE של מלנומה"** - Melanoma screening (Melanoma)
- Real Hebrew content with chapters mapped to Hebrew names

Test user: `test@dermnemonic.com` / `test123456`

## 🔍 Filters

The app supports comprehensive filtering by:
- **Diagnosis**: Psoriasis, Lichen Planus, Melanoma, Urticaria, Pemphigus, Atopic Dermatitis
- **Clinical Sign**: Auspitz, Nikolsky, Darier, Wickham striae
- **Pathology**: Spongiosis, Acantholysis, Parakeratosis, Hypergranulosis
- **Treatment**: Biologics, Retinoids, Topical steroids, Immunomodulators
- **Risk Factors**: Smoking, Sun exposure, Immunosuppression, Genetics, Obesity, Stress
- **Aid Type**: Mnemonic, Illustration, Table, Video, Audio
- **Status**: All, Verified, Pending

Filters work in combination and show a badge count of active filters.

## 🚀 Deployment to Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account (free tier works)
- Supabase project already set up

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Connect Vercel**
   - Go to [vercel.com](https://vercel.com) and import your repository
   - Framework preset: **Next.js**
   - Root directory: `./` (or `dermnemonic/` if in monorepo)

3. **Add Environment Variables** (in Vercel dashboard)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Configure Supabase**
   - In Supabase dashboard > Authentication > URL Configuration
   - Add your Vercel URL to:
     - Site URL: `https://your-app.vercel.app`
     - Redirect URLs: `https://your-app.vercel.app/**`

5. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for build to complete
   - Visit your production URL!

### Verify Deployment
- [ ] Feed loads and displays learning aids
- [ ] Search works
- [ ] Filters work
- [ ] Can create account and login
- [ ] Can upload images
- [ ] Can add ratings and comments
- [ ] All Hebrew text displays correctly (RTL)
- [ ] Mobile responsive

## 📝 Next Steps

1. **Supabase Setup**: Complete authentication and real data
2. **Upload Flow**: Build form with controlled tag vocabulary
3. **Detail View**: Individual learning aid pages with comments
4. **Card View**: Implement swipeable flashcard UI
5. **User Profiles**: Uploader pages with aggregate ratings
6. **Live Mode**: Real-time conference features with QR codes
7. **AI Features**: Sketch canvas + AI quiz generator (Anthropic API)
8. **Study Sets**: Collections with SM-2 spaced repetition
9. **WhatsApp Integration**: Share buttons with deep links

## 🎨 Design System

- **Background**: `#FAF6F2` (warm cream)
- **Primary**: `#E97C7C` (soft coral)
- **Font**: Heebo (Hebrew) + Inter (English)
- **Direction**: RTL (right-to-left) throughout
- **Dark Mode**: Supported via Tailwind

## 🌐 i18n

All UI strings are in `/locales/he.json` (primary) and `/locales/en.json` (fallback).
English medical terms render LTR inside Hebrew sentences.

## 📚 Reference Files

- `../CLAUDE.md` - Full project documentation
- `../dermnemonic-meta-prompt.md` - Complete spec
- `../טריקים ושטיקים לבולוניה.xlsx` - Real Hebrew mnemonics examples
- `../dermatology-curriculum.txt` - Bolognia textbook topics

## 🏆 Contest Info

**Deadline**: June 3, 2026  
**Competing Against**: A song, a poster, and a TikTok  
**Judging Criteria** (equal weight):
1. Medical accuracy
2. Creativity and originality
3. Fun aspect / learning experience

**Goal**: More useful, more beautiful, more fun 🎯

---

Built with ❤️ for Israeli dermatology residents
