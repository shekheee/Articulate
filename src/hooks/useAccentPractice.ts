'use client'

import { useCallback, useRef, useState } from 'react'
import { buildWav } from '@/lib/accent/scoring'
import type { WordScore } from '@/lib/accent/scoring'
import type { Accent } from '@/lib/accent/phrases'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export interface ScoreResult {
  transcribed: string
  wordScores: WordScore[]
  accuracy: number
}

const SILENCE_THRESHOLD_MS = 1500 // gap > 1.5s between PCM chunks = end of speech
const SAMPLE_RATE = 16000

export function useAccentPractice(accent: Accent) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Int16Array[]>([])
  const lastChunkTimeRef = useRef<number>(0)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDoneCallbackRef = useRef<((r: ScoreResult) => void) | null>(null)

  const stopMic = useCallback(() => {
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const submitAudio = useCallback(
    async (phraseId: string, expected: string, mode: 'shadowing' | 'drill' | 'coach' = 'shadowing') => {
      if (chunksRef.current.length === 0) {
        setError('No audio captured. Please try again.')
        setRecordingState('error')
        return
      }

      setRecordingState('processing')

      const wav = buildWav(chunksRef.current, SAMPLE_RATE)
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(wav))
      )
      chunksRef.current = []

      try {
        const res = await fetch('/api/accent/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, expected, accent, phraseId, mode }),
        })
        if (!res.ok) throw new Error('Scoring failed')
        const data: ScoreResult = await res.json()
        setResult(data)
        setRecordingState('done')
        onDoneCallbackRef.current?.(data)
      } catch {
        setError('Scoring failed. Please try again.')
        setRecordingState('error')
      }
    },
    [accent]
  )

  const startRecording = useCallback(
    async (phraseId: string, expected: string, mode: 'shadowing' | 'drill' | 'coach' = 'shadowing', onDone?: (r: ScoreResult) => void) => {
      setResult(null)
      setError(null)
      chunksRef.current = []
      onDoneCallbackRef.current = onDone ?? null

      try {
        const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
        if (ctx.state === 'suspended') await ctx.resume()
        audioCtxRef.current = ctx

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream

        await ctx.audioWorklet.addModule('/worklet/audio-processor.js')
        const source = ctx.createMediaStreamSource(stream)
        const worklet = new AudioWorkletNode(ctx, 'pcm-audio-processor')
        workletNodeRef.current = worklet
        sourceNodeRef.current = source

        worklet.port.onmessage = (e) => {
          if (e.data?.type !== 'pcm') return
          const chunk = new Int16Array(e.data.data)
          chunksRef.current.push(chunk)
          lastChunkTimeRef.current = Date.now()

          // Reset silence timer on each chunk
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            // Silence detected — stop recording and submit
            stopMic()
            submitAudio(phraseId, expected, mode)
          }, SILENCE_THRESHOLD_MS)
        }

        source.connect(worklet)
        setRecordingState('recording')
      } catch {
        setError('Microphone access denied.')
        setRecordingState('error')
      }
    },
    [stopMic, submitAudio]
  )

  const stopRecording = useCallback(
    (phraseId: string, expected: string, mode: 'shadowing' | 'drill' | 'coach' = 'shadowing') => {
      stopMic()
      submitAudio(phraseId, expected, mode)
    },
    [stopMic, submitAudio]
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setRecordingState('idle')
    chunksRef.current = []
  }, [])

  return { recordingState, result, error, startRecording, stopRecording, reset }
}
