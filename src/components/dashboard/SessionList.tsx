'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button-link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { InterviewSession } from '@/lib/db/schema'

const TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  dsa: 'DSA',
  system_design: 'System Design',
  case_study: 'Case Study',
}

const PERSONA_LABELS: Record<string, string> = {
  google: 'Google',
  amazon: 'Amazon',
  startup: 'Startup',
  strict: 'Strict',
  friendly: 'Friendly',
}

function ScoreColor({ score }: { score: number | null }) {
  if (!score) return <span className="text-muted-foreground text-sm">—</span>
  const color = score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600'
  return <span className={`font-bold ${color}`}>{score}/10</span>
}

export function SessionList({ sessions }: { sessions: InterviewSession[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No interviews yet.{' '}
        <a href="/interview/new" className="text-primary underline">Start your first one</a>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {sessions.map((s: InterviewSession, i: number) => (
        <div key={s.id}>
          {i > 0 && <Separator />}
          <div className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{TYPE_LABELS[s.type] ?? s.type}</span>
                <Badge variant="secondary" className="text-xs">{PERSONA_LABELS[s.persona] ?? s.persona}</Badge>
                <Badge variant="outline" className="text-xs">{s.difficulty}</Badge>
                {s.company && s.company !== 'generic' && (
                  <Badge variant="outline" className="text-xs capitalize">{s.company.replace('_', ' ')}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {new Date(s.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <ScoreColor score={s.overallScore} />
                {s.status === 'completed' ? (
                  <div className="mt-1">
                    <ButtonLink href={`/feedback/${s.id}`} size="sm" variant="ghost" className="h-7 text-xs">
                      View Feedback
                    </ButtonLink>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {s.status === 'in_progress' ? 'In Progress' : 'Abandoned'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Delete */}
              {confirmId === s.id ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs px-2"
                    disabled={deleting === s.id}
                    onClick={() => handleDelete(s.id)}
                  >
                    {deleting === s.id ? '…' : 'Delete'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                  onClick={() => setConfirmId(s.id)}
                  title="Delete session"
                >
                  🗑
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
