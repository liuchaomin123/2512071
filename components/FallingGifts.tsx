import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GiftData {
  pos: THREE.Vector3;
  velocity: number;
  rotation: THREE.Euler;
  rotSpeed: { x: number; y: number; z: number };
  landPos: THREE.Vector3;
  scale: THREE.Vector3;
  color: THREE.Color;
  landed: boolean;
  landTime: number;
  maxLandTime: number;
}

const tempObj = new THREE.Object3D();

const FallingGifts: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 80; // Number of gifts in the cycle

  const data = useMemo(() => {
    const items: GiftData[] = [];
    const colors = [
      new THREE.Color('#D4AF37'), // Gold
      new THREE.Color('#8B0000'), // Dark Red
      new THREE.Color('#2F4F4F'), // Dark Slate Gray
      new THREE.Color('#C0C0C0'), // Silver
      new THREE.Color('#FFD700'), // Bright Gold
      new THREE.Color('#FFFFFF'), // White
    ];

    for (let i = 0; i < count; i++) {
        // Target landing position (random pile around base)
        const angle = Math.random() * Math.PI * 2;
        // Radius between 2 and 7 to scatter around the tree skirt
        const radius = 2 + Math.random() * 5; 
        const landX = Math.cos(angle) * radius;
        const landZ = Math.sin(angle) * radius;
        // Slight pile height variation
        const landY = Math.random() * 1.5; 

        // Start position (high up)
        const startY = 20 + Math.random() * 40; 
        
        items.push({
            pos: new THREE.Vector3(landX, startY, landZ),
            velocity: 4 + Math.random() * 4,
            rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI),
            rotSpeed: {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
                z: (Math.random() - 0.5) * 3,
            },
            landPos: new THREE.Vector3(landX, landY, landZ),
            scale: new THREE.Vector3(
                0.4 + Math.random() * 0.4, 
                0.4 + Math.random() * 0.4, 
                0.4 + Math.random() * 0.4
            ),
            color: colors[Math.floor(Math.random() * colors.length)],
            landed: false,
            landTime: 0,
            // Gifts stay on ground for 10-20 seconds before recycling
            maxLandTime: 10 + Math.random() * 10, 
        });
    }
    return items;
  }, [count]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        data.forEach((d, i) => {
            meshRef.current!.setColorAt(i, d.color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
      if (!meshRef.current) return;

      data.forEach((d, i) => {
          if (!d.landed) {
             // Fall logic
             d.pos.y -= d.velocity * delta;
             
             // Rotate while falling
             d.rotation.x += d.rotSpeed.x * delta;
             d.rotation.y += d.rotSpeed.y * delta;
             d.rotation.z += d.rotSpeed.z * delta;

             // Check landing
             if (d.pos.y <= d.landPos.y) {
                 d.pos.y = d.landPos.y;
                 d.landed = true;
                 d.landTime = 0;
                 // Settle rotation flat-ish? 
                 // For now, keep chaotic rotation as if tumbled.
             }
          } else {
             // Landed logic
             d.landTime += delta;
             if (d.landTime > d.maxLandTime) {
                 // Recycle to top
                 d.landed = false;
                 d.pos.y = 30 + Math.random() * 10;
                 // Option: Randomize X/Z again?
                 // Keeping same vertical column is simpler for "stacking" illusion
             }
          }

          tempObj.position.copy(d.pos);
          tempObj.rotation.copy(d.rotation);
          tempObj.scale.copy(d.scale);
          
          // Shrink effect when recycling
          if (d.landed && d.landTime > d.maxLandTime - 1.0) {
              const shrink = (d.maxLandTime - d.landTime);
              tempObj.scale.multiplyScalar(Math.max(0.01, shrink));
          }

          tempObj.updateMatrix();
          meshRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
       <boxGeometry args={[1, 1, 1]} />
       <meshStandardMaterial roughness={0.2} metalness={0.5} />
    </instancedMesh>
  );
};

export default FallingGifts;