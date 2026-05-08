export interface QuizQuestion {
  id: string
  chapter: string // matches CHAPTERS values (e.g., 'psoriasis', 'melanoma')
  question: string
  options: string[] // Always 4 options
  correctAnswer: number // Index of correct answer (0-3)
  explanation: string
  imageUrl?: string // Optional: e.g., "/quiz-images/american-board-001.png"
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
    console.error('Error loading quiz questions:', error)
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

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
