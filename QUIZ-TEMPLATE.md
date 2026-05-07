# Quiz Questions Template

## How to Add New Questions

Edit the file: `public/quiz-questions.json`

Each question follows this format:

```json
{
  "id": "unique-id-here",
  "chapter": "chapter-value-from-CHAPTERS",
  "question": "השאלה בעברית או English",
  "options": [
    "תשובה א",
    "תשובה ב", 
    "תשובה ג",
    "תשובה ד"
  ],
  "correctAnswer": 0,
  "explanation": "ההסבר המלא למה התשובה נכונה"
}
```

### Important Notes

1. **ID**: Must be unique (e.g., "psoriasis-001", "melanoma-002")
2. **Chapter**: Must match a value from `lib/chapters.ts` exactly
3. **Options**: Always exactly 4 options
4. **correctAnswer**: Index of correct answer (0 = first option, 1 = second, etc.)
5. **Explanation**: Should explain why the answer is correct AND why others are wrong

### Available Chapter Values

Common chapters you'll use:

- `psoriasis` - Psoriasis
- `melanoma` - Melanoma  
- `drug-reactions` - Drug Reactions
- `pemphigus` - Pemphigus
- `pemphigoid` - Pemphigoid Group
- `atopic-dermatitis` - Atopic Dermatitis
- `urticaria` - Urticaria
- `lupus` - Lupus
- `dermatomyositis` - Dermatomyositis
- `scleroderma` - Scleroderma
- `erythema-multiforme` - SJS/TEN
- `papulosquamous` - PRP and other papulosquamous
- `other-bullous` - Other bullous diseases
- `genetics` - Genetics
- `bacterial-skin` - Bacterial infections

See `lib/chapters.ts` for the complete list of 159 chapters.

## Example Question

```json
{
  "id": "psoriasis-002",
  "chapter": "psoriasis",
  "question": "מה הטיפול הביולוגי הראשון שאושר לפסוריאזיס?",
  "options": [
    "Ustekinumab",
    "Etanercept",
    "Adalimumab",
    "Secukinumab"
  ],
  "correctAnswer": 1,
  "explanation": "Etanercept (Enbrel) היה הביולוגי הראשון שאושר לטיפול בפסוריאזיס. הוא מעכב TNF-alpha. Ustekinumab מעכב IL-12/23, Secukinumab מעכב IL-17, ו-Adalimumab הוא גם מעכב TNF אך אושר מאוחר יותר."
}
```

## How to Test

1. Add your questions to `data/quiz-questions.json`
2. Run `npm run dev`
3. Go to `/quiz`
4. Select chapters - you should see question counts next to each chapter
5. Start quiz - your questions will appear mixed with image-based questions

## Current Question Count

You currently have 13 questions across these chapters:
- Chapter 9 - Papulosquamous (2 questions)
- Chapter 12 - Atopic Dermatitis (1 question)
- Chapter 18 - Urticaria (1 question)
- Chapter 20 - SJS/TEN (1 question)
- Chapter 21 - Drug Reactions (2 questions)
- Chapter 42 - Dermatomyositis (1 question)
- Chapter 43 - Scleroderma (1 question)
- Chapter 59 - Darier-Hailey (1 question)
- Chapter 67 - Hyperpigmentation (2 questions)
- Chapter 82 - STI (1 question)

## Quiz Features

✅ **Randomized answers** - Answer order shuffles each quiz session  
✅ **No repeats** - Each question appears exactly once  
✅ **Auto-images** - Questions automatically show relevant chapter images  
✅ **Chapter badges** - Shows chapter number and name for each question  
✅ **Mobile-optimized** - Large touch targets, responsive design  
✅ **End anytime** - "End Now" button to finish quiz mid-way
