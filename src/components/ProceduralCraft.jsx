// SI disclosure: this file was written with Super Intelligence (Manus AI) and reviewed by the Lunar Relics 3D team.
import React, { useMemo } from 'react';
import * as THREE from 'three';

/* Detailed stand-ins for the relics that have no NASA mesh in the archive.
   Proportions follow the published hardware so they read as the real machine
   instead of a toy block. */

const ALU = { color: '#dbe1e6', metalness: 0.55, roughness: 0.34 };
const FOIL = { color: '#d9b23a', metalness: 0.62, roughness: 0.38 };
const DARK = { color: '#1b222b', metalness: 0.55, roughness: 0.4 };
const WHITE = { color: '#e8ebef', metalness: 0.2, roughness: 0.58 };
// Solar cells read as deep blue glass (like NASA photos), never as black holes.
const CELL = { color: '#2a5fc4', metalness: 0.3, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, emissive: '#0e3484', emissiveIntensity: 0.5 };

function Strut({ start, end, radius = 0.02, color = '#c5ccd2', metalness = 0.82, roughness = 0.3 }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);
    const len = direction.length() || 0.001;
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    return { position: a.clone().add(b).multiplyScalar(0.5).toArray(), quaternion: quat, length: len };
  }, [start, end]);
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshPhysicalMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function Dish({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.2 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.8]} />
        <meshPhysicalMaterial color="#d7dde3" metalness={0.88} roughness={0.24} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WireWheel({ position, radius = 0.28, width = 0.16 }) {
  const spokes = useMemo(() => Array.from({ length: 20 }, (_, i) => (i / 20) * Math.PI * 2), []);
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[radius, 0.022, 8, 40]} />
        <meshPhysicalMaterial color="#c6ccd2" metalness={0.6} roughness={0.34} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius - 0.004, 0.032, 6, 40]} />
        <meshStandardMaterial color="#2a2f36" metalness={0.4} roughness={0.62} />
      </mesh>
      {spokes.map((angle, i) => (
        <mesh key={`spoke-${i}`} position={[Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5, 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[radius * 0.96, 0.006, 0.012]} />
          <meshPhysicalMaterial color="#cdd3d8" metalness={0.88} roughness={0.34} />
        </mesh>
      ))}
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, width * 0.5, 16]} />
        <meshPhysicalMaterial color="#9aa3ab" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SolarDeck({ width, depth, position = [0, 0, 0], rotation = [0, 0, 0], columns = 6, rows = 4 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.018, depth]} />
        <meshPhysicalMaterial color="#8f979e" metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: columns }).map((_, c) =>
        Array.from({ length: rows }).map((__, r) => (
          <mesh
            key={`cell-${c}-${r}`}
            position={[
              -width / 2 + (width / columns) * (c + 0.5),
              0.013,
              -depth / 2 + (depth / rows) * (r + 0.5),
            ]}
          >
            <boxGeometry args={[(width / columns) * 0.88, 0.006, (depth / rows) * 0.88]} />
            <meshPhysicalMaterial {...CELL} />
          </mesh>
        )),
      )}
    </group>
  );
}

/* ---------- Apollo 15 Lunar Roving Vehicle (3.1 m long, 1.83 m wide) ---------- */
export function LrvModel() {
  const wheelSpots = [[0.95, -0.26, 0.66], [0.95, -0.26, -0.66], [-0.95, -0.26, 0.66], [-0.95, -0.26, -0.66]];
  return (
    <group name="lrv">
      {/* tubular chassis */}
      <Strut start={[-1.12, -0.08, 0.5]} end={[1.12, -0.08, 0.5]} radius={0.026} />
      <Strut start={[-1.12, -0.08, -0.5]} end={[1.12, -0.08, -0.5]} radius={0.026} />
      <Strut start={[-1.05, -0.08, 0.5]} end={[-1.05, -0.08, -0.5]} radius={0.02} />
      <Strut start={[1.05, -0.08, 0.5]} end={[1.05, -0.08, -0.5]} radius={0.02} />
      <Strut start={[0, -0.08, 0.5]} end={[0, -0.08, -0.5]} radius={0.018} />
      {/* suspension arms */}
      {wheelSpots.map((spot, i) => (
        <Strut
          key={`arm-${i}`}
          start={[spot[0] * 0.55, -0.1, spot[2] * 0.55]}
          end={[spot[0], spot[1] + 0.02, spot[2]]}
          radius={0.024}
          color="#aab2b9"
        />
      ))}
      {/* deck */}
      <mesh position={[0, -0.02, 0]} castShadow>
        <boxGeometry args={[1.6, 0.075, 0.8]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
      <mesh position={[-0.42, 0.05, 0]} castShadow>
        <boxGeometry args={[0.5, 0.09, 0.72]} />
        <meshPhysicalMaterial {...FOIL} />
      </mesh>
      {/* fenders */}
      {wheelSpots.map((spot, i) => (
        <mesh key={`fender-${i}`} position={[spot[0], spot[1], spot[2]]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.315, 0.03, 6, 26, Math.PI]} />
          <meshPhysicalMaterial color="#c3cad0" metalness={0.45} roughness={0.42} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {wheelSpots.map((spot, i) => (
        <WireWheel key={`wheel-${i}`} position={spot} radius={0.29} />
      ))}
      {/* seats: frame + mesh back, side by side across the deck */}
      {[-1, 1].map((side) => (
        <group key={`seat-${side}`} position={[0.1, 0.18, side * 0.24]}>
          <mesh castShadow>
            <boxGeometry args={[0.44, 0.06, 0.36]} />
            <meshStandardMaterial color="#8d959b" metalness={0.25} roughness={0.7} />
          </mesh>
          <mesh position={[-0.2, 0.18, 0]} rotation={[0, 0, 0.18]} castShadow>
            <boxGeometry args={[0.05, 0.36, 0.34]} />
            <meshStandardMaterial color="#98a1a8" metalness={0.22} roughness={0.72} />
          </mesh>
          <Strut start={[0.18, 0, 0]} end={[0.18, 0.3, 0]} radius={0.012} color="#9aa3ab" />
        </group>
      ))}
      {/* control console and T-handle */}
      <group position={[0.62, 0.22, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.2, 0.5]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        <Strut start={[0, 0.1, 0]} end={[0.16, 0.34, 0]} radius={0.012} color="#9aa3ab" />
        <mesh position={[0.17, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
      </group>
      {/* electronics, batteries, gold thermal blanket */}
      <mesh position={[-0.62, 0.06, 0]} castShadow>
        <boxGeometry args={[0.36, 0.16, 0.62]} />
        <meshPhysicalMaterial {...FOIL} />
      </mesh>
      <mesh position={[-0.3, 0.08, 0]} castShadow>
        <boxGeometry args={[0.24, 0.12, 0.66]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
      {/* high-gain antenna on its mast, plus the low-gain whip */}
      <Strut start={[-0.78, 0.1, -0.3]} end={[-0.78, 0.62, -0.3]} radius={0.014} color="#a7b0b8" />
      <Dish position={[-0.78, 0.66, -0.3]} rotation={[0.55, 0.3, 0]} radius={0.2} />
      <Strut start={[-0.72, 0.1, 0.34]} end={[-0.86, 0.92, 0.36]} radius={0.007} color="#b6bec5" />
      {/* colour TV camera at the front */}
      <Strut start={[0.82, -0.02, -0.3]} end={[0.9, 0.26, -0.3]} radius={0.012} color="#9aa3ab" />
      <mesh position={[0.92, 0.29, -0.3]}>
        <boxGeometry args={[0.1, 0.09, 0.09]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      {/* lunar dust coating on the lower body */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[1.5, 0.01, 0.74]} />
        <meshStandardMaterial color="#8d8577" metalness={0.1} roughness={0.95} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- Sojourner (65 cm long, six cleated wheels) ---------- */
export function SojournerModel() {
  const wheels = [[0.2, -0.02, 0.16], [0.2, -0.02, -0.16], [0, -0.02, 0.17], [0, -0.02, -0.17], [-0.2, -0.02, 0.16], [-0.2, -0.02, -0.16]];
  return (
    <group name="sojourner">
      <SolarDeck width={0.5} depth={0.36} position={[0, 0.11, 0]} columns={5} rows={4} />
      <mesh position={[0, 0.055, 0]} castShadow>
        <boxGeometry args={[0.42, 0.07, 0.3]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
      {wheels.map((spot, i) => (
        <group key={`sw-${i}`}>
          <Strut start={[spot[0], 0.03, spot[2] * 0.55]} end={[spot[0], spot[1], spot[2]]} radius={0.009} color="#b0b8bf" />
          <group position={spot} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.062, 0.062, 0.045, 18]} />
              <meshPhysicalMaterial color="#c8ced4" metalness={0.86} roughness={0.3} />
            </mesh>
            <mesh>
              <torusGeometry args={[0.062, 0.011, 6, 20]} />
              <meshStandardMaterial color="#2c3238" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        </group>
      ))}
      {/* rocker-bogie links */}
      <Strut start={[-0.2, 0.04, 0]} end={[0.2, 0.04, 0]} radius={0.008} color="#a9b2b9" />
      {/* camera mast and APXS */}
      <Strut start={[0.16, 0.12, 0]} end={[0.2, 0.26, 0]} radius={0.008} color="#a9b2b9" />
      <mesh position={[0.21, 0.28, 0]}>
        <boxGeometry args={[0.05, 0.04, 0.07]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <mesh position={[0.24, 0.03, 0]}>
        <boxGeometry args={[0.06, 0.05, 0.05]} />
        <meshPhysicalMaterial {...FOIL} />
      </mesh>
    </group>
  );
}

/* ---------- Surveyor 3 (three-legged lander, 3.3 m leg span) ---------- */
export function SurveyorModel() {
  const legs = [[0, 0.72], [0.62, -0.36], [-0.62, -0.36]];
  return (
    <group name="surveyor">
      {/* main bus with thermal blanket */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.54, 0.4, 0.54]} />
        <meshPhysicalMaterial {...WHITE} />
      </mesh>
      <mesh position={[0, 0.42, 0]} scale={1.02}>
        <boxGeometry args={[0.62, 0.44, 0.62]} />
        <meshStandardMaterial color="#c8b98f" metalness={0.4} roughness={0.7} transparent opacity={0.35} />
      </mesh>
      {/* legs: upper strut, shock absorber, footpad */}
      {legs.map(([x, z], i) => {
        const len = Math.hypot(x, z) || 0.001;
        const ox = (x / len) * 0.82;
        const oz = (z / len) * 0.82;
        return (
          <group key={`leg-${i}`}>
            <Strut start={[x * 0.42, 0.34, z * 0.42]} end={[ox, -0.12, oz]} radius={0.026} color="#d3d8dd" />
            <Strut start={[x * 0.42, 0.5, z * 0.42]} end={[ox * 0.72, 0.16, oz * 0.72]} radius={0.014} color="#b7bec4" />
            <mesh position={[ox, -0.14, oz]}>
              <cylinderGeometry args={[0.11, 0.13, 0.04, 20]} />
              <meshPhysicalMaterial color="#b3bac0" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
      {/* solar panel and planar array on top */}
      <SolarDeck width={0.86} depth={0.5} position={[0, 0.66, 0]} rotation={[0.06, 0, 0]} columns={4} rows={3} />
      {/* camera mast with two sensor heads */}
      <Strut start={[0, 0.66, 0]} end={[0, 1.12, 0]} radius={0.016} color="#c9d0d6" />
      <mesh position={[0, 1.16, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.1]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <Dish position={[0.26, 0.78, 0.2]} rotation={[0.5, 0.4, 0]} radius={0.13} />
      {/* sampling arm and scoop */}
      <Strut start={[0.3, 0.34, 0.3]} end={[0.62, 0.05, 0.44]} radius={0.014} color="#c2c9cf" />
      <mesh position={[0.66, 0.02, 0.46]} rotation={[0.3, 0.2, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.1]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
    </group>
  );
}

/* ---------- Phoenix (circular deck, two round solar arrays) ---------- */
export function PhoenixModel() {
  return (
    <group name="phoenix">
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.1, 32]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`array-${side}`} position={[side * 0.78, 0.4, 0]} rotation={[0, 0, side * -0.12]}>
          {/* UltraFlex array: a ten-sided fan of blue cell gores with a bright frame. */}
          <mesh castShadow>
            <cylinderGeometry args={[0.58, 0.58, 0.02, 10]} />
            <meshPhysicalMaterial color="#c3cad1" metalness={0.6} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.014, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.008, 10]} />
            <meshPhysicalMaterial {...CELL} />
          </mesh>
          {Array.from({ length: 10 }).map((_, g) => (
            <mesh key={`gore-${g}`} position={[Math.cos((g / 10) * Math.PI * 2 + Math.PI / 10) * 0.27, 0.02, Math.sin((g / 10) * Math.PI * 2 + Math.PI / 10) * 0.27]} rotation={[0, -((g / 10) * Math.PI * 2 + Math.PI / 10), 0]}>
              <boxGeometry args={[0.54, 0.006, 0.012]} />
              <meshStandardMaterial color="#d7dde3" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 0.024, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#d7dde3" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* legs */}
      {[[0, 0.55], [0.48, -0.28], [-0.48, -0.28]].map(([x, z], i) => (
        <Strut key={`pl-${i}`} start={[x * 0.6, 0.3, z * 0.6]} end={[x, -0.3, z]} radius={0.024} color="#cbd2d8" />
      ))}
      {/* mast with stereo camera */}
      <Strut start={[0, 0.39, 0]} end={[0, 1.0, 0]} radius={0.018} color="#cbd2d8" />
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.26, 0.09, 0.1]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      {/* robotic arm */}
      <Strut start={[-0.2, 0.32, 0.3]} end={[-0.5, 0.02, 0.62]} radius={0.018} color="#d5dbdf" />
      <Strut start={[-0.5, 0.02, 0.62]} end={[-0.26, -0.16, 0.86]} radius={0.014} color="#d5dbdf" />
      <mesh position={[-0.24, -0.18, 0.9]}>
        <boxGeometry args={[0.1, 0.05, 0.12]} />
        <meshPhysicalMaterial {...ALU} />
      </mesh>
      {/* UHF antenna */}
      <Strut start={[0.3, 0.38, -0.3]} end={[0.34, 0.62, -0.34]} radius={0.01} color="#b8c0c7" />
    </group>
  );
}

/* ---------- Apollo 12 ALSEP (central station and mission-specific instruments) ---------- */
export function AlsepModel() {
  const swsSensors = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2;
    return [Math.cos(angle) * 0.072, Math.sin(angle) * 0.072];
  });
  return (
    <group name="apollo-12-alsep">
      {/* Central station, axial-helical antenna, and the three-cell dust detector. */}
      <group name="alsep-central-station" position={[0, 0.16, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.3, 0.3]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.36, 0.02, 0.32]} />
          <meshPhysicalMaterial {...FOIL} />
        </mesh>
        <Strut start={[0, 0.17, 0]} end={[0, 0.71, 0]} radius={0.012} color="#b8c0c7" />
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`helix-${i}`} position={[0, 0.43 + i * 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.035, 0.004, 6, 16]} />
            <meshStandardMaterial color="#b8c0c7" metalness={0.7} roughness={0.32} />
          </mesh>
        ))}
        <mesh position={[0, 0.73, 0]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshStandardMaterial color="#b8c0c7" metalness={0.7} roughness={0.32} />
        </mesh>
        <group name="lunar-dust-detector" position={[0, 0.145, 0.105]}>
          {[-1, 0, 1].map((i) => (
            <mesh key={`dust-cell-${i}`} position={[i * 0.07, 0.012, 0]}>
              <boxGeometry args={[0.05, 0.009, 0.07]} />
              <meshPhysicalMaterial {...CELL} />
            </mesh>
          ))}
        </group>
      </group>

      {/* SNAP-27 RTG beside the station, shown as a dark finned cylinder. */}
      <group name="snap-27-rtg" position={[-0.52, 0.15, 0.08]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.085, 0.095, 0.3, 20]} />
          <meshStandardMaterial color="#343a3e" metalness={0.48} roughness={0.5} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`rtg-fin-${i}`} position={[Math.cos(angle) * 0.09, 0, Math.sin(angle) * 0.09]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.07, 0.25, 0.008]} />
              <meshStandardMaterial color="#4a5054" metalness={0.5} roughness={0.46} />
            </mesh>
          );
        })}
      </group>

      {/* Passive seismic experiment, deployed as a separate instrument. */}
      <group name="passive-seismic-experiment" position={[0.49, 0.015, -0.28]}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.16, 0.04, 24]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.1, 20]} />
          <meshStandardMaterial color="#3a424a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.075, 18, 12]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
      </group>

      {/* Lunar Surface Magnetometer on its tripod. */}
      <group name="lunar-surface-magnetometer" position={[0.35, 0.02, 0.42]}>
        {[0, 1, 2].map((i) => (
          <Strut key={`mt-${i}`} start={[0, 0, 0]} end={[Math.cos((i / 3) * Math.PI * 2) * 0.16, 0.26, Math.sin((i / 3) * Math.PI * 2) * 0.16]} radius={0.006} color="#b8c0c7" />
        ))}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.08, 0.055, 0.08]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        <Strut start={[-0.12, 0.28, 0]} end={[0.12, 0.28, 0]} radius={0.005} color="#b8c0c7" />
      </group>

      {/* Seven exposed sensor apertures of the Solar Wind Spectrometer. */}
      <group name="solar-wind-spectrometer" position={[0.48, 0.025, 0.12]}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <boxGeometry args={[0.28, 0.05, 0.24]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        {swsSensors.map(([x, z], i) => (
          <group key={`sws-sensor-${i}`} position={[x, 0.06, z]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.03, 0.022, 12]} />
              <meshStandardMaterial color="#454c53" metalness={0.45} roughness={0.48} />
            </mesh>
            <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.015, 12]} />
              <meshStandardMaterial color="#aeb8bf" metalness={0.6} roughness={0.32} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Separate low ion-detector packages: SIDE and CCIG. */}
      <group name="side-instrument" position={[-0.45, 0.02, -0.38]}>
        <mesh position={[0, 0.065, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.18]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        <Strut start={[0, 0.12, 0]} end={[0.04, 0.3, 0.04]} radius={0.012} color="#b8c0c7" />
        <mesh position={[0.04, 0.31, 0.04]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.07, 0.08, 14]} />
          <meshStandardMaterial color="#343a3e" metalness={0.5} roughness={0.42} />
        </mesh>
      </group>
      <group name="cold-cathode-ion-gauge" position={[-0.55, 0.015, -0.1]}>
        <mesh position={[0, 0.045, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.14]} />
          <meshPhysicalMaterial {...ALU} />
        </mesh>
        <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.11, 12]} />
          <meshStandardMaterial color="#68727a" metalness={0.58} roughness={0.38} />
        </mesh>
      </group>

      {/* Instrument leads run out from the central station; no Apollo-12 heat-flow probe is shown. */}
      <group name="instrument-leads">
        <Strut start={[0.13, 0.025, -0.08]} end={[0.32, 0.012, -0.2]} radius={0.006} color="#8b939a" />
        <Strut start={[0.32, 0.012, -0.2]} end={[0.49, 0.012, -0.28]} radius={0.006} color="#8b939a" />
        <Strut start={[0.14, 0.025, 0.04]} end={[0.32, 0.012, 0.1]} radius={0.006} color="#8b939a" />
        <Strut start={[0.32, 0.012, 0.1]} end={[0.48, 0.012, 0.12]} radius={0.006} color="#8b939a" />
        <Strut start={[0.08, 0.025, 0.11]} end={[0.2, 0.012, 0.3]} radius={0.006} color="#8b939a" />
        <Strut start={[0.2, 0.012, 0.3]} end={[0.35, 0.012, 0.42]} radius={0.006} color="#8b939a" />
        <Strut start={[-0.15, 0.025, -0.08]} end={[-0.32, 0.012, -0.25]} radius={0.006} color="#8b939a" />
        <Strut start={[-0.32, 0.012, -0.25]} end={[-0.45, 0.012, -0.38]} radius={0.006} color="#8b939a" />
        <Strut start={[-0.16, 0.025, 0]} end={[-0.4, 0.012, -0.08]} radius={0.006} color="#8b939a" />
        <Strut start={[-0.4, 0.012, -0.08]} end={[-0.55, 0.012, -0.1]} radius={0.006} color="#8b939a" />
      </group>
    </group>
  );
}

function scaled(Model, scale, offsetY = 0) {
  return function ScaledCraft() {
    return (
      <group scale={scale} position={[0, offsetY, 0]}>
        <Model />
      </group>
    );
  };
}

/* Each craft is authored at true proportions, then scaled so the whole
   machine fits the same camera framing as the NASA meshes. */
export const PROCEDURAL_MODELS = {
  'apollo-15-lrv': scaled(LrvModel, 0.92, 0.02),
  'sojourner-rover': scaled(SojournerModel, 3.4, -0.02),
  'surveyor-3': scaled(SurveyorModel, 1.35, -0.16),
  'phoenix-lander': scaled(PhoenixModel, 0.78, -0.04),
  'alsep-scientific-packages': scaled(AlsepModel, 1.7, -0.18),
};
