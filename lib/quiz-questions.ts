import { logger } from './logger'

export interface QuizQuestion {
  id: string
  chapter: string // matches CHAPTERS values (e.g., 'psoriasis', 'melanoma')
  question: string
  options: string[] // Always 4 options
  correctAnswer: number // Index of correct answer (0-3)
  explanation: string
  imageUrl?: string // Optional: e.g., "/quiz-images/american-board-001.png"
  testName?: string // e.g., "שלב א׳ הר״י", "American Board"
  year?: number // e.g., 2022
}

// Detect test metadata from question ID
export function getQuestionMetadata(question: QuizQuestion): { testName: string; year: number | null } {
  // Israeli Board exam questions (2022)
  if (question.id.startsWith('american-board-')) {
    return { testName: 'שלב א׳ הר״י', year: 2022 }
  }

  // Hebrew mnemonic questions (no specific year)
  return { testName: 'שאלות מקוריות', year: null }
}

export interface QuizQuestionsData {
  questions: QuizQuestion[]
}

// Load quiz questions from JSON file
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const response = await fetch('/quiz-questions.json')
    const data: QuizQuestionsData = await response.json()
    return data.questions
  } catch (error) {
    logger.error('Error loading quiz questions:', error)
    return []
  }
}

// Get questions filtered by chapters
export function filterQuestionsByChapters(
  questions: QuizQuestion[],
  selectedChapters: string[]
): QuizQuestion[] {
  if (selectedChapters.includes('all')) {
    return questions
  }
  return questions.filter(q => selectedChapters.includes(q.chapter))
}

// Filter questions by test and year
export function filterQuestionsByTestAndYear(
  questions: QuizQuestion[],
  selectedTests: string[],
  selectedYears: number[]
): QuizQuestion[] {
  if (selectedTests.includes('all')) {
    return questions
  }

  return questions.filter(q => {
    const metadata = getQuestionMetadata(q)

    // Check if test matches
    const testMatches = selectedTests.includes(metadata.testName)

    // Check if year matches (if year filter is applied)
    const yearMatches = selectedYears.length === 0 ||
                       metadata.year === null ||
                       selectedYears.includes(metadata.year)

    return testMatches && yearMatches
  })
}

// Get available years for a specific test
export function getAvailableYearsForTest(questions: QuizQuestion[], testName: string): number[] {
  const years = new Set<number>()

  questions.forEach(q => {
    const metadata = getQuestionMetadata(q)
    if (metadata.testName === testName && metadata.year !== null) {
      years.add(metadata.year)
    }
  })

  return Array.from(years).sort((a, b) => b - a) // Sort descending
}

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
