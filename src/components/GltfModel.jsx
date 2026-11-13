import { useMemo } from 'react';
import { Bounds } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

export default function GltfModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const instance = useMemo(() => scene.clone(true), [scene]);
  return (
    <Bounds fit clip observe margin={1.28}>
      <primitive object={instance} dispose={null} />
    </Bounds>
  );
}
