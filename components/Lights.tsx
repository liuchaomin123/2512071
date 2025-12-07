import React, { useMemo, useRef, useContext } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeContext } from '../App';
import { TreeState } from '../types';

const LightsMaterial = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aBlinkOffset;
    attribute float aBlinkSpeed;
    
    varying float vAlpha;

    // Cubic easing
    float easeOutCubic(float x) {
        return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      float t = uProgress;
      
      // Delay based on height for a sweeping effect
      float delay = aTargetPos.y * 0.05; 
      float activation = smoothstep(0.0, 1.0, (t * 1.5) - delay);
      float eased = easeOutCubic(clamp(activation, 0.0, 1.0));

      vec3 newPos = mix(aChaosPos, aTargetPos, eased);

      // Gentle movement in wind
      if (t > 0.8) {
        newPos.x += sin(uTime + newPos.y) * 0.02;
        newPos.z += cos(uTime + newPos.y) * 0.02;
      }

      vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
      
      gl_PointSize = (25.0) * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Twinkle logic
      // Base glow + sine wave blink
      float blink = sin(uTime * aBlinkSpeed + aBlinkOffset);
      // Map -1..1 to 0.2..1.0
      float brightness = 0.6 + 0.4 * blink;
      
      vAlpha = brightness;
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    
    void main() {
      // Soft glow texture generation
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float dist = length(xy);
      
      // Sharp core, soft glow
      float core = 1.0 - smoothstep(0.0, 0.1, dist);
      float glow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      float finalAlpha = core * 0.8 + glow * 0.4;
      
      if (dist > 0.5) discard;
      
      // Warm light color #fff8e7
      vec3 lightColor = vec3(1.0, 0.97, 0.9);
      
      gl_FragColor = vec4(lightColor, finalAlpha * vAlpha);
    }
  `
};

interface Props {
  count?: number;
}

const Lights: React.FC<Props> = ({ count = 600 }) => {
  const { state } = useContext(TreeContext);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, chaosPositions, targetPositions, blinkOffsets, blinkSpeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const chaosPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const blinkOffsets = new Float32Array(count);
    const blinkSpeeds = new Float32Array(count);

    const treeHeight = 12;
    const maxRadius = 5.3; // Slightly outside foliage

    for (let i = 0; i < count; i++) {
        // Chaos
        const r = 25 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 8;
        chaosPositions[i * 3 + 2] = r * Math.cos(phi);

        // Target: Surface of cone
        const y = Math.random() * treeHeight;
        const coneRadius = maxRadius * (1 - y / treeHeight);
        const ang = Math.random() * 2 * Math.PI;
        
        // Push slightly further out than ornaments
        const tx = (coneRadius + 0.1) * Math.cos(ang);
        const ty = y;
        const tz = (coneRadius + 0.1) * Math.sin(ang);

        targetPositions[i * 3] = tx;
        targetPositions[i * 3 + 1] = ty;
        targetPositions[i * 3 + 2] = tz;
        
        // Initial
        positions[i*3] = chaosPositions[i*3];
        positions[i*3+1] = chaosPositions[i*3+1];
        positions[i*3+2] = chaosPositions[i*3+2];

        blinkOffsets[i] = Math.random() * 100;
        blinkSpeeds[i] = 2.0 + Math.random() * 3.0; 
    }

    return { positions, chaosPositions, targetPositions, blinkOffsets, blinkSpeeds };
  }, [count]);

  useFrame((stateThree, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = stateThree.clock.elapsedTime;
      
      const targetProgress = state === TreeState.FORMED ? 1.0 : 0.0;
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        targetProgress,
        delta * 1.5
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={chaosPositions.length/3} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={targetPositions.length/3} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aBlinkOffset" count={blinkOffsets.length} array={blinkOffsets} itemSize={1} />
        <bufferAttribute attach="attributes-aBlinkSpeed" count={blinkSpeeds.length} array={blinkSpeeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={LightsMaterial.vertexShader}
        fragmentShader={LightsMaterial.fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 }
        }}
      />
    </points>
  );
};

export default Lights;