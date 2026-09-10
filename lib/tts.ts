'use client'

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; style: 'bullet' | 'numbered'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; text: string }
  | { type: 'key_term'; term: string; definition: string }
  | { type: 'group'; heading?: string; blocks: ContentBlock[] }
  | { type: 'title'; text: string; overview: string; examContext: string }

// Text content can contain lightweight **bold** markdown for on-screen
// emphasis. Strip it before handing text to the speech synthesizer so it
// doesn't read the asterisks aloud.
function stripBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1')
}

// Converts a structured lesson content block into plain text for the
// browser's built-in voice to read aloud.
export function blockToSpeechText(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return stripBold(block.text)
    case 'paragraph':
      return stripBold(block.text)
    case 'list':
      return block.items.map(stripBold).join('. ')
    case 'callout':
      return stripBold(block.text)
    case 'key_term':
      return `${block.term}: ${stripBold(block.definition)}`
    case 'group':
      return [block.heading, ...block.blocks.map(blockToSpeechText)]
        .filter(Boolean)
        .join('. ')
    case 'title':
      return [
        stripBold(block.text),
        stripBold(block.overview),
        `How this shows up on the exam: ${stripBold(block.examContext)}`,
      ].join('. ')
    default:
      return ''
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, onEnd?: () => void) {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}