'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, Lightbulb, Laugh, MessageCircle, Bookmark, Share2, CheckCircle2, Clock, Star } from 'lucide-react'
import { LearningAid } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CHAPTERS } from '@/lib/chapters'
import { MarkdownText } from '@/components/markdown-text'

interface LearningAidCardProps {
  aid: LearningAid
  locale?: 'he' | 'en'
}

interface ReactionCounts {
  heart: number
  brain: number
  lightbulb: number
  laugh: number
}

export function LearningAidCard({ aid, locale = 'he' }: LearningAidCardProps) {
  const router = useRouter()
  const stats = aid.stats || {}
  const uploader = aid.uploader
  const [saved, setSaved] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    heart: 0,
    brain: 0,
    lightbulb: 0,
    laugh: 0
  })
  const [userReactions, setUserReactions] = useState<string[]>([])
  const [reactionsLoading, setReactionsLoading] = useState(false)

  // Check if aid is recent (uploaded in last 48 hours)
  const isRecent = () => {
    const createdAt = new Date(aid.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 48
  }

  // Load user rating from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedRatings = localStorage.getItem('aid-ratings')
    if (savedRatings) {
      const ratings = JSON.parse(savedRatings)
      if (ratings[aid.id]) {
        setUserRating(ratings[aid.id])
      }
    }
  }, [aid.id])

  // Fetch reactions on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    async function fetchReactions() {
      try {
        const response = await fetch(`/api/aids/${aid.id}/reactions`)
        if (response.ok) {
          const data = await response.json()
          setReactionCounts(data.counts)
          setUserReactions(data.userReactions || [])
        }
      } catch (error) {
        console.error('Error fetching reactions:', error)
      }
    }
    fetchReactions()
  }, [aid.id])

  const handleRating = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newRating = userRating === rating ? 0 : rating // Toggle off if same rating
    setUserRating(newRating)

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const savedRatings = localStorage.getItem('aid-ratings')
      const ratings = savedRatings ? JSON.parse(savedRatings) : {}
      if (newRating === 0) {
        delete ratings[aid.id]
      } else {
        ratings[aid.id] = newRating
      }
      localStorage.setItem('aid-ratings', JSON.stringify(ratings))
    }
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(!saved)
    // TODO: Save to local storage or API
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()

    const url = `${window.location.origin}/aid/${aid.id}`
    const message = `בדוק את עזר הלמידה הזה: ${aid.title}\n\n${url}`
    const encodedMessage = encodeURIComponent(message)

    // Try WhatsApp first
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`

    // Open WhatsApp
    const whatsappWindow = window.open(whatsappUrl, '_blank')

    // Fallback: if WhatsApp doesn't open (not installed), use native share or copy
    setTimeout(() => {
      if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed === 'undefined') {
        if (navigator.share) {
          navigator.share({
            title: aid.title,
            text: message,
            url: url
          }).catch(err => console.log('Error sharing:', err))
        } else {
          navigator.clipboard.writeText(url)
          alert('הקישור הועתק ללוח!')
        }
      }
    }, 500)
  }

  const handleReaction = async (reactionType: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (reactionsLoading) return

    // Optimistic update - instant UI feedback
    const isActive = userReactions.includes(reactionType)
    const newUserReactions = isActive
      ? userReactions.filter(r => r !== reactionType)
      : [...userReactions, reactionType]
    const newCounts = {
      ...reactionCounts,
      [reactionType]: isActive
        ? Math.max(0, reactionCounts[reactionType as keyof ReactionCounts] - 1)
        : reactionCounts[reactionType as keyof ReactionCounts] + 1
    }

    setUserReactions(newUserReactions)
    setReactionCounts(newCounts)
    setReactionsLoading(true)

    try {
      const response = await fetch(`/api/aids/${aid.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction_type: reactionType })
      })

      if (!response.ok) {
        // Revert on error
        setUserReactions(userReactions)
        setReactionCounts(reactionCounts)

        if (response.status === 401) {
          // Redirect to login instead of showing alert
          window.location.href = '/auth/login'
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      // Revert on error
      setUserReactions(userReactions)
      setReactionCounts(reactionCounts)
    } finally {
      setReactionsLoading(false)
    }
  }

  const handleCardClick = () => {
    // Store current aid ID for navigation context
    // The parent component should set this in localStorage
    router.push(`/aid/${aid.id}`)
  }

  return (
    <Card
      id={`aid-card-${aid.id}`}
      className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={uploader?.avatar_url} />
              <AvatarFallback>{uploader?.display_name?.[0] || 'D'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{uploader?.display_name || 'דרמנמוניק'}</p>
              <p className="text-xs text-muted-foreground">{uploader?.hospital}</p>
            </div>
          </div>
          {aid.chapter && (() => {
            const chapterInfo = CHAPTERS.find(c => c.value === aid.chapter)
            return chapterInfo && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <span dir="ltr">
                  {chapterInfo.number
                    ? `${chapterInfo.number}. ${chapterInfo.label_en}`
                    : chapterInfo.label_en}
                </span>
              </Badge>
            )
          })()}
        </div>

        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold leading-tight hover:text-primary transition-colors flex-1">
            {aid.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isRecent() && (
              <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                חדש
              </Badge>
            )}
            {aid.verified && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
          </div>
        </div>

        {aid.tags && aid.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {aid.tags.slice(0, 5).map((tag, index) => (
              <Badge key={`${tag.category}-${tag.value}-${index}`} variant="outline" className="text-xs">
                {locale === 'he' && tag.value_he ? tag.value_he : tag.value}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {aid.media_url && (
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
            <Image
              src={aid.media_url}
              alt={aid.title}
              fill
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
            />
          </div>
        )}

        {aid.body && (
          <MarkdownText text={aid.body} className="text-sm leading-relaxed" />
        )}

        {aid.caption && (
          <p className="text-sm text-muted-foreground">
            {aid.caption}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {/* Reaction Buttons */}
        <div className="flex items-center justify-center gap-1 w-full">
          <button
            onClick={(e) => handleReaction('heart', e)}
            disabled={reactionsLoading}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all hover:scale-110 ${
              userReactions.includes('heart')
                ? 'bg-red-100 dark:bg-red-900/20'
                : 'hover:bg-muted'
            }`}
            aria-label="אהבתי"
          >
            <Heart
              className={`h-5 w-5 ${
                userReactions.includes('heart')
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground'
              }`}
            />
            {reactionCounts.heart > 0 && (
              <span className="text-xs font-medium">{reactionCounts.heart}</span>
            )}
          </button>

          <button
            onClick={(e) => handleReaction('brain', e)}
            disabled={reactionsLoading}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all hover:scale-110 ${
              userReactions.includes('brain')
                ? 'bg-blue-100 dark:bg-blue-900/20'
                : 'hover:bg-muted'
            }`}
            aria-label="כפיים"
          >
            <span
              className={`text-lg leading-none transition-all ${
                userReactions.includes('brain')
                  ? 'scale-110'
                  : 'grayscale opacity-60'
              }`}
            >
              👏
            </span>
            {reactionCounts.brain > 0 && (
              <span className="text-xs font-medium">{reactionCounts.brain}</span>
            )}
          </button>

          <button
            onClick={(e) => handleReaction('lightbulb', e)}
            disabled={reactionsLoading}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all hover:scale-110 ${
              userReactions.includes('lightbulb')
                ? 'bg-yellow-100 dark:bg-yellow-900/20'
                : 'hover:bg-muted'
            }`}
            aria-label="אהה!"
          >
            <Lightbulb
              className={`h-5 w-5 ${
                userReactions.includes('lightbulb')
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-muted-foreground'
              }`}
            />
            {reactionCounts.lightbulb > 0 && (
              <span className="text-xs font-medium">{reactionCounts.lightbulb}</span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between w-full text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {stats.comment_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              {stats.save_count || 0}
            </span>
          </div>
          {stats.rating_avg && stats.rating_avg > 0 && (
            <span className="font-medium flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {stats.rating_avg.toFixed(1)} ({stats.rating_count})
            </span>
          )}
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2 w-full justify-center">
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                id={`rate-${aid.id}-${star}`}
                onClick={(e) => handleRating(star, e)}
                onMouseEnter={() => setHoverRating(star)}
                className="transition-transform hover:scale-110 p-2 -m-1"
                aria-label={`דרג ${star} כוכבים`}
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= (hoverRating || userRating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {userRating > 0 && (
            <span className="text-xs text-muted-foreground">
              ({userRating})
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full pt-2 border-t">
          <Button
            id={`btn-save-${aid.id}`}
            variant={saved ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={handleSave}
          >
            <Bookmark className={`h-4 w-4 ms-1 ${saved ? 'fill-current' : ''}`} />
            {locale === 'he' ? 'שמור' : 'Save'}
          </Button>
          <Button
            id={`btn-share-${aid.id}`}
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
