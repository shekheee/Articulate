import { auth } from '@/lib/auth/auth'
import { getSessionWithEvaluation } from '@/lib/db/queries'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ButtonLink } from '@/components/ui/button-link'

const SCORE_COLORS = (score: number) => {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { sessionId } = await params
  const data = await getSessionWithEvaluation(sessionId)

  if (!data || data.session.userId !== authSession.user.id) notFound()

  const { session, evaluation } = data

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Evaluation is being generated...</p>
          <ButtonLink href="/dashboard">Go to Dashboard</ButtonLink>
        </div>
      </div>
    )
  }

  const scores = [
    { label: 'Clarity', value: evaluation.clarityScore, desc: 'How clear was your communication?' },
    { label: 'Structure', value: evaluation.structureScore, desc: 'Did you use STAR / organized frameworks?' },
    { label: 'Confidence', value: evaluation.confidenceScore, desc: 'Did you sound assured?' },
    { label: 'Depth', value: evaluation.depthScore, desc: 'Did you go beyond surface-level?' },
    { label: 'Fluency', value: evaluation.fluencyScore ?? 0, desc: 'How smooth and natural was your speaking?' },
  ]

  type SpeakingMetrics = {
    fillerWords?: Record<string, number>
    totalFillers?: number
    fillerRate?: number
    estimatedPauses?: number
    wordsPerMinute?: number
    observations?: string[]
  }
  const sm = evaluation.speakingMetrics as SpeakingMetrics | null

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interview Feedback</h1>
            <p className="text-muted-foreground mt-1">
              {session.type.replace('_', ' ')} · {session.persona} · {session.difficulty}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${SCORE_COLORS(evaluation.overallScore)}`}>
              {evaluation.overallScore}/10
            </div>
            <div className="text-xs text-muted-foreground">Overall</div>
          </div>
        </div>

        {/* Score breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scores.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className={`font-bold ${SCORE_COLORS(s.value)}`}>{s.value}/10</span>
                </div>
                <Progress value={s.value * 10} className="h-2" />
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        {sm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🗣️ Speaking Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-2xl font-bold">{sm.wordsPerMinute ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Words / min</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-2xl font-bold">{sm.totalFillers ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Filler words</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-2xl font-bold">{sm.estimatedPauses ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hesitations</div>
                </div>
              </div>

              {sm.fillerWords && Object.keys(sm.fillerWords).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Filler breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sm.fillerWords).map(([word, count]) => (
                      <Badge key={word} variant="secondary" className="text-xs">
                        &quot;{word}&quot; × {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {sm.observations && sm.observations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Observations</p>
                  <ul className="space-y-1">
                    {sm.observations.map((obs, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-yellow-500 shrink-0">→</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Speaking Coach — LLM-generated personalised tips */}
        {Array.isArray(evaluation.speakingCoaching) && (evaluation.speakingCoaching as string[]).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🎙️ Speaking Coach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Personalised feedback on <em>how</em> you spoke, based on your actual transcript.
              </p>
              <ul className="space-y-2">
                {(evaluation.speakingCoaching as string[]).map((tip, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-green-600">✅ Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(evaluation.strengths as string[]).map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-500 shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">⚠️ Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(evaluation.weaknesses as string[]).map((w, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-red-500 shrink-0">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💡 What to Work On Next</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(evaluation.suggestions as string[]).map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="font-bold text-primary">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        {Array.isArray(evaluation.perQuestion) && evaluation.perQuestion.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-Question Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(evaluation.perQuestion as Array<{
                question: string
                answer: string
                score: number
                contentScore?: number
                feedback: string
                improvements: string[]
                modelAnswer?: string
              }>).map((q, i) => (
                <div key={i} className="space-y-2">
                  {i > 0 && <Separator />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">Q{i + 1}: {q.question}</div>
                    <div className="flex gap-1 shrink-0">
                      {q.contentScore != null && (
                        <Badge variant="outline" className="text-xs">Content {q.contentScore}/10</Badge>
                      )}
                      <Badge variant={q.score >= 7 ? 'default' : 'secondary'}>{q.score}/10</Badge>
                    </div>
                  </div>
                  {q.answer && (
                    <div className="bg-muted/50 rounded-md px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Your answer</p>
                      <p className="text-sm text-foreground/80 italic">&ldquo;{q.answer}&rdquo;</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{q.feedback}</p>
                  {q.modelAnswer && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                      <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">Model answer</p>
                      <p className="text-sm text-foreground/90">{q.modelAnswer}</p>
                    </div>
                  )}
                  {q.improvements.length > 0 && (
                    <ul className="space-y-1">
                      {q.improvements.map((imp, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex gap-1">
                          <span>→</span> {imp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <ButtonLink href="/interview/prep" className="flex-1">Interview Prep</ButtonLink>
          <ButtonLink href="/interview/new" variant="outline" className="flex-1">Custom Interview</ButtonLink>
          <ButtonLink href="/dashboard" variant="outline" className="flex-1">Dashboard</ButtonLink>
        </div>
      </div>
    </div>
  )
}
