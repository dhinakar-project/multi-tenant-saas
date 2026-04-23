import React, { useEffect, useRef } from 'react'

/**
 * Native Canvas bar chart — no external library dependency.
 * Renders a responsive bar chart for ticket metrics.
 */
export default function AnalyticsChart({ data = [], label = 'Tickets', color = '#7c3aed' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // High-DPI canvas
    const cssW = canvas.offsetWidth
    const cssH = canvas.offsetHeight
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)

    const W = cssW
    const H = cssH
    const pad = { top: 24, right: 16, bottom: 40, left: 48 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    ctx.clearRect(0, 0, W, H)

    const maxVal = Math.max(...data.map(d => d.value), 1)
    const barW = Math.max(8, (chartW / data.length) * 0.55)
    const gap = chartW / data.length

    // Draw grid lines
    const gridLines = 4
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + chartH - (i / gridLines) * chartH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + chartW, y)
      ctx.stroke()

      // Y-axis labels
      ctx.fillStyle = 'rgba(148,163,184,0.5)'
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(Math.round((i / gridLines) * maxVal), pad.left - 6, y + 3)
    }

    // Draw bars with gradient fill
    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH
      const x = pad.left + i * gap + gap / 2 - barW / 2
      const y = pad.top + chartH - barH

      // Gradient
      const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH)
      grad.addColorStop(0, color)
      grad.addColorStop(1, color + '33')

      // Rounded top bar
      const radius = Math.min(6, barW / 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barW - radius, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
      ctx.lineTo(x + barW, y + barH)
      ctx.lineTo(x, y + barH)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Glow under bar
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0

      // Value label on top
      if (d.value > 0) {
        ctx.fillStyle = '#f1f5f9'
        ctx.font = `bold 10px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(d.value, x + barW / 2, y - 6)
      }

      // X-axis label
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW / 2, pad.top + chartH + 16)
    })

    // Chart label
    ctx.fillStyle = 'rgba(148,163,184,0.4)'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label, pad.left, pad.top - 8)
  }, [data, color, label])

  if (data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
        No data to display yet
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 220, display: 'block' }}
    />
  )
}
