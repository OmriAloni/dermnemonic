import fs from 'fs'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// ===== INTERFACES =====

interface ParsedQuestion {
  questionNumber: number
  vignette: string
  options: [string, string, string, string]
  rawText: string
}

interface AnswerKey {
  [questionNumber: number]: number // 0=A, 1=B, 2=C, 3=D
}

interface QuizQuestion {
  id: string
  chapter: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

// ===== PHASE 1: PDF EXTRACTION =====

async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath)
    const uint8Array = new Uint8Array(dataBuffer)
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdfDocument = await loadingTask.promise
    let fullText = ''

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText
  } catch (error) {
    console.error(`❌ Failed to extract text from ${pdfPath}:`, error)
    throw error
  }
}

// ===== PHASE 2: QUESTION PARSING =====

function parseQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Clean the text first - remove page headers/footers
  let cleanText = text.replace(/עמוד \d+ גירסה שלב א.*?גרסאת מסטר\s*/g, '')

  // New approach: Look for complete question pattern
  // Question number + vignette + exactly 4 options (א ב ג ד in order)
  // Pattern: NUMBER . VIGNETTE א. OPTION ב. OPTION ג. OPTION ד. OPTION
  // Lookahead: next question starts with whitespace + number + period OR end of text
  const completeQuestionPattern = /(\d{1,3})\s*\.\s+(.+?)\s+א\.\s*(.+?)\s+ב\.\s*(.+?)\s+ג\.\s*(.+?)\s+ד\.\s*(.+?)(?=\s+\d{1,3}\s*\.|$)/gs

  const matches = [...cleanText.matchAll(completeQuestionPattern)]

  for (const match of matches) {
    const questionNumber = parseInt(match[1])

    // Skip if not a real question number (1-150)
    if (questionNumber < 1 || questionNumber > 150) continue

    const vignette = match[2].replace(/\s+/g, ' ').trim()
    const options = [
      match[3].replace(/\s+/g, ' ').trim(),  // א
      match[4].replace(/\s+/g, ' ').trim(),  // ב
      match[5].replace(/\s+/g, ' ').trim(),  // ג
      match[6].replace(/\s+/g, ' ').trim()   // ד
    ] as [string, string, string, string]


    if (vignette.length < 10) {
      console.warn(`⚠️  Question ${questionNumber}: Vignette too short (${vignette.length} chars)`)
      continue
    }

    if (options.some(opt => opt.length < 2)) {
      console.warn(`⚠️  Question ${questionNumber}: One or more options too short`)
      continue
    }

    questions.push({
      questionNumber,
      vignette,
      options,
      rawText: match[0]
    })
  }

  return questions
}

// ===== PHASE 3: ANSWER PARSING =====

function parseAnswers(text: string): AnswerKey {
  const answers: AnswerKey = {}

  // Hebrew format: "1 ד" "2 א" etc. (question number + Hebrew letter)
  const answerPattern = /(\d+)\s+([א-ד])/g
  const matches = [...text.matchAll(answerPattern)]

  for (const match of matches) {
    const questionNum = parseInt(match[1])
    const answerLetter = match[2]

    // Convert Hebrew letters to indices: א=0, ב=1, ג=2, ד=3
    const hebrewToIndex: Record<string, number> = {
      'א': 0,  // aleph = A
      'ב': 1,  // bet = B
      'ג': 2,  // gimel = C
      'ד': 3   // dalet = D
    }

    answers[questionNum] = hebrewToIndex[answerLetter]
  }

  return answers
}

// ===== PHASE 4: ANSWER MATCHING =====

function matchAnswers(
  parsedQuestions: ParsedQuestion[],
  answerKey: AnswerKey
): QuizQuestion[] {
  const quizQuestions: QuizQuestion[] = []

  for (const parsed of parsedQuestions) {
    const correctAnswer = answerKey[parsed.questionNumber]

    if (correctAnswer === undefined) {
      console.warn(`⚠️  No answer found for question ${parsed.questionNumber}`)
      continue
    }

    quizQuestions.push({
      id: `american-board-${parsed.questionNumber.toString().padStart(3, '0')}`,
      chapter: assignChapter(parsed.vignette),
      question: parsed.vignette,
      options: parsed.options,
      correctAnswer,
      explanation: ''
    })
  }

  return quizQuestions
}

// ===== PHASE 5: CHAPTER ASSIGNMENT =====

function assignChapter(vignette: string): string {
  const lowerVignette = vignette.toLowerCase()

  // Keyword-based heuristic (conservative matching)
  const keywords: Record<string, string[]> = {
    'psoriasis': ['psoriasis', 'silvery scale', 'plaque psoriasis', 'koebner'],
    'melanoma': ['melanoma', 'melanocytic', 'asymmetry', 'abcde', 'malignant melanoma'],
    'atopic-dermatitis': ['atopic dermatitis', 'eczema', 'atopic', 'flexural'],
    'acne': ['acne vulgaris', 'comedone', 'propionibacterium', 'acne'],
    'lupus': ['lupus', 'malar rash', 'butterfly rash', 'systemic lupus'],
    'rosacea': ['rosacea', 'flushing', 'telangiectasia'],
    'vitiligo': ['vitiligo', 'depigmentation', 'depigmented'],
    'urticaria': ['urticaria', 'hives', 'wheals'],
    'pemphigus': ['pemphigus', 'blisters', 'blister'],
    'drug-reactions': ['drug eruption', 'drug reaction', 'stevens-johnson', 'ten'],
    'sti': ['syphilis', 'hiv', 'herpes', 'chancre', 'sexually transmitted'],
    'fungal': ['tinea', 'candida', 'fungal', 'onychomycosis'],
    'bacterial': ['impetigo', 'cellulitis', 'folliculitis', 'erysipelas']
  }

  for (const [chapter, terms] of Object.entries(keywords)) {
    for (const term of terms) {
      if (lowerVignette.includes(term)) {
        return chapter
      }
    }
  }

  return 'other' // Default fallback
}

// ===== PHASE 6: JSON GENERATION =====

async function generateQuizJSON(
  quizQuestions: QuizQuestion[],
  outputPath: string
): Promise<void> {
  // Load existing questions
  let existingQuestions: QuizQuestion[] = []

  if (fs.existsSync(outputPath)) {
    const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
    existingQuestions = existingData.questions || []
  }

  // Remove old American board questions (IDs starting with "american-board-")
  // Then add the newly extracted ones (prevents duplicates on re-run)
  const nonAmericanQuestions = existingQuestions.filter(q => !q.id.startsWith('american-board-'))
  const allQuestions = [...nonAmericanQuestions, ...quizQuestions]

  const output = {
    questions: allQuestions,
    metadata: {
      total: allQuestions.length,
      extracted: quizQuestions.length,
      existing: existingQuestions.length,
      extractedAt: new Date().toISOString()
    }
  }

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`✅ Generated ${allQuestions.length} total questions (${quizQuestions.length} new + ${existingQuestions.length} existing)`)
}

// ===== VALIDATION =====

function validateQuestions(questions: QuizQuestion[]): void {
  const errors: string[] = []

  for (const q of questions) {
    if (!q.question || q.question.length < 20) {
      errors.push(`Question ${q.id}: Vignette too short`)
    }

    if (q.options.length !== 4) {
      errors.push(`Question ${q.id}: Expected 4 options, got ${q.options.length}`)
    }

    if (q.options.some(opt => opt.length < 2)) {
      errors.push(`Question ${q.id}: One or more options too short`)
    }

    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      errors.push(`Question ${q.id}: Invalid correctAnswer ${q.correctAnswer}`)
    }
  }

  if (errors.length > 0) {
    console.warn(`\n⚠️  Validation warnings (${errors.length}):`)
    errors.forEach(err => console.warn(`   ${err}`))
  } else {
    console.log('✅ All questions passed validation')
  }
}

// ===== MAIN EXECUTION =====

async function main() {
  try {
    console.log('🚀 Starting PDF question extraction...\n')

    // Paths
    const testPdfPath = path.join(__dirname, '..', 'test.pdf')
    const answersPdfPath = path.join(__dirname, '..', 'answers.pdf')
    const outputPath = path.join(__dirname, '..', 'public', 'quiz-questions.json')
    const logPath = path.join(__dirname, 'extraction-log.txt')

    // Setup logging
    const logStream = fs.createWriteStream(logPath, { flags: 'w' })
    const originalLog = console.log
    console.log = (...args) => {
      originalLog(...args)
      logStream.write(args.join(' ') + '\n')
    }

    // Phase 1: Extract text
    console.log('📄 Phase 1: Extracting text from test.pdf...')
    const questionsText = await extractTextFromPDF(testPdfPath)
    console.log(`   Extracted ${questionsText.length} characters\n`)

    console.log('📄 Phase 1: Extracting text from answers.pdf...')
    const answersText = await extractTextFromPDF(answersPdfPath)
    console.log(`   Extracted ${answersText.length} characters\n`)

    // Phase 2: Parse questions
    console.log('🔍 Phase 2: Parsing questions...')
    const parsedQuestions = parseQuestions(questionsText)
    console.log(`   Parsed ${parsedQuestions.length} questions\n`)

    // Phase 3: Parse answers
    console.log('🔍 Phase 3: Parsing answers...')
    const answerKey = parseAnswers(answersText)
    console.log(`   Parsed ${Object.keys(answerKey).length} answers\n`)

    // Phase 4: Match answers to questions
    console.log('🔗 Phase 4: Matching answers...')
    const quizQuestions = matchAnswers(parsedQuestions, answerKey)
    console.log(`   Matched ${quizQuestions.length} complete questions\n`)

    // Identify missing questions
    const parsedNumbers = new Set(parsedQuestions.map(q => q.questionNumber))
    const answerNumbers = Object.keys(answerKey).map(Number)
    const missingQuestions = answerNumbers.filter(num => !parsedNumbers.has(num))
    if (missingQuestions.length > 0) {
      console.log(`⚠️  Missing ${missingQuestions.length} questions: ${missingQuestions.join(', ')}\n`)
    }

    // Validate
    console.log('✓ Phase 5: Validating...')
    validateQuestions(quizQuestions)
    console.log()

    // Phase 6: Generate JSON
    console.log('💾 Phase 6: Generating quiz-questions.json...')
    await generateQuizJSON(quizQuestions, outputPath)

    // Summary
    console.log('\n✅ Extraction complete!')
    console.log(`📊 Summary:`)
    console.log(`   - Questions extracted: ${quizQuestions.length}`)
    console.log(`   - Questions with answers: ${quizQuestions.filter(q => q.correctAnswer !== undefined).length}`)
    console.log(`   - Output file: ${outputPath}`)
    console.log(`   - Log file: ${logPath}`)

    // Chapter distribution
    const chapterCounts: Record<string, number> = {}
    quizQuestions.forEach(q => {
      chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1
    })
    console.log(`\n📚 Chapter distribution:`)
    Object.entries(chapterCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([chapter, count]) => {
        console.log(`   ${chapter}: ${count}`)
      })

    logStream.close()

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
