import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Strut({ start, end, radius = 0.025, color = '#c5ccd2', metalness = 0.78 }) {
  const delta = useMemo(() => new THREE.Vector3(...end).sub(new THREE.Vector3(...start)), [start, end]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize()), [delta]);
  const center = useMemo(() => new THREE.Vector3(...start).add(new THREE.Vector3(...end)).multiplyScalar(0.5), [start, end]);
  return (
    <mesh position={center.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius * 0.72, radius, delta.length(), 12]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={0.28} envMapIntensity={1.25} />
    </mesh>
  );
}

function SolarWing({ position = [0, 0, 0], rotation = [0, 0, 0], width = 0.9, height = 0.72, columns = 4, rows = 3 }) {
  const cells = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellWidth = (width - 0.12) / columns;
    const cellHeight = (height - 0.12) / rows;
    return {
      key: `${column}-${row}`,
      x: -width / 2 + 0.06 + cellWidth * (column + 0.5),
      z: -height / 2 + 0.06 + cellHeight * (row + 0.5),
      cellWidth,
      cellHeight,
    };
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.055, height]} />
        <meshStandardMaterial color="#606a73" metalness={0.82} roughness={0.3} envMapIntensity={1.3} />
      </mesh>
      {cells.map((cell) => (
        <mesh key={cell.key} position={[cell.x, 0.033, cell.z]} castShadow>
          <boxGeometry args={[cell.cellWidth - 0.018, 0.018, cell.cellHeight - 0.018]} />
          <meshPhysicalMaterial color="#18375a" metalness={0.68} roughness={0.3} clearcoat={0.35} clearcoatRoughness={0.28} envMapIntensity={1.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.046, 0]}>
        <boxGeometry args={[0.012, 0.012, height - 0.1]} />
        <meshStandardMaterial color="#aab6c0" metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

function AntennaDish({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.28, color = '#cbd2d8' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[radius, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.34]} />
        <meshPhysicalMaterial color={color} metalness={0.82} roughness={0.24} clearcoat={0.42} side={THREE.DoubleSide} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, radius * 0.24, radius * 0.54]}>
        <cylinderGeometry args={[0.018, 0.028, radius * 0.42, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, radius * 0.24, radius * 0.54]}>
        <sphereGeometry args={[0.042, 16, 12]} />
        <meshStandardMaterial color="#e1c263" metalness={0.78} roughness={0.23} />
      </mesh>
    </group>
  );
}

function Wheel({ position }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.205, 0.205, 0.14, 32]} />
        <meshStandardMaterial color="#252d34" metalness={0.48} roughness={0.52} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.112, 0.112, 0.152, 24]} />
        <meshStandardMaterial color="#aeb7be" metalness={0.82} roughness={0.25} envMapIntensity={1.4} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.18, 0.018, 8, 28]} />
        <meshStandardMaterial color="#616c73" metalness={0.62} roughness={0.37} />
      </mesh>
    </group>
  );
}

function RoverModel() {
  const wheels = [-1, 0, 1].flatMap((x) => [-1, 1].map((side) => [x * 0.72, -0.36, side * 0.62]));
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[1.14, 0.32, 0.9]} />
        <meshPhysicalMaterial color="#c6cbd0" metalness={0.78} roughness={0.27} clearcoat={0.28} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.88, 0.12, 0.7]} />
        <meshStandardMaterial color="#414b53" metalness={0.7} roughness={0.34} />
      </mesh>
      {wheels.map((wheel, index) => (
        <group key={`wheel-${index}`}>
          <Strut start={[wheel[0] * 0.73, -0.06, wheel[2] * 0.7]} end={wheel} radius={0.035} />
          <Wheel position={wheel} />
        </group>
      ))}
      <SolarWing position={[-1.02, 0.12, 0]} rotation={[0, 0, -0.06]} width={0.82} height={0.72} columns={4} rows={3} />
      <SolarWing position={[1.02, 0.12, 0]} rotation={[0, 0, 0.06]} width={0.82} height={0.72} columns={4} rows={3} />
      <Strut start={[0, 0.24, -0.12]} end={[0, 0.84, -0.12]} radius={0.035} />
      <mesh position={[0, 0.91, -0.12]} castShadow>
        <boxGeometry args={[0.34, 0.2, 0.28]} />
        <meshPhysicalMaterial color="#d4d8dd" metalness={0.76} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.92, 0.028]}>
        <boxGeometry args={[0.14, 0.08, 0.025]} />
        <meshStandardMaterial color="#111a22" metalness={0.56} roughness={0.22} />
      </mesh>
      <mesh position={[0.09, 0.93, 0.046]}>
        <sphereGeometry args={[0.027, 16, 12]} />
        <meshPhysicalMaterial color="#5d99ba" metalness={0.32} roughness={0.13} clearcoat={0.8} />
      </mesh>
      <AntennaDish position={[-0.34, 0.57, 0.38]} rotation={[0.32, 0, 0]} radius={0.2} />
      <mesh position={[0.34, 0.36, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.3, 20]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

function LanderModel() {
  const legs = [-1, 1].flatMap((x) => [-1, 1].map((z) => ({
    upper: [x * 0.34, 0.34, z * 0.31],
    foot: [x * 0.84, -0.72, z * 0.72],
  })));
  return (
    <group>
      <mesh position={[0, 0.53, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.68, 0.52, 8]} />
        <meshPhysicalMaterial color="#c4c8c9" metalness={0.72} roughness={0.31} clearcoat={0.25} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.52, 0.62, 0.16, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} clearcoat={0.45} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const x = Math.sin(angle) * 0.63;
        const z = Math.cos(angle) * 0.63;
        return (
          <mesh key={`foil-${index}`} position={[x, 0.54, z]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.39, 0.38, 0.035]} />
            <meshPhysicalMaterial color={index % 2 ? '#c79e2c' : '#d4af37'} metalness={0.86} roughness={0.23} clearcoat={0.38} />
          </mesh>
        );
      })}
      {legs.map(({ upper, foot }, index) => (
        <group key={`leg-${index}`}>
          <Strut start={upper} end={foot} radius={0.035} />
          <Strut start={[upper[0] * 0.72, upper[1] - 0.08, upper[2] * 0.72]} end={[foot[0] * 0.84, foot[1] + 0.08, foot[2] * 0.84]} radius={0.018} color="#d4af37" metalness={0.84} />
          <mesh position={foot} rotation={[0.08, 0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 0.055, 24]} />
            <meshStandardMaterial color="#aeb6bc" metalness={0.82} roughness={0.28} />
          </mesh>
        </group>
      ))}
      <AntennaDish position={[0.48, 0.78, 0.12]} rotation={[0.52, 0, -0.5]} radius={0.25} />
      <mesh position={[-0.64, 0.46, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.095, 0.095, 0.42, 20]} />
        <meshStandardMaterial color="#c99d36" metalness={0.8} roughness={0.24} />
      </mesh>
      <mesh position={[0.02, 0.9, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.32, 16]} />
        <meshStandardMaterial color="#b5bec5" metalness={0.8} roughness={0.27} />
      </mesh>
      <SolarWing position={[0, 0.92, -0.8]} rotation={[-0.18, 0, 0]} width={0.62} height={0.42} columns={3} rows={2} />
    </group>
  );
}

function EagleDescentStageModel() {
  const legs = [-1, 1].flatMap((x) => [-1, 1].map((z) => ({
    upper: [x * 0.36, 0.34, z * 0.34],
    foot: [x * 0.84, -0.72, z * 0.72],
  })));
  const facePanels = Array.from({ length: 8 }, (_, index) => {
    const angle = ((index + 0.5) / 8) * Math.PI * 2;
    const radius = 0.674;
    return {
      key: `foil-panel-${index}`,
      position: [Math.sin(angle) * radius, 0.54, Math.cos(angle) * radius],
      rotation: angle,
      color: index % 2 ? '#bb985d' : '#c8a66b',
    };
  });
  const frameCorners = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2;
    return [Math.sin(angle) * 0.7, Math.cos(angle) * 0.7];
  });

  return (
    <group>
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.72, 0.52, 8]} />
        <meshPhysicalMaterial color="#b99152" metalness={0.38} roughness={0.48} clearcoat={0.16} clearcoatRoughness={0.42} />
      </mesh>
      {facePanels.map((panel) => (
        <mesh key={panel.key} position={panel.position} rotation={[0, panel.rotation, 0]}>
          <boxGeometry args={[0.35, 0.27, 0.012]} />
          <meshStandardMaterial color={panel.color} metalness={0.28} roughness={0.52} />
        </mesh>
      ))}
      {frameCorners.map(([x, z], index) => (
        <Strut key={`frame-${index}`} start={[x * 0.94, 0.29, z * 0.94]} end={[x * 0.88, 0.79, z * 0.88]} radius={0.018} color="#d4c08f" metalness={0.48} />
      ))}
      {[0.29, 0.79].map((y) => (
        <mesh key={`deck-ring-${y}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[y === 0.29 ? 0.69 : 0.61, 0.018, 8, 48]} />
          <meshStandardMaterial color="#d2b77c" metalness={0.52} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.075, 8]} />
        <meshStandardMaterial color="#9fa8a9" metalness={0.42} roughness={0.48} />
      </mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`deck-equipment-${x}-${z}`} position={[x * 0.23, 0.88, z * 0.2]} castShadow>
          <boxGeometry args={[0.16, 0.07, 0.13]} />
          <meshStandardMaterial color="#777b73" metalness={0.32} roughness={0.56} />
        </mesh>
      )))}
      {legs.map(({ upper, foot }, index) => (
        <group key={`landing-leg-${index}`}>
          <Strut start={upper} end={foot} radius={0.032} color="#aeb7b9" metalness={0.54} />
          <Strut
            start={[upper[0] * 0.9, upper[1] - 0.05, upper[2] * 0.9]}
            end={[foot[0] * 0.94, foot[1] + 0.12, foot[2] * 0.94]}
            radius={0.014}
            color="#c9ac6a"
            metalness={0.42}
          />
          <mesh position={foot} castShadow>
            <cylinderGeometry args={[0.145, 0.17, 0.06, 24]} />
            <meshStandardMaterial color="#8f999b" metalness={0.4} roughness={0.52} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.22, 0.25, 12, 1, true]} />
        <meshStandardMaterial color="#747b7c" metalness={0.56} roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.43, 0.95]} castShadow>
        <boxGeometry args={[0.25, 0.17, 0.2]} />
        <meshStandardMaterial color="#92978d" metalness={0.25} roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.32, 0.95]}>
        <boxGeometry args={[0.22, 0.035, 0.17]} />
        <meshStandardMaterial color="#c6a960" metalness={0.34} roughness={0.54} />
      </mesh>
      <Strut start={[0, -0.34, 0.95]} end={[0, -0.16, 0.95]} radius={0.012} color="#b8bdb7" metalness={0.36} />
      <SolarWing position={[0.18, -0.31, 1.06]} rotation={[0, 0, 0]} width={0.3} height={0.18} columns={3} rows={2} />
      <SolarWing position={[-0.18, -0.31, 1.06]} rotation={[0, 0, 0]} width={0.3} height={0.18} columns={3} rows={2} />
    </group>
  );
}

function ScientificPackageModel() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.92, 0.28, 0.78]} />
        <meshPhysicalMaterial color="#cbd0d2" metalness={0.72} roughness={0.28} clearcoat={0.25} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.62, 0.22, 0.52]} />
        <meshPhysicalMaterial color="#d4af37" metalness={0.86} roughness={0.23} clearcoat={0.36} />
      </mesh>
      <mesh position={[0, 0.57, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.28, 12]} />
        <meshStandardMaterial color="#aeb7bc" metalness={0.8} roughness={0.28} />
      </mesh>
      <SolarWing position={[0.94, 0.16, 0]} rotation={[0, 0, 0.05]} width={0.82} height={0.7} columns={4} rows={3} />
      <Strut start={[0.18, 0.5, 0]} end={[0.18, 1.0, 0]} radius={0.025} />
      <AntennaDish position={[-0.33, 0.64, 0.32]} rotation={[0.4, 0, 0]} radius={0.22} />
      <mesh position={[-0.52, 0.26, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.38, 18]} />
        <meshStandardMaterial color="#c7952f" metalness={0.82} roughness={0.24} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Strut start={[side * 0.26, 0.12, 0]} end={[side * 0.5, -0.42, 0.26]} radius={0.025} />
          <mesh position={[side * 0.5, -0.43, 0.26]}>
            <cylinderGeometry args={[0.12, 0.14, 0.045, 20]} />
            <meshStandardMaterial color="#9da7ae" metalness={0.8} roughness={0.29} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RotorcraftModel() {
  const rotor = useRef();
  useFrame((_, delta) => { if (rotor.current) rotor.current.rotation.y += delta * 0.85; });
  return (
    <group>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.56, 0.28, 0.4]} />
        <meshPhysicalMaterial color="#d4d8dd" metalness={0.72} roughness={0.28} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0.21]}>
        <boxGeometry args={[0.18, 0.12, 0.045]} />
        <meshPhysicalMaterial color="#3f6b80" metalness={0.32} roughness={0.2} clearcoat={0.75} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Strut start={[side * 0.14, 0.28, 0]} end={[side * 0.25, -0.18, 0]} radius={0.022} color="#bdc4ca" />
          <mesh position={[side * 0.25, -0.2, 0]}>
            <sphereGeometry args={[0.07, 18, 12]} />
            <meshStandardMaterial color="#323c45" metalness={0.55} roughness={0.42} />
          </mesh>
        </group>
      ))}
      <Strut start={[0, 0.49, 0]} end={[0, 0.91, 0]} radius={0.026} />
      <group ref={rotor} position={[0, 0.94, 0]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[2.15, 0.045, 0.12]} />
          <meshStandardMaterial color="#4b555d" metalness={0.62} roughness={0.34} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.026, 0]}>
          <boxGeometry args={[1.45, 0.045, 0.11]} />
          <meshStandardMaterial color="#59646d" metalness={0.62} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.1, 20]} />
          <meshStandardMaterial color="#d4af37" metalness={0.84} roughness={0.23} />
        </mesh>
      </group>
      <SolarWing position={[0, 0.18, -0.48]} width={0.48} height={0.38} columns={3} rows={2} />
    </group>
  );
}

function ProbeModel() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.64, 8]} />
        <meshPhysicalMaterial color="#c3cbd0" metalness={0.78} roughness={0.27} clearcoat={0.28} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.43, 0.43, 0.18, 8]} />
        <meshPhysicalMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
      <SolarWing position={[-1.04, 0.05, 0]} width={0.92} height={0.86} columns={4} rows={4} />
      <SolarWing position={[1.04, 0.05, 0]} width={0.92} height={0.86} columns={4} rows={4} />
      <Strut start={[0, 0.34, 0]} end={[0, 0.82, 0]} radius={0.028} />
      <AntennaDish position={[0, 0.84, 0.28]} rotation={[0.5, 0, 0]} radius={0.34} />
      <Strut start={[-0.2, -0.22, 0]} end={[-0.2, -0.7, 0]} radius={0.03} color="#d4af37" />
      <Strut start={[0.2, -0.22, 0]} end={[0.2, -0.7, 0]} radius={0.03} color="#d4af37" />
      <mesh position={[0, -0.71, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.05, 18]} />
        <meshStandardMaterial color="#aeb8bf" metalness={0.8} roughness={0.28} />
      </mesh>
    </group>
  );
}

function ModelByType({ item }) {
  const type = (item.type || '').toLowerCase();
  if (type.includes('rover')) return <RoverModel />;
  if (item.id === 'apollo-11-eagle-descent-stage') return <EagleDescentStageModel />;
  if (type.includes('lander')) return <LanderModel />;
  if (type.includes('scientific')) return <ScientificPackageModel />;
  if (type.includes('rotor')) return <RotorcraftModel />;
  return <ProbeModel />;
}

export default function HoloRelic({ item }) {
  return (
    <group scale={0.96}>
      <ModelByType item={item} />
    </group>
  );
}
