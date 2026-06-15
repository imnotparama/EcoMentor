import { useEffect, useState, useRef } from 'react'

interface CarbonHaloProps {
  score: number // 0–100
  size?: number
  animated?: boolean
}

function getScoreColor(score: number): { primary: string; secondary: string } {
  if (score >= 75) return { primary: '#3FB950', secondary: '#26a641' }
  if (score >= 50) return { primary: '#58A6FF', secondary: '#2f81f7' }
  if (score >= 25) return { primary: '#D29922', secondary: '#bb8009' }
  return { primary: '#F85149', secondary: '#da3633' }
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Platinum'
  if (score >= 60) return 'Gold'
  if (score >= 45) return 'Silver'
  if (score >= 25) return 'Bronze'
  return 'Getting Started'
}

export default function CarbonHalo({ score, size = 200, animated = true }: CarbonHaloProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [pulsePhase, setPulsePhase] = useState(0)
  const animRef = useRef<number | null>(null)
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const colors = getScoreColor(score)

  // Animate score counter
  useEffect(() => {
    let start = 0
    const end = score
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * end)
      setDisplayScore(start)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score])

  // Pulse animation
  useEffect(() => {
    if (!animated) return
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 100)
    }, 50)
    pulseRef.current = interval
    return () => clearInterval(interval)
  }, [animated])

  const circumference = 2 * Math.PI * (size / 2 - 16)
  const strokeDashoffset = circumference * (1 - displayScore / 100)

  // Pulse effect: sinusoidal opacity
  const pulseOpacity = animated
    ? 0.3 + 0.4 * Math.sin((pulsePhase / 100) * 2 * Math.PI)
    : 0.5

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      role="img"
      aria-label={`Sustainability score: ${Math.round(score)} out of 100. Rating: ${getScoreLabel(score)}`}
    >
      {/* Outer glow ring */}
      {animated && (
        <div
          style={{
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: '50%',
            background: 'transparent',
            boxShadow: `0 0 ${30 + pulsePhase * 0.3}px ${colors.primary}`,
            opacity: pulseOpacity,
            transition: 'opacity 0.05s linear',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 16}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={8}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 16}
          fill="none"
          stroke={`url(#haloGradient-${size})`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease' }}
        />

        <defs>
          <linearGradient
            id={`haloGradient-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.primary} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: size * 0.22,
            fontWeight: 700,
            color: colors.primary,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            transition: 'color 0.3s ease',
          }}
        >
          {displayScore}
        </div>
        <div
          style={{
            fontSize: size * 0.07,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            marginTop: 4,
          }}
        >
          / 100
        </div>
        <div
          style={{
            fontSize: size * 0.065,
            color: colors.primary,
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            marginTop: 2,
            opacity: 0.9,
          }}
        >
          {getScoreLabel(score)}
        </div>
      </div>

      {/* Accessible data table (visually hidden) */}
      <table className="sr-only">
        <caption>Carbon sustainability score</caption>
        <tbody>
          <tr>
            <th scope="row">Score</th>
            <td>{Math.round(score)} / 100</td>
          </tr>
          <tr>
            <th scope="row">Rating</th>
            <td>{getScoreLabel(score)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
