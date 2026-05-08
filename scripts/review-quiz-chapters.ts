import fs from 'fs'
import path from 'path'

const quizFilePath = path.join(process.cwd(), 'public', 'quiz-questions.json')
const data = JSON.parse(fs.readFileSync(quizFilePath, 'utf-8'))

// Keywords and patterns for chapter classification
const chapterPatterns: Record<string, { keywords: string[], concepts: string[] }> = {
  'psoriasis': {
    keywords: ['פסוריאזיס', 'psoriasis', 'pustular psoriasis'],
    concepts: ['PASI', 'TNF', 'biologics for psoriasis']
  },
  'papulosquamous': {
    keywords: ['PRP', 'pityriasis rosea', 'lichen planus', 'parapsoriasis'],
    concepts: ['herald patch', 'christmas tree', 'collarette']
  },
  'atopic-dermatitis': {
    keywords: ['אטופי', 'atopic', 'אקזמה', 'eczema', 'dennie-morgan'],
    concepts: ['Hertoghe sign', 'periorbital shiners', 'IgE']
  },
  'urticaria': {
    keywords: ['סרפדת', 'urticaria', 'אורטיקריה', 'angioedema'],
    concepts: ['wheals', 'mast cell', 'antihistamine']
  },
  'drug-reactions': {
    keywords: ['תרופה', 'drug', 'תגובה לתרופה', 'medication', 'DRESS', 'SJS', 'TEN'],
    concepts: ['drug-induced', 'adverse reaction']
  },
  'erythema-multiforme': {
    keywords: ['stevens-johnson', 'toxic epidermal necrolysis', 'erythema multiforme', 'SJS', 'TEN'],
    concepts: ['target lesions', 'mucous membrane']
  },
  'dermatomyositis': {
    keywords: ['דרמטומיוזיטיס', 'dermatomyositis', "Gottron's", 'heliotrope', 'flagellate'],
    concepts: ['muscle weakness', 'myositis']
  },
  'acne': {
    keywords: ['אקנה', 'acne', 'comedones', 'נאונטל', 'אינפנטיל', 'neonatal', 'infantile'],
    concepts: ['sebaceous', 'propionibacterium', 'isotretinoin']
  },
  'rosacea': {
    keywords: ['רוזאצאה', 'rosacea', 'rhinophyma'],
    concepts: ['facial erythema', 'telangiectasia', 'papulopustular']
  },
  'allergic-contact': {
    keywords: ['דרמטיטיס ממגע', 'contact dermatitis', 'patch test', 'balsam of peru', 'nickel'],
    concepts: ['type IV hypersensitivity', 'allergen']
  },
  'pregnancy': {
    keywords: ['הריון', 'pregnancy', 'הרה', 'יילוד'],
    concepts: ['gestational', 'pruritic', 'pemphigoid gestationis']
  },
  'pemphigus': {
    keywords: ['פמפיגוס', 'pemphigus', 'acantholysis'],
    concepts: ['intraepidermal blister', 'desmoglein']
  },
  'pemphigoid': {
    keywords: ['פמפיגואיד', 'pemphigoid', 'bullous pemphigoid'],
    concepts: ['subepidermal blister', 'BP180', 'BP230']
  },
  'lupus': {
    keywords: ['לופוס', 'lupus', 'SLE', 'SCLE', 'DLE'],
    concepts: ['photosensitivity', 'ANA', 'anti-dsDNA']
  },
  'vasculitis': {
    keywords: ['וסקוליטיס', 'vasculitis', 'leukocytoclastic'],
    concepts: ['palpable purpura', 'vessel inflammation']
  },
  'melanoma': {
    keywords: ['מלנומה', 'melanoma'],
    concepts: ['ABCDE', 'Breslow', 'sentinel node']
  },
  'ak-bcc-scc': {
    keywords: ['קרצינומה', 'carcinoma', 'basal cell', 'squamous cell', 'actinic keratosis', 'BCC', 'SCC'],
    concepts: ['keratinocyte cancer', 'sun exposure']
  },
  'bacterial': {
    keywords: ['חיידקי', 'bacterial', 'staph', 'strep', 'cellulitis', 'impetigo'],
    concepts: ['antibiotic']
  },
  'fungal': {
    keywords: ['פטרייתי', 'fungal', 'tinea', 'candida', 'malassezia'],
    concepts: ['KOH', 'dermatophyte']
  },
  'hpv': {
    keywords: ['HPV', 'wart', 'יבלת', 'condyloma'],
    concepts: ['papillomavirus']
  },
  'herpes': {
    keywords: ['הרפס', 'herpes', 'HSV', 'VZV', 'shingles', 'אבעבועות רוח'],
    concepts: ['vesicular', 'acyclovir']
  },
  'hair-nail-biology': {
    keywords: ['ציפורן', 'nail', 'matrix', 'nail bed', 'nail plate'],
    concepts: ['nail anatomy', 'nail growth']
  },
  'nail-disorders': {
    keywords: ['ציפורן', 'nail', 'onychomycosis', 'paronychia', 'נייל'],
    concepts: ['nail disease', 'nail pathology']
  },
  'alopecias': {
    keywords: ['אלופציה', 'alopecia', 'hair loss', 'נשירת שיער'],
    concepts: ['anagen', 'telogen']
  },
  'biopsy-excisions': {
    keywords: ['ביופסיה', 'biopsy', 'פורמלין', 'formalin', 'היסטולוגיה', 'histology'],
    concepts: ['specimen handling', 'tissue processing']
  },
  'ichthyoses': {
    keywords: ['איכתיוזיס', 'ichthyosis'],
    concepts: ['scaling', 'collodion baby']
  },
  'vitiligo': {
    keywords: ['ויטיליגו', 'vitiligo', 'depigmentation'],
    concepts: ['melanocyte loss', 'repigmentation']
  },
  'mastocytosis': {
    keywords: ['מסטוציטוזיס', 'mastocytosis', 'urticaria pigmentosa', "Darier's sign"],
    concepts: ['mast cell', 'tryptase']
  }
}

// Analyze each question
const updates: Array<{id: string, currentChapter: string, suggestedChapter: string, confidence: string, reason: string}> = []
let needsReview = 0

data.questions.forEach((q: any) => {
  const text = (q.question + ' ' + q.options.join(' ') + ' ' + q.explanation).toLowerCase()

  let bestMatch = { chapter: 'other', score: 0, keywords: [] as string[] }

  // Check each chapter pattern
  for (const [chapter, pattern] of Object.entries(chapterPatterns)) {
    let score = 0
    const foundKeywords: string[] = []

    // Check keywords
    pattern.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 3
        foundKeywords.push(keyword)
      }
    })

    // Check concepts
    pattern.concepts.forEach(concept => {
      if (text.includes(concept.toLowerCase())) {
        score += 1
        foundKeywords.push(concept)
      }
    })

    if (score > bestMatch.score) {
      bestMatch = { chapter, score, keywords: foundKeywords }
    }
  }

  // Determine if current assignment is appropriate
  const currentChapter = q.chapter
  const suggestedChapter = bestMatch.score >= 3 ? bestMatch.chapter : 'other'

  if (currentChapter !== suggestedChapter && bestMatch.score >= 3) {
    updates.push({
      id: q.id,
      currentChapter,
      suggestedChapter,
      confidence: bestMatch.score >= 6 ? 'HIGH' : bestMatch.score >= 3 ? 'MEDIUM' : 'LOW',
      reason: `Found: ${bestMatch.keywords.join(', ')}`
    })
    needsReview++
  } else if (currentChapter !== 'other' && bestMatch.score < 2) {
    // Current chapter but low confidence - might need "other"
    updates.push({
      id: q.id,
      currentChapter,
      suggestedChapter: 'other',
      confidence: 'LOW',
      reason: 'No clear chapter match - consider "other"'
    })
    needsReview++
  }
})

console.log(`\n📊 Quiz Chapter Analysis`)
console.log(`========================`)
console.log(`Total questions: ${data.questions.length}`)
console.log(`Questions needing review: ${needsReview}`)

if (updates.length > 0) {
  console.log(`\n⚠️  Suggested Changes:\n`)
  updates.forEach(u => {
    console.log(`${u.id}:`)
    console.log(`  Current: ${u.currentChapter}`)
    console.log(`  Suggested: ${u.suggestedChapter}`)
    console.log(`  Confidence: ${u.confidence}`)
    console.log(`  Reason: ${u.reason}`)
    console.log(``)
  })

  // Save to file for review
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', 'chapter-review-results.json'),
    JSON.stringify({ updates, summary: { total: data.questions.length, needsReview } }, null, 2)
  )
  console.log(`📝 Full results saved to: scripts/chapter-review-results.json`)
} else {
  console.log(`\n✅ All chapters look appropriate!`)
}

// Chapter distribution
const chapterCounts: Record<string, number> = {}
data.questions.forEach((q: any) => {
  chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1
})

console.log(`\n📈 Current Distribution:`)
Object.entries(chapterCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([chapter, count]) => {
    console.log(`  ${chapter}: ${count}`)
  })
