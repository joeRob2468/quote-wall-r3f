"use client";

import { useFrame, useThree } from "@react-three/fiber";

import { Model } from "./Model";
import { PerspectiveCamera } from "@react-three/drei";
import { Three } from "@/components/canvas/Three";
import { easing } from "maath";

export const Playground = () => {
  return (
    <Three>
      <group position={[-0, -1, 0]}>
        <Model scale={0.5} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      </group>
      <CameraRig />
    </Three>
  );
};

function CameraRig({ debug }: { debug?: boolean }) {
  const { camera } = useThree();
  const cameraPosition = { x: 0.5, y: 3, z: -2.6 };
  const targetPosition = { x: 0.3, y: 3.15, z: 1.7 };
  
  camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [
        cameraPosition.x,
        cameraPosition.y + (0.25 + state.pointer.y / 4),
        cameraPosition.z,
      ],
      0.75,
      delta,
      undefined,
      undefined,
      0.0001
    );

    const targetX = (state.pointer.x * 1.2) * -1;
    const scalingFactor = 4;

    let lookAtOffset = 0;
    if (targetX >= 0) {
      lookAtOffset = targetX**scalingFactor;
    } else {
      lookAtOffset = (Math.abs(targetX)**scalingFactor) * -1;
    }

    easing.dampLookAt(
      state.camera,
      [
        targetPosition.x + lookAtOffset,
        targetPosition.y,
        targetPosition.z
      ],
      0.75,
      delta,
      undefined,
      undefined,
      0.0001
    );
  });

  return (
    <>
      <PerspectiveCamera
        position={[cameraPosition.x, cameraPosition.y, cameraPosition.z]}
        fov={45}
        near={1}
        far={20}
        makeDefault
      />
      {debug && (
        <mesh
          position={[targetPosition.x, targetPosition.y, targetPosition.z]}
          scale={0.5}
        >
          <sphereGeometry />
          <meshPhongMaterial color={"#CCCCCC"} />
        </mesh>
      )}
    </>
  );
}
