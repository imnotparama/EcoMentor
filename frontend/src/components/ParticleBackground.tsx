import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  rotation: number
  rotationSpeed: number
  type: 'leaf' | 'circle'
  color: string
}

const COLORS = ['#3FB950', '#26a641', '#58A6FF', '#3FB95066', '#58A6FF44']

export default function ParticleBackground({ count = 25 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      size: Math.random() * 6 + 3,
      opacity: Math.random() * 0.3 + 0.05,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      type: (Math.random() > 0.5 ? 'leaf' : 'circle') as 'leaf' | 'circle',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    const drawLeaf = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.bezierCurveTo(p.size, -p.size / 2, p.size, p.size / 2, 0, p.size)
      ctx.bezierCurveTo(-p.size, p.size / 2, -p.size, -p.size / 2, 0, -p.size)
      ctx.fill()
      ctx.restore()
    }

    const drawCircle = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Wrap around edges
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width }
        if (p.x < -20) { p.x = canvas.width + 20 }
        if (p.x > canvas.width + 20) { p.x = -20 }

        if (p.type === 'leaf') {
          drawLeaf(ctx, p)
        } else {
          drawCircle(ctx, p)
        }
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
