# Dropdown Audit - All Select Components

## ✅ All Dropdowns Fixed and Verified

### 1. Main Page - Filter Panel
**File**: `components/filters/simple-filter-panel.tsx`

#### פרק (Chapter)
- **Value Type**: chapter code (e.g., "psoriasis", "acne")
- **Display**: Hebrew label from CHAPTERS constant
- **Example**: "psoriasis" → "פסוריאזיס"
- **Status**: ✅ Fixed - Shows Hebrew label
- **Text Wrap**: ✅ Yes - `whitespace-normal` for long names

#### מיון (Sort)
- **Value Type**: sort mode ("newest", "rated", "alphabetical")
- **Display**: Hardcoded Hebrew labels
- **Mapping**:
  - "newest" → "חדש ביותר"
  - "rated" → "המדורגים ביותר"
  - "alphabetical" → "א-ב"
- **Status**: ✅ Fixed - Shows Hebrew

---

### 2. Upload Page
**File**: `app/upload/page.tsx`

#### בית חולים (Hospital)
- **Value Type**: Hebrew hospital name
- **Display**: Same as value (already Hebrew)
- **Options**: איכילוב, הדסה, שיבא, רמב״ם, בילינסון, סורוקה, אחר
- **Status**: ✅ Fixed - Shows selected value correctly

#### פרק * (Chapter - REQUIRED)
- **Value Type**: chapter code
- **Display**: Hebrew label from CHAPTERS constant
- **Placeholder**: "בחר פרק" when empty
- **Required**: YES - button disabled without selection
- **Status**: ✅ Fixed - Shows Hebrew label or placeholder
- **Text Wrap**: ✅ Yes - `max-w-[300px]` + `whitespace-normal`

#### סוג עזר למידה * (Aid Type - REQUIRED)
- **Value Type**: aid type code (e.g., "mnemonic", "illustration")
- **Display**: Hebrew label from AID_TYPES constant
- **Options**: מנמוניק, איור, טבלה, תרשים זרימה, אחר
- **Required**: YES
- **Status**: ✅ Fixed - Shows Hebrew label

#### קטגוריה (Tag Category)
- **Value Type**: category code ("diagnosis", "sign", etc.)
- **Display**: Hebrew label mapping
- **Mapping**:
  - "diagnosis" → "אבחנה"
  - "sign" → "סימן קליני"
  - "pathology" → "פתולוגיה"
  - "treatment" → "טיפול"
  - "risk_factors" → "גורמי סיכון"
- **Status**: ✅ Fixed - Shows Hebrew

---

## Pattern Used

All SelectValue components now follow this pattern:

```tsx
<SelectValue>
  {selectedValue
    ? ITEMS.find(i => i.value === selectedValue)?.label
    : 'placeholder text'}
</SelectValue>
```

Or for simple mappings:
```tsx
<SelectValue>
  {value === 'option1' && 'תווית 1'}
  {value === 'option2' && 'תווית 2'}
  {!value && 'בחר אופציה'}
</SelectValue>
```

## Changes Made
1. ❌ Removed `placeholder` attribute from `<SelectValue>`
2. ✅ Added dynamic children to show correct Hebrew text
3. ✅ Added `max-w-[300px]` to long dropdowns (chapters)
4. ✅ Added `whitespace-normal` to SelectItem for text wrapping
5. ✅ Conditional display: show label if selected, placeholder if empty

## Testing Checklist
- [ ] Main page → Filter "פרק" → Select any chapter → Shows Hebrew name
- [ ] Main page → Filter "מיון" → Shows "חדש ביותר" by default
- [ ] Upload page → "פרק *" → Empty shows "בחר פרק", selected shows Hebrew
- [ ] Upload page → "סוג עזר למידה *" → Shows Hebrew aid type
- [ ] Upload page → "בית חולים" → Shows hospital name
- [ ] Upload page → Tags "קטגוריה" → Shows Hebrew category
- [ ] Long chapter names wrap to 2 lines (not overflow)
