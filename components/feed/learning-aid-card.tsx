'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, Brain, Lightbulb, Laugh, MessageCircle, Bookmark, Share2, CheckCircle2, Clock, Star } from 'lucide-react'
import { LearningAid } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CHAPTERS } from '@/lib/chapters'

interface LearningAidCardProps {
  aid: LearningAid
  locale?: 'he' | 'en'
}

export function LearningAidCard({ aid, locale = 'he' }: LearningAidCardProps) {
  const router = useRouter()
  const stats = aid.stats || {}
  const uploader = aid.uploader
  const [saved, setSaved] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  // Load user rating from localStorage on mount
  useState(() => {
    const savedRatings = localStorage.getItem('aid-ratings')
    if (savedRatings) {
      const ratings = JSON.parse(savedRatings)
      if (ratings[aid.id]) {
        setUserRating(ratings[aid.id])
      }
    }
  })

  const handleRating = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newRating = userRating === rating ? 0 : rating // Toggle off if same rating
    setUserRating(newRating)

    // Save to localStorage
    const savedRatings = localStorage.getItem('aid-ratings')
    const ratings = savedRatings ? JSON.parse(savedRatings) : {}
    if (newRating === 0) {
      delete ratings[aid.id]
    } else {
      ratings[aid.id] = newRating
    }
    localStorage.setItem('aid-ratings', JSON.stringify(ratings))
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(!saved)
    // TODO: Save to local storage or API
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/aid/${aid.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: aid.title,
          text: aid.body,
          url: url
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('הקישור הועתק ללוח!')
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
              <Badge variant="secondary" className="min-w-[70px] justify-center">
                {locale === 'he' ? chapterInfo.label : chapterInfo.label_en}
              </Badge>
            )
          })()}
        </div>

        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold leading-tight hover:text-primary transition-colors flex-1">
            {aid.title}
          </h3>
          {aid.verified && (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          )}
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
            />
          </div>
        )}

        {aid.body && (
          <p className="text-sm leading-relaxed">
            {aid.body}
          </p>
        )}

        {aid.caption && (
          <p className="text-sm text-muted-foreground">
            {aid.caption}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
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
            className="flex items-center gap-0.5"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                id={`rate-${aid.id}-${star}`}
                onClick={(e) => handleRating(star, e)}
                onMouseEnter={() => setHoverRating(star)}
                className="transition-transform hover:scale-110 p-0.5"
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
