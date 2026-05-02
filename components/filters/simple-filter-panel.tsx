'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'

export interface SimpleFilterState {
  chapters: string[]
  aidTypes: string[]
  sort: 'newest' | 'rated' | 'alphabetical' | 'shuffle'
  showSavedOnly: boolean
}

interface SimpleFilterPanelProps {
  onFilterChange: (filters: SimpleFilterState) => void
  locale?: 'he' | 'en'
}

export function SimpleFilterPanel({ onFilterChange, locale = 'he' }: SimpleFilterPanelProps) {
  const [filters, setFilters] = useState<SimpleFilterState>({
    chapters: [],
    aidTypes: [],
    sort: 'newest',
    showSavedOnly: false
  })
  const [chapterPopoverOpen, setChapterPopoverOpen] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')

  const updateFilters = (updates: Partial<SimpleFilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleAidType = (type: string) => {
    const newTypes = filters.aidTypes.includes(type)
      ? filters.aidTypes.filter(t => t !== type)
      : [...filters.aidTypes, type]
    updateFilters({ aidTypes: newTypes })
  }

  const toggleChapter = (chapterValue: string) => {
    const newChapters = filters.chapters.includes(chapterValue)
      ? filters.chapters.filter(c => c !== chapterValue)
      : [...filters.chapters, chapterValue]
    updateFilters({ chapters: newChapters })
    // Clear search after selection
    setChapterSearch('')
  }

  const removeChapter = (chapterValue: string) => {
    const newChapters = filters.chapters.filter(c => c !== chapterValue)
    updateFilters({ chapters: newChapters })
  }

  const clearAllChapters = () => {
    updateFilters({ chapters: [] })
  }

  return (
    <div id="filter-panel" className="bg-card rounded-lg border p-6 space-y-6">
      {/* Chapter Filter - Multi-select with Search */}
      <div className="space-y-3">
        <label className="text-sm font-medium">פרקים</label>
        <Popover open={chapterPopoverOpen} onOpenChange={(open) => {
          setChapterPopoverOpen(open)
          // Clear search when closing
          if (!open) setChapterSearch('')
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={chapterPopoverOpen}
              className="w-full justify-between h-auto min-h-10 font-normal"
            >
              <div className="flex gap-1 flex-wrap">
                {filters.chapters.length === 0 ? (
                  <span className="text-muted-foreground">בחר פרקים...</span>
                ) : (
                  filters.chapters.slice(0, 2).map((chapterValue) => {
                    const chapter = CHAPTERS.find(c => c.value === chapterValue)
                    if (!chapter) return null
                    const text = chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en
                    return (
                      <Badge key={chapterValue} variant="secondary" className="gap-1">
                        <span dir="ltr" className="text-xs">{text.length > 20 ? `Ch. ${chapter.number}` : text}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            removeChapter(chapterValue)
                          }}
                        />
                      </Badge>
                    )
                  })
                )}
                {filters.chapters.length > 2 && (
                  <Badge variant="secondary">+{filters.chapters.length - 2}</Badge>
                )}
              </div>
              <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="חפש פרק..."
                value={chapterSearch}
                onValueChange={setChapterSearch}
              />
              <CommandList>
                <CommandEmpty>לא נמצאו פרקים</CommandEmpty>
                <CommandGroup>
                  {CHAPTERS.filter(c => c.value !== 'all')
                    .filter(chapter => {
                      if (!chapterSearch) return true
                      const text = chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en
                      return text.toLowerCase().includes(chapterSearch.toLowerCase())
                    })
                    .map((chapter, index) => {
                      const text = chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en
                      return (
                        <CommandItem
                          key={chapter.value}
                          value={text}
                          onSelect={() => toggleChapter(chapter.value)}
                          className="gap-2"
                          ref={(el) => {
                            // Auto-scroll to first result
                            if (index === 0 && chapterSearch && el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                            }
                          }}
                        >
                          <Checkbox
                            checked={filters.chapters.includes(chapter.value)}
                            className="h-4 w-4"
                            onCheckedChange={(e) => e.preventDefault()}
                          />
                          <span dir="ltr" className="flex-1 text-left">{text}</span>
                          {filters.chapters.includes(chapter.value) && (
                            <Check className="h-4 w-4" />
                          )}
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              </CommandList>
            </Command>
            {filters.chapters.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllChapters}
                  className="w-full"
                >
                  נקה הכל ({filters.chapters.length})
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Aid Type Filter */}
      <div className="space-y-3">
        <div className="text-sm font-medium">סוג עזר למידה</div>
        <div className="space-y-2">
          {AID_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-3">
              <Checkbox
                id={`aid-type-${type.value}`}
                checked={filters.aidTypes.includes(type.value)}
                onCheckedChange={() => toggleAidType(type.value)}
                className="h-5 w-5"
              />
              <label
                htmlFor={`aid-type-${type.value}`}
                className="text-sm cursor-pointer flex-1 py-2 -my-2"
              >
                {locale === 'he' ? type.label : type.label_en}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Only Filter */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-3">
          <Checkbox
            id="show-saved-only"
            checked={filters.showSavedOnly}
            onCheckedChange={(checked) => updateFilters({ showSavedOnly: !!checked })}
            className="h-5 w-5"
          />
          <label
            htmlFor="show-saved-only"
            className="text-sm font-medium cursor-pointer flex-1 py-2 -my-2"
          >
            רק שמורים
          </label>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2 pt-4 border-t">
        <label htmlFor="sort-select" className="text-sm font-medium">מיון</label>
        <Select value={filters.sort} onValueChange={(value: any) => updateFilters({ sort: value })}>
          <SelectTrigger id="sort-select" className="w-full sm:w-auto sm:min-w-[150px] h-10">
            <SelectValue>
              {filters.sort === 'newest' && 'חדש ביותר'}
              {filters.sort === 'rated' && 'המדורגים ביותר'}
              {filters.sort === 'alphabetical' && 'א-ב'}
              {filters.sort === 'shuffle' && 'אקראי'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="newest">חדש ביותר</SelectItem>
            <SelectItem value="rated">המדורגים ביותר</SelectItem>
            <SelectItem value="alphabetical">א-ב</SelectItem>
            <SelectItem value="shuffle">אקראי</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Summary */}
      {(filters.chapters.length > 0 || filters.aidTypes.length > 0 || filters.showSavedOnly) && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filters.chapters.length > 0 && `${filters.chapters.length} `}
              {filters.aidTypes.length > 0 && `${filters.aidTypes.length} `}
              {filters.showSavedOnly && '1 '}
              פילטרים פעילים
            </span>
            <button
              onClick={() => updateFilters({ chapters: [], aidTypes: [], showSavedOnly: false })}
              className="text-sm text-primary hover:underline"
            >
              נקה הכל
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
