'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface NewFilterPanelProps {
  onFilterChange?: (filters: NewFilterState) => void
  uploaders?: Array<{ id: string; name: string }>
  locale?: 'he' | 'en'
}

export interface NewFilterState {
  chapter?: string | null
  aidTypes: string[]
  uploader?: string | null
  diagnoses: string[]
  signs: string[]
  pathology: string[]
  treatments: string[]
  riskFactors: string[]
  sort?: 'newest' | 'alphabetical' | 'rated'
}

const chapters = [
  { value: 'all', label: 'כל הפרקים', label_en: 'All Chapters' },
  { value: '8', label: 'פרק 8: Psoriasis', label_en: 'Chapter 8: Psoriasis' },
  { value: '11', label: 'פרק 11: Lichen Planus', label_en: 'Chapter 11: Lichen Planus' },
  { value: '12', label: 'פרק 12: Atopic Dermatitis', label_en: 'Chapter 12: Atopic Dermatitis' },
  { value: '21', label: 'פרק 21: Drug Reactions', label_en: 'Chapter 21: Drug Reactions' },
  { value: '25', label: 'פרק 25: Neutrophilic Dermatoses', label_en: 'Chapter 25: Neutrophilic Dermatoses' },
  { value: '29', label: 'פרק 29: Pemphigus', label_en: 'Chapter 29: Pemphigus' },
  { value: '30', label: 'פרק 30: Pemphigoid', label_en: 'Chapter 30: Pemphigoid' },
  { value: '113', label: 'פרק 113: Melanoma', label_en: 'Chapter 113: Melanoma' },
]

const aidTypeOptions = [
  { value: 'mnemonic', label: 'מנמוניק', label_en: 'Mnemonic' },
  { value: 'illustration', label: 'איור', label_en: 'Illustration' },
  { value: 'table', label: 'טבלה', label_en: 'Table' },
  { value: 'summary-table', label: 'טבלה מסכמת', label_en: 'Summary Table' },
  { value: 'character', label: 'דמות', label_en: 'Character' },
  { value: 'video', label: 'וידאו', label_en: 'Video' },
  { value: 'audio', label: 'אודיו', label_en: 'Audio' },
]

const diagnosisOptions = [
  { value: 'psoriasis', label: 'פסוריאזיס', label_en: 'Psoriasis' },
  { value: 'lichen-planus', label: 'ליכן פלנוס', label_en: 'Lichen Planus' },
  { value: 'melanoma', label: 'מלנומה', label_en: 'Melanoma' },
  { value: 'urticaria', label: 'אורטיקריה', label_en: 'Urticaria' },
  { value: 'pemphigus', label: 'פמפיגוס', label_en: 'Pemphigus' },
  { value: 'atopic-dermatitis', label: 'דלקת עור אטופית', label_en: 'Atopic Dermatitis' },
  { value: 'sweet-syndrome', label: "Sweet's Syndrome", label_en: "Sweet's Syndrome" },
  { value: 'blueberry-muffin', label: 'Blueberry Muffin', label_en: 'Blueberry Muffin' },
]

const signOptions = [
  { value: 'auspitz', label: 'סימן אוספיץ', label_en: 'Auspitz Sign' },
  { value: 'nikolsky', label: 'סימן ניקולסקי', label_en: 'Nikolsky Sign' },
  { value: 'darier', label: 'סימן דרייה', label_en: 'Darier Sign' },
  { value: 'wickham', label: 'פסי ויקהם', label_en: 'Wickham Striae' },
  { value: 'purpura', label: 'פורפורה', label_en: 'Purpura' },
]

const pathologyOptions = [
  { value: 'spongiosis', label: 'ספונגיוזיס', label_en: 'Spongiosis' },
  { value: 'acantholysis', label: 'אקנתוליזיס', label_en: 'Acantholysis' },
  { value: 'parakeratosis', label: 'פראקרטוזיס', label_en: 'Parakeratosis' },
  { value: 'hypergranulosis', label: 'היפרגרנולוזיס', label_en: 'Hypergranulosis' },
  { value: 'neutrophilic-infiltrate', label: 'חדירה נויטרופילית', label_en: 'Neutrophilic Infiltrate' },
]

const treatmentOptions = [
  { value: 'biologics', label: 'ביולוגיים', label_en: 'Biologics' },
  { value: 'retinoids', label: 'רטינואידים', label_en: 'Retinoids' },
  { value: 'topical-steroids', label: 'סטרואידים מקומיים', label_en: 'Topical Steroids' },
  { value: 'corticosteroids', label: 'קורטיקוסטרואידים', label_en: 'Corticosteroids' },
  { value: 'immunomodulators', label: 'אימונומודולטורים', label_en: 'Immunomodulators' },
]

const riskFactorOptions = [
  { value: 'smoking', label: 'עישון', label_en: 'Smoking' },
  { value: 'sun-exposure', label: 'חשיפה לשמש', label_en: 'Sun Exposure' },
  { value: 'immunosuppression', label: 'דיכוי חיסוני', label_en: 'Immunosuppression' },
  { value: 'genetics', label: 'גנטיקה', label_en: 'Genetics' },
]

export function NewFilterPanel({ onFilterChange, uploaders = [], locale = 'he' }: NewFilterPanelProps) {
  const [filters, setFilters] = useState<NewFilterState>({
    chapter: 'all',
    aidTypes: [],
    uploader: undefined,
    diagnoses: [],
    signs: [],
    pathology: [],
    treatments: [],
    riskFactors: [],
    sort: 'newest',
  })

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aidTypes: true,
    diagnosis: false,
    signs: false,
    pathology: false,
    treatments: false,
    riskFactors: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleFilter = (category: keyof NewFilterState, value: string) => {
    const currentValues = filters[category] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]

    const newFilters = { ...filters, [category]: newValues }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearAllFilters = () => {
    const newFilters: NewFilterState = {
      chapter: 'all',
      aidTypes: [],
      uploader: undefined,
      diagnoses: [],
      signs: [],
      pathology: [],
      treatments: [],
      riskFactors: [],
      sort: 'newest',
    }
    setFilters(newFilters)
    setExpandedSections({
      aidTypes: true,
      diagnosis: false,
      signs: false,
      pathology: false,
      treatments: false,
      riskFactors: false,
    })
    onFilterChange?.(newFilters)
  }

  const totalActiveFilters =
    filters.aidTypes.length +
    filters.diagnoses.length +
    filters.signs.length +
    filters.pathology.length +
    filters.treatments.length +
    filters.riskFactors.length +
    (filters.chapter !== 'all' ? 1 : 0) +
    (filters.uploader ? 1 : 0)

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">{locale === 'he' ? 'סינון' : 'Filters'}</span>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary">{totalActiveFilters}</Badge>
          )}
        </div>
        {totalActiveFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            {locale === 'he' ? 'נקה הכל' : 'Clear All'}
          </Button>
        )}
      </div>

      <Separator />

      {/* Chapter and Uploader */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            {locale === 'he' ? 'פרק' : 'Chapter'}
          </Label>
          <Select
            value={filters.chapter}
            onValueChange={(value) => {
              const newFilters = { ...filters, chapter: value }
              setFilters(newFilters)
              onFilterChange?.(newFilters)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map(ch => (
                <SelectItem key={ch.value} value={ch.value}>
                  {locale === 'he' ? ch.label : ch.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {uploaders.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {locale === 'he' ? 'מעלה' : 'Uploader'}
            </Label>
            <Select
              value={filters.uploader || 'all'}
              onValueChange={(value) => {
                const newFilters = { ...filters, uploader: value === 'all' ? undefined : value }
                setFilters(newFilters)
                onFilterChange?.(newFilters)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={locale === 'he' ? 'כולם' : 'All'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'he' ? 'כולם' : 'All'}</SelectItem>
                {uploaders.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Aid Types */}
      <div>
        <button
          onClick={() => toggleSection('aidTypes')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'סוגי עזרים' : 'Aid Types'}</span>
          {expandedSections.aidTypes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.aidTypes && (
          <div className="grid grid-cols-2 gap-2">
            {aidTypeOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`aid-${option.value}`}
                  checked={filters.aidTypes.includes(option.value)}
                  onCheckedChange={() => toggleFilter('aidTypes', option.value)}
                />
                <Label htmlFor={`aid-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Diagnosis */}
      <div>
        <button
          onClick={() => toggleSection('diagnosis')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'אבחנות' : 'Diagnoses'}</span>
          {expandedSections.diagnosis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.diagnosis && (
          <div className="grid grid-cols-2 gap-2">
            {diagnosisOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`diag-${option.value}`}
                  checked={filters.diagnoses.includes(option.value)}
                  onCheckedChange={() => toggleFilter('diagnoses', option.value)}
                />
                <Label htmlFor={`diag-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Signs */}
      <div>
        <button
          onClick={() => toggleSection('signs')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'סימנים קליניים' : 'Clinical Signs'}</span>
          {expandedSections.signs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.signs && (
          <div className="grid grid-cols-2 gap-2">
            {signOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`sign-${option.value}`}
                  checked={filters.signs.includes(option.value)}
                  onCheckedChange={() => toggleFilter('signs', option.value)}
                />
                <Label htmlFor={`sign-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pathology */}
      <div>
        <button
          onClick={() => toggleSection('pathology')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'פתולוגיה' : 'Pathology'}</span>
          {expandedSections.pathology ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.pathology && (
          <div className="grid grid-cols-2 gap-2">
            {pathologyOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`path-${option.value}`}
                  checked={filters.pathology.includes(option.value)}
                  onCheckedChange={() => toggleFilter('pathology', option.value)}
                />
                <Label htmlFor={`path-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Treatments */}
      <div>
        <button
          onClick={() => toggleSection('treatments')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'טיפולים' : 'Treatments'}</span>
          {expandedSections.treatments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.treatments && (
          <div className="grid grid-cols-2 gap-2">
            {treatmentOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`treat-${option.value}`}
                  checked={filters.treatments.includes(option.value)}
                  onCheckedChange={() => toggleFilter('treatments', option.value)}
                />
                <Label htmlFor={`treat-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Factors */}
      <div>
        <button
          onClick={() => toggleSection('riskFactors')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
        >
          <span>{locale === 'he' ? 'גורמי סיכון' : 'Risk Factors'}</span>
          {expandedSections.riskFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.riskFactors && (
          <div className="grid grid-cols-2 gap-2">
            {riskFactorOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`risk-${option.value}`}
                  checked={filters.riskFactors.includes(option.value)}
                  onCheckedChange={() => toggleFilter('riskFactors', option.value)}
                />
                <Label htmlFor={`risk-${option.value}`} className="text-sm cursor-pointer">
                  {locale === 'he' ? option.label : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
