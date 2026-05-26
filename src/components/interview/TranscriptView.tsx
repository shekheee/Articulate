'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TranscriptMessage {
  role: 'ai' | 'user'
  content: string
  id: string
}

interface TranscriptViewProps {
  messages: TranscriptMessage[]
  personaLabel: string
  userName: string
}

export function TranscriptView({ messages, personaLabel, userName }: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <Avatar className="h-8 w-8 shrink-0 mt-1">
            <AvatarFallback className={msg.role === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
              {msg.role === 'ai' ? 'AI' : userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-muted text-foreground rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            }`}
          >
            <div className="font-semibold text-xs mb-1 opacity-70">
              {msg.role === 'ai' ? personaLabel : 'You'}
            </div>
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
