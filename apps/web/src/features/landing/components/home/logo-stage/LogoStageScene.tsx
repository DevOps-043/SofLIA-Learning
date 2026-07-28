'use client'

import {
  Center,
  Environment,
  Float,
  Lightformer,
  PresentationControls,
  Resize,
  useGLTF,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, type ReactNode } from 'react'
import { Group } from 'three'
import { MODEL_URL } from './ecosystem-tools.config'

function ClonedModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url)
  // Clone per canvas: a THREE object can only live in one scene graph. The
  // built-in recursive clone shares geometry/material refs (no duplicate GPU
  // buffers), which is all these static, non-skinned models need.
  const cloned = useMemo(() => scene.clone(true), [scene])
  return <primitive object={cloned} scale={scale} />
}

useGLTF.preload(MODEL_URL)

function StageLights({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <pointLight position={[-3, -1, 3]} intensity={10} color={accent} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.7} position={[2, 3, 4]} scale={[4, 4, 1]} />
        <Lightformer intensity={1} color={accent} position={[-3, -1, 2]} scale={[3, 3, 1]} />
        <Lightformer intensity={1.2} position={[0, -3, -4]} scale={[6, 2, 1]} />
      </Environment>
    </>
  )
}

/** Continuous slow spin around Y — used only in the hero. */
function AutoRotate({ children }: { children: ReactNode }) {
  const groupRef = useRef<Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.25
  })
  return <group ref={groupRef}>{children}</group>
}

const CANVAS_PROPS = {
  dpr: [1, 2] as [number, number],
  performance: { min: 0.6 },
  gl: { antialias: true, alpha: true, powerPreference: 'high-performance' as const },
}

/** Hero logo: front-facing, auto-rotating, and draggable with the cursor. */
export function HeroLogoScene({ accent }: { accent: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 7.2], fov: 42 }} {...CANVAS_PROPS}>
      <Suspense fallback={null}>
        <StageLights accent={accent} />
        <PresentationControls
          global
          cursor
          snap={false}
          speed={1.6}
          polar={[-0.4, 0.4]}
          azimuth={[-Infinity, Infinity]}
          damping={0.15}
        >
          <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.4}>
            <AutoRotate>
              <Center>
                <ClonedModel url={MODEL_URL} scale={2.2} />
              </Center>
            </AutoRotate>
          </Float>
        </PresentationControls>
      </Suspense>
    </Canvas>
  )
}

/**
 * Ecosystem logo: static and front-facing. Shows the SofLIA molecule by
 * default, or the selected tool's own 3D logo when `logoUrl` is set. `Resize`
 * normalizes any model to a fixed on-screen size (so nothing is cut off and
 * every tool logo reads at the same scale, regardless of its native units).
 * The `key` forces a clean remount on model change — no stale frame.
 */
export function EcosystemLogoScene({
  logoUrl,
  accent,
}: {
  logoUrl?: string
  accent: string
}) {
  const url = logoUrl ?? MODEL_URL

  return (
    <Canvas camera={{ position: [0, 0, 5.4], fov: 42 }} {...CANVAS_PROPS}>
      <Suspense fallback={null}>
        <StageLights accent={accent} />
        <group key={url}>
          <Center>
            <Resize scale={3}>
              <ClonedModel url={url} />
            </Resize>
          </Center>
        </group>
      </Suspense>
    </Canvas>
  )
}
