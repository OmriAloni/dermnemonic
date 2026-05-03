'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter } from 'lucide-react'
import type { TagCategory } from '@/lib/types'

interface FilterPanelProps {
  onFilterChange?: (filters: FilterState) => void
  locale?: 'he' | 'en'
}

export interface FilterState {
  diagnosis: string[]
  sign: string[]
  pathology: string[]
  treatment: string[]
  riskFactors: string[]
  aidType: string[]
  verified?: boolean
  sort?: 'newest' | 'rated' | 'thanked'
}

// Mock data - in real app, fetch from Supabase
const filterOptions = {
  diagnosis: [
    { value: 'psoriasis', label: 'פסוריאזיס', label_en: 'Psoriasis' },
    { value: 'lichen-planus', label: 'ליכן פלנוס', label_en: 'Lichen Planus' },
    { value: 'melanoma', label: 'מלנומה', label_en: 'Melanoma' },
    { value: 'urticaria', label: 'אורטיקריה', label_en: 'Urticaria' },
    { value: 'pemphigus', label: 'פמפיגוס', label_en: 'Pemphigus' },
    { value: 'atopic-dermatitis', label: 'דלקת עור אטופית', label_en: 'Atopic Dermatitis' },
  ],
  sign: [
    { value: 'auspitz', label: 'סימן אוספיץ', label_en: 'Auspitz Sign' },
    { value: 'nikolsky', label: 'סימן ניקולסקי', label_en: 'Nikolsky Sign' },
    { value: 'darier', label: 'סימן דרייה', label_en: 'Darier Sign' },
    { value: 'wickham', label: 'פסי ויקהם', label_en: 'Wickham Striae' },
  ],
  pathology: [
    { value: 'spongiosis', label: 'ספונגיוזיס', label_en: 'Spongiosis' },
    { value: 'acantholysis', label: 'אקנתוליזיס', label_en: 'Acantholysis' },
    { value: 'parakeratosis', label: 'פראקרטוזיס', label_en: 'Parakeratosis' },
    { value: 'hypergranulosis', label: 'היפרגרנולוזיס', label_en: 'Hypergranulosis' },
  ],
  treatment: [
    { value: 'biologics', label: 'ביולוגיים', label_en: 'Biologics' },
    { value: 'retinoids', label: 'רטינואידים', label_en: 'Retinoids' },
    { value: 'topical-steroids', label: 'סטרואידים מקומיים', label_en: 'Topical Steroids' },
    { value: 'immunomodulators', label: 'אימונומודולטורים', label_en: 'Immunomodulators' },
  ],
  riskFactors: [
    { value: 'smoking', label: 'עישון', label_en: 'Smoking' },
    { value: 'sun-exposure', label: 'חשיפה לשמש', label_en: 'Sun Exposure' },
    { value: 'immunosuppression', label: 'דיכוי חיסוני', label_en: 'Immunosuppression' },
    { value: 'genetics', label: 'גנטיקה', label_en: 'Genetics' },
    { value: 'obesity', label: 'השמנת יתר', label_en: 'Obesity' },
    { value: 'stress', label: 'מתח', label_en: 'Stress' },
  ],
  aidType: [
    { value: 'mnemonic', label: 'מנמוניק', label_en: 'Mnemonic' },
    { value: 'illustration', label: 'איור', label_en: 'Illustration' },
    { value: 'table', label: 'טבלה', label_en: 'Table' },
    { value: 'video', label: 'וידאו', label_en: 'Video' },
    { value: 'audio', label: 'אודיו', label_en: 'Audio' },
  ]
}

export function FilterPanel({ onFilterChange, locale = 'he' }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    diagnosis: [],
    sign: [],
    pathology: [],
    treatment: [],
    riskFactors: [],
    aidType: [],
    verified: undefined,
    sort: 'newest'
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const addFilter = (category: keyof Omit<FilterState, 'verified' | 'sort'>, value: string) => {
    const newFilters = {
      ...filters,
      [category]: [...filters[category], value]
    }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const removeFilter = (category: keyof Omit<FilterState, 'verified' | 'sort'>, value: string) => {
    const newFilters = {
      ...filters,
      [category]: filters[category].filter(v => v !== value)
    }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearAllFilters = () => {
    const newFilters: FilterState = {
      diagnosis: [],
      sign: [],
      pathology: [],
      treatment: [],
      riskFactors: [],
      aidType: [],
      verified: undefined,
      sort: 'newest'
    }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const hasActiveFilters =
    filters.diagnosis.length > 0 ||
    filters.sign.length > 0 ||
    filters.pathology.length > 0 ||
    filters.treatment.length > 0 ||
    filters.riskFactors.length > 0 ||
    filters.aidType.length > 0 ||
    filters.verified !== undefined

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {locale === 'he' ? 'סינון' : 'Filter'}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ms-2">
              {filters.diagnosis.length + filters.sign.length + filters.pathology.length + filters.treatment.length + filters.riskFactors.length + filters.aidType.length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            {locale === 'he' ? 'נקה הכל' : 'Clear All'}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Diagnosis Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'אבחנה' : 'Diagnosis'}
            </label>
            <Select onValueChange={(value) => addFilter('diagnosis', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר אבחנה' : 'Select diagnosis'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.diagnosis.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clinical Sign Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'תסמינים' : 'Clinical Sign'}
            </label>
            <Select onValueChange={(value) => addFilter('sign', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר סימן' : 'Select sign'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.sign.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pathology Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'פתולוגיה' : 'Pathology'}
            </label>
            <Select onValueChange={(value) => addFilter('pathology', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר ממצא' : 'Select finding'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.pathology.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'טיפול' : 'Treatment'}
            </label>
            <Select onValueChange={(value) => addFilter('treatment', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר טיפול' : 'Select treatment'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.treatment.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aid Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'סוג עזר' : 'Aid Type'}
            </label>
            <Select onValueChange={(value) => addFilter('aidType', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר סוג' : 'Select type'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.aidType.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Factors Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'גורמי סיכון' : 'Risk Factors'}
            </label>
            <Select onValueChange={(value) => addFilter('riskFactors', value as string)}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'בחר גורם סיכון' : 'Select risk factor'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.riskFactors.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === 'he' ? option.label : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verified Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'סטטוס' : 'Status'}
            </label>
            <Select
              value={filters.verified === undefined ? 'all' : filters.verified ? 'verified' : 'pending'}
              onValueChange={(value) => {
                const newFilters = {
                  ...filters,
                  verified: value === 'all' ? undefined : value === 'verified'
                }
                setFilters(newFilters)
                onFilterChange?.(newFilters)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'he' ? 'הכל' : 'All'}</SelectItem>
                <SelectItem value="verified">{locale === 'he' ? 'מאומתים' : 'Verified'}</SelectItem>
                <SelectItem value="pending">{locale === 'he' ? 'ממתינים' : 'Pending'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {Object.entries(filters).map(([category, values]) => {
            if (category === 'sort' || category === 'verified' || !Array.isArray(values) || values.length === 0) return null

            return values.map((value) => {
              const option = filterOptions[category as keyof typeof filterOptions]?.find(o => o.value === value)
              if (!option) return null

              return (
                <Badge key={`${category}-${value}`} variant="secondary" className="flex items-center gap-1">
                  <span className="text-xs">{locale === 'he' ? option.label : option.label_en}</span>
                  <button
                    onClick={() => removeFilter(category as any, value)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })
          })}
        </div>
      )}
    </div>
  )
}
