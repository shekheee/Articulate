'use client'

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isActive: boolean
  color?: string
}

export function WaveformVisualizer({ isActive, color = '#6366f1' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const barsRef = useRef<number[]>(Array(20).fill(2))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = barsRef.current.length
      const barWidth = canvas.width / barCount - 2
      const centerY = canvas.height / 2

      for (let i = 0; i < barCount; i++) {
        if (isActive) {
          // Animate towards random heights
          const target = Math.random() * (canvas.height * 0.7) + 4
          barsRef.current[i] = barsRef.current[i] * 0.7 + target * 0.3
        } else {
          barsRef.current[i] = barsRef.current[i] * 0.85 + 2 * 0.15
        }

        const h = barsRef.current[i]
        const x = i * (barWidth + 2)
        ctx.fillStyle = color
        ctx.globalAlpha = isActive ? 0.9 : 0.3
        ctx.beginPath()
        ctx.roundRect(x, centerY - h / 2, barWidth, h, 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [isActive, color])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={48}
      className="w-full h-12"
    />
  )
}
