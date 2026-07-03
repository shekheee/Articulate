'use client'

import { useCallback, useRef, useState } from 'react'
import {
  blobToBase64,
  getSupportedRecordingMimeType,
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
  SILENCE_STOP_MS,
  SPEECH_RMS_THRESHOLD,
} from '@/lib/accent/audio'
import type { FluencyAnalysis } from '@/lib/accent/fluency'
import type { AccentCoachingFeedback } from '@/lib/accent/feedback'
import type { PhoneticsAnalysis } from '@/lib/accent/phonetics'
import type { ProsodyAnalysis } from '@/lib/accent/prosody'
import type { PhonemeWordAnalysis } from '@/lib/accent/phonetics'
import type { Accent } from '@/lib/accent/phrases'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export interface ScoreResult {
  transcribed: string
  wordScores: PhonemeWordAnalysis[]
  accuracy: number
  fluency: FluencyAnalysis
  prosody?: ProsodyAnalysis
  phonetics?: PhoneticsAnalysis
  coaching: AccentCoachingFeedback
  durationSeconds: number
}

export function useAccentPractice(accent: Accent) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const levelRafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechDetectedRef = useRef(false)
  const recordingStartRef = useRef(0)
  const mimeTypeRef = useRef('audio/webm')
  const onDoneCallbackRef = useRef<((r: ScoreResult) => void) | null>(null)
  const submitArgsRef = useRef<{ phraseId: string; expected: string; mode: 'shadowing' | 'drill' | 'coach' } | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    maxTimerRef.current = null
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
    levelRafRef.current = null
  }, [])

  const stopMic = useCallback((waitForRecorder = false): Promise<void> => {
    clearTimers()
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        if (waitForRecorder) {
          recorder.addEventListener(
            'stop',
            () => {
              streamRef.current?.getTracks().forEach((t) => t.stop())
              streamRef.current = null
              analyserRef.current?.disconnect()
              analyserRef.current = null
              audioCtxRef.current?.close().catch(() => {})
              audioCtxRef.current = null
              mediaRecorderRef.current = null
              setAudioLevel(0)
              resolve()
            },
            { once: true }
          )
          try {
            recorder.stop()
          } catch {
            resolve()
          }
        } else {
          try {
            recorder.stop()
          } catch {
            /* noop */
          }
          streamRef.current?.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          analyserRef.current?.disconnect()
          analyserRef.current = null
          audioCtxRef.current?.close().catch(() => {})
          audioCtxRef.current = null
          mediaRecorderRef.current = null
          setAudioLevel(0)
          resolve()
        }
      } else {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        analyserRef.current?.disconnect()
        analyserRef.current = null
        audioCtxRef.current?.close().catch(() => {})
        audioCtxRef.current = null
        mediaRecorderRef.current = null
        setAudioLevel(0)
        resolve()
      }
    })
  }, [clearTimers])

  const submitAudio = useCallback(
    async (phraseId: string, expected: string, mode: 'shadowing' | 'drill' | 'coach' = 'shadowing') => {
      const durationMs = Date.now() - recordingStartRef.current
      const blobs = chunksRef.current
      chunksRef.current = []

      if (blobs.length === 0 || durationMs < MIN_RECORDING_MS) {
        setError('No audio captured — check mic permissions and speak after pressing record.')
        setRecordingState('error')
        return
      }

      setRecordingState('processing')
      setRecordingSeconds(0)

      try {
        const blob = new Blob(blobs, { type: mimeTypeRef.current })
        const base64 = await blobToBase64(blob)
        const durationSeconds = Math.max(1, Math.round(durationMs / 1000))

        const res = await fetch('/api/accent/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: mimeTypeRef.current,
            durationSeconds,
            expected,
            accent,
            phraseId,
            mode,
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error ?? 'Scoring failed. Please try again.')
        }

        const scoreResult = data as ScoreResult
        setResult(scoreResult)
        setRecordingState('done')
        onDoneCallbackRef.current?.(scoreResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scoring failed. Please try again.')
        setRecordingState('error')
      }
    },
    [accent]
  )

  const scheduleSilenceStop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(async () => {
      const args = submitArgsRef.current
      if (!args || !speechDetectedRef.current) return
      await stopMic(true)
      submitAudio(args.phraseId, args.expected, args.mode)
    }, SILENCE_STOP_MS)
  }, [stopMic, submitAudio])

  const startRecording = useCallback(
    async (
      phraseId: string,
      expected: string,
      mode: 'shadowing' | 'drill' | 'coach' = 'shadowing',
      onDone?: (r: ScoreResult) => void
    ) => {
      setResult(null)
      setError(null)
      setRecordingSeconds(0)
      chunksRef.current = []
      speechDetectedRef.current = false
      onDoneCallbackRef.current = onDone ?? null
      submitArgsRef.current = { phraseId, expected, mode }

      if (typeof MediaRecorder === 'undefined') {
        setError('Recording is not supported in this browser.')
        setRecordingState('error')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        streamRef.current = stream

        const mimeType = getSupportedRecordingMimeType()
        mimeTypeRef.current = mimeType

        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        if (ctx.state === 'suspended') await ctx.resume()

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const tickLevel = () => {
          analyser.getByteTimeDomainData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / dataArray.length)
          setAudioLevel(Math.min(1, rms * 8))

          if (rms > SPEECH_RMS_THRESHOLD) {
            speechDetectedRef.current = true
            scheduleSilenceStop()
          }
          levelRafRef.current = requestAnimationFrame(tickLevel)
        }
        levelRafRef.current = requestAnimationFrame(tickLevel)

        const recorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = recorder
        recordingStartRef.current = Date.now()

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          /* submit handled by stopRecording / silence / max timer */
        }

        recorder.onerror = () => {
          setError('Recording failed. Please try again.')
          setRecordingState('error')
          stopMic()
        }

        recorder.start(250)
        setRecordingState('recording')

        timerRef.current = setInterval(() => {
          setRecordingSeconds((s) => s + 1)
        }, 1000)

        maxTimerRef.current = setTimeout(async () => {
          const args = submitArgsRef.current
          if (!args) return
          await stopMic(true)
          submitAudio(args.phraseId, args.expected, args.mode)
        }, MAX_RECORDING_MS)
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Microphone access denied. Allow mic permission in your browser settings.'
            : 'Could not access microphone. Check permissions and try again.'
        setError(msg)
        setRecordingState('error')
        stopMic()
      }
    },
    [scheduleSilenceStop, stopMic, submitAudio]
  )

  const stopRecording = useCallback(
    async (phraseId: string, expected: string, mode: 'shadowing' | 'drill' | 'coach' = 'shadowing') => {
      submitArgsRef.current = { phraseId, expected, mode }
      await stopMic(true)
      submitAudio(phraseId, expected, mode)
    },
    [stopMic, submitAudio]
  )

  const reset = useCallback(() => {
    void stopMic(false)
    setResult(null)
    setError(null)
    setRecordingState('idle')
    setRecordingSeconds(0)
    chunksRef.current = []
  }, [stopMic])

  return {
    recordingState,
    result,
    error,
    recordingSeconds,
    audioLevel,
    startRecording,
    stopRecording,
    reset,
  }
}
