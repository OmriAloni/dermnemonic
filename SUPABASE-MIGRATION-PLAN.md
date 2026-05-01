# Supabase Migration Plan

## Quick Start Checklist

### 1. Create Supabase Project (5 min)
```bash
# Go to https://supabase.com
# Click "New Project"
# Save these values:
- Project URL: https://xxxxx.supabase.co
- Anon Public Key: eyJhbGci...
- Service Role Key: eyJhbGci... (keep secret!)
```

### 2. Install Supabase Client (1 min)
```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 4. Database Schema
Copy schema from `/Users/omrialon/Documents/yuval/CLAUDE.md` (lines ~10-150)

Run in Supabase SQL Editor:
```sql
-- Create tables: users, learning_aids, tags, etc.
-- See CLAUDE.md for full schema
```

### 5. Migrate Existing Data
**Option A:** Manual (Supabase Dashboard)
- Upload `data/learning-aids.json` via Supabase Table Editor

**Option B:** Script (Recommended)
```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import aids from '../data/learning-aids.json'

const supabase = createClient(url, serviceKey)

// Insert aids
for (const aid of aids.aids) {
  await supabase.from('learning_aids').insert(aid)
}
```

### 6. Migrate Images
- Upload from `public/uploads/` to Supabase Storage bucket
- Update `media_url` paths in database

### 7. Update API Routes

**Before (Local):**
```typescript
// app/api/aids/route.ts
const data = await fs.readFile('data/learning-aids.json')
return Response.json(JSON.parse(data))
```

**After (Supabase):**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase
    .from('learning_aids')
    .select('*, uploader(*), tags(*)')
  return Response.json(data)
}
```

### 8. Update Upload API
```typescript
// Upload image to Supabase Storage
const { data: uploadData } = await supabase.storage
  .from('learning-aids')
  .upload(`${userId}/${filename}`, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('learning-aids')
  .getPublicUrl(uploadData.path)
```

### 9. Star Ratings → Database
Replace localStorage with Supabase:
```typescript
// Before: localStorage.setItem('aid-ratings', ...)
// After:
await supabase.from('ratings').upsert({
  aid_id: aidId,
  user_id: userId,
  rating: stars
})
```

### 10. Deploy to Vercel
```bash
# Connect GitHub repo
vercel

# Add environment variables in Vercel dashboard
# Auto-deploys on git push
```

---

## File Changes Needed

### Create:
1. `lib/supabase/client.ts` - Client-side Supabase client
2. `lib/supabase/server.ts` - Server-side Supabase client
3. `lib/supabase/middleware.ts` - Auth middleware
4. `scripts/migrate-to-supabase.ts` - One-time migration script

### Modify:
1. `app/api/aids/route.ts` - Replace fs with Supabase
2. `app/api/upload/route.ts` - Upload to Supabase Storage
3. `components/feed/learning-aid-card.tsx` - Save ratings to DB
4. `app/aid/[id]/page.tsx` - Load ratings from DB
5. `app/uploaders/page.tsx` - Load ratings from DB

---

## Testing Strategy

1. **Local First:**
   - Keep JSON file working
   - Add Supabase alongside
   - Test both paths

2. **Gradual Migration:**
   - Day 1: Read-only from Supabase
   - Day 2: Uploads to Supabase
   - Day 3: Ratings to Supabase
   - Day 4: Delete local JSON

3. **Rollback Plan:**
   - Keep `data/learning-aids.json` as backup
   - Can switch back if needed

---

## Common Issues & Solutions

**Issue:** "Invalid API key"
- Check `.env.local` is loaded
- Restart dev server after adding env vars

**Issue:** CORS errors
- Enable RLS (Row Level Security) on tables
- Add policies for anon access

**Issue:** Images not loading
- Check Storage bucket is public
- Verify `publicUrl` path is correct

**Issue:** Hebrew text issues
- Ensure Postgres uses UTF-8
- Check `text` columns support Hebrew

---

## Estimated Timeline

- Supabase setup: **1 hour**
- Schema creation: **30 min**
- Data migration: **1 hour**
- API route updates: **2 hours**
- Testing: **1 hour**
- Deploy to Vercel: **30 min**

**Total: ~6 hours**

---

## Resources

- Supabase Docs: https://supabase.com/docs
- Next.js + Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Vercel Deploy: https://vercel.com/docs

---

Good luck! 🚀
