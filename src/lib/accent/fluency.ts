import { analyzeSpeaking, type SpeakingMetrics } from '@/lib/ai/evaluate'

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface PauseEvent {
  durationMs: number
  afterText: string
  type: 'hesitation' | 'breath' | 'long'
}

export interface FluencyAnalysis extends SpeakingMetrics {
  pauses: PauseEvent[]
  totalPauseMs: number
  longestPauseMs: number
}

export function analyzePausesFromSegments(
  segments: TranscriptSegment[],
  pauseThresholdSec = 0.35
): PauseEvent[] {
  if (segments.length < 2) return []

  const pauses: PauseEvent[] = []
  for (let i = 1; i < segments.length; i++) {
    const gapSec = segments[i].start - segments[i - 1].end
    if (gapSec < pauseThresholdSec) continue

    const durationMs = Math.round(gapSec * 1000)
    const afterText = segments[i - 1].text.trim().split(/\s+/).pop() ?? segments[i - 1].text.trim()

    pauses.push({
      durationMs,
      afterText,
      type: durationMs >= 1500 ? 'long' : durationMs >= 700 ? 'breath' : 'hesitation',
    })
  }
  return pauses
}

export function buildFluencyAnalysis(
  transcript: string,
  durationSeconds: number,
  segments: TranscriptSegment[] = []
): FluencyAnalysis {
  const pauses = analyzePausesFromSegments(segments)
  const speaking = analyzeSpeaking([transcript], durationSeconds, {
    allText: transcript,
    pauseCount: pauses.length,
  })

  const totalPauseMs = pauses.reduce((s, p) => s + p.durationMs, 0)
  const longestPauseMs = pauses.length > 0 ? Math.max(...pauses.map((p) => p.durationMs)) : 0

  const observations = [...speaking.observations]
  if (longestPauseMs >= 1500) {
    const worst = pauses.find((p) => p.durationMs === longestPauseMs)
    observations.unshift(
      `Long pause (${(longestPauseMs / 1000).toFixed(1)}s) after "${worst?.afterText ?? '…'}" — breathe silently instead of hesitating audibly.`
    )
  }
  if (pauses.filter((p) => p.type === 'breath').length >= 2) {
    observations.push('Multiple breath-length gaps detected — try linking words more smoothly.')
  }

  return {
    ...speaking,
    pauses,
    totalPauseMs,
    longestPauseMs,
    observations,
  }
}

export function formatFluencySummary(f: FluencyAnalysis): string[] {
  const lines: string[] = []
  if (f.wordsPerMinute > 0) {
    lines.push(`Pace: ${f.wordsPerMinute} words/min${f.wordsPerMinute < 100 ? ' (a bit slow)' : f.wordsPerMinute > 180 ? ' (quite fast)' : ''}`)
  }
  if (f.totalFillers > 0) {
    lines.push(`Filler words: ${f.totalFillers} (${f.fillerRate} per 100 words)`)
  }
  if (f.pauses.length > 0) {
    lines.push(`Pauses: ${f.pauses.length} gap(s), longest ${(f.longestPauseMs / 1000).toFixed(1)}s`)
    const notable = f.pauses.filter((p) => p.durationMs >= 700).slice(0, 3)
    for (const p of notable) {
      lines.push(`  • ${(p.durationMs / 1000).toFixed(1)}s pause after "${p.afterText}"`)
    }
  }
  return lines
}
