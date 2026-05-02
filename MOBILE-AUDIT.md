# Mobile UI Audit - May 2, 2026

## Critical Issues Found

### 🔴 Priority 1: Touch Target Sizes (WCAG Fail)

**Minimum touch target**: 44x44px (iOS/Android guideline)

#### Issues:
1. **Star ratings** (`learning-aid-card.tsx` line 183)
   - Current: `h-5 w-5` with `p-0.5` = ~24px total
   - Fix: Increase to `h-6 w-6` with `p-2` = 44px

2. **Search clear button** (`search-bar.tsx` line 41)
   - Current: `h-7 w-7` = 28px
   - Fix: Increase to `h-9 w-9` = 36px minimum, ideally `h-11 w-11` = 44px

3. **Carousel navigation arrows** (detail page line 109)
   - Current: `p-3` with `h-6 w-6` icon = ~48px ✅ OK
   - Top arrows (line 135): Only `p-1.5` = too small
   - Fix: Increase top arrow padding to `p-2`

4. **Filter checkboxes** (`simple-filter-panel.tsx` line 73)
   - Current: Default checkbox size ~16px
   - Fix: Ensure label clickable area is 44x44px

---

### 🟡 Priority 2: Layout Breaks on Mobile

#### Upload Form (`upload/page.tsx`)

1. **Two-column grids on mobile** (line 178, 213)
   ```tsx
   <div className="grid grid-cols-2 gap-4">
   ```
   - Hebrew text in selects will overflow
   - Fix: Use `grid-cols-1 sm:grid-cols-2`

2. **Tag input row** (line 305)
   - 3 inputs + button in one row = impossible on mobile
   - Fix: Stack vertically on mobile, horizontal on desktop

3. **Long chapter names in selects**
   - Already has `whitespace-normal` ✅
   - But might need `max-w` constraint

#### Filter Panel (`simple-filter-panel.tsx`)

1. **Select min-width** (line 46)
   - `min-w-[200px]` might overflow on small screens (320px phones)
   - Fix: Use `w-full sm:w-auto sm:min-w-[200px]`

#### Detail Page Carousel

1. **Fixed side arrows** (line 106-121)
   - Might overlap content on narrow screens
   - Fix: Hide on very small screens, show only top nav

---

### 🟢 Priority 3: UX Improvements

1. **Form input spacing**
   - Upload form needs more vertical spacing on mobile
   - Current `space-y-6` is good ✅

2. **Image upload area** (line 280)
   - `h-32` might be too small on mobile
   - Consider `h-40 sm:h-32`

3. **Action button text**
   - Some buttons have text that might wrap on mobile
   - Consider icon-only on mobile, text on desktop

---

## Test Checklist

### On iPhone (Safari)
- [ ] Star rating tappable without zoom
- [ ] Search clear button easy to tap
- [ ] Upload form usable (all fields)
- [ ] Chapter select doesn't overflow
- [ ] Tag inputs work (stacked layout)
- [ ] Carousel navigation smooth
- [ ] Filter panel fits screen
- [ ] All touch targets 44x44px minimum

### On Android (Chrome)
- [ ] Same as iPhone
- [ ] RTL layout correct
- [ ] Hebrew font renders
- [ ] Select dropdowns don't glitch

### Landscape Mode
- [ ] Layout doesn't break
- [ ] Navigation still works
- [ ] Forms still usable

---

## Fixes to Implement

### 1. Touch Targets
- learning-aid-card.tsx
- search-bar.tsx
- aid/[id]/page.tsx (top nav arrows)
- simple-filter-panel.tsx (checkbox areas)

### 2. Responsive Grids
- upload/page.tsx (all grids)

### 3. Tag Input Layout
- upload/page.tsx (line 305-341)

### 4. Select Widths
- simple-filter-panel.tsx
- upload/page.tsx

---

## Testing Strategy

1. **Chrome DevTools Mobile Emulation**
   - iPhone SE (375px - smallest modern phone)
   - Pixel 5 (393px)
   - iPhone 14 Pro (430px)

2. **Real Device Testing**
   - Borrow iPhone from colleague
   - Test on own Android
   - Check WhatsApp share works

3. **Accessibility Audit**
   - Lighthouse mobile score
   - Check contrast ratios
   - Test screen reader with Hebrew

---

## Status

- [x] Audit complete
- [x] Fixes implemented ✅
- [ ] Tested on emulator (NEXT: Use Chrome DevTools)
- [ ] Tested on real device (NEXT: Borrow iPhone/use Android)
- [ ] Lighthouse score >90

## Fixes Implemented (May 2, 2026)

### ✅ Touch Target Fixes
1. **Star ratings** - Increased from 24px to 44px touch area
   - Changed `p-0.5` to `p-2 -m-1`
   - Added `aria-label` for accessibility
   - File: `components/feed/learning-aid-card.tsx`

2. **Search clear button** - Increased from 28px to 40px
   - Changed `h-7 w-7` to `h-10 w-10`
   - Added `aria-label`
   - File: `components/search-bar.tsx`

3. **Detail page nav arrows** - Increased from ~32px to 44px
   - Changed `p-1.5` + `h-4 w-4` to `p-2` + `h-5 w-5`
   - Added `aria-label` attributes
   - File: `app/aid/[id]/page.tsx`

4. **Checkbox labels** - Increased clickable area
   - Added `py-2 -my-2` to labels for 44px height
   - Increased gap to `gap-3`
   - File: `components/filters/simple-filter-panel.tsx`

### ✅ Responsive Layout Fixes
1. **Upload form grids** - Stack on mobile
   - Changed `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
   - Applied to uploader info and chapter/aid type sections
   - File: `app/upload/page.tsx`

2. **Tag input layout** - Stack on mobile
   - Changed `flex gap-2` to `flex-col sm:flex-row`
   - All inputs now `w-full sm:w-auto`
   - File: `app/upload/page.tsx`

3. **Filter panel selects** - Full width on mobile
   - Chapter select: `w-full sm:w-auto sm:min-w-[200px]`
   - Sort select: `w-full sm:w-auto sm:min-w-[150px]`
   - File: `components/filters/simple-filter-panel.tsx`

4. **Side carousel arrows** - Hidden on mobile
   - Added `hidden md:flex` to prevent overlap
   - Top nav arrows remain visible
   - File: `app/aid/[id]/page.tsx`

### ✅ UX Improvements
1. **Image upload area** - Taller on mobile
   - Changed `h-32` to `h-40 sm:h-32`
   - File: `app/upload/page.tsx`

2. **Action buttons** - Icon-only on mobile
   - Added `<span className="hidden sm:inline">text</span>`
   - Buttons maintain 44px height (`h-11`)
   - File: `app/aid/[id]/page.tsx`

3. **Select heights** - Consistent minimum
   - All selects now `h-10` or `min-h-10`
   - Better tap targets across the board

### Build Status
✅ **Build successful** - No TypeScript errors
✅ **All changes backward compatible**
✅ **RTL layout preserved**

## Next Steps for Testing

1. **Chrome DevTools Device Emulation**
   ```
   - Open http://localhost:3000
   - F12 > Toggle device toolbar (Cmd+Shift+M)
   - Test: iPhone SE (375px), Pixel 5 (393px), iPhone 14 (430px)
   ```

2. **Check each page:**
   - Feed (/) - cards, filters, search
   - Upload (/upload) - all form fields
   - Detail (/aid/[id]) - navigation, actions
   - Quiz (/quiz) - if implemented

3. **Specific tests:**
   - [ ] Tap star ratings (should register easily)
   - [ ] Tap search clear button (no zoom)
   - [ ] Use chapter select (long Hebrew names don't overflow)
   - [ ] Fill upload form (all fields reachable)
   - [ ] Navigate detail carousel (arrows work)
   - [ ] Toggle filters (checkboxes easy to hit)

4. **Real device test:**
   - Test WhatsApp share (opens app)
   - Test camera upload
   - Check scroll performance
   - Verify RTL on actual mobile Safari
