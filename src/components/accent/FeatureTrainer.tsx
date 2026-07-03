'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NativeReferencePlayer } from '@/components/accent/NativeReferencePlayer'
import { ContrastiveFeedbackPanel } from '@/components/accent/ContrastiveFeedbackPanel'
import { useRPPractice } from '@/hooks/useRPPractice'
import type { RPFeature } from '@/lib/accent/rp/types'
import { Lock, ChevronRight } from 'lucide-react'

interface FeatureTrainerProps {
  feature: RPFeature
  status: 'locked' | 'in_progress' | 'mastered' | 'needs_review'
  masteryScore: number
  bestScore: number
}

export function FeatureTrainer({ feature, status, masteryScore, bestScore }: FeatureTrainerProps) {
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)
  const phrase = feature.practicePhrases[currentPhraseIdx % feature.practicePhrases.length]
  const { state, result, error, seconds, level, start, stop, reset } = useRPPractice(
    feature.id,
    phrase.id
  )

  if (status === 'locked') {
    return (
      <div className="glass-card p-8 text-center space-y-3">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="font-semibold">This unit is locked</p>
        <p className="text-sm text-muted-foreground">Master the previous feature to unlock.</p>
        <ButtonLink href="/accent" variant="outline">← Back to training path</ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-3xl">{feature.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{feature.title}</h1>
          <p className="text-sm text-muted-foreground">Unit {feature.order} · {feature.targetIpa}</p>
        </div>
        <Badge variant={status === 'mastered' ? 'default' : status === 'needs_review' ? 'outline' : 'secondary'}>
          {status === 'needs_review' ? 'Review due' : status === 'mastered' ? 'Mastered' : 'In progress'}
        </Badge>
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Feature mastery</span>
          <span>{masteryScore}% · best {bestScore}%</span>
        </div>
        <Progress value={masteryScore} className="h-2" />
      </div>

      <div className="glass-card p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">The rule</p>
          <p className="text-sm leading-relaxed">{feature.rule}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {feature.exampleWords.slice(0, 5).map((w) => (
            <Badge key={w.word} variant="outline" className="font-normal">
              {w.word} <span className="text-muted-foreground ml-1">{w.ipa}</span>
            </Badge>
          ))}
        </div>
        {feature.minimalPairs.length > 0 && (
          <div className="text-sm space-y-1 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Minimal pair</p>
            {feature.minimalPairs.slice(0, 1).map((p) => (
              <p key={p.rp}>
                <strong>{p.rp}</strong> {p.rpIpa} vs {p.contrast} {p.contrastIpa} — {p.note}
              </p>
            ))}
          </div>
        )}
      </div>

      {!result ? (
        <>
          <NativeReferencePlayer text={phrase.text} accent="british" label="Native RP model — listen first" />

          <div className="glass-card p-5 space-y-4">
            <p className="text-lg font-medium text-center leading-relaxed">&ldquo;{phrase.text}&rdquo;</p>
            <p className="text-xs text-center text-muted-foreground">
              Focus: {phrase.focusWords.join(', ')}
            </p>

            {state === 'idle' && (
              <Button size="lg" className="w-full" onClick={start}>
                🎙️ Shadow this phrase
              </Button>
            )}
            {state === 'recording' && (
              <div className="space-y-3">
                <div className="flex justify-center gap-1 h-8 items-end">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-primary transition-all duration-75"
                      style={{ height: `${8 + level * 24 * (0.5 + Math.random() * 0.5)}px` }}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">Recording… {seconds}s</p>
                <Button size="lg" variant="destructive" className="w-full" onClick={stop}>
                  Stop & analyse
                </Button>
              </div>
            )}
            {state === 'processing' && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Analysing your RP production…
              </p>
            )}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <ContrastiveFeedbackPanel
            feedback={result.contrastive}
            expected={result.expected}
            transcribed={result.transcribed}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Try again
            </Button>
            {currentPhraseIdx < feature.practicePhrases.length - 1 ? (
              <Button
                className="flex-1"
                onClick={() => {
                  setCurrentPhraseIdx((i) => i + 1)
                  reset()
                }}
              >
                Next phrase <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <ButtonLink href="/accent" className="flex-1">Back to path</ButtonLink>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
