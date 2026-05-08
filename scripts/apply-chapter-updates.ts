import fs from 'fs'
import path from 'path'

const quizFilePath = path.join(process.cwd(), 'public', 'quiz-questions.json')
const reviewFilePath = path.join(process.cwd(), 'scripts', 'chapter-review-results.json')

// Read the quiz data and review results
const quizData = JSON.parse(fs.readFileSync(quizFilePath, 'utf-8'))
const reviewData = JSON.parse(fs.readFileSync(reviewFilePath, 'utf-8'))

// Apply updates for HIGH and MEDIUM confidence only
let highConfUpdates = 0
let mediumConfUpdates = 0
let skipped = 0

reviewData.updates.forEach((update: any) => {
  const question = quizData.questions.find((q: any) => q.id === update.id)

  if (!question) {
    console.log(`⚠️  Question ${update.id} not found`)
    return
  }

  // Apply HIGH confidence updates automatically
  if (update.confidence === 'HIGH') {
    question.chapter = update.suggestedChapter
    highConfUpdates++
    return
  }

  // Apply MEDIUM confidence updates (but skip ones moving to "other" unless it's clear)
  if (update.confidence === 'MEDIUM') {
    // Don't move to "other" for MEDIUM confidence - keep existing if unsure
    if (update.suggestedChapter === 'other') {
      skipped++
      return
    }

    // For specific chapters, apply the change
    question.chapter = update.suggestedChapter
    mediumConfUpdates++
    return
  }

  // Skip LOW confidence
  if (update.confidence === 'LOW') {
    skipped++
  }
})

// Write updated quiz back
fs.writeFileSync(quizFilePath, JSON.stringify(quizData, null, 2))

console.log(`\n✅ Chapter Updates Applied`)
console.log(`========================`)
console.log(`HIGH confidence updates: ${highConfUpdates}`)
console.log(`MEDIUM confidence updates: ${mediumConfUpdates}`)
console.log(`Skipped (LOW confidence or moving to "other"): ${skipped}`)
console.log(`\nTotal changes: ${highConfUpdates + mediumConfUpdates}`)

// Show new distribution
const chapterCounts: Record<string, number> = {}
quizData.questions.forEach((q: any) => {
  chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1
})

console.log(`\n📈 Updated Distribution:`)
Object.entries(chapterCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 20)
  .forEach(([chapter, count]) => {
    console.log(`  ${chapter}: ${count}`)
  })
