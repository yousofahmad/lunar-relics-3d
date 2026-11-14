import { Component, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import GltfModel from './GltfModel.jsx';
import HoloRelic from './HoloRelic.jsx';
import { PROCEDURAL_MODELS } from './ProceduralCraft.jsx';
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
  const measureRef = useRef(null);
  const [measuredBounds, setMeasuredBounds] = useState(null);
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const box = new THREE.Box3().setFromObject(measureRef.current);
    if (box.isEmpty()) return;
    const localBox = box.applyMatrix4(new THREE.Matrix4().copy(measureRef.current.matrixWorld).invert());
    const size = localBox.getSize(new THREE.Vector3());
    const center = localBox.getCenter(new THREE.Vector3());
    const next = { size: size.toArray(), center: center.toArray(), maxDimension: Math.max(size.x, size.y, size.z) };
    setMeasuredBounds((previous) => (previous && Math.abs(previous.maxDimension - next.maxDimension) < 0.0001 ? previous : next));
  }, [children]);
  const fittedBounds = bounds || measuredBounds;
  const size = fittedBounds?.size;
  const maxDim = bounds?.maxDimension
    || fittedBounds?.maxDimension
    || (Array.isArray(size) ? Math.max(size[0] || 0, size[1] || 0, size[2] || 0) : (typeof size === 'number' ? size : 0));
  const scale = maxDim > 0.0001 ? Math.min(2.8 / maxDim, 8) : 1;
  const center = Array.isArray(fittedBounds?.center) ? fittedBounds.center : [0, 0, 0];
  return (
    <group scale={scale}>
      <group ref={measureRef} position={[-center[0], -center[1], -center[2]]}>{children}</group>
    </group>
  );
}

function ProceduralRepresentation({ item }) {
  const DetailedCraft = PROCEDURAL_MODELS[item?.id];
  return DetailedCraft ? <DetailedCraft /> : <HoloRelic item={item} />;
}

class ModelLoadBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default function ModelPeek({ item, language = 'en' }) {
  const info = getRelicModelInfo(item);
  const modelPath = info?.modelPath || item?.model3dFile || null;
  const [bounds, setBounds] = useState(null);
  const [meshReady, setMeshReady] = useState(!modelPath);
  const [meshError, setMeshError] = useState(false);
  const isAr = language === 'ar';
  const fallback = <ProceduralRepresentation item={item} />;

  useEffect(() => {
    setBounds(null);
    setMeshReady(!modelPath);
    setMeshError(false);
  }, [item?.id, modelPath]);

  const status = meshError
    ? (isAr ? 'تعذّر تحميل مجسم NASA · إعادة بناء إجرائية' : 'NASA MESH UNAVAILABLE · PROCEDURAL RECONSTRUCTION')
    : modelPath && !meshReady
      ? (isAr ? 'جارٍ تحميل مجسم NASA…' : 'LOADING NASA MESH…')
      : info?.fidelity === 'authentic'
        ? (isAr ? 'مجسم NASA أصلي' : 'AUTHENTIC NASA MESH')
        : (isAr ? 'إعادة بناء من صور ومواصفات NASA' : 'RECONSTRUCTION · NASA PHOTOS & SPECS');
  const detail = meshError
    ? (isAr ? 'إعادة بناء إجرائية مطابقة لفئة المركبة' : 'Procedural craft matching this vehicle class')
    : (isAr ? info?.modelLabelAr || info?.modelLabel : info?.modelLabel) || (isAr ? 'إعادة بناء إجرائية' : 'Procedural spacecraft archetype');

  return (
    <div className="model-peek" dir="ltr">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.5, 4.4], fov: 42, near: 0.1, far: 30 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#05080d']} />
        <fog attach="fog" args={['#05080d', 7, 14]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[3.5, 5, 4]} intensity={2.1} color="#fff6e8" />
        <directionalLight position={[-4, -1.5, -3]} intensity={0.9} color="#7fb2ff" />
        <pointLight position={[0, -2.4, 3]} intensity={1.2} color="#ffb08a" />
        <Suspense fallback={fallback}>
          <SlowSpin>
            <Fit bounds={bounds}>
              {modelPath ? (
                <ModelLoadBoundary
                  key={`${item?.id || 'relic'}:${modelPath}`}
                  fallback={fallback}
                  onError={() => { setMeshError(true); setMeshReady(false); }}
                >
                  <GltfModel
                    modelPath={modelPath}
                    item={item}
                    preserveMaterials
                    onBoundsReady={setBounds}
                    onModelReady={() => setMeshReady(true)}
                  />
                </ModelLoadBoundary>
              ) : (
                fallback
              )}
            </Fit>
          </SlowSpin>
        </Suspense>
      </Canvas>
      <span className="model-peek-tag" dir={isAr ? 'rtl' : 'ltr'}>
        <strong>{status}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}
