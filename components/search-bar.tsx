'use client'

import { useState, forwardRef, useImperativeHandle, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export interface SearchBarRef {
  focus: () => void
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(
  ({ onSearch, placeholder = 'חיפוש...' }, ref) => {
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      }
    }))

    const handleChange = (value: string) => {
      setQuery(value)
      onSearch(value)
    }

    const handleClear = () => {
      setQuery('')
      onSearch('')
    }

    return (
      <div className="relative flex items-center">
        <Search className="absolute start-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="ps-10 pe-3"
          dir="rtl"
        />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute end-1 h-10 w-10 p-0"
          aria-label="נקה חיפוש"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
})

SearchBar.displayName = 'SearchBar'
