import React, { useMemo, useRef, useContext, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeContext } from '../App';
import { TreeState } from '../types';

interface RibbonProps {
  count?: number; // Segments per ribbon
  color: string;
  radiusOffset: number; // To layer ribbons
  speedOffset: number;
  startAngle: number;
}

const tempObj = new THREE.Object3D();

// Individual Ribbon Strand Component
const RibbonStrand: React.FC<RibbonProps> = ({ count = 400, color, radiusOffset, speedOffset, startAngle }) => {
  const { state } = useContext(TreeContext);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Generate Geometry Data for the Ribbon path
  const data = useMemo(() => {
    const items = [];
    const treeHeight = 12;
    const maxRadius = 5.2 + radiusOffset; // Sit on top of ornaments

    for (let i = 0; i < count; i++) {
      // Progress along the ribbon (0 to 1)
      const t = i / count;
      
      // --- Target Position (Spiral) ---
      // Height goes bottom to top
      const y = t * treeHeight;
      
      // Radius narrows as we go up
      const rAtHeight = maxRadius * (1 - y / (treeHeight + 1));
      
      // Angle: 4 full rotations (8 * PI) + start offset
      const angle = t * Math.PI * 8 + startAngle;
      
      const tx = rAtHeight * Math.cos(angle);
      const ty = y;
      const tz = rAtHeight * Math.sin(angle);
      
      const targetPos = new THREE.Vector3(tx, ty, tz);

      // Rotation: Look at the next point to form a continuous line
      // Calculate tangent roughly
      const nextT = (i + 1) / count;
      const nextY = nextT * treeHeight;
      const nextR = maxRadius * (1 - nextY / (treeHeight + 1));
      const nextAngle = nextT * Math.PI * 8 + startAngle;
      const nextPos = new THREE.Vector3(
        nextR * Math.cos(nextAngle),
        nextY,
        nextR * Math.sin(nextAngle)
      );
      
      const lookAtMat = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0); 
      // Actually we want the ribbon flat against the cone surface.
      // Normal to cone surface roughly: (x, 0, z) normalized
      const normal = new THREE.Vector3(tx, 0, tz).normalize();
      
      // We calculate a rotation that orients the segment along the path, with 'up' facing out
      // Using LookAt helper logic manually or via Object3D
      const dummy = new THREE.Object3D();
      dummy.position.copy(targetPos);
      dummy.lookAt(nextPos);
      // Adjust roll to face outward
      // This is a simplification; for perfect ribbons we'd need Frenet-Serret frames, 
      // but simple lookAt + tilt often works for chaos animations.
      
      const targetRot = dummy.rotation.clone();

      // --- Chaos Position ---
      const rChaos = 20 * Math.cbrt(Math.random());
      const thetaChaos = Math.random() * 2 * Math.PI;
      const phiChaos = Math.acos(2 * Math.random() - 1);
      
      const cx = rChaos * Math.sin(phiChaos) * Math.cos(thetaChaos);
      const cy = rChaos * Math.sin(phiChaos) * Math.sin(thetaChaos) + 6;
      const cz = rChaos * Math.cos(phiChaos);
      
      items.push({
        chaosPos: new THREE.Vector3(cx, cy, cz),
        targetPos: targetPos,
        targetRot: targetRot,
        chaosRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI),
        speed: Math.random() * 0.5 + 0.5 + speedOffset,
      });
    }
    return items;
  }, [count, radiusOffset, startAngle, speedOffset]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    
    const isFormed = state === TreeState.FORMED;

    data.forEach((d, i) => {
      meshRef.current!.getMatrixAt(i, tempObj.matrix);
      tempObj.matrix.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);

      const targetP = isFormed ? d.targetPos : d.chaosPos;
      
      // Lerp Position
      tempObj.position.lerp(targetP, delta * d.speed);

      // Rotation handling
      if (isFormed) {
          // Smoothly rotate to target orientation
          const q = new THREE.Quaternion().setFromEuler(d.targetRot);
          tempObj.quaternion.slerp(q, delta * d.speed);
      } else {
          // Spin in chaos
          tempObj.rotation.x += delta * 0.5;
          tempObj.rotation.z += delta * 0.5;
      }
      
      // Slight scale pop
      tempObj.scale.setScalar(1.0);

      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Flattened box to look like a ribbon segment */}
      <boxGeometry args={[0.15, 0.02, 0.4]} /> 
      <meshStandardMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.6} 
        emissive={color}
        emissiveIntensity={0.2}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

const Ribbons: React.FC = () => {
  return (
    <group>
      {/* Red Ribbon */}
      <RibbonStrand 
        color="#8a0000" 
        count={300} 
        radiusOffset={0.3} 
        startAngle={0} 
        speedOffset={0.2} 
      />
      {/* Gold Ribbon */}
      <RibbonStrand 
        color="#FFD700" 
        count={300} 
        radiusOffset={0.35} 
        startAngle={Math.PI} 
        speedOffset={0.0} 
      />
    </group>
  );
};

export default Ribbons;