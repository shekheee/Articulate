'use client'

import { useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ButtonLink } from '@/components/ui/button-link'
import { AudioPlaybackQueue } from '@/lib/voice/playback'
import { getPhrases, type AccentPhrase, type Accent } from '@/lib/accent/phrases'
import { useAccentPractice } from '@/hooks/useAccentPractice'

export default function DrillsPage() {
  const params = useSearchParams()
  const accent = (params.get('accent') ?? 'british') as Accent
  // Drills use all phrases but show just the key word/feature label (flash-card style)
  const allPhrases = getPhrases(accent)

  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sessionScores, setSessionScores] = useState<number[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const queueRef = useRef<AudioPlaybackQueue | null>(null)

  const { recordingState, result, error, startRecording, stopRecording, reset } = useAccentPractice(accent)

  const current: AccentPhrase | undefined = allPhrases[idx]

  const playPhrase = useCallback(async () => {
    if (!current || isPlaying) return
    setIsPlaying(true)
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
        queueRef.current = new AudioPlaybackQueue(audioCtxRef.current, 24000)
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: current.text, voice: 'nova' }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const decoded = await audioCtxRef.current.decodeAudioData(await res.arrayBuffer())
      const source = audioCtxRef.current.createBufferSource()
      source.buffer = decoded
      source.connect(audioCtxRef.current.destination)
      source.start()
      source.onended = () => {
        setIsPlaying(false)
        setRevealed(true)
      }
    } catch {
      setIsPlaying(false)
      setRevealed(true)
    }
  }, [current, isPlaying])

  const handleRecord = useCallback(() => {
    if (!current) return
    startRecording(current.id, current.text, 'drill', (r) => {
      setSessionScores((prev) => [...prev, r.accuracy])
    })
  }, [current, startRecording])

  const handleStop = useCallback(() => {
    if (!current) return
    stopRecording(current.id, current.text, 'drill')
  }, [current, stopRecording])

  const handleNext = useCallback(() => {
    reset()
    setRevealed(false)
    setIdx((i) => (i + 1) % allPhrases.length)
  }, [reset, allPhrases.length])

  const sessionAvg =
    sessionScores.length > 0
      ? Math.round(sessionScores.reduce((s, v) => s + v, 0) / sessionScores.length)
      : null

  if (!current) return null

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto py-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Drills</h1>
            <p className="text-muted-foreground text-sm">{accent === 'british' ? '🇬🇧 British RP' : '🇮🇪 Irish English'}</p>
          </div>
          <ButtonLink href="/accent" variant="outline" size="sm">← Back</ButtonLink>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Card {idx + 1} of {allPhrases.length}</span>
            {sessionAvg !== null && <span>Avg: <strong>{sessionAvg}%</strong></span>}
          </div>
          <Progress value={((idx + 1) / allPhrases.length) * 100} className="h-1.5" />
        </div>

        {/* Flash card */}
        <Card className="min-h-48">
          <CardContent className="py-8 flex flex-col items-center justify-center gap-4 text-center">
            <Badge variant="outline">{current.featureLabel}</Badge>

            {!revealed ? (
              <>
                <p className="text-muted-foreground text-sm">Tap listen, then repeat what you hear.</p>
                <Button onClick={playPhrase} disabled={isPlaying} size="lg">
                  {isPlaying ? '▶ Playing...' : '▶ Listen'}
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium leading-relaxed">&ldquo;{current.text}&rdquo;</p>
                <Button onClick={playPhrase} disabled={isPlaying} variant="outline" size="sm">
                  🔁 {isPlaying ? 'Playing...' : 'Play again'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Record controls */}
        {revealed && (
          <div className="space-y-3">
            {(recordingState === 'idle' || recordingState === 'done' || recordingState === 'error') && (
              <Button onClick={handleRecord} className="w-full">
                🎤 {recordingState === 'done' ? 'Try again' : 'Say it'}
              </Button>
            )}
            {recordingState === 'recording' && (
              <Button onClick={handleStop} variant="secondary" className="w-full">⏹ Done</Button>
            )}
            {recordingState === 'processing' && (
              <Button disabled className="w-full">Scoring...</Button>
            )}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Score result */}
        {result && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Accuracy</span>
                <span className={`text-2xl font-bold ${result.accuracy >= 75 ? 'text-green-600' : result.accuracy >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {result.accuracy}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.wordScores.map((w, i) => {
                  const bg = w.score >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
                    w.score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  return <span key={i} className={`rounded border px-1.5 py-0.5 text-xs font-medium ${bg}`}>{w.word} {w.score}%</span>
                })}
              </div>
              <p className="text-xs text-muted-foreground">Heard: &ldquo;{result.transcribed}&rdquo;</p>
              <div className="rounded bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Tip: </strong>{current.tip}
              </div>
              <Button onClick={handleNext} className="w-full">Next card →</Button>
            </CardContent>
          </Card>
        )}

        {revealed && !result && recordingState === 'idle' && (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleNext}>
            Skip →
          </Button>
        )}
      </div>
    </div>
  )
}
