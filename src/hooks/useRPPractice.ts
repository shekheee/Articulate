'use client'

import { useCallback, useRef, useState } from 'react'
import {
  blobToBase64,
  getSupportedRecordingMimeType,
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
} from '@/lib/accent/audio'
import { showGamificationCelebrations } from '@/lib/gamification/celebrate'
import type { ContrastiveFeedback } from '@/lib/accent/rp/types'
import type { GamificationAward } from '@/lib/gamification/award'

export type RPRecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export interface RPPracticeResult {
  transcribed: string
  expected: string
  contrastive: ContrastiveFeedback
  gamification?: GamificationAward
}

export function useRPPractice(featureId: string, phraseId: string) {
  const [state, setState] = useState<RPRecordingState>('idle')
  const [result, setResult] = useState<RPPracticeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const mimeRef = useRef('audio/webm')
  const analyserRef = useRef<AnalyserNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    analyserRef.current?.disconnect()
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    recorderRef.current = null
    setLevel(0)
  }, [])

  const submit = useCallback(
    async (blobs: Blob[], durationMs: number) => {
      if (blobs.length === 0 || durationMs < MIN_RECORDING_MS) {
        setError('Recording too short — speak the full phrase.')
        setState('error')
        return
      }
      setState('processing')
      try {
        const base64 = await blobToBase64(new Blob(blobs, { type: mimeRef.current }))
        const res = await fetch('/api/accent/rp/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId,
            phraseId,
            audioBase64: base64,
            mimeType: mimeRef.current,
            durationSeconds: Math.max(1, Math.round(durationMs / 1000)),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Practice failed')
        setResult(data)
        setState('done')
        if (data.gamification) {
          showGamificationCelebrations({
            xpEarned: data.gamification.xpEarned,
            leveledUp: data.gamification.leveledUp,
            newLevel: data.gamification.newLevel,
            newBadges: data.gamification.newBadges,
            dailyGoalMet: data.gamification.dailyGoalMet,
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Practice failed')
        setState('error')
      }
    },
    [featureId, phraseId]
  )

  const start = useCallback(async () => {
    setResult(null)
    setError(null)
    setSeconds(0)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const mime = getSupportedRecordingMimeType()
      mimeRef.current = mime
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 8))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)

      const rec = new MediaRecorder(stream, { mimeType: mime })
      recorderRef.current = rec
      startRef.current = Date.now()
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.start(250)
      setState('recording')
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      setTimeout(async () => {
        if (recorderRef.current?.state === 'recording') {
          const blobs = [...chunksRef.current]
          rec.stop()
          cleanup()
          await submit(blobs, Date.now() - startRef.current)
        }
      }, MAX_RECORDING_MS)
    } catch {
      setError('Microphone access denied or unavailable.')
      setState('error')
      cleanup()
    }
  }, [cleanup, submit])

  const stop = useCallback(async () => {
    const rec = recorderRef.current
    const blobs = [...chunksRef.current]
    const dur = Date.now() - startRef.current
    if (rec && rec.state === 'recording') rec.stop()
    cleanup()
    await submit(blobs, dur)
  }, [cleanup, submit])

  const reset = useCallback(() => {
    cleanup()
    setResult(null)
    setError(null)
    setState('idle')
    setSeconds(0)
    chunksRef.current = []
  }, [cleanup])

  return { state, result, error, seconds, level, start, stop, reset }
}
