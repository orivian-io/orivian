// Audio helpers for the narration generator: Kokoro synthesis, silence
// trimming, MP3 encoding, and sentence timing.

import { Mp3Encoder } from '@breezystack/lamejs'
import { splitSegments, type NarrationSegment } from '../../lib/narration'

export const SAMPLE_RATE = 24000
const GAP_SECONDS = 0.3 // pause between sentences
const MP3_KBPS = 48

// ---------------------------------------------------------------------------
// Speech synthesis
// ---------------------------------------------------------------------------

export type Synth = (text: string, voice: string) => Promise<Float32Array>

export async function createSynth(fast: boolean, fake: boolean): Promise<Synth> {
  if (fake) {
    // Test tone roughly as long as the text would take to say.
    return async (text) => {
      const seconds = Math.max(0.4, text.length / 15)
      const pcm = new Float32Array(Math.round(seconds * SAMPLE_RATE))
      for (let i = 0; i < pcm.length; i++) pcm[i] = 0.2 * Math.sin((2 * Math.PI * 220 * i) / SAMPLE_RATE)
      return pcm
    }
  }
  const { KokoroTTS } = await import('kokoro-js')
  console.log(`Loading Kokoro (${fast ? 'q8, fast' : 'fp32, best quality'}) - first run downloads the model...`)
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: fast ? 'q8' : 'fp32',
    device: 'cpu',
  })
  return async (text, voice) => {
    const out = await tts.generate(text, { voice: voice as 'af_heart' })
    if (out.sampling_rate !== SAMPLE_RATE) throw new Error(`Unexpected sample rate ${out.sampling_rate}`)
    return out.audio
  }
}

// Trims near-silence from both ends, keeping a short natural tail.
function trimSilence(pcm: Float32Array): Float32Array {
  const threshold = 0.008
  const pad = Math.round(0.04 * SAMPLE_RATE)
  let start = 0
  let end = pcm.length
  while (start < end && Math.abs(pcm[start]) < threshold) start++
  while (end > start && Math.abs(pcm[end - 1]) < threshold) end--
  return pcm.subarray(Math.max(0, start - pad), Math.min(pcm.length, end + pad))
}

export function encodeMp3(pcm: Float32Array): Uint8Array {
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS)
  const samples = new Int16Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const parts: Uint8Array[] = []
  const step = 1152 * 20
  for (let i = 0; i < samples.length; i += step) {
    const buf = encoder.encodeBuffer(samples.subarray(i, i + step))
    if (buf.length) parts.push(new Uint8Array(buf))
  }
  const tail = encoder.flush()
  if (tail.length) parts.push(new Uint8Array(tail))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

// Speaks a block sentence by sentence, recording when each sentence starts
// and ends so the player can highlight along with the audio.
export async function narrate(synth: Synth, text: string, voice: string) {
  const gap = new Float32Array(Math.round(GAP_SECONDS * SAMPLE_RATE))
  const chunks: Float32Array[] = []
  const segments: NarrationSegment[] = []
  let samples = 0
  for (const span of splitSegments(text)) {
    if (chunks.length) {
      chunks.push(gap)
      samples += gap.length
    }
    const pcm = trimSilence(await synth(text.slice(span.from, span.to), voice))
    segments.push({ from: span.from, to: span.to, start: round(samples / SAMPLE_RATE), end: round((samples + pcm.length) / SAMPLE_RATE) })
    chunks.push(pcm)
    samples += pcm.length
  }
  const pcm = new Float32Array(samples)
  let o = 0
  for (const c of chunks) {
    pcm.set(c, o)
    o += c.length
  }
  return { mp3: encodeMp3(pcm), duration: round(samples / SAMPLE_RATE), segments }
}

const round = (n: number) => Math.round(n * 1000) / 1000

