'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PREP_TRACKS, type PrepTrack } from '@/lib/interview/questionBank'

const DIFFICULTIES = [
  { id: 'mid', label: 'Mid-level (3–5 yrs)', description: 'Solid DS/ML fundamentals' },
  { id: 'senior', label: 'Senior (6+ yrs)', description: 'Leadership + deep technical depth' },
]

export function PrepClient() {
  const router = useRouter()
  const [track, setTrack] = useState<PrepTrack | ''>('')
  const [difficulty, setDifficulty] = useState('mid')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = PREP_TRACKS.find((t) => t.id === track)

  async function startSession() {
    if (!selected) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selected.interviewType,
          persona: selected.persona,
          difficulty,
          questionCount: selected.questionCount,
          company: 'generic',
          round: `prep:${selected.id}`,
          customQuestions: selected.questions,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to start session')
        setLoading(false)
        return
      }

      const session = await res.json()
      router.push(`/interview/${session.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-cyan-500/5 px-4 py-3 text-sm text-muted-foreground">
        Earn <strong className="text-foreground">+50–150 XP</strong> per completed prep session. Complete a track to unlock the{' '}
        <strong className="text-foreground">Prep Master</strong> badge.
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Choose a track</h2>
        {PREP_TRACKS.map((t) => (
          <Card
            key={t.id}
            className={`interactive-card cursor-pointer ${track === t.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''}`}
            onClick={() => setTrack(t.id)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <span className="text-3xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{t.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {t.questionCount} questions
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              </div>
              {track === t.id && <Badge className="shrink-0">Selected</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="space-y-3 animate-in fade-in duration-300 motion-reduce:animate-none">
          <h2 className="text-lg font-semibold">Difficulty</h2>
          {DIFFICULTIES.map((d) => (
            <Card
              key={d.id}
              className={`interactive-card cursor-pointer ${difficulty === d.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''}`}
              onClick={() => setDifficulty(d.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="font-semibold">{d.label}</div>
                  <div className="text-sm text-muted-foreground">{d.description}</div>
                </div>
                {difficulty === d.id && <Badge>Selected</Badge>}
              </CardContent>
            </Card>
          ))}

          <Card className="glass-card border-dashed">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sample questions
              </p>
              <ul className="space-y-1.5">
                {selected.questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {i + 1}. {q}
                  </li>
                ))}
                {selected.questions.length > 3 && (
                  <li className="text-xs text-muted-foreground">+ {selected.questions.length - 3} more</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button className="w-full" size="lg" disabled={!track || loading} onClick={startSession}>
        {loading ? 'Starting...' : 'Start spoken practice 🎤'}
      </Button>
    </div>
  )
}
