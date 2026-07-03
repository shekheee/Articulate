import { auth } from '@/lib/auth/auth'
import { getUserSessions } from '@/lib/db/queries'
import { getGamificationProfile } from '@/lib/gamification/award'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreChart } from '@/components/dashboard/ScoreChart'
import { SessionList } from '@/components/dashboard/SessionList'
import { PageShell } from '@/components/layout/PageShell'
import { GamificationHero } from '@/components/gamification/GamificationHero'
import { BadgeGrid, BadgeGridSummary } from '@/components/gamification/BadgeGrid'
import { Mic, Target, Plus } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  dsa: 'DSA',
  system_design: 'System Design',
}

export default async function DashboardPage() {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const [allSessions, gamification] = await Promise.all([
    getUserSessions(authSession.user.id),
    getGamificationProfile(authSession.user.id),
  ])
  const completed = allSessions.filter((s) => s.status === 'completed')

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / completed.length
        )
      : null

  const chartData = completed
    .slice()
    .reverse()
    .map((s, i) => ({
      name: `#${i + 1}`,
      score: s.overallScore ?? 0,
      type: TYPE_LABELS[s.type] ?? s.type,
    }))

  return (
    <PageShell maxWidth="lg">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hey, {authSession.user.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Your speaking journey at a glance</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ButtonLink href="/interview/prep" size="lg" className="gap-2">
              <Target className="h-4 w-4" /> Interview Prep
            </ButtonLink>
            <ButtonLink href="/accent" variant="outline" size="lg" className="gap-2">
              <Mic className="h-4 w-4" /> RP Trainer
            </ButtonLink>
            <ButtonLink href="/interview/new" variant="secondary" size="lg" className="gap-2">
              <Plus className="h-4 w-4" /> New Interview
            </ButtonLink>
          </div>
        </div>

        <GamificationHero profile={gamification} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total sessions', value: allSessions.length },
            { label: 'Completed', value: completed.length },
            { label: 'Avg score', value: avgScore ? `${avgScore}/10` : '—' },
            { label: 'Badges', value: gamification.earnedBadges.length },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {chartData.length > 1 && (
          <Card className="glass-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Score over time</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreChart data={chartData} />
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <BadgeGridSummary earnedIds={gamification.earnedBadges} />
          </div>
          <BadgeGrid earnedIds={gamification.earnedBadges} compact />
        </div>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Interview history</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList sessions={allSessions} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
