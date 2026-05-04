'use client'

interface MarkdownTextProps {
  text: string
  className?: string
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  // Render text with HTML support for bold (<strong> tags)
  // No markdown ** support - use toolbar button instead
  const renderText = (input: string) => {
    if (!input) return null

    // Parse HTML safely - only allow <strong> tags
    const parts = input.split(/(<strong>.*?<\/strong>)/g)

    return parts.map((part, index) => {
      if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
        const content = part.slice(8, -9) // Remove <strong></strong>
        return <strong key={index}>{content}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  return <div className={className}>{renderText(text)}</div>
}
