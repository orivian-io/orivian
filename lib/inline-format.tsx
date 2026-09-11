import { Fragment } from 'react'

// Renders lightweight **bold** markdown within any lesson/course text as
// emphasized spans. Shared by the course page and the immersive lesson
// player so key terms can be called out consistently anywhere content is
// shown - plain text with no ** markers renders unchanged, so this is safe
// to wrap around any copy, authored or not.
export function renderInline(text: string | null | undefined) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-brand-primary">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}