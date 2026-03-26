import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AppTheme } from '@/hooks/useAppTheme';

/* ── Pin component ────────────────────────────────────────── */

interface PinProps {
  position: [number, number, number];
  color: string;
  size?: number;
}

function AnimatedPin({ position, color, size = 0.08 }: PinProps) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + position[0] * 5) * 0.25;
    if (ref.current) {
      ref.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.8);
    }
  });

  return (
    <group position={position}>
      {/* Core pin */}
      <mesh ref={ref}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/* ── Atmosphere glow ──────────────────────────────────────── */

function Atmosphere({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[2.75, 64, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
    </mesh>
  );
}

/* ── Globe mesh ───────────────────────────────────────────── */

interface GlobeProps {
  theme: AppTheme;
}

function Globe({ theme }: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x = 0.15 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  const wireColor = useMemo(() => new THREE.Color(theme.teal), [theme.teal]);

  return (
    <group>
      {/* Wireframe sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 48, 48]} />
        <meshStandardMaterial
          color={theme.bgElevated}
          roughness={0.8}
          metalness={0.1}
          wireframe
        />
      </mesh>

      {/* Solid inner sphere for depth */}
      <mesh>
        <sphereGeometry args={[2.42, 48, 48]} />
        <meshStandardMaterial
          color={theme.bg}
          roughness={1}
          metalness={0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Atmosphere */}
      <Atmosphere color={theme.teal} />

      {/* Destination pins — positions on sphere surface (radius ~2.55) */}
      <AnimatedPin position={[2.3, 0.5, 1.0]} color="#FF3B30" size={0.09} />
      <AnimatedPin position={[-1.8, 1.2, -1.5]} color="#00D9FF" size={0.08} />
      <AnimatedPin position={[0.5, 1.8, 1.8]} color="#34C759" size={0.08} />
      <AnimatedPin position={[-1.0, -1.5, 1.8]} color="#FF9500" size={0.07} />
      <AnimatedPin position={[1.5, -1.2, -1.8]} color="#AF52DE" size={0.07} />
    </group>
  );
}

/* ── Main export ──────────────────────────────────────────── */

export interface InteractiveGlobeProps {
  isDarkTheme?: boolean;
  height?: number;
}

export const InteractiveGlobe = ({ height = 350 }: InteractiveGlobeProps) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { height }]} testID="globe-container">
      <Canvas testID="three-canvas">
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} color={theme.teal} />
        <directionalLight position={[-8, -6, -4]} intensity={0.3} color={theme.orange} />
        <Globe theme={theme} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default InteractiveGlobe;
