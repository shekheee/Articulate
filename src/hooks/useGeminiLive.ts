'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioPlaybackQueue } from '@/lib/voice/playback'
import type { InterviewType, Persona, Difficulty } from '@/lib/ai/prompts'

export type LiveSessionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'

export interface GeminiLiveOptions {
  systemPrompt: string
  interviewType: InterviewType
  persona: Persona
  difficulty: Difficulty
  onAITranscript?: (text: string) => void
  onUserTranscript?: (text: string) => void
  onStatusChange?: (status: LiveSessionStatus) => void
  onInterviewComplete?: () => void
}

const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export function useGeminiLive(options: GeminiLiveOptions) {
  const {
    systemPrompt,
    onAITranscript,
    onUserTranscript,
    onStatusChange,
    onInterviewComplete,
  } = options

  const [status, setStatus] = useState<LiveSessionStatus>('idle')
  const [isMicActive, setIsMicActive] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const queueRef = useRef<AudioPlaybackQueue | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const aiTranscriptRef = useRef('')
  const userTranscriptBufferRef = useRef('')
  const isConnectedRef = useRef(false)
  // Mic audio is NOT streamed until AI finishes its first turn (greeting)
  // This prevents the mic stream from suppressing AI's opening speech via VAD
  const micStreamingEnabledRef = useRef(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  // Speaking data for analysis
  const userTranscriptsRef = useRef<string[]>([])   // flushed full utterances
  // Timestamped chunks — gap between consecutive timestamps > PAUSE_THRESHOLD_MS = a real hesitation
  const speakingChunksRef = useRef<Array<{ text: string; ts: number }>>([])  
  const sessionStartRef = useRef<number>(0)
  const PAUSE_THRESHOLD_MS = 1500 // silence > 1.5s between phoneme events = real pause

  // Stable refs so WebSocket handlers always see the latest callbacks
  const onAITranscriptRef = useRef(onAITranscript)
  const onUserTranscriptRef = useRef(onUserTranscript)
  const onInterviewCompleteRef = useRef(onInterviewComplete)
  useEffect(() => { onAITranscriptRef.current = onAITranscript }, [onAITranscript])
  useEffect(() => { onUserTranscriptRef.current = onUserTranscript }, [onUserTranscript])
  useEffect(() => { onInterviewCompleteRef.current = onInterviewComplete }, [onInterviewComplete])

  const updateStatus = useCallback(
    (s: LiveSessionStatus) => {
      setStatus(s)
      onStatusChange?.(s)
    },
    [onStatusChange]
  )

  // Stable ref for disconnect so ws.onerror always uses the latest version
  const disconnectRef = useRef<() => void>(() => {})

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    queueRef.current?.stop()
    queueRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    isConnectedRef.current = false
    micStreamingEnabledRef.current = false
    // Flush any remaining buffered user speech before clearing
    if (userTranscriptBufferRef.current.trim()) {
      const utterance = userTranscriptBufferRef.current.trim()
      userTranscriptsRef.current.push(utterance)
      onUserTranscriptRef.current?.(utterance)
    }
    userTranscriptBufferRef.current = ''
    // Keep userTranscriptsRef and speakingChunksRef intact — they are read by
    // getSpeakingData() AFTER disconnect(), so clear them at connect() instead.
    sessionStartRef.current = 0

    setIsMicActive(false)
    setIsUserSpeaking(false)
    setIsAISpeaking(false)
    updateStatus('disconnected')
  }, [updateStatus])

  useEffect(() => { disconnectRef.current = disconnect }, [disconnect])

  const connect = useCallback(async () => {
    if (isConnectedRef.current) return
    updateStatus('connecting')
    // Reset transcript history for the new session
    userTranscriptsRef.current = []
    speakingChunksRef.current = []
    userTranscriptBufferRef.current = ''
    sessionStartRef.current = 0

    try {
      // 1. Get ephemeral token
      const tokenRes = await fetch('/api/live-token')
      if (!tokenRes.ok) throw new Error('Failed to get live token')
      const { token } = await tokenRes.json()

      // 2. Unlock AudioContext (must be called on user gesture path)
      // Use 24000Hz to match Gemini's output — avoids resampling artifacts/distortion
      const ctx = new AudioContext({ sampleRate: 24000 })
      if (ctx.state === 'suspended') await ctx.resume()
      audioCtxRef.current = ctx
      queueRef.current = new AudioPlaybackQueue(ctx, 24000)

      // 3. Open WebSocket
      const ws = new WebSocket(`${GEMINI_LIVE_WS_URL}?key=${token}`)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        // Send setup — do NOT mark connected yet; wait for setupComplete
        const setup = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-latest',
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
              },
            },
            inputAudioTranscription: { languageCode: 'en-US' },
            outputAudioTranscription: {},
          },
        }
        ws.send(JSON.stringify(setup))
      }

      ws.onmessage = (event) => {
        let msg: unknown
        try {
          if (event.data instanceof ArrayBuffer) {
            const text = new TextDecoder().decode(event.data)
            msg = JSON.parse(text)
          } else {
            msg = JSON.parse(event.data as string)
          }
        } catch {
          return
        }

        handleMessage(msg)
      }

      ws.onerror = (e) => {
        console.error('[GeminiLive] WebSocket error:', e)
        updateStatus('error')
        disconnectRef.current()
      }

      ws.onclose = () => {
        if (isConnectedRef.current) {
          updateStatus('disconnected')
          isConnectedRef.current = false
        }
      }

      // 4. Set up microphone + AudioWorklet
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      await ctx.audioWorklet.addModule('/worklet/audio-processor.js')
      const sourceNode = ctx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(ctx, 'pcm-audio-processor')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
        // Don't stream mic until AI has finished its first greeting turn
        if (!micStreamingEnabledRef.current) return
        if (e.data?.type === 'pcm') {
          const int16 = new Int16Array(e.data.data)
          // Convert Int16 PCM to base64 without spread (avoids stack overflow on large chunks)
          const bytes = new Uint8Array(int16.buffer)
          let binary = ''
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
          const b64 = btoa(binary)
          const msg = {
            realtimeInput: {
              audio: {
                data: b64,
                mimeType: 'audio/pcm;rate=16000',
              },
            },
          }
          wsRef.current.send(JSON.stringify(msg))
        }
      }

      sourceNodeRef.current = sourceNode
      sourceNode.connect(workletNode)
      // Do NOT connect workletNode to destination (don't play mic back)
      // isMicActive stays false until streaming is enabled after AI greeting
    } catch (err) {
      console.error('[GeminiLive] connect error:', err)
      updateStatus('error')
    }
  }, [systemPrompt, updateStatus, disconnect])

  const handleMessage = useCallback((msg: unknown) => {
    if (!msg || typeof msg !== 'object') return
    const m = msg as Record<string, unknown>

    // Server signals setup is done — mark connected and trigger AI greeting
    if (m.setupComplete !== undefined) {
      isConnectedRef.current = true
      sessionStartRef.current = Date.now()
      updateStatus('connected')
      // Send initial turn to prompt the AI to begin the interview
      wsRef.current?.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: 'Start the interview.' }] }],
          turnComplete: true,
        },
      }))
      return
    }

    if (m.serverContent) {
      const sc = m.serverContent as Record<string, unknown>

      // Audio chunks from the model — user just finished their turn, flush buffer
      if (sc.modelTurn) {
        setIsAISpeaking(true)
        if (userTranscriptBufferRef.current.trim()) {
          const utterance = userTranscriptBufferRef.current.trim()
          userTranscriptsRef.current.push(utterance)
          onUserTranscriptRef.current?.(utterance)
          userTranscriptBufferRef.current = ''
          // Don't clear speakingChunksRef here — it accumulates across turns for analysis
          setIsUserSpeaking(false)
        }
        const parts = (sc.modelTurn as Record<string, unknown>).parts as unknown[]
        if (Array.isArray(parts)) {
          for (const part of parts) {
            const p = part as Record<string, unknown>
            if (p.inlineData) {
              const id = p.inlineData as Record<string, unknown>
              if (typeof id.data === 'string') {
                const binary = atob(id.data)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                const int16 = new Int16Array(bytes.buffer)
                queueRef.current?.enqueue(int16)
              }
            }
          }
        }
      }

      // AI speech transcription (outputAudioTranscription) — inside serverContent
      if (sc.outputTranscription) {
        const ot = sc.outputTranscription as Record<string, unknown>
        if (typeof ot.text === 'string') {
          aiTranscriptRef.current += ot.text
        }
      }

      // User speech transcription (inputAudioTranscription) — also inside serverContent
      if (sc.inputTranscription) {
        const it = sc.inputTranscription as Record<string, unknown>
        if (typeof it.text === 'string' && it.text.length > 0) {
          setIsUserSpeaking(true)
          // Concatenate raw text — Gemini already includes correct spacing at word boundaries.
          // Do NOT trim or add artificial spaces; that fragments mid-word phoneme chunks.
          userTranscriptBufferRef.current += it.text
          // Keep raw chunks with timestamps — gap analysis gives real pause count
          speakingChunksRef.current.push({ text: it.text, ts: Date.now() })
        }
      }

      if (sc.turnComplete) {
        setIsAISpeaking(false)
        // Enable mic streaming after the first AI turn (greeting) completes
        if (!micStreamingEnabledRef.current) {
          micStreamingEnabledRef.current = true
          setIsMicActive(true)
        }
        if (aiTranscriptRef.current.trim()) {
          onAITranscriptRef.current?.(aiTranscriptRef.current.trim())
          if (aiTranscriptRef.current.toLowerCase().includes('interview is now complete')) {
            onInterviewCompleteRef.current?.()
          }
          aiTranscriptRef.current = ''
        }
      }
    }

  }, [updateStatus])

  const interrupt = useCallback(() => {
    // Stop local audio playback immediately
    queueRef.current?.stop()
    setIsAISpeaking(false)
    // Signal to Gemini that the user has started speaking (interrupts the model)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ realtimeInput: { activityStart: {} } }))
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const getSpeakingData = useCallback(() => {
    // Count real pauses: consecutive chunk timestamps with a gap > PAUSE_THRESHOLD_MS
    const chunks = speakingChunksRef.current
    let pauseCount = 0
    for (let i = 1; i < chunks.length; i++) {
      if (chunks[i].ts - chunks[i - 1].ts > PAUSE_THRESHOLD_MS) pauseCount++
    }
    return {
      transcripts: userTranscriptsRef.current,
      // Provide all chunk texts joined for filler-word analysis
      allText: chunks.map((c) => c.text).join(''),
      pauseCount,
      durationSeconds: sessionStartRef.current
        ? Math.round((Date.now() - sessionStartRef.current) / 1000)
        : 0,
    }
  }, [PAUSE_THRESHOLD_MS])

  // Returns and clears any text currently buffered (user was speaking when interview ended).
  // Call this before disconnect so the component can await the DB save before running eval.
  const takePendingUserTranscript = useCallback((): string | null => {
    const pending = userTranscriptBufferRef.current.trim()
    userTranscriptBufferRef.current = ''
    return pending || null
  }, [])

  return { status, isMicActive, isUserSpeaking, isAISpeaking, connect, disconnect, interrupt, getSpeakingData, takePendingUserTranscript }
}
