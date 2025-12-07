import React, { useContext, useState, useRef, useEffect } from 'react';
import { TreeContext } from '../App';
import { TreeState } from '../types';

const Overlay: React.FC = () => {
  const { state, setState, setUserImages } = useContext(TreeContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleState = () => {
    setState(state === TreeState.CHAOS ? TreeState.FORMED : TreeState.CHAOS);
    
    if (!isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        newImages.push(URL.createObjectURL(file as Blob));
      });
      setUserImages(newImages);
      // Auto-switch to formed state to see the photos
      if (state === TreeState.CHAOS) {
         setState(TreeState.FORMED);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = 0.3; 
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 z-10">
      
      <audio 
        ref={audioRef} 
        src="https://upload.wikimedia.org/wikipedia/commons/e/ed/We_Wish_You_a_Merry_Christmas_Kevin_MacLeod.ogg" 
        loop 
      />

      {/* Header */}
      <div className="text-center mt-8">
        <h1 className="font-luxury text-5xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest uppercase filter brightness-125">
          Merry Christmas
        </h1>
        <h2 className="font-luxury text-lg md:text-xl text-emerald-400 tracking-[0.5em] mt-4 drop-shadow-md uppercase">
          Grand Luxury Edition
        </h2>
      </div>

      {/* Controls Container (Top Right) */}
      <div className="absolute top-8 right-8 pointer-events-auto flex flex-col gap-4 items-end">
        {/* Music Toggle */}
        <button 
            onClick={toggleMusic}
            className={`
                flex items-center justify-center w-12 h-12 rounded-full border border-yellow-600 
                transition-all duration-300 hover:scale-110 hover:bg-yellow-900/30
                ${isPlaying ? 'bg-yellow-900/20 shadow-[0_0_10px_rgba(255,215,0,0.4)]' : 'opacity-50'}
            `}
            title={isPlaying ? "Pause Music" : "Play Music"}
        >
           {isPlaying ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
             </svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l2 2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
             </svg>
           )}
        </button>

        {/* Upload Button */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-yellow-600/50 rounded-full bg-black/50 text-yellow-500 text-xs font-luxury tracking-widest hover:bg-yellow-900/30 transition-all hover:scale-105"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            UPLOAD MEMORIES
        </button>
      </div>

      {/* Decorative Border Corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-yellow-600 opacity-50"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-yellow-600 opacity-50"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-yellow-600 opacity-50"></div>

      {/* Main Control */}
      <div className="pointer-events-auto flex flex-col items-center mb-12">
        <button
          onClick={toggleState}
          className="group relative px-12 py-4 bg-gradient-to-r from-emerald-950 to-black border-2 border-yellow-600 rounded-sm shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          
          <span className="relative font-luxury text-xl text-yellow-100 tracking-widest uppercase group-hover:text-white transition-colors">
            {state === TreeState.CHAOS ? "Assemble The Tree" : "Unleash Chaos"}
          </span>
        </button>
        
        <div className="mt-4 font-body text-yellow-700/60 text-sm tracking-widest">
          EST. 2024 • THE GOLD COLLECTION
        </div>
      </div>

      <style>{`
        @keyframes shine {
            100% {
                left: 125%;
            }
        }
        .group:hover .group-hover\\:animate-shine {
            animation: shine 1s;
        }
      `}</style>
    </div>
  );
};

export default Overlay;