'use client'

// Read-along highlighting. Maps the spoken text onto the words rendered on
// screen and highlights the current sentence and word using the CSS Custom
// Highlight API, which paints highlights without touching React's DOM.
// Browsers without that API simply get no highlight.

import { normalizeWord, wordSpans, type Span } from '@/lib/narration'
import type { NarrationProgress } from '@/lib/narrator'

type DomWord = { node: Text; start: number; end: number; norm: string }

export type ReadAlong = {
  update: (progress: NarrationProgress) => void
  clear: () => void
}

const SENTENCE = 'tts-sentence'
const WORD = 'tts-word'
const NOOP: ReadAlong = { update: () => {}, clear: () => {} }

function highlightsSupported() {
  return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'
}

function collectDomWords(container: HTMLElement): DomWord[] {
  const words: DomWord[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent || ''
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const norm = normalizeWord(m[0])
      if (norm) words.push({ node: node as Text, start: m.index, end: m.index + m[0].length, norm })
    }
  }
  return words
}

export function createReadAlong(container: HTMLElement | null, speechText: string): ReadAlong {
  if (!container || !highlightsSupported()) return NOOP

  const domWords = collectDomWords(container)
  const spoken = wordSpans(speechText).map((s) => ({ ...s, norm: normalizeWord(speechText.slice(s.from, s.to)) }))

  // Align spoken words to on-screen words in order, tolerating words that
  // are only spoken (e.g. "How this shows up on the exam") or only shown.
  const map: number[] = new Array(spoken.length).fill(-1)
  let cursor = 0
  for (let i = 0; i < spoken.length; i++) {
    if (!spoken[i].norm) continue
    for (let k = cursor; k < Math.min(domWords.length, cursor + 12); k++) {
      if (domWords[k].norm === spoken[i].norm) {
        map[i] = k
        cursor = k + 1
        break
      }
    }
  }

  const spokenIndexAt = (offset: number) => spoken.findIndex((s) => offset >= s.from && offset < s.to)

  const rangeFor = (first: number, last: number) => {
    const a = domWords[first]
    const b = domWords[last]
    const range = document.createRange()
    range.setStart(a.node, a.start)
    range.setEnd(b.node, b.end)
    return range
  }

  const sentenceRange = (span: Span) => {
    let first = -1
    let last = -1
    for (let i = 0; i < spoken.length; i++) {
      if (spoken[i].to <= span.from || spoken[i].from >= span.to || map[i] < 0) continue
      if (first < 0) first = map[i]
      last = map[i]
    }
    return first >= 0 ? rangeFor(first, last) : null
  }

  let lastSentence = -1

  const keepInView = (range: Range) => {
    const rect = range.getBoundingClientRect()
    const margin = 96
    if (rect.bottom > window.innerHeight - margin || rect.top < margin) {
      window.scrollBy({ top: rect.top - window.innerHeight / 3, behavior: 'smooth' })
    }
  }

  return {
    update({ sentence, word }) {
      if (!container.isConnected) return
      if (sentence.from !== lastSentence) {
        lastSentence = sentence.from
        const range = sentenceRange(sentence)
        if (range) {
          CSS.highlights.set(SENTENCE, new Highlight(range))
          keepInView(range)
        } else {
          CSS.highlights.delete(SENTENCE)
        }
      }
      const idx = word ? spokenIndexAt(word.from) : -1
      if (idx >= 0 && map[idx] >= 0) CSS.highlights.set(WORD, new Highlight(rangeFor(map[idx], map[idx])))
      else CSS.highlights.delete(WORD)
    },
    clear() {
      CSS.highlights.delete(SENTENCE)
      CSS.highlights.delete(WORD)
    },
  }
}
