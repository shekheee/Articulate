'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button-link'
import { formatFluencySummary } from '@/lib/accent/fluency'
import type { FluencyAnalysis } from '@/lib/accent/fluency'
import type { PhoneticsAnalysis } from '@/lib/accent/phonetics'
import type { AccentCoachingFeedback } from '@/lib/accent/feedback'

export interface CoachSummary {
  fluency: FluencyAnalysis
  phonetics: PhoneticsAnalysis
  coaching: AccentCoachingFeedback
  userWordCount: number
  durationSeconds: number
}

export function CoachSummaryPanel({ summary }: { summary: CoachSummary }) {
  const lines = formatFluencySummary(summary.fluency)

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Pronunciation {summary.phonetics.overallPhonemeScore}%</Badge>
            <Badge variant="outline">{summary.userWordCount} words spoken</Badge>
            <Badge variant="outline">{summary.durationSeconds}s</Badge>
          </div>

          <p className="text-sm">{summary.coaching.overallSummary}</p>

          <div className="rounded-md border bg-muted/30 px-3 py-3 space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">Fluency</p>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="font-bold">{summary.fluency.wordsPerMinute || '—'}</div>
                <div className="text-xs text-muted-foreground">wpm</div>
              </div>
              <div>
                <div className="font-bold">{summary.fluency.totalFillers}</div>
                <div className="text-xs text-muted-foreground">fillers</div>
              </div>
              <div>
                <div className="font-bold">{summary.fluency.pauses.length}</div>
                <div className="text-xs text-muted-foreground">pauses</div>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              {lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>

          {summary.phonetics.strugglingSounds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Sounds to work on</p>
              <div className="flex flex-wrap gap-1">
                {summary.phonetics.strugglingSounds.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Priority improvements</p>
            <ul className="text-sm space-y-1">
              {summary.coaching.priorityImprovements.map((item, i) => (
                <li key={i}>{i + 1}. {item}</li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground italic">{summary.phonetics.disclaimer}</p>

          <div className="flex gap-2 pt-2">
            <ButtonLink href="/accent/shadowing?accent=british" className="flex-1">Practice shadowing</ButtonLink>
            <ButtonLink href="/accent" variant="outline" className="flex-1">Back</ButtonLink>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
