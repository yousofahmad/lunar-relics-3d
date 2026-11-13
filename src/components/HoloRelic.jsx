import { Float } from '@react-three/drei';

function WireBox({ position, scale, color = '#67e7ff', rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.38} wireframe transparent opacity={0.8} metalness={0.25} roughness={0.42} />
    </mesh>
  );
}

function SolidBox({ position, scale, color = '#15364a', rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive="#33b9da" emissiveIntensity={0.08} metalness={0.72} roughness={0.35} />
    </mesh>
  );
}

function Wheel({ position }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.12, 18]} />
        <meshStandardMaterial color="#10212d" emissive="#43cee6" emissiveIntensity={0.14} metalness={0.75} roughness={0.5} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.11, 0.11, 0.126, 16]} />
        <meshStandardMaterial color="#69e8ff" emissive="#69e8ff" emissiveIntensity={0.55} wireframe />
      </mesh>
    </group>
  );
}

function RoverModel() {
  return (
    <group>
      <SolidBox position={[0, 0.18, 0]} scale={[1.15, 0.28, 0.75]} />
      <WireBox position={[0, 0.18, 0]} scale={[1.2, 0.33, 0.82]} />
      {[-0.56, 0.56].map((x) => [-0.42, 0.42].map((z) => <Wheel key={`${x}-${z}`} position={[x, -0.12, z]} />))}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.85, 8]} />
        <meshStandardMaterial color="#92efff" emissive="#52d8f0" emissiveIntensity={0.6} wireframe />
      </mesh>
      <WireBox position={[0.18, 1.17, 0]} scale={[0.36, 0.24, 0.3]} />
      <mesh position={[-0.57, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.23, 12]} />
        <meshStandardMaterial color="#ffbf69" emissive="#ff9d55" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

function LanderModel() {
  return (
    <group>
      <SolidBox position={[0, 0.44, 0]} scale={[0.82, 0.48, 0.72]} color="#244450" />
      <WireBox position={[0, 0.44, 0]} scale={[0.9, 0.54, 0.8]} />
      <mesh position={[0, 0.93, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.22, 0.3, 4]} />
        <meshStandardMaterial color="#ffbf69" emissive="#ffb24e" emissiveIntensity={0.48} wireframe />
      </mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <group key={`${x}-${z}`} position={[x * 0.36, 0.2, z * 0.31]} rotation={[0, 0, x * -0.4]}>
          <mesh position={[0, -0.34, 0]} rotation={[0, 0, -0.24]}>
            <cylinderGeometry args={[0.025, 0.025, 0.62, 6]} />
            <meshStandardMaterial color="#8deeff" emissive="#48b7ce" emissiveIntensity={0.45} wireframe />
          </mesh>
          <mesh position={[0.08, -0.65, 0]} scale={[0.25, 0.035, 0.22]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#69e8ff" emissive="#69e8ff" emissiveIntensity={0.3} wireframe />
          </mesh>
        </group>
      )))}
      <mesh position={[0.54, 0.58, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.035, 24]} />
        <meshStandardMaterial color="#84eefe" emissive="#69e8ff" emissiveIntensity={0.4} wireframe />
      </mesh>
    </group>
  );
}

function ScientificPackageModel() {
  return (
    <group>
      <WireBox position={[0, 0.32, 0]} scale={[0.74, 0.62, 0.58]} />
      <SolidBox position={[0, 0.32, 0]} scale={[0.68, 0.54, 0.5]} color="#193e4b" />
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 8]} />
        <meshStandardMaterial color="#7beaff" emissive="#60e6ff" emissiveIntensity={0.7} wireframe />
      </mesh>
      {[-1, 1].map((side) => <group key={side} position={[side * 0.78, 0.45, 0]}>
        <WireBox position={[0, 0, 0]} scale={[0.76, 0.44, 0.06]} color="#8cefff" />
        {[-0.22, 0, 0.22].map((x) => <mesh key={x} position={[x, 0, 0.035]} scale={[0.012, 0.2, 0.008]}><boxGeometry /><meshBasicMaterial color="#baf7ff" /></mesh>)}
      </group>)}
      <mesh position={[0.12, 0.64, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.025, 6, 24]} /><meshStandardMaterial color="#ffbf69" emissive="#ffbf69" emissiveIntensity={0.4} wireframe />
      </mesh>
    </group>
  );
}

function RotorcraftModel() {
  return (
    <group>
      <SolidBox position={[0, 0.52, 0]} scale={[0.55, 0.28, 0.4]} />
      <WireBox position={[0, 0.52, 0]} scale={[0.64, 0.35, 0.47]} />
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.035, 0.035, 0.55, 8]} /><meshStandardMaterial color="#7cecff" emissive="#67e8ff" emissiveIntensity={0.6} wireframe /></mesh>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[2.15, 0.035, 0.07]} /><meshStandardMaterial color="#9df2ff" emissive="#69e8ff" emissiveIntensity={0.7} wireframe /></mesh>
      <mesh position={[0, 1.18, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[1.25, 0.035, 0.07]} /><meshStandardMaterial color="#9df2ff" emissive="#69e8ff" emissiveIntensity={0.7} wireframe /></mesh>
      {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, 0.2, 0]}><cylinderGeometry args={[0.025, 0.025, 0.55, 6]} /><meshStandardMaterial color="#ffbf69" emissive="#ffbf69" emissiveIntensity={0.5} wireframe /></mesh>)}
      <mesh position={[0, 0.01, 0]}><sphereGeometry args={[0.05, 12, 10]} /><meshStandardMaterial color="#ffbf69" emissive="#ffbf69" emissiveIntensity={0.9} /></mesh>
    </group>
  );
}

function ProbeModel() {
  return (
    <group>
      <WireBox position={[0, 0.18, 0]} scale={[0.62, 0.62, 0.62]} />
      <SolidBox position={[0, 0.18, 0]} scale={[0.5, 0.5, 0.5]} color="#183d53" />
      {[-1, 1].map((side) => <group key={side} position={[side * 0.85, 0.18, 0]}>
        <WireBox scale={[1.03, 0.53, 0.06]} color="#72eaff" />
        {[-0.33, 0, 0.33].map((x) => <mesh key={x} position={[x, 0, 0.04]} scale={[0.018, 0.24, 0.008]}><boxGeometry /><meshBasicMaterial color="#d1faff" /></mesh>)}
      </group>)}
      <mesh position={[0, 0.83, 0]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.32, 0.22, 24, 1, true]} /><meshStandardMaterial color="#aaf3ff" emissive="#53d5eb" emissiveIntensity={0.44} wireframe side={2} /></mesh>
      <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.035, 0.035, 0.7, 8]} /><meshStandardMaterial color="#91eeff" emissive="#69e8ff" emissiveIntensity={0.5} wireframe /></mesh>
    </group>
  );
}

function ModelByType({ item }) {
  const type = (item.type || '').toLowerCase();
  if (type.includes('rover')) return <RoverModel />;
  if (type.includes('lander')) return <LanderModel />;
  if (type.includes('scientific')) return <ScientificPackageModel />;
  if (type.includes('rotor')) return <RotorcraftModel />;
  return <ProbeModel />;
}

export default function HoloRelic({ item }) {
  return (
    <Float speed={0.5} rotationIntensity={0.08} floatIntensity={0.14} floatingRange={[-0.08, 0.08]}>
      <group scale={0.96}>
        <ModelByType item={item} />
      </group>
    </Float>
  );
}
