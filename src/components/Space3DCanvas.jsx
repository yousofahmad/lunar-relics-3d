import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, Stars } from '@react-three/drei';
import { Activity, LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import SpaceLoader from './SpaceLoader.jsx';
import { playScrollWhoosh, playSonarLock } from '../utils/audioEngine.js';
import { getRelicModelPath } from '../utils/relicModelMap.js';

const GltfModel = lazy(() => import('./GltfModel.jsx'));

const PLANET_ASSETS = {
  Moon: { color: '/textures/moon-color.jpg', height: '/textures/moon-height.jpg' },
  Mars: { color: '/textures/mars-color.jpg', height: '/textures/mars-height.jpg' },
};
const APOLLO_LM_ID = 'apollo-11-eagle-descent-stage';

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
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 2.6);
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

function SpaceStudioEnvironment() {
  return (
    <Environment resolution={128} background={false}>
      <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 5, 5]} scale={[9, 5, 1]} />
      <Lightformer form="rect" intensity={1.35} color="#60a5fa" position={[-5, 1, 2]} rotation={[0, Math.PI / 3, 0]} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#EAB308" position={[4, -3, -4]} rotation={[0, -Math.PI / 4, 0]} scale={[5, 3, 1]} />
    </Environment>
  );
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
  const beaconColor = selected ? '#FC3D21' : '#EAB308';
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
          <sphereGeometry args={[selected ? 0.065 : 0.048, 24, 20]} />
          <meshBasicMaterial color={beaconColor} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.007, 0.014, 0.115, 10]} />
          <meshBasicMaterial color={beaconColor} transparent opacity={0.68} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.105, 18, 14]} />
          <meshBasicMaterial color={beaconColor} transparent opacity={0.09} depthWrite={false} />
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

function Planet({ body, items, radius = 2.6, onSelect, selectedRelic, language, autoRotate, showCaption = true }) {
  const group = useRef();
  const assets = PLANET_ASSETS[body];
  const [colorMap, heightMap] = useLoader(THREE.TextureLoader, [assets.color, assets.height]);
  const rimColor = useMemo(() => new THREE.Color(body === 'Mars' ? '#f2aa77' : '#60a5fa'), [body]);
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
          uniforms={{ rimColor: { value: rimColor }, rimStrength: { value: body === 'Mars' ? 0.28 : 0.22 } }}
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
      {showCaption && (
        <Html center position={[0, -radius * 1.12, 0]} distanceFactor={12} className={`planet-caption ${body === 'Moon' ? 'moon-caption' : 'mars-caption'}`}>
          <span>{body === 'Moon' ? (language === 'ar' ? 'القمر · LUNA' : 'THE MOON · LUNA') : (language === 'ar' ? 'المريخ · MARS' : 'MARS')}</span>
        </Html>
      )}
    </group>
  );
}

function OrbitalRelic({ item, position, onSelect, selected, language, compact }) {
  const modelRig = useRef();
  const [hovered, setHovered] = useState(false);
  const modelPath = getRelicModelPath(item);
  const title = item.nickname || item.name;

  useFrame(({ clock }) => {
    if (modelRig.current) modelRig.current.rotation.y = clock.elapsedTime * 0.24 + item.id.length * 0.08;
  });

  return (
    <group position={position}>
      <group ref={modelRig} scale={compact ? 0.105 : 0.17}>
        <ModelErrorBoundary fallback={null}>
          <Suspense fallback={null}><GltfModel modelPath={modelPath} /></Suspense>
        </ModelErrorBoundary>
      </group>
      <mesh
        onClick={(event) => { event.stopPropagation(); onSelect(item); }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[compact ? 0.2 : 0.3, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(hovered || selected) && (
        <Html center position={[0, compact ? 0.3 : 0.4, 0]} distanceFactor={compact ? 8 : 10} className="pin-label" occlude>
          <span dir={language === 'ar' ? 'auto' : 'ltr'}>{title}</span>
        </Html>
      )}
    </group>
  );
}

function DeepSpaceMap({ items, onSelect, selectedRelic, language, autoRotate, archiveOpen }) {
  const { size } = useThree();
  const compact = size.width < 620;
  const tablet = !compact && size.width < 1200;
  const sidebarDocked = archiveOpen && size.width > 760;
  const centerShift = sidebarDocked ? 1.2 : 0;
  const planetRadius = compact ? 0.55 : tablet ? 0.82 : 1.38;
  const moonPosition = compact ? [-0.68, 0.38, 0] : tablet ? [0, 1, 0] : [-1.72, 0, 0];
  const marsPosition = compact ? [0.68, 0.38, 0] : tablet ? [0, -1, 0] : [1.72, 0, 0];
  const points = useMemo(() => items.map((item, index) => {
    const compactPositions = [[-0.18, 0.12, 1.12], [0.18, 0.12, 1.3], [-0.18, -0.14, 1.3], [0.18, -0.14, 1.12]];
    if (compact) return { item, position: compactPositions[index % compactPositions.length] };
    if (tablet) {
      const tabletPositions = [[-0.3, 0.26, 1.18], [0.3, 0.26, 1.36], [-0.3, -0.26, 1.36], [0.3, -0.26, 1.18]];
      return { item, position: tabletPositions[index % tabletPositions.length] };
    }
    const angle = (index / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const orbitalRadius = 0.48;
    return { item, position: [Math.cos(angle) * orbitalRadius, Math.sin(angle) * orbitalRadius, 1.72 + (index % 2) * 0.18] };
  }), [items, compact, tablet]);

  return (
    <group position={[centerShift, 0, 0]}>
      <group position={moonPosition}>
        <Planet body="Moon" items={[]} radius={planetRadius} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} showCaption={false} />
      </group>
      <group position={marsPosition}>
        <Planet body="Mars" items={[]} radius={planetRadius} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} showCaption={false} />
      </group>
      {points.map(({ item, position }) => (
        <OrbitalRelic key={item.id} item={item} position={position} onSelect={onSelect} selected={selectedRelic?.id === item.id} language={language} compact={compact} />
      ))}
      <Html fullscreen zIndexRange={[2, 2]}>
        <div className={`dual-map-captions ${compact ? 'is-compact' : ''} ${tablet ? 'is-tablet' : ''}`} role="group" aria-label={language === 'ar' ? 'القمر والمريخ معًا' : 'Moon and Mars together'}>
          <span>{language === 'ar' ? 'القمر · LUNA' : 'THE MOON · LUNA'}</span>
          <span>{language === 'ar' ? 'المريخ · MARS' : 'MARS'}</span>
        </div>
      </Html>
    </group>
  );
}

function MapScene({ celestialView, relics, onSelect, selectedRelic, language, autoRotate, controlsRef, archiveOpen }) {
  const { size } = useThree();
  const dualPlanetView = celestialView === 'Deep Space';
  return (
    <>
      <color attach="background" args={['#03060C']} />
      <fog attach="fog" args={['#03060C', 28, 70]} />
      <ambientLight intensity={1.35} color="#e2e8f0" />
      <hemisphereLight args={['#ffffff', '#3b4252', 1.2]} />
      <directionalLight position={[5, 3.5, 7]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-6, -3, -5]} intensity={1.1} color="#60a5fa" />
      <pointLight position={[2.5, -1.5, 5]} intensity={0.09} color="#EAB308" distance={15} />
      <Stars radius={dualPlanetView ? 100 : 90} depth={dualPlanetView ? 70 : 52} count={dualPlanetView ? 5000 : 1700} factor={dualPlanetView ? 4 : 3.2} saturation={0.12} fade speed={0.09} />
      {celestialView === 'Moon' && <Planet body="Moon" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {celestialView === 'Mars' && <Planet body="Mars" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {dualPlanetView && <DeepSpaceMap items={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} archiveOpen={archiveOpen} />}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={dualPlanetView ? (size.width < 620 ? 4.8 : 5.7) : 4.7}
        maxDistance={13}
        enableDamping
        dampingFactor={0.075}
      />
    </>
  );
}

function buildHotspotPositions(item, modelBounds, isApolloLunarModule) {
  if (modelBounds?.size) {
    const [width, height, depth] = modelBounds.size;
    const [minX, minY, minZ] = modelBounds.min;
    const centerX = minX + width / 2;
    const centerZ = minZ + depth / 2;
    if (isApolloLunarModule) {
      return [
        [centerX, minY + height * 0.78, centerZ],
        [centerX, minY + height * 0.43, centerZ],
        [minX + width * 0.14, minY + height * 0.2, centerZ],
      ];
    }
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

function HotspotNode({ hotspot, position, onClick, selected, language }) {
  const part = hotspot.part || hotspot.title;
  const accessibleLabel = language === 'ar' ? `تركيز على ${part}` : `Focus on ${part}`;
  return (
    <Html position={position} center className="hotspot-html">
      <button className={`three-hotspot ${selected ? 'is-selected' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); onClick(hotspot); }} title={hotspot.title || part} aria-label={accessibleLabel} aria-pressed={selected}>
        <i className="three-hotspot-dot" aria-hidden="true" />
      </button>
    </Html>
  );
}

function HardwareCallout({ position, rigRef, active }) {
  const pathRef = useRef(null);
  const pulseRef = useRef(null);
  const { camera, size } = useThree();

  useFrame(() => {
    if (!active || !rigRef.current || !pathRef.current || !pulseRef.current) return;
    const worldPoint = rigRef.current.localToWorld(new THREE.Vector3(...position));
    const projected = worldPoint.project(camera);
    const x1 = (projected.x * 0.5 + 0.5) * size.width;
    const y1 = (-projected.y * 0.5 + 0.5) * size.height;
    const chapterText = document.querySelector('.hardware-chapter.is-current .hardware-copy');
    if (!chapterText || projected.z > 1 || x1 < 0 || x1 > size.width || y1 < 0 || y1 > size.height) {
      pathRef.current.setAttribute('d', '');
      pulseRef.current.setAttribute('r', '0');
      return;
    }
    const bounds = chapterText.getBoundingClientRect();
    const x2 = x1 < bounds.left ? bounds.left : x1 > bounds.right ? bounds.right : bounds.left + bounds.width / 2;
    const y2 = bounds.top + Math.min(bounds.height * 0.42, 110);
    const bend = Math.max(42, Math.abs(x2 - x1) * 0.34);
    const controlX = x2 > x1 ? x1 + bend : x1 - bend;
    pathRef.current.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${controlX.toFixed(1)} ${y1.toFixed(1)}, ${controlX.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    pulseRef.current.setAttribute('cx', x1.toFixed(1));
    pulseRef.current.setAttribute('cy', y1.toFixed(1));
    pulseRef.current.setAttribute('r', '4');
  });

  if (!active) return null;
  return (
    <Html fullscreen zIndexRange={[4, 4]}>
      <svg className="hardware-callout-svg" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
        <path ref={pathRef} className="hardware-callout-line" d="" />
        <circle ref={pulseRef} className="hardware-callout-pulse" cx="0" cy="0" r="0" />
      </svg>
    </Html>
  );
}

function InspectionScene({ item, language, setHotspot, selectedHotspot, autoRotate, controlsRef, storyProgress }) {
  const { camera, size } = useThree();
  const isApolloLunarModule = item.id === APOLLO_LM_ID;
  const modelPath = getRelicModelPath(item);
  const isRealModel = Boolean(modelPath);
  const storyRig = useRef(null);
  const [modelBounds, setModelBounds] = useState(null);
  const onModelBoundsReady = useMemo(() => (bounds) => setModelBounds(bounds), []);
  const hotspotPositions = useMemo(() => buildHotspotPositions(item, modelBounds, isApolloLunarModule), [item, modelBounds, isApolloLunarModule]);
  const dataHotspots = (item.hotspots || []).slice(0, 3);
  const selectedIndex = dataHotspots.findIndex((spot) => selectedHotspot && ((selectedHotspot.part && selectedHotspot.part === spot.part) || (!selectedHotspot.part && selectedHotspot.title === spot.title)));
  const chapterId = storyProgress?.chapter || 'hero';
  const chapterIndex = storyProgress?.index ?? 0;
  const chapterHotspotIndex = chapterId.startsWith('hardware-') ? Number(chapterId.slice('hardware-'.length)) : -1;
  const focusIndex = chapterHotspotIndex >= 0 ? chapterHotspotIndex : selectedIndex;
  const previousMotionRef = useRef({ chapterId, focusIndex, chapterIndex });

  useEffect(() => {
    setModelBounds(null);
  }, [item.id]);

  useEffect(() => {
    const previous = previousMotionRef.current;
    const chapterChanged = previous.chapterId !== chapterId;
    const focusChanged = previous.focusIndex !== focusIndex;
    const cameraGlides = chapterId === 'transmission'
      || chapterId.startsWith('hardware-')
      || previous.chapterId === 'transmission'
      || previous.chapterId.startsWith('hardware-');
    const travelDirection = chapterIndex >= previous.chapterIndex ? 1 : -1;
    if (chapterChanged && cameraGlides) playScrollWhoosh(travelDirection);
    if (focusIndex >= 0 && (focusChanged || (chapterChanged && chapterId.startsWith('hardware-')))) playSonarLock();
    previousMotionRef.current = { chapterId, focusIndex, chapterIndex };
  }, [chapterId, chapterIndex, focusIndex]);

  useFrame((state, delta) => {
    const rig = storyRig.current;
    if (!rig) return;
    const isHardwareChapter = chapterId.startsWith('hardware-');
    const hardwareOrdinal = chapterHotspotIndex >= 0 ? chapterHotspotIndex : Math.max(selectedIndex, 0);
    const compactLayout = size.width <= 760;
    const slide = compactLayout ? 0.24 : 1.65;
    let targetX = 0;
    if (chapterId === 'hero') targetX = compactLayout ? 0 : size.width >= 1024 ? 1.35 : 0.72;
    else if (chapterId === 'transmission') targetX = compactLayout ? 0.12 : slide;
    else if (isHardwareChapter) targetX = compactLayout ? 0 : (hardwareOrdinal === 2 ? -1.4 : (hardwareOrdinal % 2 === 0 ? -slide : slide));
    const mobileLift = compactLayout ? 0.55 : 0;
    const focusPoint = focusIndex >= 0 && hotspotPositions[focusIndex] ? new THREE.Vector3(...hotspotPositions[focusIndex]) : new THREE.Vector3(0, 0, 0);
    const focusWorld = rig.localToWorld(focusPoint);
    const targetYaw = focusIndex >= 0 ? [0.48, -0.72, 1.08][focusIndex] ?? 0.2 : chapterId === 'transmission' ? 0.12 : -0.18;
    const targetTilt = focusIndex >= 0 ? [0.1, -0.08, 0.17][focusIndex] ?? 0 : 0.015;
    const cameraDistance = isHardwareChapter
      ? (hardwareOrdinal === 2 ? 3.35 : 3.7)
      : chapterId === 'hero' && size.width >= 1024 ? 5.25 : 4.7;
    rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, targetYaw + (autoRotate ? Math.sin(state.clock.elapsedTime * 0.32) * 0.035 : 0), 1.8, delta);
    rig.rotation.x = THREE.MathUtils.damp(rig.rotation.x, targetTilt, 1.8, delta);
    rig.position.x = THREE.MathUtils.damp(rig.position.x, targetX, 1.8, delta);
    rig.position.y = THREE.MathUtils.damp(rig.position.y, mobileLift + (isHardwareChapter ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * 0.035), 1.8, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, focusWorld.x * 0.12 + state.pointer.x * 0.11, 1.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.12 + focusWorld.y * 0.1 + state.pointer.y * 0.08, 1.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraDistance, 1.4, delta);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.x = THREE.MathUtils.damp(controls.target.x, focusWorld.x * 0.18 + state.pointer.x * 0.05, 1.4, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, focusWorld.y * 0.22 + state.pointer.y * 0.035, 1.4, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, focusWorld.z * 0.18, 1.4, delta);
      controls.update();
    }
  });

  return (
    <>
      <color attach="background" args={['#03060C']} />
      <fog attach="fog" args={['#03060C', 20, 64]} />
      <ambientLight intensity={1.35} color="#e2e8f0" />
      <hemisphereLight args={['#ffffff', '#3b4252', 1.2]} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} color="#ffffff" />
      <directionalLight position={[-6, -3, -5]} intensity={1.1} color="#60a5fa" />
      <pointLight position={[0, 4, -5]} intensity={0.32} color="#EAB308" distance={18} />
      <pointLight position={[0, 4, 4]} intensity={0.34} color="#dbe5ee" distance={18} />
      <Stars radius={80} depth={50} count={3500} factor={3} saturation={0.1} fade speed={0.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.52, 0]}>
        <circleGeometry args={[2.25, 80]} />
        <meshBasicMaterial color="#0B3D91" transparent opacity={0.12} />
      </mesh>
      <ContactShadows position={[0, -1.35, 0]} opacity={0.65} scale={8} blur={2.4} far={4} color="#000000" />
      <group ref={storyRig}>
        {isRealModel ? (
          <ModelErrorBoundary
            key={item.id}
            fallback={<Html center transform={false}><span className="model-load-error">{language === 'ar' ? 'تعذّر تحميل النموذج ثلاثي الأبعاد' : '3D mission model could not be loaded'}</span></Html>}
          >
            <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} kind="model" compact /></Html>}>
              <GltfModel modelPath={modelPath} onBoundsReady={onModelBoundsReady} descentStageOnly={isApolloLunarModule} />
            </Suspense>
          </ModelErrorBoundary>
        ) : <Html center transform={false}><span className="model-load-error">{language === 'ar' ? 'لا يتوفر ملف نموذج لهذه المهمة' : 'No 3D model is available for this mission'}</span></Html>}
        {focusIndex >= 0 && dataHotspots[focusIndex] && (
          <HotspotNode
            hotspot={dataHotspots[focusIndex]}
            position={hotspotPositions[focusIndex]}
            onClick={setHotspot}
            selected
            language={language}
          />
        )}
      </group>
      {focusIndex >= 0 && hotspotPositions[focusIndex] && <HardwareCallout position={hotspotPositions[focusIndex]} rigRef={storyRig} active />}
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

export default function Space3DCanvas({ relics, filter, selectedRelic, onSelect, language, hotspot, setHotspot, storyProgress, archiveOpen = true }) {
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
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.1, 8.4], fov: 40, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: 0.55, debounce: 350 }}
        fallback={<div className="canvas-fallback">3D view is unavailable in this browser.</div>}
      >
        <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} compact /></Html>}>
          <SpaceStudioEnvironment />
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
              archiveOpen={archiveOpen}
            />
          )}
          <CameraFlight selectedId={selectedRelic?.id || null} controlsRef={controlsRef} />
        </Suspense>
      </Canvas>
      <div className="canvas-tools">
        <span className="render-state"><Activity size={13} />{selectedRelic ? (isArabic ? 'نموذج تفاعلي ثلاثي الأبعاد' : '3D INTERACTIVE MODEL') : (isArabic ? 'مشهد الكوكب' : 'Planet view')}</span>
        <div className="viewer-control-group" role="group" aria-label={isArabic ? 'أدوات تكبير وتدوير المجسم' : 'Model size and view controls'}>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('out')} aria-label={isArabic ? 'تصغير المجسم' : 'Zoom out'} title={isArabic ? 'تصغير' : 'Zoom out'}><Minus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={() => adjustZoom('in')} aria-label={isArabic ? 'تكبير المجسم' : 'Zoom in'} title={isArabic ? 'تكبير' : 'Zoom in'}><Plus size={14} /></button>
          <button type="button" className="viewer-control-button" onClick={resetView} aria-label={isArabic ? 'إعادة ضبط زاوية العرض' : 'Reset view'} title={isArabic ? 'إعادة ضبط العرض' : 'Reset view'}><LocateFixed size={14} /></button>
        </div>
        <button type="button" className={`rotate-toggle ${autoRotate ? 'on' : ''}`} onClick={() => setAutoRotate((current) => !current)} title={isArabic ? 'تبديل دوران المجسم' : 'Spin the model'}>
          <RotateCcw size={13} /><span>{isArabic ? 'دوّر المجسم' : 'SPIN MODEL'}</span><i />
        </button>
      </div>
    </div>
  );
}
