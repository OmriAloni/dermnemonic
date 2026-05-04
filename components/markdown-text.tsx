'use client'

interface MarkdownTextProps {
  text: string
  className?: string
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  // Render text with HTML support for formatting tags
  // Supports: <strong> (bold), <em> (italic), <u> (underline)
  // Content comes from contentEditable so it's safe to render
  if (!text) return null

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  )
}
