import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Colors } from '../constants/theme';

export interface InteractiveGlobeProps {
  isDarkTheme?: boolean;
}

const Globe = ({ isDarkTheme }: { isDarkTheme: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const theme = isDarkTheme ? Colors.dark : Colors.light;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15; // Slow ambient rotation
      meshRef.current.rotation.x = 0.2; // Slight tilt
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* 64 segments for a premium, smooth sphere */}
      <sphereGeometry args={[2.5, 64, 64]} />
      {/* Material mimicking a digital Moleskine or earthy globe */}
      <meshStandardMaterial 
        color={theme.surfaceElevated} 
        roughness={0.7}
        metalness={0.2}
        wireframe={true} 
      />
      
      {/* Pin 1: Rome */}
      <mesh position={[2.5, 0.5, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={theme.tint} />
      </mesh>
      
      {/* Pin 2: Tokyo */}
      <mesh position={[-2.1, 1.0, -1.0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={theme.tintSecondary} />
      </mesh>
      
      {/* Pin 3: New York */}
      <mesh position={[0.5, 1.5, 2.0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={theme.success} />
      </mesh>
    </mesh>
  );
};

export const InteractiveGlobe = ({ isDarkTheme = false }: InteractiveGlobeProps) => {
  const theme = isDarkTheme ? Colors.dark : Colors.light;

  return (
    <View style={styles.container} testID="globe-container">
      <Canvas testID="three-canvas">
        <ambientLight intensity={0.6} color={theme.background} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          color={theme.tint} 
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.5} 
          color={theme.tintSecondary} 
        />
        <Globe isDarkTheme={isDarkTheme} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 350,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default InteractiveGlobe;
