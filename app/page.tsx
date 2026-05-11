'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Users, Brain } from 'lucide-react'
import { LearningAidCard } from '@/components/feed/learning-aid-card'
import { FeedSkeleton } from '@/components/feed/learning-aid-skeleton'
import { SimpleFilterPanel, type SimpleFilterState } from '@/components/filters/simple-filter-panel'
import { UserMenu } from '@/components/user-menu'
import { SearchBar, type SearchBarRef } from '@/components/search-bar'
import type { LearningAid } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'

// Mock data removed - now fetching from API

export default function FeedPage() {
  const [aids, setAids] = useState<LearningAid[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchBarRef = useRef<SearchBarRef>(null)

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is already typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        searchBarRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch learning aids from local API
  useEffect(() => {
    async function fetchAids() {
      try {
        const response = await fetch('/api/aids')
        if (!response.ok) {
          throw new Error('שגיאה בטעינת עזרי הלמידה')
        }
        const data = await response.json()
        setAids(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching aids:', error)
        setError('בעיית חיבור. בדוק את האינטרנט ונסה שוב.')
      } finally {
        setLoading(false)
      }
    }
    fetchAids()
  }, [])

  // Filter state - default: all aid types selected
  const [currentFilters, setCurrentFilters] = useState<SimpleFilterState>({
    chapters: [],
    aidTypes: ['mnemonic', 'illustration', 'table', 'flowchart', 'other'],
    sort: 'newest',
    showSavedOnly: false
  })

  // Compute filtered aids using useMemo (derived state)
  const filteredAids = useMemo(() => {
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

    // Filter by chapters (multi-select)
    if (currentFilters.chapters.length > 0) {
      filtered = filtered.filter(aid => {
        return currentFilters.chapters.some(chapterValue => {
          const chapterInfo = CHAPTERS.find(c => c.value === chapterValue)
          return aid.chapter === chapterValue ||
                 aid.chapter === chapterInfo?.label ||
                 aid.chapter === chapterInfo?.label_en
        })
      })
    }

    // Filter by aid types (OR logic - show aids that match ANY selected type)
    // Only filter if NOT all types are selected
    const allTypesSelected = AID_TYPES.every(type => currentFilters.aidTypes.includes(type.value))

    if (!allTypesSelected) {
      filtered = filtered.filter(aid => {
        // Check if aid has any tags with category 'aid_type'
        const aidTypeTags = aid.tags?.filter(tag => tag.category === 'aid_type') || []

        // If aid has no aid_type tags, treat it as "other"
        // Only show when "other" is selected
        if (aidTypeTags.length === 0) {
          return currentFilters.aidTypes.includes('other')
        }

        // Return true if ANY of the selected aid types match ANY of the aid's aid_type tags
        return currentFilters.aidTypes.some(selectedType => {
          return aidTypeTags.some(tag => tag.value === selectedType)
        })
      })
    }

    // Filter by saved only
    if (currentFilters.showSavedOnly) {
      if (typeof window !== 'undefined') {
        const savedAids = localStorage.getItem('saved-aids')
        if (savedAids) {
          const savedIds = JSON.parse(savedAids)
          filtered = filtered.filter(aid => savedIds.includes(aid.id))
        } else {
          filtered = [] // No saved items
        }
      }
    }

    // Sort
    if (currentFilters.sort === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'he'))
    } else if (currentFilters.sort === 'rated') {
      filtered.sort((a, b) => (b.stats?.rating_avg || 0) - (a.stats?.rating_avg || 0))
    } else if (currentFilters.sort === 'shuffle') {
      // For shuffle, use a stable seed based on filtered length
      // This makes it deterministic within a render cycle
      const seed = filtered.length
      filtered.sort((a, b) => {
        const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return ((hashA * seed) % 100) - ((hashB * seed) % 100)
      })
    }

    // Always show items without chapter at the top
    filtered.sort((a, b) => {
      if (!a.chapter && b.chapter) return -1
      if (a.chapter && !b.chapter) return 1
      return 0
    })

    return filtered
  }, [aids, searchQuery, currentFilters])

  // Store filtered aids IDs in localStorage for detail page navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('filtered-aid-ids', JSON.stringify(filteredAids.map(a => a.id)))
    }
  }, [filteredAids])

  // Handle filter changes from filter panel
  const handleFilterChange = useCallback((filters: SimpleFilterState) => {
    setCurrentFilters(filters)
  }, [])

  return (
    <div className="min-h-screen" id="feed-page">
      {/* Header */}
      <header id="main-header" className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="https://dermassociation.vercel.app/presentation.html" target="_blank" rel="noopener noreferrer" className="min-w-0 flex-shrink hover:opacity-80 transition-opacity flex items-center gap-3">
              <Image src="/logosmall.jpeg" alt="Dermassociations" width={56} height={56} className="rounded-xl shadow-md" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">Dermassociations</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">פלטפורמת עזרי למידה לרופאי עור</p>
              </div>
            </Link>
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
            ref={searchBarRef}
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

        {error && (
          <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200">שגיאה</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex-shrink-0"
            >
              נסה שוב
            </Button>
          </div>
        )}

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
                {(searchQuery || currentFilters.chapters.length > 0 || currentFilters.aidTypes.length > 0 || currentFilters.showSavedOnly) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      handleFilterChange({ chapters: [], aidTypes: [], sort: 'newest', showSavedOnly: false })
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

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href="https://dermassociation.vercel.app/presentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logosmall.jpeg"
                alt="Dermassociations"
                width={80}
                height={80}
                className="rounded-xl shadow-md"
              />
            </Link>
            <p className="text-sm text-muted-foreground text-center">
              פלטפורמת עזרי למידה לרופאי עור
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

