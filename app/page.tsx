'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Users, Brain } from 'lucide-react'
import { LearningAidCard } from '@/components/feed/learning-aid-card'
import { FeedSkeleton } from '@/components/feed/learning-aid-skeleton'
import { SimpleFilterPanel, type SimpleFilterState } from '@/components/filters/simple-filter-panel'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'
import type { LearningAid } from '@/lib/types'
import Link from 'next/link'
import { CHAPTERS } from '@/lib/chapters'

// Removed mock data - will fetch from API
const mockAidsOld: LearningAid[] = [
  {
    id: '1',
    uploader_id: 'user1',
    title: '5 P\'s של Lichen Planus',
    body: 'Pruritic, Purple, Polygonal, Planar, Papules',
    explanation: 'זכור את 5 ה-P\'s הקלאסיים של Lichen Planus. זה אחד המנמוניקים הכי שימושיים בדרמטולוגיה.',
    media_type: 'text-only',
    verified: true,
    pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploader: {
      id: 'user1',
      email: 'dr.maya@example.com',
      display_name: 'ד״ר מאיה כהן',
      hospital: 'איכילוב',
      role: 'verified_contributor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    tags: [
      { id: 't1', category: 'diagnosis', value: 'lichen-planus', value_he: 'ליכן פלנוס', created_at: new Date().toISOString() },
      { id: 't2', category: 'aid_type', value: 'mnemonic', value_he: 'מנמוניק', created_at: new Date().toISOString() },
    ],
    stats: {
      rating_avg: 4.8,
      rating_count: 24,
      reaction_count: 45,
      comment_count: 8,
      save_count: 32,
    }
  },
  {
    id: '2',
    uploader_id: 'user2',
    title: 'סרפדת כרונית - אסוציאציות',
    body: 'סכרת, ראומטואיד ארתריטיס, פרנישוס אנמיה, דה-פיגמנטציה (ויטיליגו), תיאוריד (היפו)',
    explanation: 'זכרון לאסוציאציות של אורטיקריה כרונית: סרפדת = סכרת + RA + פרנישוס + ויטיליגו + היפותיאורידיזם',
    media_type: 'text-only',
    verified: false,
    pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploader: {
      id: 'user2',
      email: 'resident@example.com',
      display_name: 'יוסי לוי',
      hospital: 'הדסה',
      year_of_residency: 3,
      role: 'contributor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    tags: [
      { id: 't3', category: 'diagnosis', value: 'urticaria', value_he: 'אורטיקריה', created_at: new Date().toISOString() },
      { id: 't4', category: 'aid_type', value: 'mnemonic', value_he: 'מנמוניק', created_at: new Date().toISOString() },
    ],
    stats: {
      rating_avg: 4.2,
      rating_count: 12,
      reaction_count: 28,
      comment_count: 5,
      save_count: 18,
    }
  },
  {
    id: '3',
    uploader_id: 'user1',
    title: 'ABCDE של מלנומה',
    body: 'Asymmetry\nBorder irregularity\nColor variation\nDiameter >6mm\nEvolving',
    explanation: 'כלל ABCDE עוזר לזהות נגעים חשודים למלנומה. כל נגע שעומד באחד מהקריטריונים הללו דורש בדיקה נוספת.',
    media_type: 'text-only',
    verified: true,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploader: {
      id: 'user1',
      email: 'dr.maya@example.com',
      display_name: 'ד״ר מאיה כהן',
      hospital: 'איכילוב',
      role: 'verified_contributor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    tags: [
      { id: 't5', category: 'diagnosis', value: 'melanoma', value_he: 'מלנומה', created_at: new Date().toISOString() },
      { id: 't6', category: 'aid_type', value: 'mnemonic', value_he: 'מנמוניק', created_at: new Date().toISOString() },
    ],
    stats: {
      rating_avg: 5.0,
      rating_count: 56,
      reaction_count: 89,
      comment_count: 12,
      save_count: 67,
    }
  }
]

export default function FeedPage() {
  const [aids, setAids] = useState<LearningAid[]>([])
  const [filteredAids, setFilteredAids] = useState<LearningAid[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch learning aids from local API
  useEffect(() => {
    async function fetchAids() {
      try {
        const response = await fetch('/api/aids')
        const data = await response.json()
        setAids(data)
        setFilteredAids(data)

        // Store initial filtered aids for detail page navigation
        if (typeof window !== 'undefined') {
          localStorage.setItem('filtered-aid-ids', JSON.stringify(data.map((a: LearningAid) => a.id)))
        }
      } catch (error) {
        console.error('Error fetching aids:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAids()
  }, [])

  // Re-apply filters when search query changes
  const [currentFilters, setCurrentFilters] = useState<SimpleFilterState>({
    chapter: 'all',
    aidTypes: [],
    sort: 'newest'
  })

  useEffect(() => {
    handleFilterChange(currentFilters)
  }, [searchQuery, aids])

  const handleFilterChange = (filters: SimpleFilterState) => {
    setCurrentFilters(filters)
    let filtered = [...aids]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(aid => {
        const matchesTitle = aid.title?.toLowerCase().includes(query)
        const matchesBody = aid.body?.toLowerCase().includes(query)
        const matchesExplanation = aid.explanation?.toLowerCase().includes(query)
        const matchesTags = aid.tags?.some(tag =>
          tag.value?.toLowerCase().includes(query) ||
          tag.value_he?.toLowerCase().includes(query)
        )
        return matchesTitle || matchesBody || matchesExplanation || matchesTags
      })
    }

    // Filter by chapter
    if (filters.chapter && filters.chapter !== 'all') {
      // Match chapter value with aid.chapter field
      filtered = filtered.filter(aid => {
        const chapterInfo = CHAPTERS.find(c => c.value === filters.chapter)
        return aid.chapter === filters.chapter ||
               aid.chapter === chapterInfo?.label ||
               aid.chapter === chapterInfo?.label_en
      })
    }

    // Filter by aid types
    if (filters.aidTypes.length > 0) {
      filtered = filtered.filter(aid => {
        if (!aid.media_type) return false

        // Map old values to new filter values
        const typeMapping: Record<string, string[]> = {
          'mnemonic': ['mnemonic', 'text-only'], // Text mnemonics
          'illustration': ['illustration', 'character'], // Visual aids
          'table': ['table', 'summary-table'], // Tables
          'flowchart': ['flowchart'],
          'other': ['other', 'photo', 'diagram', 'comparison'] // Everything else
        }

        // Check if the aid's media_type matches any selected filter
        return filters.aidTypes.some(selectedType => {
          const mappedTypes = typeMapping[selectedType] || [selectedType]
          return aid.media_type && mappedTypes.includes(aid.media_type)
        })
      })
    }

    // Sort
    if (filters.sort === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'he'))
    } else if (filters.sort === 'rated') {
      filtered.sort((a, b) => (b.stats?.rating_avg || 0) - (a.stats?.rating_avg || 0))
    } else {
      // newest (default) - already sorted by created_at DESC from API
    }

    setFilteredAids(filtered)

    // Store filtered aids IDs for detail page navigation
    if (typeof window !== 'undefined') {
      localStorage.setItem('filtered-aid-ids', JSON.stringify(filtered.map(a => a.id)))
    }
  }

  return (
    <div className="min-h-screen" id="feed-page">
      {/* Header */}
      <header id="main-header" className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-shrink">
              <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">Dermasociations</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">פלטפורמת עזרי למידה לרופאי עור</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link href="/uploaders" className="hidden md:block">
                <Button id="btn-uploaders" variant="outline" size="sm">
                  <Users className="h-4 w-4 ms-1" />
                  מעלים
                </Button>
              </Link>
              <Link href="/quiz">
                <Button id="btn-quiz" variant="outline" size="sm" className="h-9 px-2 sm:px-3">
                  <Brain className="h-4 w-4 sm:ms-1" />
                  <span className="hidden sm:inline">למידה רציפה</span>
                </Button>
              </Link>
              <Link href="/upload">
                <Button id="btn-upload" size="sm" className="bg-primary hover:bg-primary/90 h-9 px-2 sm:px-3">
                  <Upload className="h-4 w-4 sm:ms-1" />
                  <span className="hidden sm:inline">העלה</span>
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={(query) => {
              setSearchQuery(query)
              // Trigger filter update - needs to be in useEffect
            }}
            placeholder="חיפוש לפי כותרת, תוכן או תגיות..."
          />
        </div>

        <div className="mb-6">
          <h2 id="feed-title" className="text-xl font-semibold">עזרי למידה ({filteredAids.length})</h2>
        </div>

        <SimpleFilterPanel onFilterChange={handleFilterChange} locale="he" />

        <div className="mt-6">
          {loading && <FeedSkeleton />}

          {!loading && filteredAids.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold">לא נמצאו תוצאות</h3>
                <p className="text-muted-foreground">
                  נסה לשנות את החיפוש או הפילטרים
                </p>
                {(searchQuery || currentFilters.chapter !== 'all' || currentFilters.aidTypes.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      handleFilterChange({ chapter: 'all', aidTypes: [], sort: 'newest' })
                    }}
                  >
                    נקה הכל
                  </Button>
                )}
              </div>
            </div>
          )}

          {!loading && filteredAids.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAids.map((aid) => (
                <LearningAidCard key={aid.id} aid={aid} locale="he" />
              ))}
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

