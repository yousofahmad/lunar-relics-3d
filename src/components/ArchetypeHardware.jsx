import * as THREE from 'three';

function Strut({ start, end, radius = 0.018, color = '#c7cdd2' }) {
  const delta = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
  const center = new THREE.Vector3(...start).add(new THREE.Vector3(...end)).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
  return (
    <mesh position={center.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius * 0.7, radius, delta.length(), 10]} />
      <meshStandardMaterial color={color} metalness={0.78} roughness={0.28} />
    </mesh>
  );
}

function SolarWing({ position, width, height, side }) {
  const columns = 4;
  const rows = 3;
  const cellWidth = (width - 0.08) / columns;
  const cellHeight = (height - 0.08) / rows;
  return (
    <group name={`hardware-solar-panel-${side}`} position={position}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.035, height]} />
        <meshStandardMaterial color="#596672" metalness={0.82} roughness={0.3} />
      </mesh>
      {Array.from({ length: columns * rows }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = -width / 2 + 0.04 + cellWidth * (column + 0.5);
        const z = -height / 2 + 0.04 + cellHeight * (row + 0.5);
        return (
          <mesh key={`${column}-${row}`} position={[x, 0.024, z]} castShadow>
            <boxGeometry args={[cellWidth - 0.012, 0.012, cellHeight - 0.012]} />
            <meshPhysicalMaterial color="#17375a" metalness={0.7} roughness={0.28} clearcoat={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

function PhoenixHardware({ bounds }) {
  const [width, height, depth] = bounds.size;
  const left = bounds.min[0];
  const right = bounds.max[0];
  const deckY = bounds.min[1] + height * 0.59;
  const panelWidth = THREE.MathUtils.clamp(width * 0.37, 0.48, 0.78);
  const panelHeight = THREE.MathUtils.clamp(depth * 0.42, 0.42, 0.7);
  const armZ = bounds.max[2] * 0.8;
  return (
    <group name="phoenix-class-hardware">
      {[-1, 1].map((side) => {
        const x = side < 0 ? left - panelWidth * 0.55 : right + panelWidth * 0.55;
        const bodyX = side < 0 ? left + width * 0.18 : right - width * 0.18;
        const sideName = side < 0 ? 'left' : 'right';
        return (
          <group key={sideName}>
            <Strut start={[bodyX, deckY, 0]} end={[x - side * panelWidth * 0.38, deckY + 0.03, 0]} radius={0.022} color="#d2b35f" />
            <SolarWing position={[x, deckY + 0.045, 0]} width={panelWidth} height={panelHeight} side={sideName} />
          </group>
        );
      })}
      <group name="hardware-robotic-arm">
        <Strut start={[bounds.min[0] + width * 0.16, deckY, armZ * 0.18]} end={[bounds.min[0] + width * 0.55, deckY - height * 0.22, armZ]} radius={0.024} color="#c7cdd2" />
        <mesh position={[bounds.min[0] + width * 0.55, deckY - height * 0.22, armZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.16, 16]} />
          <meshStandardMaterial color="#c5a24a" metalness={0.8} roughness={0.28} />
        </mesh>
        <mesh position={[bounds.min[0] + width * 0.55, deckY - height * 0.2, armZ + depth * 0.05]}>
          <boxGeometry args={[0.12, 0.08, 0.08]} />
          <meshStandardMaterial color="#1d2932" metalness={0.4} roughness={0.32} />
        </mesh>
      </group>
    </group>
  );
}

function SurveyorHardware({ bounds }) {
  const [width, height, depth] = bounds.size;
  const deckY = bounds.min[1] + height * 0.67;
  const armStart = [bounds.min[0] + width * 0.18, deckY, bounds.max[2] * 0.25];
  const armEnd = [bounds.min[0] + width * 0.55, bounds.min[1] + height * 0.23, bounds.max[2] * 0.68];
  return (
    <group name="surveyor-class-hardware">
      <group name="hardware-surface-sampler">
        <Strut start={armStart} end={armEnd} radius={0.024} color="#c7cdd2" />
        <mesh position={armEnd} rotation={[0.18, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.16, 14]} />
          <meshStandardMaterial color="#c9a44e" metalness={0.78} roughness={0.3} />
        </mesh>
        <mesh position={[armEnd[0], armEnd[1] - 0.11, armEnd[2]]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[0.17, 0.035, 0.11]} />
          <meshStandardMaterial color="#9da8ad" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>
      <group name="hardware-surveyor-camera" position={[0, bounds.max[1] + height * 0.055, bounds.max[2] * 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.18, 18]} />
          <meshPhysicalMaterial color="#bdc4c9" metalness={0.7} roughness={0.27} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <circleGeometry args={[0.065, 20]} />
          <meshStandardMaterial color="#18324b" metalness={0.5} roughness={0.18} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function SojournerHardware({ bounds }) {
  const [width, height, depth] = bounds.size;
  const deckY = bounds.min[1] + height * 0.63;
  return (
    <group name="sojourner-class-hardware">
      <group name="hardware-sojourner-solar-array" position={[0, deckY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.42, 0.035, depth * 0.52]} />
          <meshStandardMaterial color="#65717b" metalness={0.78} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.023, 0]}>
          <boxGeometry args={[width * 0.36, 0.012, depth * 0.44]} />
          <meshPhysicalMaterial color="#17375a" metalness={0.72} roughness={0.27} clearcoat={0.4} />
        </mesh>
      </group>
      <group name="hardware-apxs" position={[width * 0.32, bounds.min[1] + height * 0.52, bounds.max[2] * 0.65]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.075, 0.18, 16]} />
          <meshStandardMaterial color="#c4a04b" metalness={0.8} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshStandardMaterial color="#a9b2b8" metalness={0.76} roughness={0.28} />
        </mesh>
      </group>
    </group>
  );
}

export default function ArchetypeHardware({ item, modelBounds }) {
  if (!item || !modelBounds?.size || !modelBounds?.min) return null;
  if (item.id === 'phoenix-lander') return <PhoenixHardware bounds={modelBounds} />;
  if (item.id === 'surveyor-3') return <SurveyorHardware bounds={modelBounds} />;
  if (item.id === 'sojourner-rover') return <SojournerHardware bounds={modelBounds} />;
  return null;
}
