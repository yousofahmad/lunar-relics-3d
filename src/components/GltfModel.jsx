import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function isNeutralColor(color) {
  if (!color) return true;
  const maximum = Math.max(color.r, color.g, color.b);
  const minimum = Math.min(color.r, color.g, color.b);
  return maximum - minimum < 0.16 && maximum > 0.18;
}

function materialFinish(meshName, materialName, meshIndex, originalColor) {
  const label = `${meshName} ${materialName}`.toLowerCase();
  if (/(solar|panel|carbon|array|black|dark|cell)/.test(label)) {
    return { color: '#1e293b' };
  }
  if (/(foil|gold|kapton|thermal|blanket|copper|dish|antenna|reflector)/.test(label)) {
    return { color: '#d4af37' };
  }
  if (isNeutralColor(originalColor) && meshIndex % 7 === 3) {
    return { color: '#d4af37' };
  }
  if (isNeutralColor(originalColor) && meshIndex % 7 === 5) {
    return { color: '#1e293b' };
  }
  return { color: '#d4d8dd' };
}

const PHYSICAL_FINISH = { metalness: 0.75, roughness: 0.22, envMapIntensity: 1.8 };

function makePhysicalMaterial(source, fallbackColor, meshName = 'spacecraft') {
  const materialName = source?.name || `${meshName}-aerospace-finish`;
  let physical;

  if (source?.isMeshStandardMaterial || source?.isMeshPhysicalMaterial) {
    physical = source.clone();
  } else {
    physical = new THREE.MeshPhysicalMaterial({
      name: materialName,
      color: source?.color?.clone() || fallbackColor || new THREE.Color('#b9bec4'),
      map: source?.map || null,
      normalMap: source?.normalMap || null,
      normalScale: source?.normalScale,
      roughnessMap: source?.roughnessMap || null,
      metalnessMap: source?.metalnessMap || null,
      aoMap: source?.aoMap || null,
      aoMapIntensity: source?.aoMapIntensity,
      emissive: source?.emissive?.clone() || new THREE.Color('#000000'),
      emissiveMap: source?.emissiveMap || null,
      emissiveIntensity: source?.emissiveIntensity ?? 1,
      alphaMap: source?.alphaMap || null,
      alphaTest: source?.alphaTest ?? 0,
      bumpMap: source?.bumpMap || null,
      bumpScale: source?.bumpScale,
      displacementMap: source?.displacementMap || null,
      displacementScale: source?.displacementScale,
      displacementBias: source?.displacementBias,
      side: source?.side ?? THREE.FrontSide,
      transparent: source?.transparent ?? false,
      opacity: source?.opacity ?? 1,
      vertexColors: source?.vertexColors ?? false,
      depthWrite: source?.depthWrite ?? true,
      blending: source?.blending ?? THREE.NormalBlending,
      clearcoat: 0.28,
      clearcoatRoughness: 0.24,
    });
  }

  physical.metalness = PHYSICAL_FINISH.metalness;
  physical.roughness = PHYSICAL_FINISH.roughness;
  physical.envMapIntensity = PHYSICAL_FINISH.envMapIntensity;
  physical.needsUpdate = true;
  return physical;
}

function upgradeMaterial(material, meshName, meshIndex) {
  const originalColor = material?.color?.clone() || new THREE.Color('#b9bec4');
  const upgraded = makePhysicalMaterial(material, originalColor, meshName);

  // Keep mapped artwork intact; only tune its physically based response.
  if (!material?.map) {
    const finish = materialFinish(meshName, material?.name || '', meshIndex, originalColor);
    upgraded.color.set(finish.color);
  }

  if (upgraded.isMeshPhysicalMaterial && upgraded.clearcoat === 0) {
    upgraded.clearcoat = 0.22;
    upgraded.clearcoatRoughness = 0.28;
  }
  return upgraded;
}

function keepOriginalMaterial(material, meshName) {
  // Apollo's gold and silver colors/textures remain intact while the surface gets a metal finish.
  return makePhysicalMaterial(material, material?.color?.clone(), meshName);
}

function isAboveDescentStage(mesh) {
  const bounds = new THREE.Box3().setFromObject(mesh);
  const center = bounds.getCenter(new THREE.Vector3());
  const radialOffset = Math.hypot(center.x, center.z);
  return bounds.min.y > 2.72 || (bounds.max.y > 2.72 && center.y > 2.5 && radialOffset < 1.4);
}

function EasepContext() {
  return (
    <group position={[0.45, -0.46, 0.22]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.23, 0.15, 0.2]} />
        <meshStandardMaterial color="#a6a89b" metalness={0.2} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.19, 0.035, 0.16]} />
        <meshStandardMaterial color="#c5a85d" metalness={0.3} roughness={0.58} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.15, 0.16, 0]} rotation={[0, 0, side * -0.08]}>
          <boxGeometry args={[0.1, 0.012, 0.13]} />
          <meshStandardMaterial color="#263e55" metalness={0.26} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0.05]}>
        <cylinderGeometry args={[0.012, 0.018, 0.16, 10]} />
        <meshStandardMaterial color="#b7bdb8" metalness={0.34} roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function GltfModel({ modelPath, onBoundsReady, descentStageOnly = false, preserveMaterials = false }) {
  const { scene } = useGLTF(modelPath);
  const prepared = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    if (descentStageOnly) {
      const ascentStageParts = [];
      model.traverse((child) => {
        if (child.isMesh && isAboveDescentStage(child)) ascentStageParts.push(child);
      });
      ascentStageParts.forEach((part) => part.parent?.remove(part));
      model.updateMatrixWorld(true);
    }
    let meshIndex = 0;
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const current = child.material;
      child.material = Array.isArray(current)
        ? current.map((material) => (descentStageOnly || preserveMaterials)
          ? keepOriginalMaterial(material, child.name)
          : upgradeMaterial(material, child.name, meshIndex++))
        : (descentStageOnly || preserveMaterials)
          ? keepOriginalMaterial(current, child.name)
          : upgradeMaterial(current, child.name, meshIndex++);
    });

    model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z, 0.0001);
    const normalizedScale = 2.2 / maxDimension;
    const normalizedModel = new THREE.Group();
    normalizedModel.add(model);
    normalizedModel.scale.setScalar(normalizedScale);
    normalizedModel.position.copy(sourceCenter).multiplyScalar(-normalizedScale);
    normalizedModel.updateMatrixWorld(true);

    const normalizedBounds = new THREE.Box3().setFromObject(normalizedModel);
    const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());
    const info = {
      min: normalizedBounds.min.toArray(),
      max: normalizedBounds.max.toArray(),
      size: normalizedSize.toArray(),
      center: normalizedBounds.getCenter(new THREE.Vector3()).toArray(),
      maxDimension: Math.max(normalizedSize.x, normalizedSize.y, normalizedSize.z),
    };
    return { model: normalizedModel, info };
  }, [descentStageOnly, preserveMaterials, scene]);

  useEffect(() => {
    onBoundsReady?.(prepared.info);
  }, [onBoundsReady, prepared]);

  return (
    <group>
      <primitive object={prepared.model} dispose={null} />
      {descentStageOnly && <EasepContext />}
    </group>
  );
}
