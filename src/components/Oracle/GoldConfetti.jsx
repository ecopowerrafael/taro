import React, { useEffect, useRef } from 'react'

// Simples confetti de ouro SVG animado (não usa libs externas)
export function GoldConfetti({ trigger }) {
  const ref = useRef()
  useEffect(() => {
    if (!trigger) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = window.innerWidth
    const H = canvas.height = window.innerHeight
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * 60,
      r: 4 + Math.random() * 6,
      d: 2 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#ffe066' : '#bfa14a',
      tilt: Math.random() * 10,
      tiltAngle: 0,
      tiltAngleInc: 0.05 + Math.random() * 0.07
    }))
    let frame = 0
    let running = true
    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (let p of particles) {
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.5, p.tilt, 0, 2 * Math.PI)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.7
        ctx.shadowColor = '#ffe066'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      }
    }
    function update() {
      for (let p of particles) {
        p.y += p.d + Math.sin(frame / 8 + p.x / 80)
        p.x += Math.sin(frame / 12 + p.tilt) * 1.2
        p.tilt += p.tiltAngleInc
      }
    }
    function loop() {
      if (!running) return
      frame++
      update()
      draw()
      if (frame < 90) requestAnimationFrame(loop)
      else running = false
    }
    loop()
    return () => { running = false }
  }, [trigger])
  return (
    <canvas ref={ref} style={{
      position: 'fixed',
      left: 0, top: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999,
      transition: 'opacity 0.7s',
      opacity: trigger ? 1 : 0
    }} width={window.innerWidth} height={window.innerHeight} />
  )
}
