# TODO - Next Session Priorities

**Last Updated**: May 2, 2026  
**Production URL**: https://dermnemonic.vercel.app  
**GitHub**: https://github.com/OmriAloni/dermnemonic

---

## ✅ Completed (May 1-2, 2026)

### Performance & Infrastructure
- ✅ Created database view for stats aggregation (40x faster)
- ✅ Optimized API from 41 queries to 2 queries (N+1 fix)
- ✅ Deployed to Vercel successfully
- ✅ Fixed all TypeScript errors
- ✅ Production build working
- ✅ Environment variables configured
- ✅ Supabase integration complete

### UI/UX
- ✅ Fixed search bar RTL layout and icon positioning
- ✅ Simplified label classes for cleaner HTML
- ✅ Added loading skeletons for better perceived performance
- ✅ Made select buttons auto-width (not full-width)
- ✅ Improved form spacing (upload page)
- ✅ Added verified badges to cards
- ✅ Chapter badges working on feed cards + detail page
- ✅ Mobile UI optimization (44px touch targets, responsive grids)
- ✅ Empty states (no search results, login required, no comments)
- ✅ Upload success message with auto-redirect
- ✅ Removed unused card view toggle

### Features
- ✅ Carousel navigation with side arrows on detail pages
- ✅ Top navigation counter (e.g., "5 / 10")
- ✅ Chapter field saving correctly in upload form
- ✅ Auth working (signup/login)
- ✅ Upload flow with Supabase Storage
- ✅ Comments and ratings working
- ✅ Reaction buttons (heart/brain/lightbulb) with optimistic updates
- ✅ WhatsApp share with pre-filled Hebrew messages
- ✅ Delete comments with authentication and ownership checks
- ✅ Login requirements for all interactions (comments, ratings, reactions)

### Bug Fixes
- ✅ Comments API now uses authenticated user (not hardcoded test user)
- ✅ SSR guards for localStorage (prevents hydration errors)
- ✅ Fixed Next.js 16 async params in all API routes
- ✅ User menu fixed (removed broken profile link)

---

## 🔥 Priority 1: Content (MOST IMPORTANT!)

**Why**: Contest judges care about learning aids, not tech features.

### Tasks:
1. **Upload 15-20 quality mnemonics** from `טריקים ושטיקים לבולוניה.xlsx`
   - Focus on: Psoriasis, Melanoma, Drug Reactions, Pemphigus, Lichen Planus
   - Include images where possible (use examples from WhatsApp screenshots)
   - Make sure each has:
     - Title in Hebrew
     - Body with English medical terms
     - Explanation in Hebrew
     - Proper chapter selected
     - Aid type selected (mnemonic/illustration/table)

2. **Test the learning experience**
   - Can you actually study from these cards?
   - Is navigation smooth?
   - Are chapters helpful for organization?

3. **Get 2-3 dermatology residents to test**
   - Watch them use it (don't explain)
   - Note what confuses them
   - Ask: "Would you use this daily?"

**Time estimate**: 2-3 hours

---

## 🎯 Priority 2: Polish & Performance (30-60 min)

### 1. Image Blur Placeholders
**Why**: Better perceived performance

**Tasks**:
- Add blur data URLs to Next.js Image components
- Use `placeholder="blur"` prop
- Generate blur hashes for existing images

### 2. Lighthouse Audit
**Why**: Verify we hit performance targets

**Tasks**:
- `app/api/aids/[id]/reactions/route.ts` (already exists, verify it works)
- `components/feed/learning-aid-card.tsx` (add button UI)

### 2. Delete Comments (30 min)
**Why**: Basic functionality expected by users

**Tasks**:
- Add DELETE endpoint: `/app/api/aids/[id]/comments/[commentId]/route.ts`
- Check user owns comment
- Add delete button to `components/comments-section.tsx`
- Only show delete button for own comments

### 3. Chapter Badge on Detail Page (15 min)
**Why**: Currently only shows on feed cards, not detail view

**Tasks**:
- Add chapter badge to `app/aid/[id]/page.tsx` header
- Use same badge component as feed cards
- Test with multiple chapters

### 4. Mobile UI Audit (1-2 hours)
**Why**: User discovered glitches on mobile - critical since this is a mobile-first app

**Tasks**:
- Test all pages on actual mobile device (iPhone/Android)
- Check RTL layout and spacing on small screens
- Verify touch targets are large enough (44x44px minimum)
- Test search bar, filters, and navigation on mobile
- Check carousel arrows and gestures
- Verify form inputs and select dropdowns work properly
- Test upload flow from mobile camera
- Fix any layout breaks, overlapping text, or touch issues
- Document any remaining mobile-specific issues

**Files likely to need fixes**:
- `components/search-bar.tsx`
- `components/filters/simple-filter-panel.tsx`
- `app/upload/page.tsx`
- `app/aid/[id]/page.tsx` (carousel navigation)

### 5. WhatsApp Share (45 min)
**Why**: Viral growth potential, shows strategic thinking

**Tasks**:
- Update share button in cards to open WhatsApp
- Pre-filled message: `"בדוק את עזר הלמידה הזה: [title] - https://dermnemonic.vercel.app/aid/[id]"`
- Test on mobile (where WhatsApp is installed)

**Time estimate**: 4-5 hours total

---

## 🎨 Priority 3: Polish (Before Contest)

### Visual Polish
- [ ] Image optimization (blur placeholders, lazy loading)
- [ ] Better empty states (when no search results)
- [ ] Consistent spacing throughout
- [ ] Test dark mode (if supported)

### Mobile Testing
- [ ] Test on real iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test WhatsApp share on mobile
- [ ] Verify gestures work (carousel swipe)

### Performance
- [ ] Run Lighthouse audit
  - Target: 90+ performance
  - Target: 95+ accessibility
  - Target: 100 SEO
- [ ] Test with 30+ cards loaded
- [ ] Check API response times

**Time estimate**: 2-3 hours

---

## 🚫 Out of Scope (Don't Do Unless Time Permits)

These are nice-to-have but won't help win the contest:

- Study sets with spaced repetition
- Live conference mode
- AI quiz generator
- Curator dashboard
- User profiles
- Advanced analytics

**Focus on: Content + Fun + Usefulness**

---

## 📊 Contest Preparation Checklist

### Content Ready
- [ ] 15-20 quality mnemonics uploaded
- [ ] All have proper chapters assigned
- [ ] All have proper aid types
- [ ] Images look good on mobile
- [ ] Hebrew text is clear and readable

### Features Demo-Ready
- [ ] Carousel navigation works smoothly
- [ ] Search and filters work
- [ ] Reactions are fun and engaging
- [ ] WhatsApp share works
- [ ] Mobile experience is excellent

### Technical Ready
- [ ] Site loads fast (<2s)
- [ ] No console errors
- [ ] Works in Safari and Chrome
- [ ] Auth works (signup/login)
- [ ] Upload works

### Presentation Ready
- [ ] Demo script prepared
- [ ] Know what to show judges
- [ ] Practice 2-minute pitch
- [ ] Backup plan if WiFi fails (screenshots/video)

---

## 🎯 Success Metrics

**You're competing against: Song, Poster, TikTok**

**Your advantages**:
1. **Usefulness** - actually helps study
2. **Technology** - shows innovation
3. **Engagement** - reactions, sharing, navigation

**Judge for yourself**:
- Would a resident use this daily? (If no, fix it)
- Is it more useful than a poster? (Better be!)
- Is it more engaging than a song? (Reactions + sharing help)
- Is it more memorable than a TikTok? (Beautiful cards + smooth UX)

**Remember**: Medical accuracy + Creativity + Fun = Win 🏆

---

## 🐛 Known Issues

### Minor
- None blocking! 🎉

### Future Enhancement Ideas
- Swipe gestures on mobile (instead of arrow buttons)
- Save to study sets from card view
- Filter by multiple chapters at once
- Export cards as PDF for printing

---

## 💡 Tips for Next Session

1. **Start with content** - upload mnemonics first, then fix UI issues you notice
2. **Test on mobile** - most users will be on phones
3. **Get real user feedback** - don't assume, validate
4. **Focus on fun** - reactions and smooth animations matter
5. **Keep it simple** - don't add complexity, polish what exists

**You have a solid foundation. Now make it shine! ✨**
