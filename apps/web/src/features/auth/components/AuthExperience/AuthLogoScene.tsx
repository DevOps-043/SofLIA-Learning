'use client';

import { Center, Float, PresentationControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Group } from 'three';

const MODEL_URL = '/soflia3d.web.glb';

function SofliaModel() {
  const { scene } = useGLTF(MODEL_URL);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  return <primitive object={clonedScene} scale={2.15} />;
}

function SlowRotation({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (enabled && groupRef.current) groupRef.current.rotation.y += delta * 0.18;
  });

  return <group ref={groupRef}>{children}</group>;
}

export function AuthLogoScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const model = (
    <SlowRotation enabled={!reducedMotion}>
      <Center>
        <SofliaModel />
      </Center>
    </SlowRotation>
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.55 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 5]} intensity={2.1} />
        <directionalLight position={[-4, -2, 3]} intensity={1.15} color="rgb(4, 217, 189)" />
        <pointLight position={[0, 0, 4]} intensity={7} color="rgb(0, 205, 179)" />
        <PresentationControls
          global
          cursor
          snap={false}
          speed={1.35}
          polar={[-0.48, 0.48]}
          azimuth={[-Infinity, Infinity]}
          damping={0.16}
        >
          {reducedMotion ? (
            model
          ) : (
            <Float speed={1.05} rotationIntensity={0.07} floatIntensity={0.34}>
              {model}
            </Float>
          )}
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}
