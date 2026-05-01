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
  Heart,
  MessageCircle,
  Bookmark,
  Star,
  CheckCircle,
  Pin
} from 'lucide-react'
import type { LearningAid } from '@/lib/types'
import { CHAPTERS } from '@/lib/chapters'

export default function AidDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [aid, setAid] = useState<LearningAid | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAid() {
      try {
        const response = await fetch(`/api/aids/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch learning aid')
        }
        const data = await response.json()
        setAid(data)
      } catch (err) {
        setError('שגיאה בטעינת עזר הלמידה')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAid()
  }, [id])

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <ArrowRight className="h-5 w-5" />
              <span>חזרה לפיד</span>
            </Link>
            <div className="flex items-center gap-2">
              {aid.pinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  מוצמד
                </Badge>
              )}
              {aid.verified && (
                <Badge variant="default" className="gap-1 bg-green-500">
                  <CheckCircle className="h-3 w-3" />
                  מאומת
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
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-3xl font-bold flex-1">{aid.title}</h1>
            {aid.chapter && (() => {
              const chapterInfo = CHAPTERS.find(c => c.value === aid.chapter)
              return chapterInfo && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {chapterInfo.label}
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
          <Button variant="outline" className="flex-1" disabled>
            <Heart className="h-4 w-4 ms-1" />
            אהבתי
          </Button>
          <Button variant="outline" className="flex-1" disabled>
            <Bookmark className="h-4 w-4 ms-1" />
            שמור
          </Button>
          <Button variant="outline" className="flex-1" disabled>
            שתף
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
