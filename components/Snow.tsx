import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Snow: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 3000; // Number of snowflakes
  const height = 50; // Fall range before wrapping

  const { positions, speeds, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across a large area
      positions[i * 3] = (Math.random() - 0.5) * 60; // X
      positions[i * 3 + 1] = (Math.random() - 0.5) * height; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60; // Z

      // Variable fall speed
      speeds[i] = 2 + Math.random() * 3;
      randoms[i] = Math.random();
    }
    return { positions, speeds, randoms };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHeight: { value: height },
  }), [height]);

  useFrame((state) => {
    if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
        pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const shaderArgs = useMemo(() => ({
    uniforms: uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uHeight;
      attribute float aSpeed;
      attribute float aRandom;
      
      void main() {
        vec3 pos = position;
        
        // Falling logic: initial Y - distance traveled
        float fallOffset = uTime * aSpeed;
        
        // Wrap Y position within range [0, uHeight]
        // Add large offset to keep positive
        float currentY = pos.y - fallOffset;
        currentY = mod(currentY + 1000.0 * uHeight, uHeight);
        
        // Recenter around 0
        pos.y = currentY - uHeight * 0.5;

        // Horizontal sway (Wind effect)
        float sway = sin(uTime * 0.5 + aRandom * 10.0) * 0.5;
        pos.x += sway;
        pos.z += cos(uTime * 0.3 + aRandom * 20.0) * 0.3;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Size attenuation
        gl_PointSize = (12.0 * aRandom + 4.0) * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      void main() {
        // Soft circular particle
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if (ll > 0.5) discard;
        
        // Soft gradient alpha
        float alpha = 1.0 - smoothstep(0.0, 0.5, ll);
        
        // White snow with slight transparency
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.7); 
      }
    `,
    transparent: true,
    depthWrite: false,
  }), [uniforms]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
        />
        <bufferAttribute
            attach="attributes-aSpeed"
            count={speeds.length}
            array={speeds}
            itemSize={1}
        />
        <bufferAttribute
            attach="attributes-aRandom"
            count={randoms.length}
            array={randoms}
            itemSize={1}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <shaderMaterial args={[shaderArgs]} />
    </points>
  );
}

export default Snow;