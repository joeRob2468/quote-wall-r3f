"use client";

import { BakeShadows, PerspectiveCamera } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
} from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";

import { BlendFunction } from "postprocessing";
import { Computers } from "./Computers";
import { Model } from "./Model";
import { Three } from "@/components/canvas/Three";
import { easing } from "maath";

const CAMERA_POSITION = { x: 0.5, y: 3, z: -2.6 };
const CAMERA_TARGET_POSITION = { x: 0.3, y: 3.15, z: 1.7 };

export const Playground = () => {
  return (
    <Three>
      {/* Lights */}
      <color attach="background" args={["black"]} />
      <hemisphereLight intensity={0.1} groundColor="black" />
      <spotLight
        decay={0}
        position={[15, 20, 1]}
        angle={0.2}
        penumbra={1}
        intensity={3}
        color="#83b7ff"
        castShadow
        shadow-mapSize={2048}
      />
      <pointLight
        position={[-2.85, 4.35, 1.02]}
        intensity={4}
        color="#f9e9c1"
        castShadow
        shadow-mapSize={2048}
      />

      {/* Main Scene */}
      <group position={[-0, -1, 0]}>
        <Model scale={0.5} />
        <Computers scale={0.5} />
      </group>

      {/* Postprocessing */}
      <EffectComposer>
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          // @ts-expect-error
          offset={[0.00001, 0.00001]} 
        />
        <DepthOfField
          target={[
            CAMERA_TARGET_POSITION.x,
            CAMERA_TARGET_POSITION.y,
            CAMERA_TARGET_POSITION.z,
          ]}
          focalLength={0.15}
          bokehScale={3}
          height={700}
        />
        <Bloom
          luminanceThreshold={0}
          mipmapBlur
          luminanceSmoothing={0.9}
          intensity={3}
        />
        <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.2} />
      </EffectComposer>
      <BakeShadows />
      <CameraRig />
    </Three>
  );
};

function CameraRig() {
  const { camera } = useThree();

  camera.lookAt(
    CAMERA_TARGET_POSITION.x,
    CAMERA_TARGET_POSITION.y,
    CAMERA_TARGET_POSITION.z
  );
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [
        CAMERA_POSITION.x,
        CAMERA_POSITION.y + (0.25 + state.pointer.y / 4),
        CAMERA_POSITION.z,
      ],
      0.75,
      delta,
      undefined,
      undefined,
      0.0001
    );

    const targetX = state.pointer.x * 1.2 * -1;
    const scalingFactor = 4;

    let lookAtOffset = 0;
    if (targetX >= 0) {
      lookAtOffset = targetX ** scalingFactor;
    } else {
      lookAtOffset = Math.abs(targetX) ** scalingFactor * -1;
    }

    easing.dampLookAt(
      state.camera,
      [
        CAMERA_TARGET_POSITION.x + lookAtOffset,
        CAMERA_TARGET_POSITION.y,
        CAMERA_TARGET_POSITION.z,
      ],
      0.75,
      delta,
      undefined,
      undefined,
      0.0001
    );
  });

  return (
    <PerspectiveCamera
      position={[CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z]}
      fov={45}
      near={1}
      far={20}
      makeDefault
    />
  );
}
