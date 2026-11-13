import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Activity, LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import HoloRelic from './HoloRelic.jsx';
import SpaceLoader from './SpaceLoader.jsx';

const GltfModel = lazy(() => import('./GltfModel.jsx'));

const PLANET_ASSETS = {
  Moon: { color: '/textures/moon-color.jpg', height: '/textures/moon-height.jpg' },
  Mars: { color: '/textures/mars-color.jpg', height: '/textures/mars-height.jpg' },
};
const EAGLE_RELIC_ID = 'apollo-11-eagle-descent-stage';
const EAGLE_MODEL_PATH = '/models/apollo_lunar_module.glb';

const RIM_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const RIM_FRAGMENT_SHADER = `
  uniform vec3 rimColor;
  uniform float rimStrength;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 3.1);
    gl_FragColor = vec4(rimColor, fresnel * rimStrength);
  }
`;

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function toSpherePoint(lat, lng, radius) {
  const latitude = THREE.MathUtils.degToRad(Number(lat) || 0);
  const longitude = THREE.MathUtils.degToRad(Number(lng) || 0);
  return [
    -radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  ];
}

function Pin({ item, position, onSelect, selected = false, language = 'en' }) {
  const beacon = useRef();
  const [hovered, setHovered] = useState(false);
  const orientation = useMemo(() => {
    const outward = new THREE.Vector3(...position).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
  }, [position]);
  const title = item.nickname || item.name;
  const site = item.location?.siteName;
  const label = site ? `${title} · ${site}` : title;

  useFrame(({ clock }) => {
    if (beacon.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.6 + item.id.length) * 0.12;
      beacon.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position} quaternion={orientation}>
      <group ref={beacon}>
        <mesh
          position={[0, 0.07, 0]}
          onClick={(event) => { event.stopPropagation(); onSelect(item); }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
        >
          <sphereGeometry args={[selected ? 0.085 : 0.065, 24, 20]} />
          <meshBasicMaterial color={selected ? '#d8f5a5' : '#a4f6ff'} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.008, 0.018, 0.13, 10]} />
          <meshBasicMaterial color={selected ? '#d8f5a5' : '#5fe7ff'} transparent opacity={0.68} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.15, 18, 14]} />
          <meshBasicMaterial color={selected ? '#d8f5a5' : '#5fe7ff'} transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>
      {(hovered || selected) && (
        <Html center position={[0, 0.3, 0]} distanceFactor={11} className="pin-label" occlude>
          <span dir={language === 'ar' ? 'auto' : 'ltr'}>{label}</span>
        </Html>
      )}
    </group>
  );
}

function Planet({ body, items, radius = 2.6, onSelect, selectedRelic, language, autoRotate }) {
  const group = useRef();
  const assets = PLANET_ASSETS[body];
  const [colorMap, heightMap] = useLoader(THREE.TextureLoader, [assets.color, assets.height]);
  const rimColor = useMemo(() => new THREE.Color(body === 'Mars' ? '#f57b42' : '#e2e6e9'), [body]);
  const bumpScale = body === 'Moon' ? 0.06 : 0.025;

  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
    heightMap.colorSpace = THREE.NoColorSpace;
    heightMap.anisotropy = 8;
    return null;
  }, [colorMap, heightMap]);

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.018;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={heightMap}
          bumpScale={bumpScale}
          roughness={0.96}
          metalness={0.015}
          color={body === 'Moon' ? '#d7d9dc' : '#f1d0b5'}
        />
      </mesh>
      <mesh scale={1.018}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          uniforms={{ rimColor: { value: rimColor }, rimStrength: { value: body === 'Mars' ? 0.56 : 0.32 } }}
          vertexShader={RIM_VERTEX_SHADER}
          fragmentShader={RIM_FRAGMENT_SHADER}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {items.map((item) => {
        if (item.location?.lat == null || item.location?.lng == null) return null;
        return (
          <Pin
            key={item.id}
            item={item}
            position={toSpherePoint(item.location.lat, item.location.lng, radius * 1.002)}
            onSelect={onSelect}
            selected={selectedRelic?.id === item.id}
            language={language}
          />
        );
      })}
      <Html center position={[0, -radius * 1.12, 0]} distanceFactor={12} className={`planet-caption ${body === 'Moon' ? 'moon-caption' : 'mars-caption'}`}>
        <span>{body === 'Moon' ? (language === 'ar' ? 'القمر · LUNA' : 'THE MOON · LUNA') : (language === 'ar' ? 'المريخ · MARS' : 'MARS')}</span>
      </Html>
    </group>
  );
}

function DeepSpaceMap({ items, onSelect, selectedRelic, language }) {
  const points = useMemo(() => items.map((item, index) => {
    const t = (index + 0.5) / Math.max(items.length, 1);
    const y = 1 - 2 * t;
    const radius = 2.05 + (index % 2) * 0.34;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    return { item, position: [Math.cos(angle) * ring * radius, y * radius, Math.sin(angle) * ring * radius] };
  }), [items]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.17, 32, 24]} />
        <meshBasicMaterial color="#ffe4ab" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.34, 32, 24]} />
        <meshBasicMaterial color="#ffbc68" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {points.map(({ item, position }) => (
        <Pin key={item.id} item={item} position={position} onSelect={onSelect} selected={selectedRelic?.id === item.id} language={language} />
      ))}
      <Html center position={[0, -2.85, 0]} distanceFactor={12} className="planet-caption deep-space-caption">
        <span>{language === 'ar' ? 'مهمات الفضاء العميق' : 'DEEP SPACE MISSIONS'}</span>
      </Html>
    </group>
  );
}

function MapScene({ celestialView, relics, onSelect, selectedRelic, language, autoRotate, controlsRef }) {
  return (
    <>
      <color attach="background" args={['#03060b']} />
      <fog attach="fog" args={['#03060b', 28, 70]} />
      <ambientLight intensity={0.16} color="#b9c4ce" />
      <directionalLight position={[5, 3.5, 7]} intensity={3.4} color="#fff4e6" />
      <pointLight position={[-5, -2, -4]} intensity={0.28} color={celestialView === 'Mars' ? '#be5730' : '#b9c4d1'} distance={18} />
      <Stars radius={90} depth={52} count={1700} factor={3.2} saturation={0.12} fade speed={0.09} />
      {celestialView === 'Moon' && <Planet body="Moon" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {celestialView === 'Mars' && <Planet body="Mars" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {celestialView === 'Deep Space' && <DeepSpaceMap items={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} />}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={4.7}
        maxDistance={13}
        enableDamping
        dampingFactor={0.075}
        autoRotate={autoRotate && celestialView === 'Deep Space'}
        autoRotateSpeed={0.16}
      />
    </>
  );
}

function buildHotspotPositions(item, modelBounds, usesOfficialApolloModel) {
  if (item.id === EAGLE_RELIC_ID) {
    if (usesOfficialApolloModel && modelBounds?.size) {
      return [[0, 0.06, 0.49], [0, 0.34, 0], [1.28, -0.15, 0.22]];
    }
    return [[0, 0.52, 0.67], [0, 0.87, 0], [0, -0.18, 0.95]];
  }
  if (modelBounds?.size) {
    const [width, height, depth] = modelBounds.size;
    const [minX, minY, minZ] = modelBounds.min;
    const centerX = minX + width / 2;
    const centerZ = minZ + depth / 2;
    return [
      [centerX, minY + height * 0.84, centerZ],
      [minX + width * 0.9, minY + height * 0.5, centerZ + depth * 0.08],
      [centerX, minY + height * 0.47, minZ + depth * 0.9],
    ];
  }

  const type = (item.type || '').toLowerCase();
  if (type.includes('rover')) return [[0, 0.87, 0], [1.16, 0.12, 0.34], [0, 0.04, 0.72]];
  if (type.includes('lander')) return [[0, 0.88, 0], [0.84, 0.38, 0.12], [0, 0.2, 0.79]];
  if (type.includes('scientific')) return [[0, 0.86, 0], [0.95, 0.2, 0.2], [0, 0.17, 0.7]];
  return [[0, 0.86, 0], [1.05, 0.16, 0.14], [0, 0.16, 0.82]];
}

function HotspotNode({ hotspot, index, position, onClick, selected, language }) {
  const part = hotspot.part || hotspot.title;
  const accessibleLabel = language === 'ar' ? `نقطة عتاد ${index + 1}: ${part}` : `Hardware hotspot ${index + 1}: ${part}`;
  return (
    <Html position={position} center className="hotspot-html">
      <button className={`three-hotspot ${selected ? 'is-selected' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); onClick(hotspot); }} title={hotspot.title || part} aria-label={accessibleLabel} aria-pressed={selected}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <i className="three-hotspot-dot" aria-hidden="true" />
      </button>
    </Html>
  );
}

function InspectionScene({ item, language, setHotspot, selectedHotspot, autoRotate, controlsRef, storyProgress }) {
  const usesOfficialApolloModel = item.id === EAGLE_RELIC_ID;
  const isRealModel = usesOfficialApolloModel || (item.has3DModel && item.model3dFile);
  const modelPath = usesOfficialApolloModel ? EAGLE_MODEL_PATH : item.model3dFile;
  const storyRig = useRef(null);
  const [modelBounds, setModelBounds] = useState(null);
  const onModelBoundsReady = useMemo(() => (bounds) => setModelBounds(bounds), []);
  const hotspotPositions = useMemo(() => buildHotspotPositions(item, modelBounds, usesOfficialApolloModel), [item, modelBounds, usesOfficialApolloModel]);

  useEffect(() => {
    setModelBounds(null);
  }, [item.id]);

  useFrame((_, delta) => {
    const rig = storyRig.current;
    if (!rig) return;
    const progress = storyProgress?.total > 1 ? storyProgress.index / (storyProgress.total - 1) : 0;
    const phase = progress * Math.PI * 2;
    rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, -0.22 + progress * 0.42, 1.7, delta);
    rig.rotation.x = THREE.MathUtils.damp(rig.rotation.x, Math.sin(phase) * 0.035, 1.7, delta);
    rig.position.x = THREE.MathUtils.damp(rig.position.x, Math.sin(phase) * 0.1, 1.7, delta);
    rig.position.y = THREE.MathUtils.damp(rig.position.y, Math.cos(phase) * 0.045, 1.7, delta);
  });

  return (
    <>
      <color attach="background" args={['#03060b']} />
      <fog attach="fog" args={['#03060b', 18, 58]} />
      <ambientLight intensity={0.42} color="#d9e2e8" />
      <directionalLight position={[4, 6, 5]} intensity={2.7} color="#fffbeb" />
      <directionalLight position={[-5, 2, -4]} intensity={1.35} color="#53b9cf" />
      <pointLight position={[0, 6, 2]} intensity={1.55} color="#f5fbff" distance={20} />
      <Stars radius={80} depth={50} count={1400} factor={2.9} saturation={0.1} fade speed={0.06} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.52, 0]}>
        <circleGeometry args={[2.25, 80]} />
        <meshBasicMaterial color="#08141b" transparent opacity={0.42} />
      </mesh>
      <group ref={storyRig}>
        {isRealModel ? (
          <ModelErrorBoundary fallback={<HoloRelic item={item} />}>
            <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} kind="model" compact /></Html>}>
              <GltfModel modelPath={modelPath} onBoundsReady={onModelBoundsReady} descentStageOnly={usesOfficialApolloModel} />
            </Suspense>
          </ModelErrorBoundary>
        ) : <HoloRelic item={item} />}
        {(item.hotspots || []).slice(0, 3).map((spot, index) => (
          <HotspotNode
            key={`${item.id}-spot-${index}`}
            hotspot={spot}
            index={index}
            position={hotspotPositions[index]}
            onClick={setHotspot}
            selected={Boolean(selectedHotspot && ((selectedHotspot.part && selectedHotspot.part === spot.part) || (!selectedHotspot.part && selectedHotspot.title === spot.title)))}
            language={language}
          />
        ))}
      </group>
      <OrbitControls ref={controlsRef} makeDefault target={[0, 0, 0]} enablePan={false} minDistance={3.1} maxDistance={9} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={0.34} />
    </>
  );
}

function CameraFlight({ selectedId, controlsRef }) {
  const { camera } = useThree();
  const flight = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    flight.current = {
      elapsed: 0,
      duration: 0.9,
      fromPosition: camera.position.clone(),
      fromTarget: controls?.target.clone() || new THREE.Vector3(0, 0, 0),
      toPosition: selectedId ? new THREE.Vector3(0, 1.4, 4.5) : new THREE.Vector3(0, 0.1, 8.4),
      toTarget: new THREE.Vector3(0, 0, 0),
    };
  }, [camera, controlsRef, selectedId]);

  useFrame((_, delta) => {
    if (!flight.current) return;
    const current = flight.current;
    current.elapsed = Math.min(current.duration, current.elapsed + delta);
    const progress = current.elapsed / current.duration;
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(current.fromPosition, current.toPosition, eased);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerpVectors(current.fromTarget, current.toTarget, eased);
      controls.update();
    }
    if (progress >= 1) flight.current = null;
  });

  return null;
}

export default function Space3DCanvas({ relics, filter, selectedRelic, onSelect, language, hotspot, setHotspot, storyProgress }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef(null);
  const selectTimer = useRef(0);
  const viewFilter = selectedRelic?.body || filter;
  const isArabic = language === 'ar';

  useEffect(() => () => window.clearTimeout(selectTimer.current), []);

  const selectFromBeacon = (item) => {
    window.clearTimeout(selectTimer.current);
    const controls = controlsRef.current;
    if (controls) {
      controls.dollyIn(1.3);
      controls.update();
    }
    selectTimer.current = window.setTimeout(() => onSelect(item), 320);
  };

  const adjustZoom = (direction) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (direction === 'in') controls.dollyIn(1.2);
    else controls.dollyOut(1.2);
    controls.update();
  };

  const resetView = () => controlsRef.current?.reset();
  const celestialView = viewFilter === 'All' ? 'Moon' : viewFilter;

  return (
    <div className="space-canvas-wrap">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.1, 8.4], fov: 40, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: 0.55, debounce: 350 }}
        fallback={<div className="canvas-fallback">3D view is unavailable in this browser.</div>}
      >
        <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} compact /></Html>}>
          {selectedRelic ? (
            <InspectionScene item={selectedRelic} language={language} setHotspot={setHotspot} selectedHotspot={hotspot} autoRotate={autoRotate} controlsRef={controlsRef} storyProgress={storyProgress} />
          ) : (
            <MapScene
              celestialView={celestialView}
              relics={relics}
              onSelect={selectFromBeacon}
              selectedRelic={selectedRelic}
              language={language}
              autoRotate={autoRotate}
              controlsRef={controlsRef}
            />
          )}
          <CameraFlight selectedId={selectedRelic?.id || null} controlsRef={controlsRef} />
        </Suspense>
      </Canvas>
      <div className="canvas-tools">
        <span className="render-state"><Activity size={13} />{selectedRelic ? (selectedRelic.has3DModel || selectedRelic.id === EAGLE_RELIC_ID ? (isArabic ? 'نموذج ناسا ثلاثي الأبعاد' : 'NASA 3D MODEL') : (isArabic ? 'مركبة إجرائية ثلاثية الأبعاد' : 'PROCEDURAL 3D SPACECRAFT')) : (isArabic ? 'عرض كوكبي واقعي' : 'PLANETARY SURFACE VIEW')}</span>
        <div className="viewer-control-group" role="group" aria-label={isArabic ? 'أدوات عرض المجسم' : '3D viewer controls'}>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('out')} aria-label={isArabic ? 'تصغير المجسم' : 'Zoom out'} title={isArabic ? 'تصغير' : 'Zoom out'}><Minus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('in')} aria-label={isArabic ? 'تكبير المجسم' : 'Zoom in'} title={isArabic ? 'تكبير' : 'Zoom in'}><Plus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={resetView} aria-label={isArabic ? 'إعادة ضبط زاوية العرض' : 'Reset view'} title={isArabic ? 'إعادة ضبط العرض' : 'Reset view'}><LocateFixed size={14} /></button>
        </div>
        <button type="button" className={`rotate-toggle ${autoRotate ? 'on' : ''}`} onClick={() => setAutoRotate((current) => !current)} title={isArabic ? 'تبديل الدوران التلقائي' : 'Toggle auto rotation'}>
          <RotateCcw size={13} /><span>{isArabic ? 'دوران تلقائي' : 'AUTO ROTATE'}</span><i />
        </button>
      </div>
    </div>
  );
}
