import React, { useRef, useContext, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { TreeContext } from '../App';
import { TreeState } from '../types';

const TopStar: React.FC = () => {
  const { state } = useContext(TreeContext);
  const groupRef = useRef<THREE.Group>(null);
  
  // Coordinates
  const chaosPos = useMemo(() => new THREE.Vector3(0, 6, 0), []);
  const targetPos = useMemo(() => new THREE.Vector3(0, 13, 0), []);

  // Create the 5-point star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.2;
    const innerRadius = 0.5;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.02, // Extremely thin core
      bevelEnabled: true,
      bevelThickness: 0.05, // Subtle bevel for light catching
      bevelSize: 0.05,
      bevelSegments: 2, // Smoother bevel
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useMemo(() => {
    starGeometry.center();
  }, [starGeometry]);

  useFrame((stateThree, delta) => {
    if (!groupRef.current) return;

    const target = state === TreeState.FORMED ? targetPos : chaosPos;
    
    // Smooth Lerp Position
    groupRef.current.position.lerp(target, delta * 1.5);
    
    // Constant rotation for brilliance
    groupRef.current.rotation.y += delta * 0.5;
    
    // Dynamic Scale
    const time = stateThree.clock.elapsedTime;
    const pulse = Math.sin(time * 2) * 0.1;
    
    const targetScale = state === TreeState.FORMED ? 1.0 : 1.5;
    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale + pulse, delta * 2);
    
    groupRef.current.scale.setScalar(nextScale);

    if (state === TreeState.CHAOS) {
        groupRef.current.rotation.z += delta * 0.5;
        groupRef.current.rotation.x += delta * 0.2;
    } else {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 2);
    }
  });

  return (
    <group ref={groupRef} position={chaosPos.toArray()}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh geometry={starGeometry}>
                <meshStandardMaterial 
                    color="#FFD700" 
                    emissive="#996515"
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={1.0}
                    envMapIntensity={2.0}
                />
            </mesh>
             <pointLight distance={10} intensity={80} color="#ffaa00" decay={2} />
        </Float>
    </group>
  );
};

export default TopStar;