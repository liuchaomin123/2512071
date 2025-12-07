import React, { useContext, useEffect, useRef } from 'react';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeContext } from '../App';
import { TreeState } from '../types';
import TreeFoliage from './TreeFoliage';
import Ornaments from './Ornaments';
import Photos from './Photos';
import Snow from './Snow';
import Lights from './Lights';
import TopStar from './TopStar';
import Ribbons from './Ribbons';
import FallingGifts from './FallingGifts';

const Experience: React.FC = () => {
  const { state } = useContext(TreeContext);
  
  // Cinematic Camera Rig
  const camRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (camRef.current) {
      // Slow rotation for luxury feel
      camRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <>
      <color attach="background" args={['#020502']} />
      
      {/* Starry Sky Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Luxury Lighting Setup */}
      <Environment preset="lobby" backgroundBlurriness={0.5} environmentIntensity={1.2} />
      <ambientLight intensity={0.2} color="#004400" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.2} 
        penumbra={1} 
        intensity={200} 
        color="#fff5b6" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#ff0000" distance={20} />
      
      <group position={[0, -5, 0]}>
        {/* Rotating Base Group */}
        <group ref={camRef}>
           <TreeFoliage count={15000} />
           <Ribbons />
           <Ornaments count={400} />
           <Lights count={600} />
           <Photos count={24} />
           <TopStar />
           <FallingGifts />
        </group>
      </group>
      
      {/* Snowfall Effect */}
      <Snow />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2} 
        minDistance={10} 
        maxDistance={40}
        autoRotate={state === TreeState.FORMED}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export default Experience;