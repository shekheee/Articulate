import { auth } from '@/lib/auth/auth'
import { getUserSessions } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreChart } from '@/components/dashboard/ScoreChart'
import { SessionList } from '@/components/dashboard/SessionList'

const TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  dsa: 'DSA',
  system_design: 'System Design',
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

export default async function DashboardPage() {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const allSessions = await getUserSessions(authSession.user.id)
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {authSession.user.name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/accent" variant="outline" size="lg">🇬🇧 Accent Coach</ButtonLink>
            <ButtonLink href="/interview/new" size="lg">+ New Interview</ButtonLink>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{allSessions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{completed.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={`text-3xl font-bold ${avgScore ? (avgScore >= 8 ? 'text-green-600' : avgScore >= 6 ? 'text-yellow-600' : 'text-red-600') : ''}`}>
                {avgScore ? `${avgScore}/10` : '—'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Score trend chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreChart data={chartData} />
            </CardContent>
          </Card>
        )}

        {/* Session history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview History</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList sessions={allSessions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
