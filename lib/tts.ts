'use client'

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; style: 'bullet' | 'numbered'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; text: string }
  | { type: 'key_term'; term: string; definition: string }

// Converts a structured lesson content block into plain text for the
// browser's built-in voice to read aloud.
export function blockToSpeechText(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return block.text
    case 'paragraph':
      return block.text
    case 'list':
      return block.items.join('. ')
    case 'callout':
      return block.text
    case 'key_term':
      return `${block.term}: ${block.definition}`
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