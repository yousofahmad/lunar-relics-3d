import React, { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars, Torus } from '@react-three/drei';
import { Activity, LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import HoloRelic from './HoloRelic.jsx';
import SpaceLoader from './SpaceLoader.jsx';

const GltfModel = lazy(() => import('./GltfModel.jsx'));

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makePlanetTexture(body) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(body === 'Mars' ? 141 : 73);
  const base = body === 'Mars' ? ['#301813', '#924631', '#d17a50'] : ['#101b26', '#53616b', '#a7b3ba'];
  const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, base[0]);
  gradient.addColorStop(0.48, base[1]);
  gradient.addColorStop(1, base[0]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1650; i += 1) {
    const x = random() * 1024;
    const y = random() * 512;
    const radius = 1 + Math.pow(random(), 2) * (body === 'Mars' ? 14 : 17);
    const alpha = 0.045 + random() * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = random() > 0.48 ? `rgba(3, 8, 14, ${alpha})` : `rgba(221, 232, 236, ${alpha * 0.7})`;
    ctx.fill();
    if (radius > 8) {
      ctx.beginPath();
      ctx.arc(x - radius * 0.18, y - radius * 0.2, radius * 0.75, Math.PI * 1.12, Math.PI * 1.88);
      ctx.strokeStyle = `rgba(226, 242, 247, ${alpha * 0.58})`;
      ctx.lineWidth = Math.max(0.8, radius * 0.07);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = body === 'Mars' ? '#ffba91' : '#a8efff';
  ctx.lineWidth = 1;
  for (let y = 32; y < 512; y += 34) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
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
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.4 + item.id.length) * 0.14;
      ref.current.scale.setScalar(pulse);
    }
  });
  const name = language === 'ar' ? item.nickname || item.name : item.nickname || item.name;
  return (
    <group position={position}>
      <mesh ref={ref} onClick={(event) => { event.stopPropagation(); onSelect(item); }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
        <sphereGeometry args={[selected ? 0.073 : 0.047, 14, 12]} />
        <meshBasicMaterial color={selected ? '#c8ff6b' : '#65e8ff'} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshBasicMaterial color={selected ? '#c8ff6b' : '#4ad8ff'} transparent opacity={0.1} />
      </mesh>
      {selected && <Html center distanceFactor={8} position={[0, 0.16, 0]} className="pin-label"><span>{name}</span></Html>}
    </group>
  );
}

function Planet({ body, items, position = [0, 0, 0], radius = 1.32, onSelect, selectedRelic, language, compact = false, journeyRef }) {
  const group = useRef();
  const texture = useMemo(() => makePlanetTexture(body), [body]);
  const geometry = useMemo(() => new THREE.SphereGeometry(radius, compact ? 36 : 64, compact ? 28 : 48), [radius, compact]);
  useFrame(({ clock }) => {
    if (group.current) {
      const scrollRotation = (journeyRef?.current?.exploreProgress || 0) * 0.22;
      group.current.rotation.y = clock.elapsedTime * (compact ? 0.035 : 0.018) + scrollRotation;
    }
  });
  React.useEffect(() => () => { geometry.dispose(); texture.dispose(); }, [geometry, texture]);
  return (
    <group ref={group} position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={texture} roughness={0.96} metalness={0.08} emissive={body === 'Mars' ? '#1c0906' : '#101b22'} emissiveIntensity={0.26} />
      </mesh>
      <mesh scale={1.008}>
        <sphereGeometry args={[radius, compact ? 30 : 48, compact ? 20 : 32]} />
        <meshBasicMaterial color={body === 'Mars' ? '#ff8b60' : '#64e7ff'} wireframe transparent opacity={0.075} />
      </mesh>
      <mesh rotation={[Math.PI / 2.35, 0.06, 0]}>
        <torusGeometry args={[radius * 1.19, compact ? 0.003 : 0.004, 4, 100]} />
        <meshBasicMaterial color={body === 'Mars' ? '#ff9776' : '#68ddff'} transparent opacity={0.25} />
      </mesh>
      {items.map((item) => {
        if (item.location?.lat == null || item.location?.lng == null) return null;
        return <Pin key={item.id} item={item} position={toSpherePoint(item.location.lat, item.location.lng, radius * 1.012)} onSelect={onSelect} selected={selectedRelic?.id === item.id} language={language} />;
      })}
      <Html center position={[0, -radius * 1.3, 0]} distanceFactor={compact ? 13 : 8} className="planet-caption"><span>{body === 'Moon' ? (language === 'ar' ? 'القمر' : 'LUNA') : 'MARS'}</span></Html>
    </group>
  );
}

function DeepSpaceMap({ items, onSelect, selectedRelic, language, showLabels = true }) {
  const ring = useRef();
  useFrame((_, delta) => { if (ring.current) ring.current.rotation.z += delta * 0.035; });
  const points = items.map((item, index) => {
    const angle = (index / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 1.2 + (index % 2) * 0.44;
    return { item, position: [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.36, Math.sin(angle) * radius] };
  });
  return (
    <group>
      <mesh><sphereGeometry args={[0.17, 20, 16]} /><meshBasicMaterial color="#c8ff6b" /></mesh>
      <mesh><sphereGeometry args={[0.39, 18, 14]} /><meshBasicMaterial color="#c8ff6b" transparent opacity={0.065} /></mesh>
      {[1.2, 1.64, 2.06].map((radius) => <Torus key={radius} ref={radius === 1.2 ? ring : undefined} args={[radius, 0.006, 5, 100]} rotation={[0.24, 0.1, 0]}>
        <meshBasicMaterial color="#61dff8" transparent opacity={radius === 1.2 ? 0.46 : 0.19} />
      </Torus>)}
      {points.map(({ item, position }) => <group key={item.id} position={position}>
        <Pin item={item} position={[0, 0, 0]} onSelect={onSelect} selected={selectedRelic?.id === item.id} language={language} />
        {showLabels && <Html center position={[0, -0.14, 0]} distanceFactor={10} className="orbit-label"><span>{item.nickname || item.name}</span></Html>}
      </group>)}
      {showLabels && <Html center position={[0, -2.55, 0]} distanceFactor={10} className="planet-caption"><span>{language === 'ar' ? 'مدارات الفضاء العميق' : 'DEEP SPACE ORBITAL NETWORK'}</span></Html>}
    </group>
  );
}

function AllSystem({ relics, onSelect, selectedRelic, language, journeyRef }) {
  const moonItems = relics.filter((item) => item.body === 'Moon');
  const marsItems = relics.filter((item) => item.body === 'Mars');
  const deepItems = relics.filter((item) => item.body === 'Deep Space');
  return (
    <group scale={0.82}>
      <Planet body="Moon" items={moonItems} position={[-2.32, 0.05, 0]} radius={0.84} compact onSelect={onSelect} selectedRelic={selectedRelic} language={language} journeyRef={journeyRef} />
      <Planet body="Mars" items={marsItems} position={[0, 0.08, 0]} radius={1.0} compact onSelect={onSelect} selectedRelic={selectedRelic} language={language} journeyRef={journeyRef} />
      <group position={[2.52, 0.02, 0]} scale={0.69}>
        <DeepSpaceMap items={deepItems} onSelect={onSelect} selectedRelic={selectedRelic} language={language} showLabels={false} />
      </group>
      <mesh position={[-1.12, 0.15, -0.2]} rotation={[0.4, 0, -0.1]}><torusGeometry args={[1.1, 0.004, 4, 96]} /><meshBasicMaterial color="#4c93af" transparent opacity={0.16} /></mesh>
    </group>
  );
}

function MapScene({ filter, relics, onSelect, selectedRelic, language, autoRotate, controlsRef, journeyRef }) {
  return (
    <>
      <color attach="background" args={['#07101a']} />
      <fog attach="fog" args={['#07101a', 8, 18]} />
      <ambientLight intensity={0.72} />
      <pointLight position={[3, 4, 5]} intensity={26} color="#a7f5ff" distance={12} />
      <pointLight position={[-4, -1, -2]} intensity={18} color="#287bd1" distance={10} />
      <Stars radius={65} depth={48} count={900} factor={3.1} saturation={0.2} fade speed={0.12} />
      {filter === 'Moon' && <Planet body="Moon" items={relics} radius={1.48} onSelect={onSelect} selectedRelic={selectedRelic} language={language} journeyRef={journeyRef} />}
      {filter === 'Mars' && <Planet body="Mars" items={relics} radius={1.48} onSelect={onSelect} selectedRelic={selectedRelic} language={language} journeyRef={journeyRef} />}
      {filter === 'Deep Space' && <DeepSpaceMap items={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} />}
      {filter === 'All' && <AllSystem relics={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} journeyRef={journeyRef} />}
      <OrbitControls ref={controlsRef} makeDefault enablePan={false} enableZoom={false} minDistance={3.1} maxDistance={9.2} enableDamping dampingFactor={0.075} autoRotate={autoRotate} autoRotateSpeed={0.42} />
    </>
  );
}

const HOTSPOT_POSITIONS = [[0, 0.72, 0.12], [-0.72, 0.1, 0.2], [0.58, -0.33, 0.48]];

function HotspotNode({ hotspot, index, position, onClick, selected, language }) {
  const part = hotspot.part || hotspot.title;
  const accessibleLabel = language === 'ar' ? `نقطة عتاد ${index + 1}: ${part}` : `Hardware hotspot ${index + 1}: ${part}`;
  return (
    <Html position={position} center distanceFactor={6} className="hotspot-html">
      <button className={`three-hotspot ${selected ? 'is-selected' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); onClick(hotspot); }} title={hotspot.title || part} aria-label={accessibleLabel} aria-pressed={selected}>
        <span>{String(index + 1).padStart(2, '0')}</span>
      </button>
    </Html>
  );
}

function InspectionScene({ item, language, setHotspot, selectedHotspot, autoRotate, controlsRef, journeyRef }) {
  const isRealModel = item.has3DModel && item.model3dFile;
  const keyLightRef = useRef();
  const fillLightRef = useRef();
  useFrame((_, delta) => {
    const phase = journeyRef?.current?.timelineIndex || 0;
    const presets = [
      { key: '#ffd29b', fill: '#b9794c', keyIntensity: 31, fillIntensity: 16 },
      { key: '#b5f7ff', fill: '#166ea3', keyIntensity: 38, fillIntensity: 24 },
      { key: '#91a9e8', fill: '#1a366f', keyIntensity: 22, fillIntensity: 12 },
    ];
    const preset = presets[Math.min(phase, presets.length - 1)];
    const easing = 1 - Math.exp(-delta * 1.8);
    if (keyLightRef.current) {
      keyLightRef.current.color.lerp(new THREE.Color(preset.key), easing);
      keyLightRef.current.intensity += (preset.keyIntensity - keyLightRef.current.intensity) * easing;
    }
    if (fillLightRef.current) {
      fillLightRef.current.color.lerp(new THREE.Color(preset.fill), easing);
      fillLightRef.current.intensity += (preset.fillIntensity - fillLightRef.current.intensity) * easing;
    }
  });
  return (
    <>
      <color attach="background" args={['#07101a']} />
      <fog attach="fog" args={['#07101a', 9, 22]} />
      <ambientLight intensity={0.7} />
      <pointLight ref={keyLightRef} position={[4, 5, 5]} intensity={31} color="#ffd29b" distance={15} />
      <pointLight ref={fillLightRef} position={[-4, 0, -2]} intensity={16} color="#b9794c" distance={12} />
      <spotLight position={[0, 7, 1]} angle={0.55} penumbra={0.8} intensity={12} color="#69e8ff" />
      <Stars radius={60} depth={46} count={720} factor={2.8} saturation={0.18} fade speed={0.08} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.54, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial color="#0b2836" transparent opacity={0.28} />
      </mesh>
      {[1.02, 1.43, 1.85].map((radius) => <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.48, 0]}>
        <torusGeometry args={[radius, radius === 1.43 ? 0.008 : 0.004, 4, 90]} />
        <meshBasicMaterial color="#57d7ef" transparent opacity={radius === 1.43 ? 0.42 : 0.18} />
      </mesh>)}
      <group position={[0, -0.02, 0]}>
        {isRealModel ? (
          <ModelErrorBoundary fallback={<HoloRelic item={item} />}>
            <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} kind="model" compact /></Html>}>
              <GltfModel modelPath={item.model3dFile} />
            </Suspense>
          </ModelErrorBoundary>
        ) : <HoloRelic item={item} />}
      </group>
      {(item.hotspots || []).slice(0, 3).map((spot, index) => <HotspotNode key={`${item.id}-spot-${index}`} hotspot={spot} index={index} position={HOTSPOT_POSITIONS[index]} onClick={setHotspot} selected={Boolean(selectedHotspot && ((selectedHotspot.part && selectedHotspot.part === spot.part) || (!selectedHotspot.part && selectedHotspot.title === spot.title)))} language={language} />)}
      <OrbitControls ref={controlsRef} makeDefault enablePan={false} enableZoom={false} minDistance={2.3} maxDistance={8} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={0.42} />
    </>
  );
}

function focusForMission(item, filter, progress) {
  if (!item) return { target: new THREE.Vector3(0, 0, 0), position: new THREE.Vector3(0, 0.2, 5.2) };
  let center = new THREE.Vector3(0, 0, 0);
  let radius = 1.48;
  let scale = 1;
  const all = filter === 'All';
  if (all) {
    scale = 0.82;
    if (item.body === 'Moon') { center.set(-2.32, 0.05, 0); radius = 0.84; }
    else if (item.body === 'Mars') { center.set(0, 0.08, 0); radius = 1; }
    else { center.set(2.52, 0.02, 0); radius = 1.2; }
  }
  if (item.body === 'Deep Space' || item.location?.lat == null || item.location?.lng == null) {
    const target = center;
    return { target, position: target.clone().add(new THREE.Vector3(0.4, 0.35, 3.6)) };
  }
  const localPoint = new THREE.Vector3(...toSpherePoint(item.location.lat, item.location.lng, radius));
  localPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), progress * 0.22);
  const offset = localPoint.clone().multiplyScalar(scale);
  const target = center.clone().add(offset);
  const normal = localPoint.normalize();
  const position = target.clone().add(normal.multiplyScalar(all ? 3.15 : 3.25));
  position.y += 0.16;
  return { target, position };
}

function cameraForMemory(journey) {
  const chapter = journey.chapter || 0;
  if (chapter === 2 && journey.hotspotIndex >= 0) {
    const positions = HOTSPOT_POSITIONS;
    const hotspotPosition = new THREE.Vector3(...positions[Math.min(journey.hotspotIndex, positions.length - 1)]);
    const outward = hotspotPosition.clone().normalize();
    const position = hotspotPosition.clone().add(outward.multiplyScalar(2.25));
    position.y += 0.28;
    return { target: hotspotPosition, position };
  }
  const zoom = chapter === 1 ? 4.15 : chapter === 3 ? 3.95 : chapter === 4 ? 4.15 : 4.45;
  return { target: new THREE.Vector3(0, 0, 0), position: new THREE.Vector3(0, 0.2, zoom) };
}

function CameraFlight({ selectedId, filter, relics, journeyRef, controlsRef, autoRotate }) {
  const { camera } = useThree();
  const moving = useRef(false);
  const lastKey = useRef('');

  useFrame((_, delta) => {
    const journey = journeyRef?.current || {};
    const chapter = journey.chapter || 0;
    const hotspotIndex = journey.hotspotIndex ?? -1;
    const timelineIndex = journey.timelineIndex || 0;
    const progress = journey.exploreProgress || 0;
    const exploring = Boolean(journey.exploreEnabled);
    const key = selectedId
      ? `relic:${selectedId}:${chapter}:${hotspotIndex}:${timelineIndex}`
      : exploring ? `map:${Math.floor(progress)}:${Math.round((progress % 1) * 10)}` : 'map:orbit';
    const scrolling = Boolean(journey.isScrolling);
    if (key !== lastKey.current || (!selectedId && exploring && scrolling)) moving.current = true;
    lastKey.current = key;
    if (!moving.current) return;

    let desired;
    if (selectedId) {
      desired = cameraForMemory(journey);
    } else if (!exploring) {
      desired = { target: new THREE.Vector3(0, 0, 0), position: new THREE.Vector3(0, 0.2, 5.2) };
    } else {
      const targets = journey.cameraItems?.length ? journey.cameraItems : relics;
      const maximum = Math.max(0, targets.length - 1);
      const safeProgress = THREE.MathUtils.clamp(progress, 0, maximum);
      const firstIndex = Math.floor(safeProgress);
      const secondIndex = Math.min(maximum, firstIndex + 1);
      const blend = THREE.MathUtils.smoothstep(safeProgress - firstIndex, 0, 1);
      const first = focusForMission(targets[firstIndex], filter, safeProgress);
      const second = focusForMission(targets[secondIndex], filter, safeProgress);
      desired = {
        target: first.target.clone().lerp(second.target, blend),
        position: first.position.clone().lerp(second.position, blend),
      };
    }

    const easing = 1 - Math.exp(-delta * (scrolling ? 3.8 : 2.4));
    camera.position.lerp(desired.position, easing);
    const controls = controlsRef.current;
    if (controls) {
      controls.autoRotate = scrolling ? false : autoRotate;
      controls.target.lerp(desired.target, easing);
      controls.update();
    }
    if (!scrolling && camera.position.distanceTo(desired.position) < 0.035 && (!controls || controls.target.distanceTo(desired.target) < 0.025)) moving.current = false;
  });

  return null;
}

export default function Space3DCanvas({ relics, filter, selectedRelic, onSelect, language, hotspot, setHotspot, journeyRef }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef(null);
  const viewFilter = selectedRelic?.body || filter;
  const isArabic = language === 'ar';

  const adjustZoom = (direction) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (direction === 'in') controls.dollyIn(1.2);
    else controls.dollyOut(1.2);
    controls.update();
  };

  const resetView = () => controlsRef.current?.reset();

  return (
    <div className="space-canvas-wrap">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, selectedRelic ? 5.5 : 5.2], fov: 42, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: 0.6, debounce: 350 }}
        fallback={<div className="canvas-fallback">3D view is unavailable in this browser.</div>}
      >
        <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} compact /></Html>}>
          {selectedRelic ? (
            <InspectionScene item={selectedRelic} language={language} setHotspot={setHotspot} selectedHotspot={hotspot} autoRotate={autoRotate} controlsRef={controlsRef} journeyRef={journeyRef} />
          ) : (
            <MapScene filter={viewFilter} relics={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} controlsRef={controlsRef} journeyRef={journeyRef} />
          )}
          <CameraFlight selectedId={selectedRelic?.id || null} filter={viewFilter} relics={relics} journeyRef={journeyRef} controlsRef={controlsRef} autoRotate={autoRotate} />
        </Suspense>
      </Canvas>
      <div className="canvas-tools">
        <span className="render-state"><Activity size={13} />{selectedRelic ? (selectedRelic.has3DModel ? (isArabic ? 'نموذج ناسا ثلاثي الأبعاد' : 'NASA 3D MODEL') : (isArabic ? 'مجسم هولوغرافي إجرائي' : 'PROCEDURAL HOLOGRAM')) : (isArabic ? 'رسم إجرائي مباشر' : 'PROCEDURAL LIVE RENDER')}</span>
        <div className="viewer-control-group" role="group" aria-label={isArabic ? 'أدوات عرض المجسم' : '3D viewer controls'}>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('out')} aria-label={isArabic ? 'تصغير المجسم' : 'Zoom out'} title={isArabic ? 'تصغير' : 'Zoom out'}><Minus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('in')} aria-label={isArabic ? 'تكبير المجسم' : 'Zoom in'} title={isArabic ? 'تكبير' : 'Zoom in'}><Plus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={resetView} aria-label={isArabic ? 'إعادة ضبط زاوية العرض' : 'Reset view'} title={isArabic ? 'إعادة ضبط العرض' : 'Reset view'}><LocateFixed size={14} /></button>
        </div>
        <button type="button" className={`rotate-toggle ${autoRotate ? 'on' : ''}`} onClick={() => setAutoRotate((current) => !current)} title={language === 'ar' ? 'تبديل الدوران التلقائي' : 'Toggle auto rotation'}>
          <RotateCcw size={13} /><span>{language === 'ar' ? 'دوران تلقائي' : 'AUTO ROTATE'}</span><i />
        </button>
      </div>
    </div>
  );
}
