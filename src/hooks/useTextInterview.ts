'use client'

import { useState, useCallback, useRef } from 'react'
import type { InterviewType, Persona, Difficulty } from '@/lib/ai/prompts'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UseTextInterviewOptions {
  sessionId: string
  interviewType: InterviewType
  persona: Persona
  difficulty: Difficulty
  questionCount: number
  company?: string
  round?: string
  resumeContext?: string | null
  customQuestions?: string[] | null
  onMessage?: (role: 'ai' | 'user', content: string, order: number) => void
  onInterviewComplete?: () => void
}

export function useTextInterview({
  interviewType,
  persona,
  difficulty,
  questionCount,
  company,
  round,
  resumeContext,
  customQuestions,
  onMessage,
  onInterviewComplete,
}: UseTextInterviewOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const orderRef = useRef(0)

  const sendToAPI = useCallback(
    async (historyMessages: ChatMessage[]) => {
      setIsLoading(true)
      const assistantId = 'ai-' + String(Date.now())
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyMessages.map((m) => ({ role: m.role, content: m.content })),
            interviewType,
            persona,
            difficulty,
            questionCount,
            company,
            round,
            resumeContext,
            customQuestions,
          }),
        })

        if (!res.body) throw new Error('No response body')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let aiContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2))
                if (typeof text === 'string') {
                  aiContent += text
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: aiContent } : m))
                  )
                }
              } catch {}
            }
          }
        }

        if (aiContent) {
          onMessage?.('ai', aiContent, orderRef.current++)
          if (aiContent.toLowerCase().includes('interview is now complete')) {
            onInterviewComplete?.()
          }
        }
      } catch (err) {
        console.error('[useTextInterview]', err)
      } finally {
        setIsLoading(false)
      }
    },
    [interviewType, persona, difficulty, questionCount, company, round, resumeContext, customQuestions, onMessage, onInterviewComplete]
  )

  const startInterview = useCallback(() => {
    const triggerMsg: ChatMessage = { id: 'start', role: 'user', content: '__start__' }
    setMessages([triggerMsg])
    sendToAPI([triggerMsg])
  }, [sendToAPI])

  const submitAnswer = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return
      const userMsg: ChatMessage = {
        id: 'user-' + String(Date.now()),
        role: 'user',
        content: text,
      }
      setInput('')
      onMessage?.('user', text, orderRef.current++)
      const updated = [...messages, userMsg]
      setMessages(updated)
      sendToAPI(updated)
    },
    [input, isLoading, messages, onMessage, sendToAPI]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value)
    },
    []
  )

  return { messages, input, handleInputChange, submitAnswer, isLoading, startInterview }
}
