'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ArrowRight, Upload as UploadIcon, Trophy, Medal, Award } from 'lucide-react'
import type { LearningAid } from '@/lib/types'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface UploaderStats {
  id: string
  name: string
  hospital: string
  avatar_url?: string
  role: string
  totalUploads: number
  avgRating: number
  totalReactions: number
  totalSaves: number
  userRating?: number
}

export default function UploadersPage() {
  const [uploaders, setUploaders] = useState<UploaderStats[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchUploaders() {
      try {
        const response = await fetch('/api/aids')
        const aids: LearningAid[] = await response.json()

        // Group by uploader
        const uploaderMap = new Map<string, UploaderStats>()

        aids.forEach(aid => {
          const uploader = aid.uploader
          if (!uploader) return

          if (!uploaderMap.has(uploader.id)) {
            uploaderMap.set(uploader.id, {
              id: uploader.id,
              name: uploader.display_name,
              hospital: uploader.hospital || '',
              avatar_url: uploader.avatar_url,
              role: uploader.role,
              totalUploads: 0,
              avgRating: 0,
              totalReactions: 0,
              totalSaves: 0,
            })
          }

          const stats = uploaderMap.get(uploader.id)!
          stats.totalUploads++
          stats.totalReactions += aid.stats?.reaction_count || 0
          stats.totalSaves += aid.stats?.save_count || 0

          // Calculate average rating across all their aids
          if (aid.stats?.rating_avg) {
            const currentTotal = stats.avgRating * (stats.totalUploads - 1)
            stats.avgRating = (currentTotal + aid.stats.rating_avg) / stats.totalUploads
          }
        })

        const uploadersArray = Array.from(uploaderMap.values())
          .sort((a, b) => b.totalUploads - a.totalUploads)

        setUploaders(uploadersArray)

        // Load saved ratings from localStorage
        const savedRatings = localStorage.getItem('uploader-ratings')
        if (savedRatings) {
          setRatings(JSON.parse(savedRatings))
        }
      } catch (error) {
        logger.error('Error fetching uploaders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUploaders()
  }, [])

  const handleRate = (uploaderId: string, rating: number) => {
    const newRatings = { ...ratings, [uploaderId]: rating }
    setRatings(newRatings)
    localStorage.setItem('uploader-ratings', JSON.stringify(newRatings))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    )
  }

  return (
    <div id="uploaders-page" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span>חזרה לפיד</span>
            </Link>
            <h1 className="text-xl font-bold">מעלים ודירוגים</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Winner Podium */}
        {uploaders.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">🏆 מצעד המנצחים</h2>
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center" style={{ width: '150px' }}>
                <Avatar className="h-20 w-20 mb-3 ring-4 ring-slate-400">
                  <AvatarImage src={uploaders[1]?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-slate-100">
                    {uploaders[1]?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <Medal className="h-8 w-8 text-slate-400 mb-2" />
                <p className="font-semibold text-center text-sm mb-1">{uploaders[1]?.name}</p>
                <div className="w-full bg-slate-400/20 rounded-t-lg pt-8 pb-4 px-3 text-center border-2 border-slate-400">
                  <div className="text-3xl font-bold text-slate-600">2</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {uploaders[1]?.totalUploads} העלאות
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center" style={{ width: '150px' }}>
                <Avatar className="h-24 w-24 mb-3 ring-4 ring-primary">
                  <AvatarImage src={uploaders[0]?.avatar_url} />
                  <AvatarFallback className="text-3xl bg-primary/10">
                    {uploaders[0]?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <p className="font-bold text-center mb-1">{uploaders[0]?.name}</p>
                <div className="w-full bg-primary/20 rounded-t-lg pt-12 pb-4 px-3 text-center border-2 border-primary">
                  <div className="text-4xl font-bold text-primary">1</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {uploaders[0]?.totalUploads} העלאות
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center" style={{ width: '150px' }}>
                <Avatar className="h-16 w-16 mb-3 ring-4 ring-amber-600">
                  <AvatarImage src={uploaders[2]?.avatar_url} />
                  <AvatarFallback className="text-xl bg-amber-50">
                    {uploaders[2]?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <Award className="h-7 w-7 text-amber-600 mb-2" />
                <p className="font-semibold text-center text-sm mb-1">{uploaders[2]?.name}</p>
                <div className="w-full bg-amber-600/20 rounded-t-lg pt-6 pb-4 px-3 text-center border-2 border-amber-600">
                  <div className="text-2xl font-bold text-amber-700">3</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {uploaders[2]?.totalUploads} העלאות
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">כל המעלים</h2>
          <p className="text-muted-foreground">
            דרג את המעלים לפי איכות התוכן שלהם
          </p>
        </div>

        <div className="grid gap-4">
          {uploaders.map((uploader, index) => {
            // Skip top 3 if we showed them in podium
            if (uploaders.length >= 3 && index < 3) {
              return null
            }

            return (
              <Card key={uploader.id} id={`uploader-card-${uploader.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={uploader.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {uploader.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-background">
                          #{index + 1}
                        </div>
                      </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{uploader.name}</h3>
                        {uploader.role === 'verified_contributor' && (
                          <Badge variant="secondary">מאומת</Badge>
                        )}
                        {uploader.role === 'curator' && (
                          <Badge variant="default">אוצר</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {uploader.hospital}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {uploader.totalUploads}
                    </div>
                    <div className="text-xs text-muted-foreground">העלאות</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {uploader.avgRating > 0 ? uploader.avgRating.toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">דירוג ממוצע</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {uploader.totalReactions}
                    </div>
                    <div className="text-xs text-muted-foreground">תודות</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {uploader.totalSaves}
                    </div>
                    <div className="text-xs text-muted-foreground">שמירות</div>
                  </div>
                </div>

                {/* Rating */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">דרג את המעלה:</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        id={`rate-${uploader.id}-${star}`}
                        onClick={() => handleRate(uploader.id, star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (ratings[uploader.id] || 0)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                    {ratings[uploader.id] && (
                      <span className="text-sm text-muted-foreground mr-2">
                        דירגת: {ratings[uploader.id]}/5
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          )}
        </div>

        {uploaders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <UploadIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">אין עדיין מעלים</p>
              <Link href="/upload">
                <Button>העלה תוכן ראשון</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
