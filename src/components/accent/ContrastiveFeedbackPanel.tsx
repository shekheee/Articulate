'use client'

import type { ContrastiveFeedback } from '@/lib/accent/rp/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ContrastiveFeedbackPanel({
  feedback,
  expected,
  transcribed,
}: {
  feedback: ContrastiveFeedback
  expected: string
  transcribed: string
}) {
  const scoreColor =
    feedback.featureScore >= 80
      ? 'text-emerald-600'
      : feedback.featureScore >= 60
        ? 'text-amber-600'
        : 'text-red-500'

  return (
    <div className="space-y-4 animate-in fade-in duration-300 motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Feature score</p>
          <p className={cn('text-3xl font-bold tabular-nums', scoreColor)}>
            {feedback.featureScore}%
          </p>
        </div>
        <Badge variant={feedback.passedFeature ? 'default' : 'secondary'}>
          {feedback.passedFeature ? 'Feature passed' : 'Keep practising'}
        </Badge>
      </div>

      <p className="text-sm leading-relaxed">{feedback.summary}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            What you produced
          </p>
          <p className="text-sm">{feedback.whatYouProduced}</p>
          <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{transcribed}&rdquo;</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            RP target
          </p>
          <p className="text-sm">{feedback.rpTarget}</p>
          <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{expected}&rdquo;</p>
        </div>
      </div>

      {feedback.contrastiveNotes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Contrastive notes
          </p>
          <ul className="space-y-1.5">
            {feedback.contrastiveNotes.map((n, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary shrink-0">→</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.articulatoryCues.length > 0 && (
        <div className="rounded-xl border border-dashed p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Articulatory cues
          </p>
          <ul className="space-y-1 text-sm">
            {feedback.articulatoryCues.map((c, i) => (
              <li key={i}>💡 {c}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.wordFeedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Word-level focus
          </p>
          {feedback.wordFeedback.map((w) => (
            <div key={w.word} className="text-sm rounded-lg bg-muted/40 px-3 py-2">
              <span className="font-semibold">{w.word}</span> — {w.issue}. <span className="text-muted-foreground">{w.cue}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-cyan-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Next micro-drill
        </p>
        <p className="text-sm font-medium">{feedback.nextDrill}</p>
      </div>
    </div>
  )
}
