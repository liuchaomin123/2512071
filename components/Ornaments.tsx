import React, { useMemo, useRef, useContext, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeContext } from '../App';
import { TreeState, ParticleData } from '../types';

interface Props {
  count: number;
}

const tempObj = new THREE.Object3D();
const tempVec = new THREE.Vector3();

const Ornaments: React.FC<Props> = ({ count }) => {
  const { state } = useContext(TreeContext);
  
  // Refs for Instanced Meshes
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate Data
  const data = useMemo(() => {
    const items: ParticleData[] = [];
    const treeHeight = 12;
    const maxRadius = 5.2; // Slightly larger than foliage

    const colors = [
        new THREE.Color('#D4AF37'), // Gold
        new THREE.Color('#800000'), // Deep Red
        new THREE.Color('#C0C0C0'), // Silver
        new THREE.Color('#FF0000'), // Bright Red
    ];

    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 20 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta) + 10;
      const cz = r * Math.cos(phi);

      // Target (Surface of cone)
      const y = Math.random() * treeHeight;
      const coneRadius = maxRadius * (1 - y / treeHeight);
      const ang = Math.random() * 2 * Math.PI;
      
      // Push out slightly to sit ON the leaves
      const tx = (coneRadius + 0.2) * Math.cos(ang);
      const ty = y;
      const tz = (coneRadius + 0.2) * Math.sin(ang);

      const scale = Math.random() * 0.4 + 0.1;

      items.push({
        id: i,
        chaosPos: new THREE.Vector3(cx, cy, cz),
        targetPos: new THREE.Vector3(tx, ty, tz),
        speed: Math.random() * 0.5 + 0.5, // "Weight"
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.2 ? 'ball' : 'box',
        scale,
        rotationOffset: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      });
    }
    return items;
  }, [count]);

  // Set initial colors
  useLayoutEffect(() => {
    if (meshRef.current) {
        data.forEach((d, i) => {
            meshRef.current!.setColorAt(i, d.color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  // Animation Frame
  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const isFormed = state === TreeState.FORMED;
    
    // We update every instance
    data.forEach((d, i) => {
      // Current logical position
      // In a real physics engine we'd track current position. 
      // Here we interp based on time/progress.
      
      // We need to maintain state "between" frames to allow different speeds.
      // But for stateless optimization, we can just lerp a "global progress" adjusted by local speed.
      // However, true "Heavy" vs "Light" feel requires dampening.
      // Let's rely on CSS-like lerp logic: current = lerp(current, target, factor).
      
      // Retrieve current transform to get position
      meshRef.current!.getMatrixAt(i, tempObj.matrix);
      tempObj.matrix.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);
      
      const target = isFormed ? d.targetPos : d.chaosPos;
      
      // LERP factor based on 'speed' (weight). Heavier = slower (lower speed value)
      // Actually, lighter objects fly faster? Let's say speed is the lerp factor.
      const factor = delta * d.speed * 2.0; 
      
      tempObj.position.lerp(target, factor);
      
      // Rotate decoration
      if (isFormed) {
          tempObj.rotation.x = Math.sin(stateThree.clock.elapsedTime + d.id) * 0.1 + d.rotationOffset.x;
          tempObj.rotation.y += delta * 0.5;
      } else {
          tempObj.rotation.x += delta;
          tempObj.rotation.z += delta;
      }
      
      tempObj.scale.setScalar(d.scale);

      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        emissive="#330000"
        emissiveIntensity={0.2}
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
};

export default Ornaments;