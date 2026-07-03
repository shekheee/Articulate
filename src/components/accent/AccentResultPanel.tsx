'use client'

import { useState } from 'react'
import type { ScoreResult } from '@/hooks/useAccentPractice'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatFluencySummary } from '@/lib/accent/fluency'
import { NativeReferencePlayer } from '@/components/accent/NativeReferencePlayer'

function WordPhonetics({
  words,
}: {
  words: NonNullable<ScoreResult['phonetics']>['words']
}) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pronunciation by word</p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {words.map((w, i) => {
          const bg =
            w.score >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
            w.score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            'bg-red-100 text-red-800 border-red-200'
          return (
            <button
              key={i}
              type="button"
              className={`rounded-md border px-2 py-0.5 text-sm font-medium cursor-pointer transition-shadow hover:shadow-md ${bg} ${active === i ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActive(active === i ? null : i)}
              title={w.phonemeTip}
            >
              {w.word}
              <span className="text-xs opacity-70 ml-1">{w.score}%</span>
            </button>
          )
        })}
      </div>
      {active != null && words[active] && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
          <p><span className="font-medium">Target IPA:</span> {words[active].ipa}</p>
          <p><span className="font-medium">Heard as:</span> {words[active].heardAs}</p>
          {words[active].issues.length > 0 && (
            <p><span className="font-medium">Issues:</span> {words[active].issues.join('; ')}</p>
          )}
          <p className="text-muted-foreground">{words[active].phonemeTip}</p>
        </div>
      )}
    </div>
  )
}

export function AccentResultPanel({
  result,
  tip,
  expectedPhrase,
  accent = 'british',
}: {
  result: ScoreResult
  tip?: string
  expectedPhrase?: string
  accent?: 'british' | 'irish'
}) {
  const fluencyLines = formatFluencySummary(result.fluency)

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-medium text-sm">Your attempt</span>
          <div className="flex gap-2">
            <Badge variant="outline">Pronunciation {result.accuracy}%</Badge>
            {result.prosody && <Badge variant="outline">Prosody {result.prosody.score}%</Badge>}
          </div>
        </div>

        {result.phonetics && <WordPhonetics words={result.phonetics.words} />}

        {(expectedPhrase || result.coaching.modelPhrase) && (
          <NativeReferencePlayer
            text={expectedPhrase ?? result.coaching.modelPhrase ?? ''}
            accent={accent}
          />
        )}

        <div className="text-xs text-muted-foreground text-center">
          Heard: &ldquo;{result.transcribed}&rdquo;
        </div>

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

        {result.prosody && (
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-1">
            <p className="font-medium text-sm">Prosody & intonation</p>
            <p className="text-muted-foreground">Pace: {result.prosody.paceVariance}</p>
            {result.prosody.intonationNotes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
            {result.prosody.stressNotes.map((n, i) => (
              <p key={`s-${i}`}>{n}</p>
            ))}
          </div>
        )}

        {result.phonetics && result.phonetics.minimalPairs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Targeted drills</p>
            {result.phonetics.minimalPairs.map((p, i) => (
              <div key={i} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{p.label} ({p.sound})</p>
                <p className="text-muted-foreground text-xs">{p.pair[0]} vs {p.pair[1]}</p>
                <p className="text-xs mt-1">Practice: &ldquo;{p.practicePhrase}&rdquo;</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">{result.coaching.overallSummary}</p>
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

        {result.phonetics?.disclaimer && (
          <p className="text-[10px] text-muted-foreground italic">{result.phonetics.disclaimer}</p>
        )}

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
