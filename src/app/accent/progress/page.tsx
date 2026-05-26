import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getUserAccentAttempts } from '@/lib/db/queries'
import { PHRASES, computeAccentLevel, type Accent } from '@/lib/accent/phrases'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'

export default async function ProgressPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const attempts = await getUserAccentAttempts(session.user.id)

  const buildAccentStats = (accent: Accent) => {
    const filtered = attempts.filter((a) => a.accent === accent)
    const bestScores: Record<string, number> = {}
    const attemptCounts: Record<string, number> = {}
    const recentScores: Record<string, number[]> = {}

    for (const a of filtered) {
      if ((bestScores[a.phraseId] ?? -1) < a.accuracy) bestScores[a.phraseId] = a.accuracy
      attemptCounts[a.phraseId] = (attemptCounts[a.phraseId] ?? 0) + 1
      if (!recentScores[a.phraseId]) recentScores[a.phraseId] = []
      recentScores[a.phraseId].push(a.accuracy)
    }

    const level = computeAccentLevel(bestScores, accent)
    const phraseData = PHRASES.filter((p) => p.accent === accent).map((p) => ({
      ...p,
      bestScore: bestScores[p.id] ?? null,
      attempts: attemptCounts[p.id] ?? 0,
      trend: recentScores[p.id]?.slice(-3) ?? [],
    }))

    return { level, phraseData, totalAttempts: filtered.length }
  }

  const britishStats = buildAccentStats('british')
  const irishStats = buildAccentStats('irish')

  const levelLabels: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }
  const levelColors: Record<number, string> = { 1: '', 2: 'text-yellow-600', 3: 'text-green-600' }

  function PhraseRow({ phrase, bestScore, attempts: att, trend }: { phrase: typeof britishStats.phraseData[0]; bestScore: number | null; attempts: number; trend: number[] }) {
    const color = bestScore === null ? 'text-muted-foreground' : bestScore >= 75 ? 'text-green-600' : bestScore >= 50 ? 'text-yellow-600' : 'text-red-500'
    return (
      <div className="flex items-center gap-3 py-2 border-b last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{phrase.text}</p>
          <p className="text-xs text-muted-foreground">{phrase.featureLabel} · Level {phrase.level}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {trend.length > 1 && (
            <div className="flex gap-0.5 items-end h-4">
              {trend.map((s, i) => (
                <div key={i} className="w-1 rounded-sm bg-primary/40" style={{ height: `${Math.max(2, (s / 100) * 16)}px` }} />
              ))}
            </div>
          )}
          <span className={`text-sm font-bold w-12 text-right ${color}`}>
            {bestScore !== null ? `${bestScore}%` : '—'}
          </span>
          <span className="text-xs text-muted-foreground w-16 text-right">{att > 0 ? `${att} try` : 'untried'}</span>
        </div>
      </div>
    )
  }

  function AccentSection({ label, stats }: { label: string; stats: typeof britishStats }) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{label}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.totalAttempts} attempts</Badge>
              <Badge variant={stats.level === 3 ? 'default' : 'outline'} className={levelColors[stats.level]}>
                {levelLabels[stats.level]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {[1, 2, 3].map((lvl) => {
            const phrs = stats.phraseData.filter((p) => p.level === lvl)
            const unlocked = lvl <= stats.level
            return (
              <div key={lvl}>
                <div className="flex items-center gap-2 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Level {lvl} — {levelLabels[lvl]}
                  </span>
                  {!unlocked && <Badge variant="outline" className="text-xs">Locked</Badge>}
                </div>
                {phrs.map((p) => (
                  <PhraseRow
                    key={p.id}
                    phrase={p}
                    bestScore={unlocked ? p.bestScore : null}
                    attempts={unlocked ? p.attempts : 0}
                    trend={unlocked ? p.trend : []}
                  />
                ))}
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pronunciation Progress</h1>
            <p className="text-muted-foreground text-sm mt-1">Your best score per phrase across all attempts.</p>
          </div>
          <ButtonLink href="/accent" variant="outline" size="sm">← Back</ButtonLink>
        </div>

        {attempts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No attempts yet. Start with Shadowing or Drills to see your progress here.
              <div className="mt-4">
                <ButtonLink href="/accent">Go to Accent Coach</ButtonLink>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <AccentSection label="🇬🇧 British RP" stats={britishStats} />
            <AccentSection label="🇮🇪 Irish English" stats={irishStats} />
          </>
        )}
      </div>
    </div>
  )
}
