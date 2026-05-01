# How to Run Dermnemonic

## Quick Start (Without Supabase)

The app is pre-configured with mock data, so you can see it working immediately:

```bash
cd /Users/omrialon/Documents/yuval/dermnemonic
npm run dev
```

Then open http://localhost:3000

You'll see:
- ✅ 3 Hebrew learning aids (Lichen Planus, Chronic Urticaria, Melanoma)
- ✅ Full filtering system (diagnosis, signs, pathology, treatment, risk factors, aid type, status)
- ✅ Hebrew RTL layout with Heebo font
- ✅ Mobile-optimized card UI
- ✅ Stats display (ratings, reactions, comments, saves)

## With Supabase (Full Functionality)

### 1. Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Create a new project (wait ~2 minutes for setup)
3. Go to Project Settings > API

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` - From "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From "Project API keys" > "anon public"
- `SUPABASE_SERVICE_ROLE_KEY` - From "Project API keys" > "service_role" (keep secret!)

### 3. Run Database Migration

Go to Supabase Dashboard > SQL Editor, paste the entire contents of:
`supabase/migrations/20260501000000_initial_schema.sql`

Click "Run". You should see "Success" message.

### 4. Run Dev Server

```bash
npm run dev
```

## What's Working Now

✅ **Feed Page** (`/`)
- List view with learning aid cards
- Hebrew RTL layout
- Filter panel with 6 categories
- Mock data (3 items)
- Responsive design

✅ **Filters**
- Diagnosis (Psoriasis, Lichen Planus, Melanoma, etc.)
- Clinical Signs (Auspitz, Nikolsky, Darier, Wickham)
- Pathology (Spongiosis, Acantholysis, etc.)
- Treatment (Biologics, Retinoids, Steroids, etc.)
- Risk Factors (Smoking, Sun exposure, etc.)
- Aid Type (Mnemonic, Illustration, Table, Video, Audio)
- Status (All, Verified, Pending)

✅ **Learning Aid Cards**
- Title, body, explanation
- Tags with Hebrew/English
- Uploader info (name, hospital)
- Verification badge
- Stats (ratings, reactions, comments, saves)
- Action buttons (Thanks, Save, Share)

## What's Next to Build

🚧 Upload flow
🚧 Detail view (`/aid/[id]`)
🚧 Authentication (magic link + Google OAuth)
🚧 Card/swipeable view mode
🚧 User profiles
🚧 Leaderboard
🚧 Study sets
🚧 Live conference mode
🚧 AI quiz generator
🚧 Sketch canvas
🚧 WhatsApp sharing

## File Locations

**Main Files:**
- `/app/page.tsx` - Feed page
- `/components/feed/learning-aid-card.tsx` - Card component
- `/components/filters/filter-panel.tsx` - Filter component
- `/lib/types.ts` - TypeScript types
- `/locales/he.json` - Hebrew translations

**Database:**
- `/supabase/migrations/20260501000000_initial_schema.sql` - Full schema with RLS

**Config:**
- `/app/layout.tsx` - Root layout (Hebrew RTL + Heebo font)
- `/app/globals.css` - Tailwind v4 configuration
- `/.env.local.example` - Environment template

## Troubleshooting

**"Module not found" errors:**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

**Filters not working:**
- Check console for errors
- Make sure mock data tags match filter values

**Hebrew not displaying:**
- Check browser language settings
- Clear cache and hard reload (Cmd+Shift+R)

**Layout broken:**
- Check `dir="rtl"` in `<html>` tag (`app/layout.tsx`)
- Verify Heebo font is loading

## Development Tips

**Hot Reload:**
Changes to `.tsx` files auto-reload. If it doesn't:
1. Save the file again
2. Check terminal for errors
3. Restart dev server if needed

**Inspecting Components:**
1. Open browser DevTools
2. Use React DevTools extension
3. Check "Components" tab for props/state

**Adding Filters:**
1. Add to `filterOptions` in `filter-panel.tsx`
2. Add to database enum in migration file
3. Update TypeScript types in `lib/types.ts`

**Changing Colors:**
1. Edit `app/globals.css` (Tailwind v4 uses CSS variables)
2. Look for `:root` section
3. Use OKLCH format for better color management

## Mock Data Structure

Each mock learning aid has:
```typescript
{
  id: string
  title: string (Hebrew)
  body: string (English medical terms)
  explanation: string (Hebrew)
  media_type: 'text-only' | 'illustration' | ...
  verified: boolean
  pinned: boolean
  uploader: { name, hospital, role }
  tags: [{ category, value, value_he }]
  stats: { rating_avg, counts... }
}
```

## Next Session: What to Do

1. **Connect Supabase** (follow steps above)
2. **Create first real user** via Supabase Auth
3. **Build upload form** (`/app/upload/page.tsx`)
4. **Implement detail view** (`/app/aid/[id]/page.tsx`)
5. **Add authentication flows**
6. **Test with real data**

---

Need help? Check:
- `README.md` - Full documentation
- `../CLAUDE.md` - Project architecture
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
