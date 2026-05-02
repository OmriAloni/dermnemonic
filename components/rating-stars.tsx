'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface RatingStarsProps {
  aidId: string
  initialRating?: number
  onChange?: (rating: number) => void
}

export function RatingStars({ aidId, initialRating = 0, onChange }: RatingStarsProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }

    // Fetch user's existing rating
    async function fetchUserRating() {
      try {
        const response = await fetch(`/api/aids/${aidId}/ratings`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.stars) {
            setRating(data.stars)
          }
        }
      } catch (error) {
        console.error('Error fetching rating:', error)
      }
    }

    checkAuth()
    fetchUserRating()
  }, [aidId])

  const handleRating = async (stars: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/aids/${aidId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stars })
      })

      if (response.ok) {
        const data = await response.json()
        setRating(stars)
        if (onChange) {
          onChange(stars)
        }
      }
    } catch (error) {
      console.error('Error saving rating:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">יש להתחבר כדי לדרג</p>
        <Link href="/auth/login">
          <Button size="sm">התחבר</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={loading}
          className="transition-transform hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ms-2 text-sm text-muted-foreground">
          דירגת {rating} כוכבים
        </span>
      )}
    </div>
  )
}
