'use client'

import { Center, Float, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { Mesh } from 'three'

/** Rotating placeholder shown until a tool ships its own 3D logo. */
function PlaceholderLogo({ color }: { color: string }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4
      meshRef.current.rotation.y += delta * 0.6
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          metalness={0.6}
          roughness={0.25}
          flatShading
        />
      </mesh>
    </Float>
  )
}

/** Loads a tool's own GLB logo once its path is set in the config. */
function GltfLogo({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
      <Center>
        <primitive object={cloned} scale={1.6} />
      </Center>
    </Float>
  )
}

interface ToolLogoViewerProps {
  logoUrl?: string
  color: string
}

export function ToolLogoViewer({ logoUrl, color }: ToolLogoViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.8} />
      <pointLight position={[-2, -1, 2]} intensity={6} color={color} />
      <Suspense fallback={null}>
        {logoUrl ? <GltfLogo url={logoUrl} /> : <PlaceholderLogo color={color} />}
      </Suspense>
    </Canvas>
  )
}
