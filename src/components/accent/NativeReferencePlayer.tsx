'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface NativeReferencePlayerProps {
  text: string
  accent?: 'british' | 'irish'
  label?: string
}

export function NativeReferencePlayer({ text, accent = 'british', label = 'Native reference' }: NativeReferencePlayerProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<1 | 0.75>(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const play = useCallback(
    async (rate: 1 | 0.75) => {
      if (!text.trim()) return
      setLoading(true)
      setSpeed(rate)
      try {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current)
          urlRef.current = null
        }

        const voice = accent === 'british' ? 'fable' : 'nova'
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice }),
        })
        if (!res.ok) throw new Error('TTS failed')

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        const audio = new Audio(url)
        audio.playbackRate = rate
        audioRef.current = audio
        audio.onended = () => setPlaying(false)
        audio.onerror = () => setPlaying(false)
        await audio.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      } finally {
        setLoading(false)
      }
    },
    [text, accent]
  )

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm italic">&ldquo;{text}&rdquo;</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={loading || playing}
          onClick={() => play(1)}
        >
          {loading ? 'Loading…' : playing && speed === 1 ? '▶ Playing' : '▶ Normal speed'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={loading || playing}
          onClick={() => play(0.75)}
        >
          🐢 Slow (0.75×)
        </Button>
      </div>
    </div>
  )
}
