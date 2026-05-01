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
import { Label } from '@/components/ui/label'

interface QuizQuestion {
  aid: LearningAid
  correctAnswer: string
  options: string[]
}

export default function QuizPage() {
  const [aids, setAids] = useState<LearningAid[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedChapters, setSelectedChapters] = useState<string[]>(['all'])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/aids')
        const data: LearningAid[] = await response.json()
        setAids(data)
      } catch (error) {
        console.error('Error fetching aids:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const prepareQuiz = () => {
    // Filter aids by selected chapters
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

    if (quizableAids.length === 0) {
      alert('אין מספיק עזרי למידה עם תמונות ואבחנות בפרקים שנבחרו')
      return
    }

    // Get all unique diagnoses
    const allDiagnoses = Array.from(
      new Set(
        aids
          .flatMap(aid => aid.tags || [])
          .filter(tag => tag.category === 'diagnosis')
          .map(tag => tag.value_he || tag.value)
      )
    )

    // Create quiz questions
    const preparedQuestions: QuizQuestion[] = quizableAids.map(aid => {
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
        aid,
        correctAnswer,
        options
      }
    })

    // Shuffle questions
    const shuffled = preparedQuestions.sort(() => Math.random() - 0.5)
    setQuestions(shuffled)
    setQuizStarted(true)
  }

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return // Already answered

    setSelectedAnswer(answer)
    setShowResult(true)
    setAnsweredQuestions(prev => prev + 1)

    if (answer === currentQuestion.correctAnswer) {
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
    }
  }

  const handleRestart = () => {
    // Reset to chapter selection
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
                  {CHAPTERS.filter(c => c.value !== 'all').map((chapter) => (
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
                        {chapter.label}
                      </label>
                    </div>
                  ))}
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
        <p className="text-lg">אין מספיק עזרי למידה עם תמונות ואבחנות בפרקים שנבחרו</p>
        <Button onClick={() => setQuizStarted(false)}>חזרה לבחירת פרקים</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer

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

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Trophy className="h-4 w-4 ml-2" />
                {score}/{answeredQuestions}
              </Badge>
              <span className="text-sm text-muted-foreground">
                שאלה {currentQuestionIndex + 1} מתוך {questions.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Card */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-8 space-y-6">
            {/* Question */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">?מה האבחנה</h2>

              {currentQuestion.aid.chapter && (
                <Badge variant="secondary">
                  פרק {currentQuestion.aid.chapter}
                </Badge>
              )}
            </div>

            {/* Image */}
            {currentQuestion.aid.media_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={currentQuestion.aid.media_url}
                  alt="תמונה לשאלה"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 pt-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrectOption = option === currentQuestion.correctAnswer

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
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`text-lg h-auto py-4 justify-start ${extraClasses}`}
                  >
                    <span className="font-semibold ml-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                    {showResult && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 mr-auto" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 mr-auto" />
                    )}
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
                      <p className="text-xl font-semibold text-destructive">
                        לא נכון - התשובה הנכונה היא: {currentQuestion.correctAnswer}
                      </p>
                    </>
                  )}
                </div>

                {/* Show aid title and explanation */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{currentQuestion.aid.title}</h3>
                  {currentQuestion.aid.body && (
                    <p className="text-sm whitespace-pre-wrap">{currentQuestion.aid.body}</p>
                  )}
                  {currentQuestion.aid.explanation && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentQuestion.aid.explanation}
                    </p>
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
