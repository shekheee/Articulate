'use client'

import type { ScoreResult } from '@/hooks/useAccentPractice'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatFluencySummary } from '@/lib/accent/fluency'

function WordHighlight({ wordScores }: { wordScores: ScoreResult['wordScores'] }) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {wordScores.map((w, i) => {
        const bg =
          w.score >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
          w.score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          'bg-red-100 text-red-800 border-red-200'
        return (
          <span key={i} className={`rounded-md border px-2 py-0.5 text-sm font-medium ${bg}`}>
            {w.word}
            <span className="text-xs opacity-70 ml-1">{w.score}%</span>
          </span>
        )
      })}
    </div>
  )
}

export function AccentResultPanel({
  result,
  tip,
}: {
  result: ScoreResult
  tip?: string
}) {
  const fluencyLines = formatFluencySummary(result.fluency)

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Your attempt</span>
          <span
            className={`text-xl font-bold ${
              result.accuracy >= 75 ? 'text-green-600' : result.accuracy >= 50 ? 'text-yellow-600' : 'text-red-500'
            }`}
          >
            {result.accuracy}%
          </span>
        </div>

        <WordHighlight wordScores={result.wordScores} />

        <div className="text-xs text-muted-foreground text-center">
          Heard: &ldquo;{result.transcribed}&rdquo;
        </div>

        {/* Fluency metrics */}
        <div className="rounded-md border bg-muted/30 px-3 py-3 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Speaking fluency</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-bold">{result.fluency.wordsPerMinute || '—'}</div>
              <div className="text-xs text-muted-foreground">wpm</div>
            </div>
            <div>
              <div className="font-bold">{result.fluency.totalFillers}</div>
              <div className="text-xs text-muted-foreground">fillers</div>
            </div>
            <div>
              <div className="font-bold">{result.fluency.pauses.length}</div>
              <div className="text-xs text-muted-foreground">pauses</div>
            </div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {fluencyLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>

        {/* LLM coaching */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{result.coaching.overallSummary}</p>
          {result.coaching.modelPhrase && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Model phrase: </span>
              {result.coaching.modelPhrase}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Priority improvements</p>
            <ul className="text-sm space-y-1">
              {result.coaching.priorityImprovements.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <Badge variant="outline" className="shrink-0 h-5 px-1.5 text-xs">{i + 1}</Badge>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {tip && (
          <div className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tip: </span>{tip}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RecordingIndicator({
  recordingSeconds,
  audioLevel,
}: {
  recordingSeconds: number
  audioLevel: number
}) {
  const bars = 12
  const activeBars = Math.round(audioLevel * bars)

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex items-end gap-0.5 h-8" aria-hidden>
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-all duration-75 ${
              i < activeBars ? 'bg-red-500' : 'bg-muted'
            }`}
            style={{ height: `${Math.max(4, ((i + 1) / bars) * 32)}px` }}
          />
        ))}
      </div>
      <p className="text-sm text-red-600 font-medium animate-pulse">
        ● Recording {recordingSeconds}s — speak now, then tap Stop when done
      </p>
    </div>
  )
}
