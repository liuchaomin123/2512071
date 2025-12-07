import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { TreeState } from './types';
import Experience from './components/Experience';
import Overlay from './components/Overlay';

export const TreeContext = React.createContext<{
  state: TreeState;
  setState: (s: TreeState) => void;
  userImages: string[];
  setUserImages: (images: string[]) => void;
}>({
  state: TreeState.CHAOS,
  setState: () => {},
  userImages: [],
  setUserImages: () => {},
});

const App: React.FC = () => {
  const [state, setState] = useState<TreeState>(TreeState.CHAOS);
  const [userImages, setUserImages] = useState<string[]>([]);

  return (
    <TreeContext.Provider value={{ state, setState, userImages, setUserImages }}>
      <div className="relative w-full h-screen bg-black">
        <Canvas
          shadows
          camera={{ position: [0, 4, 20], fov: 45 }}
          dpr={[1, 2]}
          gl={{ 
            antialias: false, 
            toneMapping: 3, // CineonToneMapping
            toneMappingExposure: 1.5 
          }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
        <Overlay />
      </div>
    </TreeContext.Provider>
  );
};

export default App;