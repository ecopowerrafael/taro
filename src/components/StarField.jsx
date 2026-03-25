import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function StarField() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) {
      return undefined
    }

    if (!THREE.WebGLRenderer) {
      console.warn('WebGLRenderer não disponível no THREE. StarField desativado.')
      return undefined
    }

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.warn('WebGL não disponível no navegador. StarField desativado.')
      return undefined
    }

    let scene
    let camera
    let renderer
    let stars
    let starGeometry
    let starMaterial
    let frameId = null

    try {
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000,
      )
      camera.position.z = 6

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setSize(container.clientWidth, container.clientHeight)
      container.appendChild(renderer.domElement)

      const starsCount = 1400
      starGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(starsCount * 3)

      for (let index = 0; index < starsCount; index += 1) {
        const i = index * 3
        positions[i] = (Math.random() - 0.5) * 30
        positions[i + 1] = (Math.random() - 0.5) * 30
        positions[i + 2] = (Math.random() - 0.5) * 30
      }
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      starMaterial = new THREE.PointsMaterial({
        color: '#E5E7EB',
        size: 0.03,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      stars = new THREE.Points(starGeometry, starMaterial)
      scene.add(stars)

      const mouse = { x: 0, y: 0 }
      const target = { x: 0, y: 0 }

      const onMouseMove = (event) => {
        const x = event.clientX / window.innerWidth - 0.5
        const y = event.clientY / window.innerHeight - 0.5
        target.x = x * 0.45
        target.y = -y * 0.45
      }

      const onDeviceOrientation = (event) => {
        const gamma = Math.max(-45, Math.min(45, event.gamma ?? 0))
        const beta = Math.max(-45, Math.min(45, event.beta ?? 0))
        target.x = (gamma / 45) * 0.35
        target.y = -(beta / 45) * 0.35
      }

      const onResize = () => {
        if (!container || !camera || !renderer) return
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      }

      const animate = () => {
        frameId = window.requestAnimationFrame(animate)
        mouse.x += (target.x - mouse.x) * 0.04
        mouse.y += (target.y - mouse.y) * 0.04

        camera.position.x = mouse.x
        camera.position.y = mouse.y
        camera.lookAt(scene.position)

        stars.rotation.y += 0.00035
        stars.rotation.x += 0.00015

        renderer.render(scene, camera)
      }

      window.addEventListener('mousemove', onMouseMove, { passive: true })
      window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true })
      window.addEventListener('resize', onResize)

      animate()

      return () => {
        if (frameId) window.cancelAnimationFrame(frameId)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('deviceorientation', onDeviceOrientation)
        window.removeEventListener('resize', onResize)
        starGeometry?.dispose()
        starMaterial?.dispose()
        renderer?.dispose()
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    } catch (error) {
      console.error('StarField falhou na inicialização:', error)
      starGeometry?.dispose()
      starMaterial?.dispose()
      renderer?.dispose()
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      return undefined
    }
  }, [])

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-0 opacity-55" aria-hidden />
}
