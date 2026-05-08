import fs from 'fs'
import path from 'path'

// Paths
const SOURCE_DIR = '/Users/omrialon/Documents/yuval/dermnemonic/questions pics'
const TARGET_DIR = path.join(__dirname, '..', 'public', 'quiz-images')
const QUIZ_JSON = path.join(__dirname, '..', 'public', 'quiz-questions.json')
const BACKUP_JSON = path.join(__dirname, '..', 'public', 'quiz-questions.backup.json')

interface QuizQuestion {
  id: string
  chapter: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  imageUrl?: string
}

interface QuizQuestionsData {
  questions: QuizQuestion[]
  metadata?: any
}

async function attachImages() {
  console.log('🚀 Starting image attachment process...\n')

  // Step 1: Verify source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Step 2: Create target directory
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true })
    console.log(`✅ Created directory: ${TARGET_DIR}\n`)
  } else {
    console.log(`📁 Directory already exists: ${TARGET_DIR}\n`)
  }

  // Step 3: Read source images
  const sourceFiles = fs.readdirSync(SOURCE_DIR)
    .filter(file => file.endsWith('.png'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('.png', ''))
      const numB = parseInt(b.replace('.png', ''))
      return numA - numB
    })

  console.log(`📸 Found ${sourceFiles.length} images in source directory\n`)

  // Step 4: Copy and rename images
  const copiedImages: { source: string; target: string; questionId: string }[] = []
  const skippedImages: { source: string; reason: string }[] = []

  for (const file of sourceFiles) {
    // Extract question number (e.g., "1.png" → 1, "22.png" → 22)
    const match = file.match(/^(\d+)\.png$/)
    if (!match) {
      skippedImages.push({ source: file, reason: 'Invalid filename format' })
      continue
    }

    const questionNumber = parseInt(match[1])

    // Pad with zeros (1 → "001", 22 → "022", 150 → "150")
    const paddedNumber = questionNumber.toString().padStart(3, '0')
    const questionId = `american-board-${paddedNumber}`
    const targetFilename = `${questionId}.png`
    const targetPath = path.join(TARGET_DIR, targetFilename)

    try {
      // Copy file
      fs.copyFileSync(path.join(SOURCE_DIR, file), targetPath)
      copiedImages.push({
        source: file,
        target: targetFilename,
        questionId
      })
      console.log(`   ${file} → ${targetFilename}`)
    } catch (error) {
      skippedImages.push({
        source: file,
        reason: `Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  console.log(`\n✅ Copied ${copiedImages.length} images`)
  if (skippedImages.length > 0) {
    console.log(`⚠️  Skipped ${skippedImages.length} images:`)
    skippedImages.forEach(({ source, reason }) => {
      console.log(`   ${source}: ${reason}`)
    })
  }
  console.log()

  // Step 5: Load quiz questions
  if (!fs.existsSync(QUIZ_JSON)) {
    console.error(`❌ Quiz questions file not found: ${QUIZ_JSON}`)
    process.exit(1)
  }

  const quizData: QuizQuestionsData = JSON.parse(fs.readFileSync(QUIZ_JSON, 'utf-8'))
  console.log(`📚 Loaded ${quizData.questions.length} questions from quiz-questions.json\n`)

  // Step 6: Create backup
  fs.copyFileSync(QUIZ_JSON, BACKUP_JSON)
  console.log(`💾 Created backup: quiz-questions.backup.json\n`)

  // Step 7: Update questions with image URLs
  let imagesAttached = 0
  const imageMap = new Map(copiedImages.map(img => [img.questionId, img.target]))

  for (const question of quizData.questions) {
    if (question.id.startsWith('american-board-')) {
      const targetFilename = imageMap.get(question.id)
      if (targetFilename) {
        question.imageUrl = `/quiz-images/${targetFilename}`
        imagesAttached++
      }
    }
  }

  // Step 8: Save updated quiz questions
  fs.writeFileSync(
    QUIZ_JSON,
    JSON.stringify(quizData, null, 2),
    'utf-8'
  )

  console.log(`✅ Updated quiz-questions.json with image references\n`)

  // Step 9: Generate report
  console.log('📊 Summary:')
  console.log(`   - Images copied: ${copiedImages.length}`)
  console.log(`   - Images attached to questions: ${imagesAttached}`)
  console.log(`   - Questions without images: ${quizData.questions.filter(q => q.id.startsWith('american-board-') && !q.imageUrl).length}`)
  console.log(`   - Total american-board questions: ${quizData.questions.filter(q => q.id.startsWith('american-board-')).length}`)
  console.log()

  // Step 10: List questions with images
  const questionsWithImages = quizData.questions
    .filter(q => q.imageUrl)
    .map(q => q.id.replace('american-board-', ''))
    .sort((a, b) => parseInt(a) - parseInt(b))

  console.log('✅ Questions with images:')
  console.log(`   ${questionsWithImages.join(', ')}`)
  console.log()

  console.log('✅ Image attachment complete!')
  console.log(`📁 Images location: ${TARGET_DIR}`)
  console.log(`📄 Updated file: ${QUIZ_JSON}`)
  console.log(`💾 Backup file: ${BACKUP_JSON}`)
}

// Run the script
attachImages().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
