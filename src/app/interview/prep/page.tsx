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

export default function InterviewPrepPage() {
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Prep</h1>
          <p className="text-muted-foreground mt-1">
            Data Science / ML / AI tracks — speak your answers aloud, get delivery + content feedback.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Tailored for DS & AI engineer roles: technical concepts, RAG/LLM system design, stats, SQL talk-throughs, and behavioral STAR questions. Each session uses curated questions with AI evaluation of both <strong>how</strong> you speak and <strong>what</strong> you say.
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Choose a track</h2>
          {PREP_TRACKS.map((t) => (
            <Card
              key={t.id}
              className={`cursor-pointer transition-all hover:border-primary ${track === t.id ? 'border-primary bg-primary/5' : ''}`}
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
                {track === t.id && <Badge>Selected</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>

        {selected && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Difficulty</h2>
            {DIFFICULTIES.map((d) => (
              <Card
                key={d.id}
                className={`cursor-pointer transition-all hover:border-primary ${difficulty === d.id ? 'border-primary bg-primary/5' : ''}`}
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

            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sample questions in this track
                </p>
                <ul className="space-y-1.5">
                  {selected.questions.slice(0, 3).map((q, i) => (
                    <li key={i} className="text-sm text-foreground/80">
                      {i + 1}. {q}
                    </li>
                  ))}
                  {selected.questions.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      + {selected.questions.length - 3} more
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
            ← Dashboard
          </Button>
          <Button
            className="flex-1"
            disabled={!track || loading}
            onClick={startSession}
          >
            {loading ? 'Starting...' : 'Start spoken practice 🎤'}
          </Button>
        </div>
      </div>
    </div>
  )
}
