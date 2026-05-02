'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RatingStars } from '@/components/rating-stars'
import { CommentsSection } from '@/components/comments-section'
import {
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Star,
  CheckCircle,
  Pin,
  Share2
} from 'lucide-react'
import type { LearningAid } from '@/lib/types'
import { CHAPTERS } from '@/lib/chapters'

export default function AidDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [aid, setAid] = useState<LearningAid | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allAids, setAllAids] = useState<LearningAid[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [saved, setSaved] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current aid
        const aidResponse = await fetch(`/api/aids/${id}`)
        if (!aidResponse.ok) {
          throw new Error('Failed to fetch learning aid')
        }
        const aidData = await aidResponse.json()
        setAid(aidData)

        // Check if saved in localStorage
        if (typeof window !== 'undefined') {
          const savedAids = localStorage.getItem('saved-aids')
          if (savedAids) {
            const saved = JSON.parse(savedAids)
            setSaved(saved.includes(id))
          }
        }

        // Fetch reactions to see if user liked
        const reactionsResponse = await fetch(`/api/aids/${id}/reactions`)
        if (reactionsResponse.ok) {
          const reactionsData = await reactionsResponse.json()
          setLikeCount(reactionsData.counts.heart || 0)
          setLiked(reactionsData.userReactions?.includes('heart') || false)
        }

        // Fetch all aids for navigation
        const allResponse = await fetch('/api/aids')
        if (allResponse.ok) {
          const allData = await allResponse.json()
          setAllAids(allData)
          const index = allData.findIndex((a: LearningAid) => a.id === id)
          setCurrentIndex(index)
        }
      } catch (err) {
        setError('שגיאה בטעינת עזר הלמידה')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/aids/${id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: 'heart' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.action === 'added') {
          setLiked(true)
          setLikeCount(likeCount + 1)
        } else {
          setLiked(false)
          setLikeCount(Math.max(0, likeCount - 1))
        }
      } else if (response.status === 401) {
        alert('יש להתחבר כדי להגיב')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSave = () => {
    if (typeof window === 'undefined') return

    const savedAids = localStorage.getItem('saved-aids')
    const saved = savedAids ? JSON.parse(savedAids) : []

    if (saved.includes(id)) {
      const updated = saved.filter((aidId: string) => aidId !== id)
      localStorage.setItem('saved-aids', JSON.stringify(updated))
      setSaved(false)
    } else {
      localStorage.setItem('saved-aids', JSON.stringify([...saved, id]))
      setSaved(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !aid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-lg mb-4">{error || 'עזר למידה לא נמצא'}</p>
            <Link href="/">
              <Button>חזרה לדף הבית</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = aid.uploader?.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?'

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allAids.length - 1
  const previousAid = hasPrevious ? allAids[currentIndex - 1] : null
  const nextAid = hasNext ? allAids[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-background relative">
      {/* Side Navigation - Carousel Style (hidden on mobile to avoid overlap) */}
      {hasPrevious && (
        <Link
          href={`/aid/${previousAid?.id}`}
          className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-20 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-3 shadow-lg transition-all hover:scale-110"
          aria-label="עזר למידה קודם"
        >
          <ChevronRight className="h-6 w-6" />
        </Link>
      )}
      {hasNext && (
        <Link
          href={`/aid/${nextAid?.id}`}
          className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-20 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-3 shadow-lg transition-all hover:scale-110"
          aria-label="עזר למידה הבא"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      )}

      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Back button - icon only on mobile */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 flex-shrink-0">
              <ArrowRight className="h-5 w-5" />
              <span className="hidden sm:inline">חזרה לפיד</span>
            </Link>

            {/* Top Navigation Arrows - compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link
                href={hasPrevious ? `/aid/${previousAid?.id}` : '#'}
                className={`p-2 rounded-md transition-colors ${
                  hasPrevious
                    ? 'hover:bg-accent text-foreground'
                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                }`}
                onClick={(e) => !hasPrevious && e.preventDefault()}
                aria-label="עזר למידה קודם"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-xs sm:text-sm text-muted-foreground min-w-[45px] sm:min-w-[50px] text-center">
                {currentIndex + 1}/{allAids.length}
              </span>
              <Link
                href={hasNext ? `/aid/${nextAid?.id}` : '#'}
                className={`p-2 rounded-md transition-colors ${
                  hasNext
                    ? 'hover:bg-accent text-foreground'
                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                }`}
                onClick={(e) => !hasNext && e.preventDefault()}
                aria-label="עזר למידה הבא"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>

            {/* Badges - hide text on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {aid.pinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  <span className="hidden sm:inline">מוצמד</span>
                </Badge>
              )}
              {aid.verified && (
                <Badge variant="default" className="gap-1 bg-green-500">
                  <CheckCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">מאומת</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {aid.media_url && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-6">
            <Image
              src={aid.media_url}
              alt={aid.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4 flex-wrap">
            <h1 className="text-3xl font-bold flex-1 min-w-0">{aid.title}</h1>
            {aid.chapter && (() => {
              const chapterInfo = CHAPTERS.find(c => c.value === aid.chapter)
              return chapterInfo && (
                <Badge variant="secondary" className="text-base px-3 py-1 flex-shrink-0">
                  פרק: {chapterInfo.label}
                </Badge>
              )
            })()}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{aid.uploader?.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {aid.uploader?.hospital}
                  {aid.uploader?.year_of_residency && ` • שנה ${aid.uploader.year_of_residency}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {aid.stats?.rating_avg?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs">({aid.stats?.rating_count || 0})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-sm">{aid.stats?.reaction_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{aid.stats?.comment_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bookmark className="h-4 w-4" />
                <span className="text-sm">{aid.stats?.save_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-6">
          {aid.body && (
            <div>
              <h2 className="text-xl font-semibold mb-3">תוכן</h2>
              <div className="prose prose-lg max-w-none">
                <p className="whitespace-pre-wrap text-lg leading-relaxed">{aid.body}</p>
              </div>
            </div>
          )}

          {aid.explanation && (
            <div>
              <h2 className="text-xl font-semibold mb-3">הסבר</h2>
              <div className="prose max-w-none bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{aid.explanation}</p>
              </div>
            </div>
          )}

          {aid.tags && aid.tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">תגיות</h2>
              <div className="flex flex-wrap gap-2">
                {aid.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.value_he || tag.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {aid.source_citation && (
            <div>
              <h2 className="text-xl font-semibold mb-3">מקור</h2>
              <p className="text-sm text-muted-foreground">{aid.source_citation}</p>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        <div className="flex gap-3 mb-8">
          <Button
            variant={liked ? 'default' : 'outline'}
            className={`flex-1 h-11 ${liked ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 sm:ms-1 ${liked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">אהבתי</span>
            {likeCount > 0 && <span className="text-xs ms-1">({likeCount})</span>}
          </Button>
          <Button
            variant={saved ? 'default' : 'outline'}
            className="flex-1 h-11"
            onClick={handleSave}
          >
            <Bookmark className={`h-4 w-4 sm:ms-1 ${saved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">שמור</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => {
              const url = `${window.location.origin}/aid/${aid.id}`
              const message = `בדוק את עזר הלמידה הזה: ${aid.title}\n\n${url}`
              const encodedMessage = encodeURIComponent(message)
              const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
              const whatsappUrl = isMobile
                ? `whatsapp://send?text=${encodedMessage}`
                : `https://wa.me/?text=${encodedMessage}`
              window.open(whatsappUrl, '_blank')
            }}
          >
            <Share2 className="h-4 w-4 sm:ms-1" />
            <span className="hidden sm:inline">שתף</span>
          </Button>
        </div>

        {/* Rating */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">דרג עזר למידה זה</h3>
          <RatingStars aidId={aid.id} />
        </div>

        <Separator className="my-8" />

        {/* Comments Section */}
        <CommentsSection aidId={aid.id} />

        <div className="mt-8 text-sm text-muted-foreground text-center">
          נוצר ב-{new Date(aid.created_at).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </main>
    </div>
  )
}
