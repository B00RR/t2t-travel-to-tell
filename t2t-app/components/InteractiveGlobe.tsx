/* eslint-disable react/no-unknown-property */
// react/no-unknown-property is disabled because this file uses @react-three/fiber,
// which extends JSX with three.js-native props (position, args, intensity, roughness, metalness, etc.)
// that ESLint's react plugin does not recognize. These are NOT HTML attributes.
import React, { useRef, Component, ReactNode } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AppTheme } from '@/hooks/useAppTheme';

/* ── Error Boundary for WebGL failures ────────────────────── */

interface GlobeErrorBoundaryState {
  hasError: boolean;
}

class GlobeErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, GlobeErrorBoundaryState> {
  state: GlobeErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('InteractiveGlobe: WebGL not available, showing fallback.', error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ── Fallback when WebGL is unavailable ───────────────────── */

function GlobeFallback({ theme, height }: { theme: AppTheme; height: number }) {
  return (
    <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={[styles.fallbackCircle, { borderColor: theme.teal }]}>
        <Text style={[styles.fallbackEmoji]}>🌍</Text>
      </View>
    </View>
  );
}

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
    <GlobeErrorBoundary fallback={<GlobeFallback theme={theme} height={height} />}>
      <View style={[styles.container, { height }]} testID="globe-container">
        <Canvas testID="three-canvas">
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.0} color={theme.teal} />
          <directionalLight position={[-8, -6, -4]} intensity={0.3} color={theme.orange} />
          <Globe theme={theme} />
        </Canvas>
      </View>
    </GlobeErrorBoundary>
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
  fallbackCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 48,
  },
});

export default InteractiveGlobe;
