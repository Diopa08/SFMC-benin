import { useEffect, useRef } from 'react'

interface FloatingItem {
  x: number; y: number; z: number
  vx: number; vy: number
  size: number; color: string; shape: 'brick' | 'bag' | 'rod' | 'stone'
  opacity: number; rotation: number; vr: number
}

const COLORS = {
  brick: '#b84020',
  bag:   '#d8d0c6',
  rod:   '#8fa0b0',
  stone: '#c8a870',
}

function makeItems(): FloatingItem[] {
  const shapes: FloatingItem['shape'][] = ['brick', 'brick', 'brick', 'bag', 'bag', 'rod', 'rod', 'rod', 'stone', 'stone', 'stone', 'stone']
  return shapes.map((shape) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: 0.4 + Math.random() * 0.6,
    vx: (Math.random() - 0.5) * 0.04,
    vy: (Math.random() - 0.5) * 0.04,
    size: shape === 'rod' ? 2 + Math.random() * 2 : 10 + Math.random() * 18,
    color: COLORS[shape],
    shape,
    opacity: 0.25 + Math.random() * 0.45,
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 0.3,
  }))
}

export default function ConstructionScene3D({ style }: { style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const itemsRef  = useRef<FloatingItem[]>(makeItems())
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width: W, height: H } = canvas
      ctx.clearRect(0, 0, W, H)

      // Stars background
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5) % 100) / 100 * W
        const sy = ((i * 97.3)  % 100) / 100 * H
        const sr = 0.6 + (i % 3) * 0.4
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
      }

      // Gold sparkles
      ctx.fillStyle = 'rgba(200,149,32,0.5)'
      for (let i = 0; i < 18; i++) {
        const px = ((i * 61.8 + performance.now() * 0.005 * (i % 3 === 0 ? 1 : -0.7)) % 100) / 100 * W
        const py = ((i * 43.1 + performance.now() * 0.004) % 100) / 100 * H
        ctx.beginPath()
        ctx.arc(px, py, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }

      const items = itemsRef.current
      items.forEach(item => {
        // Move
        item.x += item.vx
        item.y += item.vy
        item.rotation += item.vr
        if (item.x < -5)  item.x = 105
        if (item.x > 105) item.x = -5
        if (item.y < -5)  item.y = 105
        if (item.y > 105) item.y = -5

        const px = item.x / 100 * W
        const py = item.y / 100 * H
        const s  = item.size * item.z

        ctx.save()
        ctx.globalAlpha = item.opacity * item.z
        ctx.translate(px, py)
        ctx.rotate(item.rotation * Math.PI / 180)

        if (item.shape === 'brick') {
          ctx.fillStyle = item.color
          ctx.beginPath()
          ctx.roundRect(-s * 1.1, -s * 0.45, s * 2.2, s * 0.9, 2)
          ctx.fill()
          // mortar lines
          ctx.strokeStyle = 'rgba(0,0,0,0.15)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(-s * 0.3, -s * 0.45)
          ctx.lineTo(-s * 0.3,  s * 0.45)
          ctx.moveTo( s * 0.4, -s * 0.45)
          ctx.lineTo( s * 0.4,  s * 0.45)
          ctx.stroke()
        } else if (item.shape === 'bag') {
          ctx.fillStyle = item.color
          ctx.beginPath()
          ctx.roundRect(-s * 0.45, -s * 0.75, s * 0.9, s * 1.5, 4)
          ctx.fill()
          // SFMC label
          ctx.fillStyle = '#C89520'
          ctx.beginPath()
          ctx.roundRect(-s * 0.38, -s * 0.1, s * 0.76, s * 0.38, 2)
          ctx.fill()
          // neck
          ctx.fillStyle = '#bfb8ae'
          ctx.beginPath()
          ctx.ellipse(0, -s * 0.8, s * 0.18, s * 0.12, 0, 0, Math.PI * 2)
          ctx.fill()
        } else if (item.shape === 'rod') {
          const len = s * 22
          const w   = Math.max(2, s * 0.55)
          const grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0)
          grad.addColorStop(0,   'rgba(143,160,176,0.6)')
          grad.addColorStop(0.5, 'rgba(200,215,230,0.9)')
          grad.addColorStop(1,   'rgba(143,160,176,0.6)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.roundRect(-len / 2, -w / 2, len, w, w / 2)
          ctx.fill()
        } else {
          // stone cluster
          for (let k = 0; k < 5; k++) {
            const ox = Math.sin(k * 1.3) * s * 0.6
            const oy = Math.cos(k * 1.1) * s * 0.5
            const r  = s * (0.28 + (k % 2) * 0.14)
            ctx.fillStyle = k % 2 === 0 ? '#c8a870' : '#b89860'
            ctx.beginPath()
            ctx.arc(ox, oy, r, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        ctx.restore()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
    />
  )
}
