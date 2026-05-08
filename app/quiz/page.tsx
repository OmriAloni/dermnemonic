'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react'
import type { LearningAid } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { CHAPTERS } from '@/lib/chapters'
import { Checkbox } from '@/components/ui/checkbox'
import type { QuizQuestion as StandaloneQuestion } from '@/lib/quiz-questions'
import { getQuizQuestions, filterQuestionsByChapters, shuffleArray } from '@/lib/quiz-questions'

// Union type for both question formats
type QuizQuestion =
  | { type: 'aid'; aid: LearningAid; correctAnswer: string; options: string[] }
  | { type: 'standalone'; question: StandaloneQuestion; relatedImage?: string; relatedImageAlt?: string }

const QUIZ_STATE_KEY = 'quiz_state'

export default function QuizPage() {
  const [aids, setAids] = useState<LearningAid[]>([])
  const [standaloneQuestions, setStandaloneQuestions] = useState<StandaloneQuestion[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedChapters, setSelectedChapters] = useState<string[]>(['all'])
  const [hasSavedState, setHasSavedState] = useState(false)

  // Load saved quiz state on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch learning aids
        const aidsResponse = await fetch('/api/aids')
        const aidsData: LearningAid[] = await aidsResponse.json()
        setAids(aidsData)

        // Fetch standalone quiz questions
        const quizQuestionsData = await getQuizQuestions()
        setStandaloneQuestions(quizQuestionsData)

        // Check for saved quiz state
        const savedState = localStorage.getItem(QUIZ_STATE_KEY)
        if (savedState) {
          setHasSavedState(true)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Save quiz state whenever it changes
  useEffect(() => {
    if (quizStarted && !quizComplete) {
      const state = {
        questions,
        currentQuestionIndex,
        selectedAnswer,
        showResult,
        score,
        answeredQuestions,
        selectedChapters,
        timestamp: Date.now()
      }
      localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state))
    }
  }, [quizStarted, questions, currentQuestionIndex, selectedAnswer, showResult, score, answeredQuestions, selectedChapters, quizComplete])

  const loadSavedState = () => {
    const savedState = localStorage.getItem(QUIZ_STATE_KEY)
    if (savedState) {
      const state = JSON.parse(savedState)
      setQuestions(state.questions)
      setCurrentQuestionIndex(state.currentQuestionIndex)
      setSelectedAnswer(state.selectedAnswer)
      setShowResult(state.showResult)
      setScore(state.score)
      setAnsweredQuestions(state.answeredQuestions)
      setSelectedChapters(state.selectedChapters)
      setQuizStarted(true)
      setHasSavedState(false)
    }
  }

  const clearSavedState = () => {
    localStorage.removeItem(QUIZ_STATE_KEY)
    setHasSavedState(false)
  }

  const prepareQuiz = () => {
    clearSavedState()
    // Filter standalone questions by chapter
    const filteredStandaloneQuestions = filterQuestionsByChapters(standaloneQuestions, selectedChapters)

    // Filter learning aids by selected chapters
    let filteredAids = aids

    if (!selectedChapters.includes('all')) {
      filteredAids = aids.filter(aid =>
        selectedChapters.some(chapter => {
          const chapterInfo = CHAPTERS.find(c => c.value === chapter)
          return aid.chapter === chapter ||
                 aid.chapter === chapterInfo?.label ||
                 aid.chapter === chapterInfo?.label_en
        })
      )
    }

    // Filter aids that have images and diagnosis tags
    const quizableAids = filteredAids.filter(aid =>
      aid.media_url &&
      aid.tags?.some(tag => tag.category === 'diagnosis')
    )

    // Get all unique diagnoses for aid-based questions
    const allDiagnoses = Array.from(
      new Set(
        aids
          .flatMap(aid => aid.tags || [])
          .filter(tag => tag.category === 'diagnosis')
          .map(tag => tag.value_he || tag.value)
      )
    )

    // Create aid-based quiz questions
    const aidQuestions: QuizQuestion[] = quizableAids.map(aid => {
      const correctDiagnosis = aid.tags?.find(tag => tag.category === 'diagnosis')
      const correctAnswer = correctDiagnosis?.value_he || correctDiagnosis?.value || ''

      // Get 3 random wrong answers
      const wrongAnswers = allDiagnoses
        .filter(d => d !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

      // Combine and shuffle
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

      return {
        type: 'aid' as const,
        aid,
        correctAnswer,
        options
      }
    })

    // Create standalone questions with related images from the same chapter
    const standaloneQs: QuizQuestion[] = filteredStandaloneQuestions.map(q => {
      // Find learning aids in the same chapter with images
      const relatedAids = aids.filter(aid => {
        if (!aid.media_url) return false

        // Check if aid belongs to the same chapter
        const chapterInfo = CHAPTERS.find(c => c.value === q.chapter)
        if (!chapterInfo) return false

        return aid.chapter === q.chapter ||
               aid.chapter === chapterInfo.label ||
               aid.chapter === chapterInfo.label_en
      })

      // Pick a random related aid with image, or the first one
      const relatedAid = relatedAids.length > 0
        ? relatedAids[Math.floor(Math.random() * relatedAids.length)]
        : null

      // Shuffle options and update correct answer index
      const correctAnswerText = q.options[q.correctAnswer]
      const shuffledOptions = shuffleArray([...q.options])
      const newCorrectAnswerIndex = shuffledOptions.indexOf(correctAnswerText)

      return {
        type: 'standalone' as const,
        question: {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswerIndex
        },
        relatedImage: relatedAid?.media_url,
        relatedImageAlt: relatedAid?.title
      }
    })

    // Combine and shuffle all questions
    const allQuestions = [...aidQuestions, ...standaloneQs]

    if (allQuestions.length === 0) {
      alert('אין מספיק שאלות בפרקים שנבחרו')
      return
    }

    // Shuffle all questions - each question appears exactly once
    const shuffled = shuffleArray(allQuestions)

    // Safety check: Remove any duplicates (shouldn't happen, but just in case)
    const uniqueQuestions = shuffled.filter((q, index, self) => {
      if (q.type === 'aid') {
        return index === self.findIndex(other =>
          other.type === 'aid' && other.aid.id === q.aid.id
        )
      } else {
        return index === self.findIndex(other =>
          other.type === 'standalone' && other.question.id === q.question.id
        )
      }
    })

    setQuestions(uniqueQuestions)
    setQuizStarted(true)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return // Already answered

    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setAnsweredQuestions(prev => prev + 1)

    const currentQ = questions[currentQuestionIndex]
    let isCorrect = false

    if (currentQ.type === 'aid') {
      isCorrect = currentQ.options[answerIndex] === currentQ.correctAnswer
    } else {
      isCorrect = answerIndex === currentQ.question.correctAnswer
    }

    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizComplete(true)
      clearSavedState()
    }
  }

  const handleRestart = () => {
    clearSavedState()
    setQuizStarted(false)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnsweredQuestions(0)
    setQuizComplete(false)
  }

  const toggleChapter = (chapterValue: string) => {
    if (chapterValue === 'all') {
      setSelectedChapters(['all'])
    } else {
      const newSelection = selectedChapters.includes(chapterValue)
        ? selectedChapters.filter(c => c !== chapterValue)
        : [...selectedChapters.filter(c => c !== 'all'), chapterValue]

      setSelectedChapters(newSelection.length === 0 ? ['all'] : newSelection)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    )
  }

  // Chapter Selection Screen
  if (!quizStarted) {
    // Calculate available questions per chapter
    const chapterQuestionCounts = new Map<string, number>()

    // Helper function to map aid.chapter to chapter value
    const getChapterValue = (aidChapter: string | null | undefined): string | null => {
      if (!aidChapter) return null

      // Try to find matching chapter by value, label, or label_en
      const matchingChapter = CHAPTERS.find(c =>
        c.value === aidChapter ||
        c.label === aidChapter ||
        c.label_en === aidChapter
      )

      return matchingChapter?.value || null
    }

    // Count standalone questions
    standaloneQuestions.forEach(q => {
      chapterQuestionCounts.set(q.chapter, (chapterQuestionCounts.get(q.chapter) || 0) + 1)
    })

    // Count aid-based questions
    aids.forEach(aid => {
      if (aid.media_url && aid.tags?.some(tag => tag.category === 'diagnosis')) {
        const chapterValue = getChapterValue(aid.chapter)
        if (chapterValue) {
          chapterQuestionCounts.set(chapterValue, (chapterQuestionCounts.get(chapterValue) || 0) + 1)
        }
      }
    })

    return (
      <div id="chapter-selection" className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                <span className="text-sm">חזרה לפיד</span>
              </Link>
              <h1 className="text-xl font-bold">למידה רציפה</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {hasSavedState && (
            <Card className="mb-6 border-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">יש לך חידון בתהליך</h3>
                    <p className="text-sm text-muted-foreground">המשך מהמקום שבו הפסקת</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadSavedState} className="bg-primary hover:bg-primary/90">
                      המשך חידון
                    </Button>
                    <Button onClick={clearSavedState} variant="outline">
                      התחל מחדש
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">בחר פרקים ללמידה</h2>
                <p className="text-muted-foreground">
                  בחר פרק אחד או יותר, או לחץ "כל הפרקים" ללמידה מלאה
                </p>
              </div>

              <div className="space-y-4">
                {/* All Chapters Option */}
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="chapter-all"
                    checked={selectedChapters.includes('all')}
                    onCheckedChange={() => toggleChapter('all')}
                  />
                  <label htmlFor="chapter-all" className="text-lg font-semibold cursor-pointer flex-1">
                    כל הפרקים
                  </label>
                </div>

                {/* Individual Chapters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-2">
                  {CHAPTERS.filter(c => c.value !== 'all').map((chapter) => {
                    const questionCount = chapterQuestionCounts.get(chapter.value) || 0

                    return (
                      <div key={chapter.value} className="flex items-start gap-2">
                        <Checkbox
                          id={`chapter-${chapter.value}`}
                          checked={selectedChapters.includes(chapter.value)}
                          onCheckedChange={() => toggleChapter(chapter.value)}
                          disabled={selectedChapters.includes('all')}
                          className="mt-1"
                        />
                        <label
                          htmlFor={`chapter-${chapter.value}`}
                          className="text-sm cursor-pointer flex-1 leading-tight"
                        >
                          <span dir="ltr">
                            {chapter.number ? `${chapter.number}. ` : ''}{chapter.label_en}
                            {questionCount > 0 && (
                              <span className="text-muted-foreground ms-1">({questionCount})</span>
                            )}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button
                  onClick={prepareQuiz}
                  size="lg"
                  className="w-full"
                  disabled={selectedChapters.length === 0}
                >
                  התחל למידה
                  {selectedChapters.includes('all')
                    ? ' (כל הפרקים)'
                    : selectedChapters.length > 0
                      ? ` (${selectedChapters.length} פרקים)`
                      : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg">אין מספיק שאלות בפרקים שנבחרו</p>
        <Button onClick={() => setQuizStarted(false)}>חזרה לבחירת פרקים</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Determine if answer is correct
  let isCorrect = false
  let correctAnswerIndex = -1

  if (currentQuestion.type === 'aid') {
    isCorrect = selectedAnswer !== null && currentQuestion.options[selectedAnswer] === currentQuestion.correctAnswer
    correctAnswerIndex = currentQuestion.options.indexOf(currentQuestion.correctAnswer)
  } else {
    isCorrect = selectedAnswer === currentQuestion.question.correctAnswer
    correctAnswerIndex = currentQuestion.question.correctAnswer
  }

  if (quizComplete) {
    const percentage = Math.round((score / answeredQuestions) * 100)

    return (
      <div id="quiz-complete" className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span className="text-sm">חזרה לפיד</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="text-center">
            <CardContent className="p-12 space-y-6">
              <Trophy className="h-20 w-20 mx-auto text-primary" />
              <h1 className="text-4xl font-bold">!כל הכבוד</h1>
              <div className="space-y-2">
                <p className="text-6xl font-bold text-primary">{percentage}%</p>
                <p className="text-xl text-muted-foreground">
                  ענית נכון על {score} מתוך {answeredQuestions} שאלות
                </p>
              </div>

              {percentage === 100 && (
                <p className="text-xl font-semibold text-primary">!מושלם! ידע מצוין</p>
              )}
              {percentage >= 80 && percentage < 100 && (
                <p className="text-xl font-semibold">!עבודה מצוינת</p>
              )}
              {percentage >= 60 && percentage < 80 && (
                <p className="text-xl font-semibold">!עבודה טובה, תמשיך ללמוד</p>
              )}
              {percentage < 60 && (
                <p className="text-xl font-semibold">כדאי לחזור על החומר</p>
              )}

              <div className="flex gap-3 pt-6">
                <Button
                  id="btn-restart-quiz"
                  onClick={handleRestart}
                  className="flex-1"
                  size="lg"
                >
                  <RotateCcw className="h-5 w-5 ms-2" />
                  שחק שוב
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowRight className="h-5 w-5 ms-2" />
                    חזרה לפיד
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div id="quiz-page" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span className="text-sm">חזרה לפיד</span>
            </Link>

            <div className="flex items-center gap-2 md:gap-4">
              <Badge variant="secondary" className="text-sm md:text-base px-2 md:px-3 py-1">
                <Trophy className="h-4 w-4 ml-1 md:ml-2" />
                <span>{score}/{answeredQuestions}</span>
              </Badge>
              <span className="text-xs md:text-sm text-muted-foreground">
                שאלה {currentQuestionIndex + 1} מתוך {questions.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuizComplete(true)}
                className="text-xs md:text-sm"
              >
                סיים עכשיו
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Card */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-8 space-y-6">
            {/* Question Type Badge */}
            <div className="flex items-center justify-center gap-2">
              {currentQuestion.type === 'aid' ? (
                <>
                  <Badge variant="secondary">שאלה על סמך תמונה</Badge>
                  {currentQuestion.aid.chapter && (
                    <Badge variant="outline">
                      פרק {currentQuestion.aid.chapter}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary">מבחן הרי"י 2022</Badge>
                  {(() => {
                    const chapterInfo = CHAPTERS.find(c => c.value === currentQuestion.question.chapter)
                    return chapterInfo && (
                      <Badge variant="outline" dir="ltr">
                        {chapterInfo.number ? `${chapterInfo.number}. ` : ''}{chapterInfo.label_en}
                      </Badge>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Question Text */}
            <div className="text-center space-y-4">
              {currentQuestion.type === 'aid' ? (
                <h2 className="text-2xl font-bold">?מה האבחנה</h2>
              ) : (
                <div className="text-right">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.question.question}
                  </p>
                </div>
              )}
            </div>

            {/* Image (for aid-based questions and standalone questions with related images) */}
            {((currentQuestion.type === 'aid' && currentQuestion.aid.media_url) ||
              (currentQuestion.type === 'standalone' && currentQuestion.relatedImage)) && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={
                    currentQuestion.type === 'aid'
                      ? currentQuestion.aid.media_url!
                      : currentQuestion.relatedImage!
                  }
                  alt={
                    currentQuestion.type === 'aid'
                      ? 'תמונה לשאלה'
                      : currentQuestion.relatedImageAlt || 'תמונת הדגמה מהפרק'
                  }
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 pt-4">
              {(currentQuestion.type === 'aid' ? currentQuestion.options : currentQuestion.question.options).map((option, index) => {
                const isSelected = selectedAnswer === index
                const isCorrectOption = index === correctAnswerIndex

                let buttonVariant: 'default' | 'outline' | 'destructive' = 'outline'
                let extraClasses = ''

                if (showResult) {
                  if (isCorrectOption) {
                    buttonVariant = 'default'
                    extraClasses = 'bg-green-600 hover:bg-green-700 border-green-600'
                  } else if (isSelected && !isCorrectOption) {
                    buttonVariant = 'destructive'
                  }
                }

                return (
                  <Button
                    key={index}
                    id={`quiz-option-${index}`}
                    variant={buttonVariant}
                    size="lg"
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`h-auto min-h-[56px] py-3 px-4 text-right ${extraClasses}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="font-bold text-base shrink-0">{String.fromCharCode(65 + index)}.</span>
                      <span className="flex-1 text-sm md:text-base leading-relaxed text-right whitespace-normal">
                        {option}
                      </span>
                      {showResult && isCorrectOption && (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      )}
                      {showResult && isSelected && !isCorrectOption && (
                        <XCircle className="h-5 w-5 shrink-0" />
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>

            {/* Result Explanation */}
            {showResult && (
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <p className="text-xl font-semibold text-green-600">!נכון</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <p className="text-xl font-semibold text-destructive">לא נכון</p>
                    </>
                  )}
                </div>

                {/* Explanation */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {currentQuestion.type === 'aid' ? (
                    <>
                      <h3 className="font-semibold text-lg">התשובה הנכונה: {currentQuestion.correctAnswer}</h3>
                      <h4 className="font-semibold">{currentQuestion.aid.title}</h4>
                      {currentQuestion.aid.body && (
                        <p className="text-sm whitespace-pre-wrap">{currentQuestion.aid.body}</p>
                      )}
                      {currentQuestion.aid.explanation && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {currentQuestion.aid.explanation}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">
                        התשובה הנכונה: {String.fromCharCode(65 + currentQuestion.question.correctAnswer)}
                      </h3>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.question.explanation}
                      </p>
                    </>
                  )}
                </div>

                <Button
                  id="btn-next-question"
                  onClick={handleNext}
                  size="lg"
                  className="w-full"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'שאלה הבאה' : 'סיים משחק'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
