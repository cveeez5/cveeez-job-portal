'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({
  position,
  scale,
  color,
  speed,
  distort,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  distort: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={distort}
          speed={2}
          roughness={0.5}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 200;
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#22c55e"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#22c55e" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#4ade80" />

      <FloatingShape
        position={[-3, 2, -5]}
        scale={1.5}
        color="#22c55e"
        speed={1.2}
        distort={0.4}
      />
      <FloatingShape
        position={[3, -1, -3]}
        scale={1}
        color="#4ade80"
        speed={0.8}
        distort={0.3}
      />
      <FloatingShape
        position={[0, 3, -6]}
        scale={2}
        color="#10b981"
        speed={0.5}
        distort={0.5}
      />
      <FloatingShape
        position={[-4, -2, -4]}
        scale={0.8}
        color="#059669"
        speed={1.5}
        distort={0.35}
      />
      <FloatingShape
        position={[4, 1, -7]}
        scale={1.8}
        color="#34d399"
        speed={0.6}
        distort={0.45}
      />

      <ParticleField />
    </>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a]/95 to-[#0f172a] z-10 pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f172a] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
