// The ONLY module that imports three/@react-three/fiber — kept behind
// React.lazy so the 3D bundle ships as a separate async chunk.
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField({ count, radius, color, size, speed }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Points in a spherical shell so the cloud has visible depth
      const r = radius * (0.55 + 0.45 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed;
      ref.current.rotation.x += delta * speed * 0.35;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function WireCore() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.12;
      ref.current.rotation.z += delta * 0.05;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.1, 1]} />
      <meshBasicMaterial color="#4f6bff" wireframe transparent opacity={0.28} />
    </mesh>
  );
}

// Mouse parallax: gently steer the whole scene toward the pointer.
function ParallaxRig() {
  const group = useRef();
  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    const targetX = pointer.y * 0.22;
    const targetY = pointer.x * 0.35;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.5, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 2.5, delta);
  });
  return (
    <group ref={group}>
      <ParticleField count={900} radius={7.5} color="#22d3ee" size={0.045} speed={0.045} />
      <ParticleField count={500} radius={5.5} color="#6f86ff" size={0.06} speed={-0.03} />
      <WireCore />
    </group>
  );
}

export default function HeroScene({ active = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ParallaxRig />
    </Canvas>
  );
}
