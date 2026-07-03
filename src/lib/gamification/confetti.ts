/** Lightweight canvas confetti — no external deps, respects reduced motion */
export function fireConfetti(intensity: 'normal' | 'big' = 'normal') {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#22d3ee', '#f472b6', '#fbbf24']
  const count = intensity === 'big' ? 120 : 60
  const particles = Array.from({ length: count }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 4,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 10,
    life: 1,
  }))

  let frame = 0
  const maxFrames = 90

  function tick() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.35
      p.rot += p.vr
      p.life -= 1 / maxFrames
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate((p.rot * Math.PI) / 180)
      ctx!.globalAlpha = Math.max(0, p.life)
      ctx!.fillStyle = p.color
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx!.restore()
    }
    frame++
    if (alive && frame < maxFrames) {
      requestAnimationFrame(tick)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(tick)
}
