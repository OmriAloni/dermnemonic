# TODO - Next Session Priorities

## 🔥 Critical (Do First)

### 1. Performance Optimization ⚡
**Problem**: Feed page loads slowly (32+ database queries per page load)

**Fix**:
1. Create database view for stats aggregation:
   - File: `supabase/migrations/20260502000000_add_stats_view.sql`
   - View name: `learning_aid_stats`
   - Aggregates: rating_avg, rating_count, comment_count, reaction_count, save_count
   
2. Update `/app/api/aids/route.ts`:
   - Use single query with JOIN to stats view
   - Remove N+1 query loop
   
3. Add caching:
   - Install: `npm install swr`
   - Wrap feed data fetching with SWR
   - Add cache headers to API routes

4. Add loading states:
   - Skeleton loaders for feed cards
   - Loading spinner for detail pages
   - Optimistic UI updates for ratings/comments

**Expected Result**: Feed loads in <2 seconds instead of 5-10 seconds

---

## 🎯 Quick Wins (1-2 hours each)

### 2. Delete Comments
**What**: Users can delete their own comments

**Implementation**:
1. Add DELETE endpoint: `/app/api/aids/[id]/comments/[commentId]/route.ts`
2. Check comment ownership (user_id === auth user)
3. Add delete button to each comment (only show for own comments)
4. Update UI after deletion (optimistic update or refetch)

### 3. Reaction Buttons
**What**: Heart/brain/lightbulb emoji reactions on learning aids

**Implementation**:
1. Already have `reactions` table in database
2. Add POST endpoint: `/app/api/aids/[id]/reactions/route.ts`
3. Add reaction buttons component to card and detail page
4. Show reaction counts
5. Toggle reactions (click again to remove)

---

## 🚀 Deployment (After Performance Fix)

### 4. Git Setup
- [x] .gitignore created
- [ ] Review for any secrets in code
- [ ] Test build: `npm run build`
- [ ] Fix any build errors
- [ ] Commit and push to GitHub

### 5. Vercel Deployment
- [ ] Create Vercel project
- [ ] Add environment variables
- [ ] Update Supabase redirect URLs
- [ ] Deploy
- [ ] Test in production
- [ ] Run Lighthouse audit

---

## 📋 Medium Priority Features

### 6. User Profiles (`/profile/[username]`)
- Show user's uploaded learning aids
- Aggregate rating score
- Hospital and year of residency
- Follow button (use `follows` table)

### 7. Study Sets
- Use existing `study_sets` and `study_set_items` tables
- Create/edit sets
- Add aids to sets
- Set detail page with all aids

### 8. WhatsApp Share
- Share button opens WhatsApp
- Pre-filled message: "בדוק את עזר הלמידה הזה: [title]"
- Deep link to aid
- Track referrals (ref parameter in URL)

---

## 🎨 UI/UX Improvements

### 9. Image Optimization
- Add blur placeholders to all images
- Lazy loading on feed (IntersectionObserver)
- Compress uploaded images before saving

### 10. Error Handling
- Add error boundaries
- Better error messages (Hebrew)
- Toast notifications for actions
- Offline detection

### 11. Loading States
- Skeleton loaders everywhere
- Progress indicators for uploads
- Optimistic UI updates

---

## 🧪 Advanced Features (Later)

### 12. Quiz Mode
- Spaced repetition algorithm (SM-2)
- Card-based swipeable UI
- Track user progress
- Schedule next review

### 13. Live Conference Mode
- `/live` - QR code for audience
- `/live/projector` - Real-time feed display
- Supabase realtime subscriptions
- Live leaderboard

### 14. Curator Dashboard (`/curator`)
- Bulk verification
- Pin/unpin aids
- Featured carousel management
- User role management
- Content moderation

### 15. AI Quiz Generator
- Anthropic API integration
- Vision model for image analysis
- Generate 4-option MCQ
- Store generated questions

---

## 📊 Quality Checks Before Production

- [ ] Lighthouse score: 90+ performance, 95+ accessibility
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] All Hebrew RTL correct
- [ ] No console errors
- [ ] All images load
- [ ] Authentication flow works
- [ ] Upload works
- [ ] Comments/ratings work
- [ ] Search works
- [ ] Filters work
- [ ] 20+ quality learning aids loaded

---

## 🔑 Environment Variables Needed

Production (Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://pgzveeykjxpqwakazedc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=(when AI features ready)
```

---

## 📁 Files to Create/Modify

Next session will touch:
1. `supabase/migrations/20260502000000_add_stats_view.sql` - NEW
2. `app/api/aids/route.ts` - MODIFY (performance)
3. `app/api/aids/[id]/comments/[commentId]/route.ts` - NEW
4. `app/api/aids/[id]/reactions/route.ts` - NEW
5. `components/comments-section.tsx` - MODIFY (delete button)
6. `components/reaction-buttons.tsx` - NEW
7. `package.json` - ADD swr dependency

---

## 💡 Notes

- Test user credentials: test@dermnemonic.com / test123456
- Supabase URL: https://pgzveeykjxpqwakazedc.supabase.co
- All credentials in `.env.local` (not in git)
- Performance is #1 blocker for deployment
- Focus on speed + core features before advanced features
