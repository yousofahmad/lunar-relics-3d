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
    return { color: '#1e293b', metalness: 0.62, roughness: 0.34 };
  }
  if (/(foil|gold|kapton|thermal|blanket|copper|dish|antenna|reflector)/.test(label)) {
    return { color: '#d4af37', metalness: 0.84, roughness: 0.23 };
  }
  if (isNeutralColor(originalColor) && meshIndex % 7 === 3) {
    return { color: '#d4af37', metalness: 0.84, roughness: 0.23 };
  }
  if (isNeutralColor(originalColor) && meshIndex % 7 === 5) {
    return { color: '#1e293b', metalness: 0.62, roughness: 0.34 };
  }
  return { color: '#d4d8dd', metalness: 0.8, roughness: 0.27 };
}

function upgradeMaterial(material, meshName, meshIndex) {
  if (material?.map) {
    const textured = material.clone();
    if (textured.isMeshStandardMaterial || textured.isMeshPhysicalMaterial) {
      textured.envMapIntensity = 1.35;
      textured.roughness = Math.min(textured.roughness ?? 0.45, 0.46);
    }
    return textured;
  }

  const originalColor = material?.color?.clone() || new THREE.Color('#b9bec4');
  const finish = materialFinish(meshName, material?.name || '', meshIndex, originalColor);
  if (material?.isMeshStandardMaterial || material?.isMeshPhysicalMaterial) {
    const upgraded = material.clone();
    upgraded.color.set(finish.color);
    upgraded.metalness = finish.metalness;
    upgraded.roughness = finish.roughness;
    upgraded.envMapIntensity = 1.5;
    upgraded.needsUpdate = true;
    return upgraded;
  }

  return new THREE.MeshPhysicalMaterial({
    name: material?.name || `${meshName || 'spacecraft'}-aerospace-finish`,
    color: finish.color,
    metalness: finish.metalness,
    roughness: finish.roughness,
    clearcoat: finish.metalness > 0.75 ? 0.3 : 0.12,
    clearcoatRoughness: 0.28,
    side: material?.side ?? THREE.FrontSide,
    transparent: material?.transparent ?? false,
    opacity: material?.opacity ?? 1,
    envMapIntensity: 1.5,
  });
}

export default function GltfModel({ modelPath, onBoundsReady }) {
  const { scene } = useGLTF(modelPath);
  const prepared = useMemo(() => {
    const model = scene.clone(true);
    let meshIndex = 0;
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const current = child.material;
      child.material = Array.isArray(current)
        ? current.map((material) => upgradeMaterial(material, child.name, meshIndex++))
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
  }, [scene]);

  useEffect(() => {
    onBoundsReady?.(prepared.info);
  }, [onBoundsReady, prepared]);

  return <primitive object={prepared.model} dispose={null} />;
}
