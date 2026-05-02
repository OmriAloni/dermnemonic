'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'

export interface SimpleFilterState {
  chapter: string | null
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
    chapter: 'all',
    aidTypes: [],
    sort: 'newest',
    showSavedOnly: false
  })

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

  return (
    <div id="filter-panel" className="bg-card rounded-lg border p-6 space-y-6">
      {/* Chapter Filter */}
      <div className="space-y-2">
        <label htmlFor="chapter-select" className="text-sm font-medium">Chapter</label>
        <Select value={filters.chapter} onValueChange={(value) => updateFilters({ chapter: value })}>
          <SelectTrigger id="chapter-select" className="w-full whitespace-normal h-auto min-h-10">
            <SelectValue>
              {CHAPTERS.find(c => c.value === filters.chapter)?.label_en || 'Select Chapter'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[400px] w-[calc(100vw-2rem)] sm:w-[500px]">
            {CHAPTERS.map((chapter) => (
              <SelectItem
                key={chapter.value}
                value={chapter.value}
                className="whitespace-normal h-auto py-2 leading-tight"
              >
                <span className="block whitespace-normal break-words">
                  {chapter.label_en}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      {(filters.chapter !== 'all' || filters.aidTypes.length > 0 || filters.showSavedOnly) && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filters.chapter !== 'all' && '1 '}
              {filters.aidTypes.length > 0 && `${filters.aidTypes.length} `}
              {filters.showSavedOnly && '1 '}
              פילטרים פעילים
            </span>
            <button
              onClick={() => updateFilters({ chapter: 'all', aidTypes: [], showSavedOnly: false })}
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
