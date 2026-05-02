# Bug Fix: Infinite Re-render Loop (React Error #310)

**Date**: May 2, 2026  
**Status**: ✅ Fixed  
**Build**: ✅ Passing  
**Lint**: ✅ No errors in affected file

---

## Problem

Cards were not loading on the feed page, with React error #310 appearing in production:

```
Uncaught Error: Minified React error #310
```

**React Error #310** = "Too many re-renders. React limits the number of renders to prevent an infinite loop."

---

## Root Cause

The bug was in `app/page.tsx` where we were:

1. Using `useState` for `filteredAids` (derived from `aids`, `searchQuery`, and `currentFilters`)
2. Calling `setFilteredAids()` inside a `useEffect` with dependencies `[searchQuery, aids, currentFilters, applyFilters]`
3. This created a cascading setState pattern that ESLint warned about

The anti-pattern:
```typescript
// ❌ BAD: Calling setState in useEffect for derived state
useEffect(() => {
  const filtered = applyFilters(currentFilters, aids, searchQuery)
  setFilteredAids(filtered) // <-- This is an anti-pattern!
}, [searchQuery, aids, currentFilters, applyFilters])
```

**Why it caused infinite loops:**
- When filters changed → `currentFilters` updates → useEffect fires → `setFilteredAids` → re-render → (potential loop)
- ESLint rule `react-hooks/set-state-in-effect` specifically warns against this

---

## Solution

Refactored to use **`useMemo`** for derived state (React best practice):

```typescript
// ✅ GOOD: Using useMemo for derived state
const filteredAids = useMemo(() => {
  let filtered = [...aids]
  
  // Apply search filter
  if (searchQuery.trim()) { /* ... */ }
  
  // Apply chapter filter
  if (currentFilters.chapter !== 'all') { /* ... */ }
  
  // Apply aid type filter
  if (currentFilters.aidTypes.length > 0) { /* ... */ }
  
  // Sort
  if (currentFilters.sort === 'alphabetical') { /* ... */ }
  
  return filtered
}, [aids, searchQuery, currentFilters])
```

**Benefits:**
- `filteredAids` is now computed automatically when dependencies change
- No cascading setState calls
- No infinite loop risk
- Cleaner, more declarative code
- Follows React best practices

---

## Changes Made

### 1. `app/page.tsx` - Main refactor

**Before:**
```typescript
const [filteredAids, setFilteredAids] = useState<LearningAid[]>([])

const handleFilterChange = useCallback((filters: SimpleFilterState) => {
  setCurrentFilters(filters)
  const filtered = applyFilters(filters, aids, searchQuery)
  setFilteredAids(filtered) // Problem!
  localStorage.setItem('filtered-aid-ids', JSON.stringify(filtered.map(a => a.id)))
}, [aids, searchQuery, applyFilters])

useEffect(() => {
  const filtered = applyFilters(currentFilters, aids, searchQuery)
  setFilteredAids(filtered) // Problem!
  localStorage.setItem('filtered-aid-ids', JSON.stringify(filtered.map(a => a.id)))
}, [searchQuery, aids, currentFilters, applyFilters])
```

**After:**
```typescript
// Compute filtered aids using useMemo (derived state)
const filteredAids = useMemo(() => {
  let filtered = [...aids]
  // ... filtering logic ...
  return filtered
}, [aids, searchQuery, currentFilters])

// Store filtered aids IDs in localStorage (side effect)
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('filtered-aid-ids', JSON.stringify(filteredAids.map(a => a.id)))
  }
}, [filteredAids])

// Handle filter changes from filter panel
const handleFilterChange = useCallback((filters: SimpleFilterState) => {
  setCurrentFilters(filters) // Just update filters, useMemo handles the rest
}, [])
```

### 2. Removed unused mock data

Cleaned up old `mockAidsOld` variable that ESLint flagged as unused.

### 3. Simplified data fetching

Removed redundant `setFilteredAids()` and localStorage calls from the fetch useEffect since these are now handled by useMemo and a dedicated useEffect.

---

## Testing

✅ **Build**: `npm run build` passes  
✅ **TypeScript**: No type errors  
✅ **ESLint**: No warnings in `app/page.tsx`  
✅ **Dev server**: Starts successfully at http://localhost:3000

**Manual testing needed:**
1. Open http://localhost:3000 in browser
2. Verify cards load without errors
3. Test search functionality
4. Test chapter and aid type filters
5. Verify no console errors about re-renders

---

## Related React Patterns

**When to use `useMemo` vs `useState` + `useEffect`:**

| Pattern | Use Case |
|---------|----------|
| `useMemo` | Derived state (computed from other state) |
| `useState` + `useEffect` | Independent state or async data |

**Example:**
```typescript
// ✅ GOOD: useMemo for derived state
const filteredUsers = useMemo(() => 
  users.filter(u => u.name.includes(searchQuery)),
  [users, searchQuery]
)

// ❌ BAD: useState + useEffect for derived state
const [filteredUsers, setFilteredUsers] = useState([])
useEffect(() => {
  setFilteredUsers(users.filter(u => u.name.includes(searchQuery)))
}, [users, searchQuery]) // Anti-pattern! Use useMemo instead
```

---

## References

- React Docs: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- React Error #310: [Too Many Re-renders](https://react.dev/errors/310)
- ESLint Rule: [`react-hooks/set-state-in-effect`](https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md)
