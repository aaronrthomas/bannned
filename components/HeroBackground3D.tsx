'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShapes({ scrollProgress }: { scrollProgress: number }) {
    const groupRef = useRef<THREE.Group>(null);

    // Subtle rotation based on scroll
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y = scrollProgress * Math.PI * 0.3;
            groupRef.current.rotation.x = scrollProgress * Math.PI * 0.1;
            groupRef.current.position.y = scrollProgress * -2;
        }
    });

    const shapes = useMemo(() => [
        { pos: [-3.5, 2, -4] as [number, number, number], scale: 0.6, speed: 1.2, type: 'torus' },
        { pos: [4, -1, -5] as [number, number, number], scale: 0.5, speed: 0.8, type: 'octahedron' },
        { pos: [-2, -2.5, -3] as [number, number, number], scale: 0.4, speed: 1.5, type: 'icosahedron' },
        { pos: [3, 2.5, -6] as [number, number, number], scale: 0.7, speed: 1, type: 'dodecahedron' },
        { pos: [0, 3.5, -7] as [number, number, number], scale: 0.35, speed: 1.3, type: 'torus' },
        { pos: [-4.5, 0, -5] as [number, number, number], scale: 0.45, speed: 0.9, type: 'octahedron' },
        { pos: [5, -2.5, -4] as [number, number, number], scale: 0.3, speed: 1.6, type: 'icosahedron' },
    ], []);

    return (
        <group ref={groupRef}>
            {shapes.map((shape, i) => (
                <Float
                    key={i}
                    speed={shape.speed}
                    rotationIntensity={0.4}
                    floatIntensity={0.6}
                    floatingRange={[-0.3, 0.3]}
                >
                    <mesh position={shape.pos} scale={shape.scale}>
                        {shape.type === 'torus' && (
                            <torusGeometry args={[1, 0.35, 16, 32]} />
                        )}
                        {shape.type === 'octahedron' && (
                            <octahedronGeometry args={[1, 0]} />
                        )}
                        {shape.type === 'icosahedron' && (
                            <icosahedronGeometry args={[1, 0]} />
                        )}
                        {shape.type === 'dodecahedron' && (
                            <dodecahedronGeometry args={[1, 0]} />
                        )}
                        <meshStandardMaterial
                            color="#1a1a1a"
                            wireframe
                            transparent
                            opacity={0.04}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

export default function HeroBackground3D({ scrollProgress }: { scrollProgress: number }) {
    return (
        <div className="hero-v2-3d-bg">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={0.3} />
                <FloatingShapes scrollProgress={scrollProgress} />
            </Canvas>
        </div>
    );
}
