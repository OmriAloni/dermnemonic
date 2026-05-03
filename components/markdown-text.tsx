'use client'

interface MarkdownTextProps {
  text: string
  className?: string
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  // Simple markdown parser for bold (**text** or __text__)
  const renderMarkdown = (input: string) => {
    if (!input) return null

    // Split by bold markers
    const parts = input.split(/(\*\*.*?\*\*|__.*?__)/g)
    
    return parts.map((part, index) => {
      // Check if this part is bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      } else if (part.startsWith('__') && part.endsWith('__')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  return <div className={className}>{renderMarkdown(text)}</div>
}
