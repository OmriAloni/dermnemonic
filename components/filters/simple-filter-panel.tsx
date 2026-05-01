'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'

export interface SimpleFilterState {
  chapter: string | null
  aidTypes: string[]
  sort: 'newest' | 'rated' | 'alphabetical'
}

interface SimpleFilterPanelProps {
  onFilterChange: (filters: SimpleFilterState) => void
  locale?: 'he' | 'en'
}

export function SimpleFilterPanel({ onFilterChange, locale = 'he' }: SimpleFilterPanelProps) {
  const [filters, setFilters] = useState<SimpleFilterState>({
    chapter: 'all',
    aidTypes: [],
    sort: 'newest'
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
        <label htmlFor="chapter-select" className="text-sm font-medium">פרק</label>
        <Select value={filters.chapter} onValueChange={(value) => updateFilters({ chapter: value })}>
          <SelectTrigger id="chapter-select" className="w-auto min-w-[200px] whitespace-normal h-auto min-h-8">
            <SelectValue>
              {CHAPTERS.find(c => c.value === filters.chapter)?.[locale === 'he' ? 'label' : 'label_en'] || 'בחר פרק'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[400px] max-w-[300px]">
            {CHAPTERS.map((chapter) => (
              <SelectItem
                key={chapter.value}
                value={chapter.value}
                className="whitespace-normal h-auto py-2 leading-tight"
              >
                <span className="block whitespace-normal break-words">
                  {locale === 'he' ? chapter.label : chapter.label_en}
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
            <div key={type.value} className="flex items-center gap-2">
              <Checkbox
                id={`aid-type-${type.value}`}
                checked={filters.aidTypes.includes(type.value)}
                onCheckedChange={() => toggleAidType(type.value)}
              />
              <label
                htmlFor={`aid-type-${type.value}`}
                className="text-sm cursor-pointer flex-1"
              >
                {locale === 'he' ? type.label : type.label_en}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2 pt-4 border-t">
        <label htmlFor="sort-select" className="text-sm font-medium">מיון</label>
        <Select value={filters.sort} onValueChange={(value: any) => updateFilters({ sort: value })}>
          <SelectTrigger id="sort-select" className="w-auto min-w-[150px]">
            <SelectValue>
              {filters.sort === 'newest' && 'חדש ביותר'}
              {filters.sort === 'rated' && 'המדורגים ביותר'}
              {filters.sort === 'alphabetical' && 'א-ב'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="newest">חדש ביותר</SelectItem>
            <SelectItem value="rated">המדורגים ביותר</SelectItem>
            <SelectItem value="alphabetical">א-ב</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Summary */}
      {(filters.chapter !== 'all' || filters.aidTypes.length > 0) && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filters.chapter !== 'all' && '1 '}
              {filters.aidTypes.length > 0 && `${filters.aidTypes.length} `}
              פילטרים פעילים
            </span>
            <button
              onClick={() => updateFilters({ chapter: 'all', aidTypes: [] })}
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
