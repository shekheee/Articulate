import type { TranscriptSegment } from '@/lib/accent/fluency'

export interface ProsodyAnalysis {
  avgWordsPerSegment: number
  paceVariance: 'steady' | 'uneven' | 'rushed' | 'slow'
  intonationNotes: string[]
  stressNotes: string[]
  score: number
}

export function analyzeProsody(
  segments: TranscriptSegment[],
  durationSeconds: number,
  expectedWordCount: number
): ProsodyAnalysis {
  const intonationNotes: string[] = []
  const stressNotes: string[] = []

  if (segments.length === 0 || durationSeconds <= 0) {
    return {
      avgWordsPerSegment: 0,
      paceVariance: 'steady',
      intonationNotes: ['Not enough timing data for prosody analysis.'],
      stressNotes: [],
      score: 50,
    }
  }

  const segmentDurations = segments.map((s) => Math.max(0.01, s.end - s.start))
  const segmentWordCounts = segments.map((s) => s.text.split(/\s+/).filter(Boolean).length)
  const wpsPerSegment = segmentDurations.map((d, i) => segmentWordCounts[i] / d)
  const avgWps = wpsPerSegment.reduce((a, b) => a + b, 0) / wpsPerSegment.length

  const variance =
    wpsPerSegment.length > 1
      ? Math.sqrt(
          wpsPerSegment.reduce((s, v) => s + (v - avgWps) ** 2, 0) / wpsPerSegment.length
        )
      : 0

  let paceVariance: ProsodyAnalysis['paceVariance'] = 'steady'
  if (avgWps > 3.5) {
    paceVariance = 'rushed'
    intonationNotes.push('Segments are delivered quickly — allow more time for stressed syllables to land.')
  } else if (avgWps < 1.2) {
    paceVariance = 'slow'
    intonationNotes.push('Delivery is quite slow — try linking words more smoothly while keeping clarity.')
  } else if (variance > 1.5) {
    paceVariance = 'uneven'
    intonationNotes.push('Pace varies between chunks — aim for even rhythm, especially on multi-syllable words.')
  } else {
    intonationNotes.push('Pace is relatively even across the phrase.')
  }

  // Long segments may indicate flat intonation; short bursts may indicate choppy stress
  const longSegments = segments.filter((s) => s.end - s.start > 2.5)
  if (longSegments.length > 0) {
    stressNotes.push('Some phrases run long without a clear stress peak — punch the key content words.')
  }

  const shortSegments = segments.filter((s) => {
    const words = s.text.split(/\s+/).filter(Boolean).length
    return words >= 2 && s.end - s.start < 0.4 * words
  })
  if (shortSegments.length >= 2) {
    stressNotes.push('Several word groups were rushed — lengthen vowels on stressed syllables.')
  }

  const expectedWpm = expectedWordCount > 0 ? (expectedWordCount / durationSeconds) * 60 : 0
  if (expectedWpm > 0 && expectedWpm < 80) {
    intonationNotes.push(`Overall pace ~${Math.round(expectedWpm)} wpm — a native model is often 120–150 wpm for rehearsed phrases.`)
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      100 -
        (paceVariance === 'uneven' ? 15 : paceVariance === 'rushed' || paceVariance === 'slow' ? 10 : 0) -
        shortSegments.length * 5 -
        longSegments.length * 3
    )
  )

  return {
    avgWordsPerSegment: Math.round(avgWps * 10) / 10,
    paceVariance,
    intonationNotes,
    stressNotes,
    score,
  }
}
