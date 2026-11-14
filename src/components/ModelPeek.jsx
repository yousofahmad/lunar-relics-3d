import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import GltfModel from './GltfModel.jsx';
import HoloRelic from './HoloRelic.jsx';
import { getRelicModelInfo } from '../utils/relicModelMap.js';

function SlowSpin({ children, paused = false }) {
  const groupRef = useRef(null);
  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.32;
  });
  return <group ref={groupRef}>{children}</group>;
}

function Fit({ bounds, children }) {
  const size = bounds?.size;
  const maxDim = bounds?.maxDimension
    || (Array.isArray(size) ? Math.max(size[0] || 0, size[1] || 0, size[2] || 0) : (typeof size === 'number' ? size : 0));
  const scale = maxDim > 0.0001 ? Math.min(4.6 / maxDim, 12) : 1;
  const center = Array.isArray(bounds?.center) ? bounds.center : [0, 0, 0];
  return (
    <group scale={scale}>
      <group position={[-center[0], -center[1], -center[2]]}>{children}</group>
    </group>
  );
}

export default function ModelPeek({ item, language = 'en' }) {
  const info = getRelicModelInfo(item);
  const [bounds, setBounds] = useState(null);
  const modelPath = info?.modelPath || item.model3dFile || null;
  const isAr = language === 'ar';

  return (
    <div className="model-peek" dir="ltr">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.5, 4.4], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#05080d']} />
        <fog attach="fog" args={['#05080d', 7, 14]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[3.5, 5, 4]} intensity={2.1} color="#fff6e8" />
        <directionalLight position={[-4, -1.5, -3]} intensity={0.9} color="#7fb2ff" />
        <pointLight position={[0, -2.4, 3]} intensity={1.2} color="#ffb08a" />
        <Suspense fallback={null}>
          <SlowSpin>
            <Fit bounds={bounds}>
              {modelPath ? (
                <GltfModel modelPath={modelPath} item={item} preserveMaterials onBoundsReady={setBounds} />
              ) : (
                <HoloRelic item={item} />
              )}
            </Fit>
          </SlowSpin>
        </Suspense>
      </Canvas>
      <span className="model-peek-tag" dir={isAr ? 'rtl' : 'ltr'}>
        {info?.fidelity === 'authentic'
          ? (isAr ? 'مجسم NASA أصلي' : 'AUTHENTIC NASA MESH')
          : (isAr ? 'إعادة بناء من صور ومواصفات NASA' : 'RECONSTRUCTION · NASA PHOTOS & SPECS')}
      </span>
    </div>
  );
}
