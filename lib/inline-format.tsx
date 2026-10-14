import { Fragment } from 'react'

// Renders lightweight markdown emphasis within any lesson/course text:
// **bold** (and ***bold italic***) as gold emphasized spans, *italic* as
// italics. Shared by the course page and the immersive lesson player so
// key terms can be called out consistently anywhere content is shown -
// plain text with no * markers renders unchanged, so this is safe to wrap
// around any copy, authored or not. Markers must hug the words (`*word*`,
// not `5 * 3`), and leftover stray asterisks touching a word are dropped
// rather than shown.
const EMPHASIS = /(\*{1,3}(?=\S)[^*\n]+?(?<=\S)\*{1,3})/g

export function renderInline(text: string | null | undefined) {
  if (!text) return null
  if (!text.includes('*')) return text
  const parts = text.split(EMPHASIS)
  return parts.map((part, i) => {
    const m = part.match(/^(\*{1,3})([^*\n]+?)(\*{1,3})$/)
    if (m && i % 2 === 1) {
      const stars = Math.min(m[1].length, m[3].length)
      const inner = m[2]
      if (stars === 1) {
        return (
          <em key={i} className="italic">
            {inner}
          </em>
        )
      }
      return (
        <strong key={i} className={`font-semibold text-brand-primary${stars === 3 ? ' italic' : ''}`}>
          {inner}
        </strong>
      )
    }
    return <Fragment key={i}>{part.replace(/\*+(?=\S)|(?<=\S)\*+/g, '')}</Fragment>
  })
}
