import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getUserAccentAttempts } from '@/lib/db/queries'
import { getGamificationProfile } from '@/lib/gamification/award'
import { getPhrases, computeAccentLevel, type Accent } from '@/lib/accent/phrases'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageShell } from '@/components/layout/PageShell'
import { GamificationHero } from '@/components/gamification/GamificationHero'

const ACCENT_INFO = {
  british: {
    flag: '🇬🇧',
    label: 'British RP',
    description: 'Received Pronunciation — the classic BBC accent. Non-rhotic, with the BATH vowel split and distinctive intonation.',
    gradient: 'from-blue-500/10 to-indigo-500/5',
  },
  irish: {
    flag: '🇮🇪',
    label: 'Irish English',
    description: 'General Irish accent — fully rhotic, melodic intonation, and distinctive vowels. Widely loved and clear to all listeners.',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
}

export default async function AccentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [attempts, gamification] = await Promise.all([
    getUserAccentAttempts(session.user.id),
    getGamificationProfile(session.user.id),
  ])

  const statsByAccent = (['british', 'irish'] as Accent[]).map((accent) => {
    const accentAttempts = attempts.filter((a) => a.accent === accent)
    const bestScores: Record<string, number> = {}
    for (const a of accentAttempts) {
      if ((bestScores[a.phraseId] ?? -1) < a.accuracy) bestScores[a.phraseId] = a.accuracy
    }
    const level = computeAccentLevel(bestScores, accent)
    const totalPhrases = getPhrases(accent).length
    const practisedPhrases = Object.keys(bestScores).length
    const avgAccuracy =
      Object.values(bestScores).length > 0
        ? Math.round(Object.values(bestScores).reduce((s, v) => s + v, 0) / Object.values(bestScores).length)
        : 0

    return { accent, level, totalPhrases, practisedPhrases, avgAccuracy, totalAttempts: accentAttempts.length }
  })

  return (
    <PageShell maxWidth="md">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accent Coach</h1>
          <p className="text-muted-foreground mt-1">
            Practise British RP and Irish English — earn XP with every session.
          </p>
        </div>

        <GamificationHero profile={gamification} />

        <div className="grid grid-cols-1 gap-5">
          {statsByAccent.map(({ accent, level, totalPhrases, practisedPhrases, avgAccuracy, totalAttempts }) => {
            const info = ACCENT_INFO[accent]
            const levelLabels: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }
            return (
              <Card key={accent} className={`interactive-card overflow-hidden bg-gradient-to-br ${info.gradient}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{info.flag}</span>
                      <div>
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{info.description}</p>
                      </div>
                    </div>
                    <Badge variant={level === 3 ? 'default' : 'secondary'} className="shrink-0">
                      Lv.{level} · {levelLabels[level]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-background/60 py-2">
                      <div className="text-xl font-bold">{totalAttempts}</div>
                      <div className="text-xs text-muted-foreground">Attempts</div>
                    </div>
                    <div className="rounded-lg bg-background/60 py-2">
                      <div className="text-xl font-bold">{practisedPhrases}/{totalPhrases}</div>
                      <div className="text-xs text-muted-foreground">Phrases</div>
                    </div>
                    <div className="rounded-lg bg-background/60 py-2">
                      <div className={`text-xl font-bold ${avgAccuracy >= 75 ? 'text-emerald-600' : avgAccuracy >= 50 ? 'text-amber-600' : avgAccuracy > 0 ? 'text-red-500' : ''}`}>
                        {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>

                  {practisedPhrases > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Phrases practised</span>
                        <span>{practisedPhrases} / {totalPhrases}</span>
                      </div>
                      <Progress value={(practisedPhrases / totalPhrases) * 100} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <ButtonLink href={`/accent/shadowing?accent=${accent}`} size="sm" className="col-span-1">
                      🔊 Shadow
                    </ButtonLink>
                    <ButtonLink href={`/accent/drills?accent=${accent}`} variant="outline" size="sm" className="col-span-1">
                      🃏 Drills
                    </ButtonLink>
                    <ButtonLink href={`/accent/coach?accent=${accent}`} variant="outline" size="sm" className="col-span-1">
                      💬 Coach
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {attempts.length > 0 && (
          <div className="text-center">
            <ButtonLink href="/accent/progress" variant="outline" size="lg">
              📈 View full progress & badges
            </ButtonLink>
          </div>
        )}

        <Card className="glass-card border-dashed">
          <CardContent className="py-5 space-y-3">
            <p className="text-sm font-semibold">How it works</p>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Shadowing</strong> — hear a phrase, repeat it, score word-by-word.</p>
              <p><strong className="text-foreground">Drills</strong> — flash-card style pronunciation practice.</p>
              <p><strong className="text-foreground">Coach</strong> — free conversation with gentle corrections.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
