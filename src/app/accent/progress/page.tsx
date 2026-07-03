import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getUserAccentAttempts } from '@/lib/db/queries'
import { getGamificationProfile } from '@/lib/gamification/award'
import { PHRASES, computeAccentLevel, type Accent } from '@/lib/accent/phrases'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/layout/PageShell'
import { GamificationHero } from '@/components/gamification/GamificationHero'
import { BadgeGrid, BadgeGridSummary } from '@/components/gamification/BadgeGrid'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakBadge } from '@/components/gamification/StreakBadge'

export default async function ProgressPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [attempts, gamification] = await Promise.all([
    getUserAccentAttempts(session.user.id),
    getGamificationProfile(session.user.id),
  ])

  const buildAccentStats = (accent: Accent) => {
    const filtered = attempts.filter((a) => a.accent === accent)
    const bestScores: Record<string, number> = {}
    const attemptCounts: Record<string, number> = {}
    const recentScores: Record<string, number[]> = {}
    let avgFluency = 0
    let fluencyCount = 0
    let avgProsody = 0
    let prosodyCount = 0

    for (const a of filtered) {
      if ((bestScores[a.phraseId] ?? -1) < a.accuracy) bestScores[a.phraseId] = a.accuracy
      attemptCounts[a.phraseId] = (attemptCounts[a.phraseId] ?? 0) + 1
      if (!recentScores[a.phraseId]) recentScores[a.phraseId] = []
      recentScores[a.phraseId].push(a.accuracy)
      const m = a.metrics as { fluencyScore?: number; prosodyScore?: number } | null
      if (m?.fluencyScore != null) {
        avgFluency += m.fluencyScore
        fluencyCount++
      }
      if (m?.prosodyScore != null) {
        avgProsody += m.prosodyScore
        prosodyCount++
      }
    }

    const level = computeAccentLevel(bestScores, accent)
    const phraseData = PHRASES.filter((p) => p.accent === accent).map((p) => ({
      ...p,
      bestScore: bestScores[p.id] ?? null,
      attempts: attemptCounts[p.id] ?? 0,
      trend: recentScores[p.id]?.slice(-3) ?? [],
    }))

    return {
      level,
      phraseData,
      totalAttempts: filtered.length,
      avgFluency: fluencyCount ? Math.round(avgFluency / fluencyCount) : null,
      avgProsody: prosodyCount ? Math.round(avgProsody / prosodyCount) : null,
    }
  }

  const britishStats = buildAccentStats('british')
  const irishStats = buildAccentStats('irish')

  const levelLabels: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }
  const levelColors: Record<number, string> = { 1: '', 2: 'text-amber-600', 3: 'text-emerald-600' }

  function PhraseRow({ phrase, bestScore, attempts: att, trend }: { phrase: typeof britishStats.phraseData[0]; bestScore: number | null; attempts: number; trend: number[] }) {
    const color = bestScore === null ? 'text-muted-foreground' : bestScore >= 75 ? 'text-emerald-600' : bestScore >= 50 ? 'text-amber-600' : 'text-red-500'
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
                <div key={i} className="w-1 rounded-sm bg-primary/40 transition-all" style={{ height: `${Math.max(2, (s / 100) * 16)}px` }} />
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
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">{label}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{stats.totalAttempts} attempts</Badge>
              {stats.avgFluency != null && <Badge variant="outline">Fluency {stats.avgFluency}%</Badge>}
              {stats.avgProsody != null && <Badge variant="outline">Prosody {stats.avgProsody}%</Badge>}
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
    <PageShell maxWidth="md">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">Pronunciation stats, XP, streaks & achievements.</p>
        </div>

        <GamificationHero profile={gamification} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="glass-card p-4 border-0">
            <XPBar
              level={gamification.level}
              xpInLevel={gamification.xpInLevel}
              xpToNextLevel={gamification.xpToNextLevel}
              pct={gamification.xpLevelPct}
            />
          </Card>
          <Card className="glass-card p-4 border-0 flex flex-col justify-center gap-2">
            <p className="text-sm font-medium">Practice streak</p>
            <StreakBadge current={gamification.currentStreak} longest={gamification.longestStreak} showLongest />
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Badges</h2>
            <BadgeGridSummary earnedIds={gamification.earnedBadges} />
          </div>
          <BadgeGrid earnedIds={gamification.earnedBadges} />
        </div>

        {attempts.length === 0 ? (
          <Card className="glass-card border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-4xl mb-3">🎙️</p>
              <p className="text-muted-foreground mb-4">No attempts yet — your first session earns XP and a badge!</p>
              <ButtonLink href="/accent">Start accent practice</ButtonLink>
            </CardContent>
          </Card>
        ) : (
          <>
            <AccentSection label="🇬🇧 British RP" stats={britishStats} />
            <AccentSection label="🇮🇪 Irish English" stats={irishStats} />
          </>
        )}
      </div>
    </PageShell>
  )
}
