import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getUserAccentAttempts } from '@/lib/db/queries'
import { getPhrases, computeAccentLevel, type Accent } from '@/lib/accent/phrases'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const ACCENT_INFO = {
  british: {
    flag: '🇬🇧',
    label: 'British RP',
    description: 'Received Pronunciation — the classic BBC accent. Non-rhotic, with the BATH vowel split and distinctive intonation.',
    colour: 'bg-blue-500',
  },
  irish: {
    flag: '🇮🇪',
    label: 'Irish English',
    description: 'General Irish accent — fully rhotic, melodic intonation, and distinctive vowels. Widely loved and clear to all listeners.',
    colour: 'bg-green-500',
  },
}

export default async function AccentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const attempts = await getUserAccentAttempts(session.user.id)

  // Compute stats per accent
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accent Coach</h1>
            <p className="text-muted-foreground mt-1">
              Practise British RP and Irish English with real-time pronunciation feedback.
            </p>
          </div>
          <ButtonLink href="/dashboard" variant="outline" size="sm">← Dashboard</ButtonLink>
        </div>

        {/* Accent cards */}
        <div className="grid grid-cols-1 gap-4">
          {statsByAccent.map(({ accent, level, totalPhrases, practisedPhrases, avgAccuracy, totalAttempts }) => {
            const info = ACCENT_INFO[accent]
            const levelLabels: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }
            return (
              <Card key={accent}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{info.flag}</span>
                      <div>
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                      </div>
                    </div>
                    <Badge variant={level === 3 ? 'default' : 'secondary'}>
                      Level {level} — {levelLabels[level]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold">{totalAttempts}</div>
                      <div className="text-xs text-muted-foreground">Attempts</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{practisedPhrases}/{totalPhrases}</div>
                      <div className="text-xs text-muted-foreground">Phrases tried</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${avgAccuracy >= 75 ? 'text-green-600' : avgAccuracy >= 50 ? 'text-yellow-600' : avgAccuracy > 0 ? 'text-red-600' : ''}`}>
                        {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg accuracy</div>
                    </div>
                  </div>

                  {practisedPhrases > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Phrases practised</span>
                        <span>{practisedPhrases} / {totalPhrases}</span>
                      </div>
                      <Progress value={(practisedPhrases / totalPhrases) * 100} className="h-1.5" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <ButtonLink href={`/accent/shadowing?accent=${accent}`} className="col-span-1" size="sm">
                      🔊 Shadowing
                    </ButtonLink>
                    <ButtonLink href={`/accent/drills?accent=${accent}`} variant="outline" className="col-span-1" size="sm">
                      🃏 Drills
                    </ButtonLink>
                    <ButtonLink href={`/accent/coach?accent=${accent}`} variant="outline" className="col-span-1" size="sm">
                      💬 Coach
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Progress link */}
        {attempts.length > 0 && (
          <div className="text-center">
            <ButtonLink href="/accent/progress" variant="outline">
              📈 View Full Progress
            </ButtonLink>
          </div>
        )}

        {/* How it works */}
        <Card className="bg-muted/40">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">How it works</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex gap-2"><span>🔊</span><span><strong>Shadowing</strong> — hear a phrase, then repeat it. Your speech is scored word by word.</span></div>
              <div className="flex gap-2"><span>🃏</span><span><strong>Drills</strong> — flash-card style. See a word, hear it, say it.</span></div>
              <div className="flex gap-2"><span>💬</span><span><strong>Coach</strong> — have a free conversation with an AI accent coach who gently corrects your pronunciation.</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
