import * as THREE from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
}

export interface ParticleData {
  id: number;
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
  color: THREE.Color;
  type: 'box' | 'ball' | 'light';
  scale: number;
  rotationOffset: THREE.Euler;
}

export interface PhotoData {
  id: number;
  url: string;
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  speed: number;
}
