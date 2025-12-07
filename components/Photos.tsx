import React, { useMemo, useRef, useContext, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { TreeContext } from '../App';
import { TreeState, PhotoData } from '../types';

interface Props {
  count: number;
}

const ImageMesh: React.FC<{ url: string }> = ({ url }) => {
    const texture = useLoader(TextureLoader, url);
    return (
        <mesh position={[0, 0.1, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
};

// Polaroid Frame Component
const Polaroid: React.FC<{ data: PhotoData; url: string }> = ({ data, url }) => {
  const { state } = useContext(TreeContext);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((stateThree, delta) => {
    if (!groupRef.current) return;

    const target = state === TreeState.FORMED ? data.targetPos : data.chaosPos;
    
    // Smooth lerp
    groupRef.current.position.lerp(target, delta * data.speed);
    
    // Rotation lerp
    const targetQ = new THREE.Quaternion();
    if (state === TreeState.FORMED) {
       targetQ.setFromEuler(data.targetRot);
    } else {
       // Spin in chaos
       groupRef.current.rotation.z += delta;
       groupRef.current.rotation.x += delta * 0.5;
       return; 
    }
    
    groupRef.current.quaternion.slerp(targetQ, delta * 2);
  });

  return (
    <group ref={groupRef} scale={[0.8, 0.8, 0.8]}>
      {/* White Frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshStandardMaterial color="#fffff0" roughness={0.8} />
      </mesh>
      
      {/* Photo Image with Suspense */}
      <Suspense fallback={<meshStandardMaterial color="#333" />}>
         <ImageMesh url={url} />
      </Suspense>
    </group>
  );
};

const Photos: React.FC<Props> = ({ count }) => {
  const { userImages } = useContext(TreeContext);

  const defaultUrls = [
    'https://picsum.photos/id/1011/500/500',
    'https://picsum.photos/id/1025/500/500',
    'https://picsum.photos/id/102/500/500',
    'https://picsum.photos/id/106/500/500',
    'https://picsum.photos/id/13/500/500',
    'https://picsum.photos/id/16/500/500',
  ];

  // Use user images if available, otherwise defaults
  const activeUrls = userImages.length > 0 ? userImages : defaultUrls;

  const photoData = useMemo(() => {
    const items: PhotoData[] = [];
    const treeHeight = 12;
    const maxRadius = 5.5; 

    for (let i = 0; i < count; i++) {
       // Chaos
       const r = 18 * Math.cbrt(Math.random());
       const theta = Math.random() * 2 * Math.PI;
       const phi = Math.acos(2 * Math.random() - 1);
       const cx = r * Math.sin(phi) * Math.cos(theta);
       const cy = r * Math.sin(phi) * Math.sin(theta) + 8;
       const cz = r * Math.cos(phi);

       // Target
       const y = Math.random() * (treeHeight - 2) + 1; 
       const coneRadius = maxRadius * (1 - y / treeHeight);
       const ang = (i / count) * Math.PI * 8; 
       
       const tx = coneRadius * Math.cos(ang);
       const ty = y;
       const tz = coneRadius * Math.sin(ang);

       const dummy = new THREE.Object3D();
       dummy.position.set(tx, ty, tz);
       dummy.lookAt(0, ty, 0); 
       dummy.rotation.y += Math.PI; 
       dummy.rotation.z = (Math.random() - 0.5) * 0.4; 

       items.push({
         id: i,
         url: '',
         chaosPos: new THREE.Vector3(cx, cy, cz),
         targetPos: new THREE.Vector3(tx, ty, tz),
         targetRot: dummy.rotation.clone(),
         speed: Math.random() * 0.5 + 1.0,
       });
    }
    return items;
  }, [count]);

  return (
    <group>
      {photoData.map((data, index) => (
        <Polaroid 
            key={data.id} 
            data={data} 
            url={activeUrls[index % activeUrls.length]} 
        />
      ))}
    </group>
  );
};

export default Photos;