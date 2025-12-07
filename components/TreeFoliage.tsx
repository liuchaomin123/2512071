import React, { useMemo, useRef, useContext } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeContext } from '../App';
import { TreeState } from '../types';

// Custom Shader Material for High Performance Particles
const FoliageMaterial = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress; // 0.0 to 1.0
    
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;

    // Cubic easing for luxury feel
    float easeOutCubic(float x) {
        return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      // Calculate local progress based on randomness to desynchronize particles
      // Determine if we are expanding or contracting
      float t = uProgress;
      
      // Add "silky" delay based on height (aTargetPos.y) and random factor
      float delay = aRandom * 0.5;
      float activation = smoothstep(0.0 + delay, 1.0, t * (1.0 + delay));
      
      float eased = easeOutCubic(activation);

      vec3 newPos = mix(aChaosPos, aTargetPos, eased);

      // Add "breathing" or wind effect when formed
      float wind = sin(uTime * 2.0 + newPos.y * 0.5 + aRandom * 10.0) * 0.05 * activation;
      newPos.x += wind;
      newPos.z += wind;

      vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
      
      // Size attenuation
      gl_PointSize = (15.0 * aRandom + 5.0) * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Color Mixing: Deep Emerald to Gold tips
      vec3 colorDeep = vec3(0.0, 0.26, 0.15); // Emerald
      vec3 colorLight = vec3(0.1, 0.4, 0.1); // Leaf Green
      vec3 colorGold = vec3(1.0, 0.84, 0.0); // Gold
      
      vec3 baseColor = mix(colorDeep, colorLight, aRandom);
      
      // Sparkle gold occasionally
      float sparkle = sin(uTime * 5.0 + aRandom * 100.0);
      if (sparkle > 0.98) {
         vColor = mix(baseColor, colorGold, 0.8);
      } else {
         vColor = baseColor;
      }
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    
    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;
      
      // Soft edge
      float alpha = 1.0 - smoothstep(0.3, 0.5, ll);
      
      gl_FragColor = vec4(vColor, alpha);
    }
  `
};

interface Props {
  count: number;
}

const TreeFoliage: React.FC<Props> = ({ count }) => {
  const { state } = useContext(TreeContext);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate Geometry Data
  const { positions, chaosPositions, targetPositions, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const chaosPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    const treeHeight = 12;
    const maxRadius = 5;

    for (let i = 0; i < count; i++) {
      // Random (Chaos) - Sphere
      const r = 15 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta) + 5; // Lift up a bit
      const cz = r * Math.cos(phi);

      chaosPositions[i * 3] = cx;
      chaosPositions[i * 3 + 1] = cy;
      chaosPositions[i * 3 + 2] = cz;

      // Initial buffer position (starts at Chaos)
      positions[i * 3] = cx;
      positions[i * 3 + 1] = cy;
      positions[i * 3 + 2] = cz;

      // Target (Tree) - Cone with volume
      // Height varies from 0 to treeHeight
      const y = Math.random() * treeHeight;
      // Radius at this height
      const coneRadius = maxRadius * (1 - y / treeHeight);
      // Random radius within the volume at this height (to fill tree, not just shell)
      const rad = coneRadius * Math.sqrt(Math.random());
      const ang = Math.random() * 2 * Math.PI;

      const tx = rad * Math.cos(ang);
      const ty = y;
      const tz = rad * Math.sin(ang);

      targetPositions[i * 3] = tx;
      targetPositions[i * 3 + 1] = ty;
      targetPositions[i * 3 + 2] = tz;

      randoms[i] = Math.random();
    }

    return { positions, chaosPositions, targetPositions, randoms };
  }, [count]);

  // Animation Loop
  useFrame((stateThree, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = stateThree.clock.elapsedTime;
      
      const targetProgress = state === TreeState.FORMED ? 1.0 : 0.0;
      // Smooth interpolation of the uniform itself
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        targetProgress,
        delta * 2.0 // Speed of global morph
      );
    }
  });

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
          attach="attributes-aChaosPos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={targetPositions.length / 3}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={FoliageMaterial.vertexShader}
        fragmentShader={FoliageMaterial.fragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
      />
    </points>
  );
};

export default TreeFoliage;