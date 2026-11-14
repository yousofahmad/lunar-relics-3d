import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, Stars } from '@react-three/drei';
import { Activity, LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import SpaceLoader from './SpaceLoader.jsx';
import HoloRelic from './HoloRelic.jsx';
import { playScrollWhoosh, playSonarLock } from '../utils/audioEngine.js';
import { getRelicModelInfo } from '../utils/relicModelMap.js';

const GltfModel = lazy(() => import('./GltfModel.jsx'));

const PLANET_ASSETS = {
  Moon: { color: '/textures/moon-color-seamfix.webp', height: '/textures/moon-height-seamfix.webp' },
  Mars: { color: '/textures/mars-color-seamfix.webp', height: '/textures/mars-height-seamfix.webp' },
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

function toSpherePoint(lat, lng, radius, longitudeOffset = 0) {
  const latitude = THREE.MathUtils.degToRad(Number(lat) || 0);
  const longitude = THREE.MathUtils.degToRad((Number(lng) || 0) + longitudeOffset);
  return [
    -radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  ];
}

function missionPinLabel(item) {
  const labels = {
    'apollo-11-eagle-descent-stage': 'Apollo 11',
    'apollo-15-lrv': 'Apollo 15',
    'alsep-scientific-packages': 'Apollo 12 ALSEP',
    'surveyor-3': 'Surveyor 3',
    'sojourner-rover': 'Sojourner',
    'spirit-rover': 'Spirit',
    'opportunity-rover': 'Opportunity',
    'viking-1-lander': 'Viking 1',
    'viking-2-lander': 'Viking 2',
    'phoenix-lander': 'Phoenix',
    'insight-lander': 'InSight',
    'ingenuity-helicopter': 'Ingenuity',
    'dawn-spacecraft': 'Dawn',
    'near-shoemaker': 'NEAR Shoemaker',
    'pioneer-10-11': 'Pioneer 10 & 11',
    'kepler-space-telescope': 'Kepler',
  };
  return item.pinLabel || labels[item.id] || item.nickname || item.name;
}

function Pin({ item, position, onSelect, onHoverChange, selected = false, language = 'en', planetRef }) {
  const beacon = useRef();
  const pinGroup = useRef();
  const pointerDownPos = useRef(null);
  const lastPointerUp = useRef({ at: 0, moved: false });
  const lastActivation = useRef(0);
  const projectionVectors = useMemo(() => ({
    pinWorld: new THREE.Vector3(),
    planetWorld: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    cameraDirection: new THREE.Vector3(),
    projected: new THREE.Vector3(),
  }), []);
  const [hovered, setHovered] = useState(false);
  const [frontVisible, setFrontVisible] = useState(true);
  const { camera, size } = useThree();
  const beaconColor = selected ? '#FC3D21' : '#EAB308';
  const orientation = useMemo(() => {
    const outward = new THREE.Vector3(...position).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
  }, [position]);
  const title = missionPinLabel(item);
  const site = item.location?.siteName;
  const label = site ? `${title} · ${site}` : title;

  useFrame(({ clock }) => {
    if (beacon.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.6 + item.id.length) * 0.12;
      beacon.current.scale.setScalar(pulse);
    }
    if (pinGroup.current && planetRef?.current) {
      const { pinWorld, planetWorld, normal, cameraDirection, projected } = projectionVectors;
      pinGroup.current.getWorldPosition(pinWorld);
      planetRef.current.getWorldPosition(planetWorld);
      normal.subVectors(pinWorld, planetWorld).normalize();
      cameraDirection.subVectors(camera.position, pinWorld).normalize();
      projected.copy(pinWorld).project(camera);
      const insetX = 48 / Math.max(1, size.width);
      const insetY = 48 / Math.max(1, size.height);
      const insideViewport = projected.z > -1 && projected.z < 1
        && Math.abs(projected.x) < 1 - insetX
        && Math.abs(projected.y) < 1 - insetY;
      const isFrontFacing = normal.dot(cameraDirection) > 0.15 && insideViewport;
      setFrontVisible((current) => current === isFrontFacing ? current : isFrontFacing);
    }
  });

  const activate = () => {
    const now = performance.now();
    if (now - lastActivation.current < 350) return;
    lastActivation.current = now;
    onSelect(item);
  };
  const handlePointerDown = (event) => {
    event.stopPropagation();
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event) => {
    event.stopPropagation();
    const origin = pointerDownPos.current;
    pointerDownPos.current = null;
    const moved = !origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= 12;
    lastPointerUp.current = { at: performance.now(), moved };
    if (!moved) activate();
  };
  const handleClick = (event) => {
    event.stopPropagation();
    if (event.detail === 0) {
      activate();
      return;
    }
    const recentPointerUp = performance.now() - lastPointerUp.current.at < 500;
    if (recentPointerUp) return;
    const origin = pointerDownPos.current;
    pointerDownPos.current = null;
    if (!origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 12) activate();
  };
  const pinButtonProps = {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: (event) => { event.stopPropagation(); pointerDownPos.current = null; },
    onClick: handleClick,
    onTouchStart: (event) => event.stopPropagation(),
    onTouchEnd: (event) => event.stopPropagation(),
  };

  return (
    <group ref={pinGroup} position={position} quaternion={orientation}>
      <group ref={beacon}>
        <mesh position={[0, 0.07, 0]}>
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
        <mesh
          position={[0, 0.09, 0]}
          onClick={(event) => { event.stopPropagation(); onSelect(item); }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); onHoverChange?.(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); onHoverChange?.(false); document.body.style.cursor = ''; }}
        >
          <sphereGeometry args={[selected ? 0.24 : 0.21, 20, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {frontVisible && (
        <Html center position={[0, 0.07, 0]} zIndexRange={[20, 0]} className="planet-pin-html" pointerEvents="auto">
          <div className="planet-pin-overlay" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <button
              className="planet-pin-target"
              type="button"
              aria-label={language === 'ar' ? `افتح مهمة ${title}` : `Open ${title} mission`}
              title={label}
              {...pinButtonProps}
            />
            <button className="planet-pin-label" type="button" {...pinButtonProps}>
              <span className="planet-pin-glow" aria-hidden="true" />
              <span dir="auto">{title}</span>
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function Planet({ body, items, radius = 2.6, onSelect, selectedRelic, language, autoRotate, showCaption = true }) {
  const group = useRef();
  const [hoveredPin, setHoveredPin] = useState(false);
  const { gl, size } = useThree();
  const assets = PLANET_ASSETS[body];
  const [colorMap, heightMap] = useLoader(THREE.TextureLoader, [assets.color, assets.height]);
  const rimColor = useMemo(() => new THREE.Color(body === 'Mars' ? '#f2aa77' : '#60a5fa'), [body]);
  const bumpScale = 0.012;

  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.ClampToEdgeWrapping;
    colorMap.generateMipmaps = true;
    colorMap.minFilter = THREE.LinearMipmapLinearFilter;
    colorMap.magFilter = THREE.LinearFilter;
    colorMap.needsUpdate = true;
    heightMap.colorSpace = THREE.NoColorSpace;
    heightMap.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    heightMap.wrapS = THREE.RepeatWrapping;
    heightMap.wrapT = THREE.ClampToEdgeWrapping;
    heightMap.generateMipmaps = true;
    heightMap.minFilter = THREE.LinearMipmapLinearFilter;
    heightMap.magFilter = THREE.LinearFilter;
    heightMap.needsUpdate = true;
  }, [colorMap, gl, heightMap]);

  useFrame((_, delta) => {
    if (autoRotate && !hoveredPin && group.current) group.current.rotation.y += delta * 0.018;
  }, [autoRotate, hoveredPin]);

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[radius, size.width < 620 ? 128 : 256, size.width < 620 ? 96 : 160]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={body === 'Moon' ? heightMap : undefined}
          bumpScale={bumpScale}
          displacementMap={body === 'Moon' ? heightMap : undefined}
          displacementScale={body === 'Moon' ? radius * 0.006 : 0}
          roughness={body === 'Moon' ? 0.94 : 0.9}
          metalness={0}
          envMapIntensity={0.08}
          color="#ffffff"
        />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          uniforms={{ rimColor: { value: rimColor }, rimStrength: { value: body === 'Mars' ? 0.2 : 0.025 } }}
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
            onHoverChange={setHoveredPin}
            selected={selectedRelic?.id === item.id}
            language={language}
            planetRef={group}
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

function createOrbitTrajectory(radius) {
  const points = Array.from({ length: 129 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.48,
      Math.sin(angle * 2) * radius * 0.12,
    );
  });
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  return new THREE.TubeGeometry(curve, 256, Math.max(0.004, radius * 0.0032), 6, true);
}

function OrbitTrajectory({ radius, opacity = 0.25 }) {
  const geometry = useMemo(() => createOrbitTrajectory(radius), [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#60a5fa" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function OrbitMissionPin({ item, position, onSelect, language, labelSide = 'right' }) {
  const pointerDownPos = useRef(null);
  const lastPointerUp = useRef(0);
  const lastActivation = useRef(0);
  const title = missionPinLabel(item);

  const activate = () => {
    const now = performance.now();
    if (now - lastActivation.current < 350) return;
    lastActivation.current = now;
    onSelect(item);
  };
  const handlePointerDown = (event) => {
    event.stopPropagation();
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event) => {
    event.stopPropagation();
    const origin = pointerDownPos.current;
    pointerDownPos.current = null;
    const moved = Boolean(origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= 12);
    lastPointerUp.current = performance.now();
    if (!moved) activate();
  };
  const handleClick = (event) => {
    event.stopPropagation();
    if (event.detail === 0) {
      activate();
      return;
    }
    if (performance.now() - lastPointerUp.current < 500) return;
    const origin = pointerDownPos.current;
    pointerDownPos.current = null;
    if (!origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 12) activate();
  };
  const buttonProps = {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: (event) => { event.stopPropagation(); pointerDownPos.current = null; },
    onTouchStart: (event) => event.stopPropagation(),
    onTouchEnd: (event) => event.stopPropagation(),
    onClick: handleClick,
  };

  return (
    <Html center position={position} zIndexRange={[30, 0]} className="orbit-pin-html" pointerEvents="auto">
      <div className={`orbit-pin-overlay label-${labelSide}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <button
          className="orbit-pin-target"
          type="button"
          aria-label={language === 'ar' ? `افتح مهمة ${title}` : `Open ${title} mission`}
          title={title}
          {...buttonProps}
        />
        <button className="orbit-pin-label" type="button" {...buttonProps}>
          <span className="orbit-pin-label-dot" aria-hidden="true" />
          <span dir="auto">{title}</span>
        </button>
      </div>
    </Html>
  );
}

function OrbitalCraft({ item, position, onSelect, selectedRelic, language, autoRotate }) {
  const group = useRef();
  const presentation = getRelicModelInfo(item);
  const isSelected = selectedRelic?.id === item.id;

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.13;
  }, [autoRotate]);

  return (
    <group ref={group} position={position}>
      <pointLight position={[0, 0.2, 0.75]} intensity={0.34} color="#9fcaff" distance={3.2} />
      <group scale={0.31} rotation={[0.16, 0.42 + item.id.length * 0.12, -0.12]}>
        {presentation.modelPath ? (
          <ModelErrorBoundary fallback={<HoloRelic item={item} />}>
            <Suspense fallback={<HoloRelic item={item} />}>
              <GltfModel modelPath={presentation.modelPath} item={item} preserveMaterials />
            </Suspense>
          </ModelErrorBoundary>
        ) : <HoloRelic item={item} />}
      </group>
      <mesh position={[0, 0.53, 0]}>
        <sphereGeometry args={[isSelected ? 0.055 : 0.04, 16, 12]} />
        <meshBasicMaterial color={isSelected ? '#FC3D21' : '#EAB308'} />
      </mesh>
      <OrbitMissionPin
        item={item}
        position={[0, 0.53, 0]}
        onSelect={onSelect}
        language={language}
        labelSide={position[0] > 0 ? 'left' : 'right'}
      />
    </group>
  );
}

function DeepSpaceOrbit({ items, onSelect, selectedRelic, language, autoRotate, archiveOpen }) {
  const { size } = useThree();
  const compact = size.width < 620;
  const tablet = !compact && size.width < 1200;
  const sidebarDocked = archiveOpen && size.width > 760;
  const centerShift = sidebarDocked ? (language === 'ar' ? 1.05 : -1.05) : 0;
  const orbitRadius = compact ? 1.18 : tablet ? 1.95 : 2.5;
  const orbitalItems = items.filter((item) => item.body === 'Deep Space');
  const craftPositions = orbitalItems.map((_, index) => {
    const angle = orbitalItems.length < 2
      ? 0
      : -Math.PI * 0.75 + (index / (orbitalItems.length - 1)) * Math.PI * 1.5;
    return [
      Math.cos(angle) * orbitRadius,
      Math.sin(angle) * orbitRadius * 0.48,
      Math.sin(angle * 2) * orbitRadius * 0.12,
    ];
  });

  return (
    <group position={[centerShift, 0, 0]}>
      <group rotation={[0.08, 0.02, -0.04]}>
        <OrbitTrajectory radius={orbitRadius} opacity={0.34} />
        <OrbitTrajectory radius={orbitRadius * 0.66} opacity={0.12} />
        <pointLight position={[0, 0, 0]} intensity={0.48} color="#3b82f6" distance={7} />
        <mesh>
          <sphereGeometry args={[0.075, 20, 16]} />
          <meshBasicMaterial color="#dbeafe" />
        </mesh>
        {orbitalItems.map((item, index) => (
          <OrbitalCraft
            key={item.id}
            item={item}
            position={craftPositions[index]}
            onSelect={onSelect}
            selectedRelic={selectedRelic}
            language={language}
            autoRotate={autoRotate}
          />
        ))}
      </group>
      <Html fullscreen zIndexRange={[5, 0]}>
        <div className={`orbit-scene-caption ${compact ? 'is-compact' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <span>{language === 'ar' ? 'الفضاء العميق · ٤ مهمات مدارية' : 'DEEP SPACE · 4 ORBITAL MISSIONS'}</span>
        </div>
      </Html>
    </group>
  );
}


/* Shared framing maths: how far the camera must sit so the planet fills the
   viewport without being sliced by the edges. */
function mapDistanceFor(width, height, radius = 2.6, fov = 40) {
  const tan = Math.tan((fov * Math.PI) / 360);
  const narrow = width < 620;
  const targetPx = Math.min(width * (narrow ? 0.9 : 0.72), height * (narrow ? 0.72 : 0.78));
  return Math.min(Math.max((radius * height) / Math.max(1, targetPx * tan), 6.2), 20);
}

function MapScene({ celestialView, relics, onSelect, selectedRelic, language, autoRotate, controlsRef, archiveOpen }) {
  const { size } = useThree();
  const orbitalView = celestialView === 'Deep Space';
  return (
    <>
      <color attach="background" args={['#03060C']} />
      <fog attach="fog" args={['#03060C', 28, 70]} />
      <FitMapCamera view={celestialView} archiveOpen={archiveOpen} />
      <ambientLight intensity={0.08} color="#a6b4c8" />
      <hemisphereLight args={['#dbeafe', '#111827', 0.12]} />
      <directionalLight position={[7, 4, 6]} intensity={2.4} color="#fff5e7" />
      <directionalLight position={[-6, -2, -5]} intensity={0.12} color="#60a5fa" />
      <pointLight position={[2.5, -1.5, 5]} intensity={0.01} color="#EAB308" distance={15} />
      <Stars radius={orbitalView ? 110 : 90} depth={orbitalView ? 82 : 52} count={orbitalView ? (size.width < 620 ? 2600 : 5200) : (size.width < 620 ? 650 : 1600)} factor={orbitalView ? 4.8 : 3.2} saturation={0.12} fade speed={0.09} />
      {celestialView === 'Moon' && <Planet body="Moon" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {celestialView === 'Mars' && <Planet body="Mars" items={relics} radius={2.6} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} />}
      {orbitalView && <DeepSpaceOrbit items={relics} onSelect={onSelect} selectedRelic={selectedRelic} language={language} autoRotate={autoRotate} archiveOpen={archiveOpen} />}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        rotateSpeed={0.65}
        minDistance={orbitalView ? (size.width < 620 ? 5.2 : 5.7) : 4.7}
        maxDistance={22}
        enableDamping
        dampingFactor={0.075}
      />
    </>
  );
}

/* Frames the planet so it always fits the viewport instead of being sliced by
   the edges on portrait phones. */
function FitMapCamera({ view, radius = 2.6, archiveOpen = false }) {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!camera || !size?.height) return;
    const framed = mapDistanceFor(size.width, size.height, radius, camera.fov);
    const shift = archiveOpen && size.width > 1100 ? -0.85 : 0;
    camera.position.set(shift, 0.1, framed);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size?.width, size?.height, radius, view, archiveOpen]);
  return null;
}
function getHotspotRegion(hotspot) {
  const text = `${hotspot?.part || ''} ${hotspot?.title || ''} ${hotspot?.description || ''}`.toLowerCase();
  if (/camera|pancam|navcam|mast|photometer|telescope|rotor|blade|antenna|dish|imager|sensor/.test(text)) return 'top';
  if (/solar|panel|wing|rtg|radioisotope|battery|power|generator|array/.test(text)) return 'side';
  if (/wheel|leg|footpad|bogie|suspension|mobility|descent stage|landing gear|radar|altimeter|retrorocket|braking/.test(text)) return 'lower';
  if (/rear|relay|lcru|propulsion|engine/.test(text)) return 'rear';
  if (/arm|sampler|scoop|drill|seismometer|seismic|alsep|easep|instrument|apxs|plaque|collector|hp3|ida/.test(text)) return 'front';
  return 'top';
}

function getHotspotAliases(hotspot) {
  const text = `${hotspot?.part || ''} ${hotspot?.title || ''} ${hotspot?.description || ''}`.toLowerCase();
  if (/rtg|radioisotope|snap-?\d+|generator/.test(text)) return ['rtg', 'snap', 'radioisotope', 'generator'];
  if (/solar|panel|wing|array|battery/.test(text)) return ['solar', 'panel', 'array', 'battery', 'hardware-power'];
  if (/rat|rock abrasion/.test(text)) return ['rat', 'abrasion', 'arm', 'tool'];
  if (/robotic arm|instrument deployment|sampler arm|surface sampler|instrumented arm|\bapxs\b|\bhp3\b|\bida\b/.test(text)) return ['hp3', 'ida', 'arm', 'sampler', 'scoop', 'drill', 'apxs', 'instrument'];
  if (/pancam|navcam|camera|mast|photometer|telescope|imager|sensor|\bmsi\b|\bxgrs\b|\bnis\b/.test(text)) return ['camera', 'mast', 'pancam', 'navcam', 'imager', 'sensor', 'photometer', 'telescope', 'msi', 'xgrs', 'nis'];
  if (/rotor|blade/.test(text)) return ['rotor', 'blade'];
  if (/antenna|dish|lcru|communications relay/.test(text)) return ['antenna', 'dish', 'lcru', 'relay'];
  if (/wheel|leg|footpad|bogie|suspension/.test(text)) return ['wheel', 'leg', 'footpad', 'bogie', 'suspension'];
  if (/seismometer|seismic|easep|alsep/.test(text)) return ['seismometer', 'seismic', 'easep', 'alsep', 'science'];
  if (/hp3|ida|arm|sampler|scoop|drill|apxs|collector|instrument/.test(text)) return ['hp3', 'ida', 'arm', 'sampler', 'scoop', 'drill', 'apxs', 'instrument'];
  if (/plaque/.test(text)) return ['plaque'];
  return [];
}

function findNamedHardware(rig, hotspot) {
  const aliases = getHotspotAliases(hotspot);
  if (aliases.length === 0) return null;
  const matches = [];
  rig.traverse((node) => {
    if (node === rig || (!node.isMesh && node.children.length === 0)) return;
    const label = `${node.name || ''} ${node.userData?.hardwarePart || ''}`.toLowerCase();
    if (!aliases.some((alias) => label.includes(alias))) return;
    const bounds = new THREE.Box3().setFromObject(node);
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new THREE.Vector3());
    matches.push({ node, volume: Math.max(size.x * size.y * size.z, 0.000001) });
  });
  matches.sort((first, second) => first.volume - second.volume);
  return matches[0]?.node || null;
}

function raycastHardwareSurface(rig, target, hotspot, index) {
  const region = getHotspotRegion(hotspot);
  const directions = {
    top: new THREE.Vector3(0, 1, 0),
    side: new THREE.Vector3(index % 2 === 0 ? 1 : -1, 0.12, 0),
    lower: new THREE.Vector3(0.48, -1, 0.42),
    rear: new THREE.Vector3(0, 0.12, -1),
    front: new THREE.Vector3(0.48, 0.08, 1),
  };
  const bounds = new THREE.Box3().setFromObject(target);
  if (bounds.isEmpty()) return null;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const range = Math.max(size.length(), 0.2);
  const direction = directions[region] || directions.top;
  const raycaster = new THREE.Raycaster();
  const origins = [direction, direction.clone().negate()];

  for (const outward of origins) {
    raycaster.set(center.clone().addScaledVector(outward, range * 1.6), outward.clone().negate());
    raycaster.far = range * 3.2;
    const hit = raycaster.intersectObject(target, true)[0];
    if (!hit) continue;
    const normal = hit.face?.normal?.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
    const point = hit.point.clone();
    if (normal) point.addScaledVector(normal, 0.012);
    return rig.worldToLocal(point).toArray();
  }

  return null;
}

function buildHotspotPositions(rig, hotspots) {
  if (!rig) return [];
  rig.updateWorldMatrix(true, true);
  return hotspots.map((hotspot, index) => {
    const namedPart = findNamedHardware(rig, hotspot);
    return raycastHardwareSurface(rig, namedPart || rig, hotspot, index);
  });
}

function HotspotNode({ hotspot, position, onClick, selected, language }) {
  const part = language === 'ar'
    ? hotspot.partAr || hotspot.titleAr || hotspot.part || hotspot.title
    : hotspot.part || hotspot.title;
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
    <Html fullscreen zIndexRange={[9, 9]}>
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
  const modelInfo = getRelicModelInfo(item);
  const modelPath = modelInfo.modelPath;
  const isRealModel = Boolean(modelPath);
  const storyRig = useRef(null);
  const [modelReadyId, setModelReadyId] = useState(null);
  const [modelBounds, setModelBounds] = useState(null);
  const modelReady = modelReadyId === item.id;
  const onModelReady = useMemo(() => () => setModelReadyId(item.id), [item.id]);
  const onBoundsReady = useMemo(() => (bounds) => setModelBounds(bounds), []);
  useEffect(() => { setModelBounds(null); }, [item.id]);
  const dataHotspots = useMemo(() => (item.hotspots || []).slice(0, 3), [item.hotspots]);
  const hotspotPositions = useMemo(() => modelReady ? buildHotspotPositions(storyRig.current, dataHotspots) : [], [dataHotspots, item.id, modelReady]);
  const selectedIndex = dataHotspots.findIndex((spot) => selectedHotspot && ((selectedHotspot.part && selectedHotspot.part === spot.part) || (!selectedHotspot.part && selectedHotspot.title === spot.title)));
  const chapterId = storyProgress?.chapter || 'hero';
  const chapterIndex = storyProgress?.index ?? 0;
  const chapterHotspotIndex = chapterId.startsWith('hardware-') ? Number(chapterId.slice('hardware-'.length)) : -1;
  const focusIndex = chapterHotspotIndex >= 0 ? chapterHotspotIndex : selectedIndex;
  const copySideRef = useRef('left');
  useEffect(() => {
    const chapter = document.getElementById(`mission-chapter-${chapterId}`);
    const copy = chapter?.querySelector('.chapter-copy');
    if (!copy) return;
    const rect = copy.getBoundingClientRect();
    if (!rect.width) return;
    copySideRef.current = (rect.left + rect.width / 2) > window.innerWidth / 2 ? 'right' : 'left';
  }, [chapterId, item.id]);
  const previousMotionRef = useRef({ chapterId, focusIndex, chapterIndex });

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
    // Frame from the model's real footprint: a long tube (Kepler) and a wide
    // lander (Apollo) must not share one hardcoded camera distance.
    const modelSpan = modelBounds ? Math.max(modelBounds.size[0], modelBounds.size[1], modelBounds.size[2]) : 2.2;
    const modelWidth = modelBounds ? Math.max(modelBounds.size[0], modelBounds.size[2]) : 2.2;
    const mobileLift = compactLayout ? 0.55 : 0;
    const focusPoint = focusIndex >= 0 && hotspotPositions[focusIndex] ? new THREE.Vector3(...hotspotPositions[focusIndex]) : new THREE.Vector3(0, 0, 0);
    const focusWorld = rig.localToWorld(focusPoint);
    const rigCenter = rig.getWorldPosition(new THREE.Vector3());
    const cameraFocus = compactLayout ? rigCenter : new THREE.Vector3(0, focusWorld.y, 0);
    const targetYaw = focusIndex >= 0 ? [0.48, -0.72, 1.08][focusIndex] ?? 0.2 : chapterId === 'transmission' ? 0.12 : -0.18;
    const targetTilt = focusIndex >= 0 ? [0.1, -0.08, 0.17][focusIndex] ?? 0 : 0.015;
    const fitDistance = (modelSpan / 2) / Math.tan((camera.fov * Math.PI) / 360);
    const cameraDistance = compactLayout
      ? Math.max(6.4, fitDistance * 2.1)
      : isHardwareChapter
        ? Math.max(4.6, fitDistance * 1.75)
        : chapterId === 'hero' && size.width >= 1024
          ? Math.max(5.25, fitDistance * 2.05)
          : Math.max(4.7, fitDistance * 1.85);
    // Park the hardware in the empty column next to the copy. The offset is
    // solved in screen space, so the model can never drift under the text.
    const halfWidth = Math.tan((camera.fov * Math.PI) / 360) * cameraDistance * (size.width / Math.max(1, size.height));
    const modelHalf = Math.min(modelWidth, modelSpan) * 0.5;
    const safeFraction = copySideRef.current === 'right' ? 0.27 : 0.73;
    const ndcX = safeFraction * 2 - 1;
    const limit = Math.max(0.2, halfWidth - modelHalf * 1.15 - 0.16);
    let targetX = compactLayout ? 0 : Math.max(-limit, Math.min(limit, ndcX * halfWidth));
    if (isHardwareChapter && !compactLayout) targetX *= 1.04;
    rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, targetYaw + (autoRotate ? Math.sin(state.clock.elapsedTime * 0.32) * 0.035 : 0), 1.8, delta);
    rig.rotation.x = THREE.MathUtils.damp(rig.rotation.x, targetTilt, 1.8, delta);
    rig.position.x = THREE.MathUtils.damp(rig.position.x, targetX, 1.8, delta);
    rig.position.y = THREE.MathUtils.damp(rig.position.y, mobileLift + (isHardwareChapter ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * 0.035), 1.8, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraFocus.x + (compactLayout ? 0 : state.pointer.x * 0.09), 1.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraFocus.y + 0.14 + (compactLayout ? 0 : state.pointer.y * 0.07), 1.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraFocus.z + cameraDistance, 1.4, delta);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.x = THREE.MathUtils.damp(controls.target.x, cameraFocus.x + (compactLayout ? 0 : state.pointer.x * 0.035), 1.4, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, cameraFocus.y + (compactLayout ? -0.6 : state.pointer.y * 0.025), 1.4, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, cameraFocus.z, 1.4, delta);
      controls.update();
    }
  });

  return (
    <>
      <color attach="background" args={['#03060C']} />
      <fog attach="fog" args={['#03060C', 20, 64]} />
      <ambientLight intensity={0.55} color="#cbd5e1" />
      <hemisphereLight args={['#dbeafe', '#1b2736', 0.42]} />
      <directionalLight position={[4, 6, 5]} intensity={2.3} color="#fff7ed" />
      <directionalLight position={[-6, -3, -5]} intensity={0.58} color="#60a5fa" />
      <pointLight position={[0, 4, -5]} intensity={0.18} color="#EAB308" distance={18} />
      <pointLight position={[0, 4, 4]} intensity={0.48} color="#dbe5ee" distance={18} />
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
            fallback={<HoloRelic item={item} onModelReady={onModelReady} />}
          >
            <Suspense fallback={<Html center transform={false} className="loader-html"><SpaceLoader language={language} kind="model" compact /></Html>}>
              <GltfModel modelPath={modelPath} item={item} onModelReady={onModelReady} onBoundsReady={onBoundsReady} descentStageOnly={isApolloLunarModule} preserveMaterials />
            </Suspense>
          </ModelErrorBoundary>
        ) : <HoloRelic item={item} onModelReady={onModelReady} />}
        {focusIndex >= 0 && dataHotspots[focusIndex] && hotspotPositions[focusIndex] && (
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
      <OrbitControls ref={controlsRef} makeDefault target={[0, 0, 0]} enablePan={false} rotateSpeed={0.65} minDistance={2.05} maxDistance={9} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={0.34} />
    </>
  );
}

function CameraFlight({ selectedId, controlsRef }) {
  const { camera, size } = useThree();
  const flight = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    flight.current = {
      elapsed: 0,
      duration: 0.9,
      fromPosition: camera.position.clone(),
      fromTarget: controls?.target.clone() || new THREE.Vector3(0, 0, 0),
      toPosition: selectedId
        ? new THREE.Vector3(0, 1.4, 4.5)
        : new THREE.Vector3(0, 0.1, mapDistanceFor(size.width, size.height, 2.6, camera.fov)),
      toTarget: new THREE.Vector3(0, 0, 0),
    };
  }, [camera, controlsRef, selectedId, size.width, size.height]);

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

function useCompactViewport() {
  const [compact, setCompact] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < 760));
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => setCompact(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return compact;
}

export default function Space3DCanvas({ relics, filter, selectedRelic, onSelect, language, hotspot, setHotspot, storyProgress, archiveOpen = true }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const compactView = useCompactViewport();
  const controlsRef = useRef(null);
  const viewFilter = selectedRelic?.body || filter;
  const isArabic = language === 'ar';

  const selectFromBeacon = (item) => onSelect(item);

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
    <div className="space-canvas-wrap" onPointerDownCapture={() => setAutoRotate(false)} onTouchStartCapture={() => setAutoRotate(false)}>
      <Canvas
        shadows={!compactView}
        dpr={compactView ? [1, 1.3] : [1, 1.75]}
        camera={{ position: [0, 0.1, 8.4], fov: 40, near: 0.1, far: 140 }}
        gl={{ antialias: !compactView, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: compactView ? 0.4 : 0.55, debounce: 350 }}
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
      {!selectedRelic && !archiveOpen && relics.length > 0 && (
        <div className="quick-mission-carousel" role="group" aria-label={isArabic ? 'مهمات سريعة لهذا المشهد' : 'Quick missions for this view'}>
          <span className="quick-mission-heading">{isArabic ? 'مهمات سريعة' : 'QUICK MISSIONS'}</span>
          <div className="quick-mission-track">
            {relics.map((item) => (
              <button className={`quick-mission-pill ${item.body === 'Mars' ? 'is-mars' : item.body === 'Moon' ? 'is-moon' : 'is-orbit'}`} type="button" key={item.id} onClick={() => onSelect(item)}>
                <span aria-hidden="true">{item.body === 'Mars' ? '🔴' : item.body === 'Moon' ? '🌕' : '✦'}</span>
                <span dir="auto">{missionPinLabel(item)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="canvas-tools">
        <span className="render-state"><Activity size={13} />{selectedRelic ? (isArabic ? 'نموذج تفاعلي ثلاثي الأبعاد' : '3D INTERACTIVE MODEL') : celestialView === 'Deep Space' ? (isArabic ? 'مشهد مداري' : 'ORBITAL MISSION SCENE') : (isArabic ? 'مشهد الكوكب' : 'Planet view')}</span>
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
