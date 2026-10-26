"use client";

import { BakeShadows, PerspectiveCamera } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Pixelation,
} from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";

import { BlendFunction } from "postprocessing";
import { Computers } from "./Computers";
import { Model } from "./Model";
import { ScreenBloom } from "./ScreenBloom";
import { LedClock } from "./LedClock";
import { Smoke } from "./Smoke";
import {
  addFogLight,
  fogTime,
  installDriftingFog,
  updateFogLights,
} from "./driftingFog";
import ColorGrade from "./shaders/ColorGradeEffect";
import PosterizationEffect from "./shaders/PosterizationEffect";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { BackSide, Object3D, RectAreaLight, Vector3 } from "three";
import { Three } from "@/components/canvas/Three";
import { easing } from "maath";

const FOG_COLOR = "#050b0b";
const FOG_DENSITY = 0.2;
// Middle of the monitor bank, in world space; the smoke is lit from here
const SMOKE_GLOW_CENTER: [number, number, number] = [0.5, 3.2, 1.2];

// Must run before any material compiles, so at module load
installDriftingFog();

const CAMERA_POSITION = { x: 0.5, y: 3, z: -2.6 };
const CAMERA_TARGET_POSITION = { x: 0.3, y: 3.15, z: 1.35 };

export const Playground = () => {
  return (
    <Three>
      <Suspense fallback={null}>
        {/* Lights */}
        {/* Dark green haze; the background matches the fog colour so far
          surfaces fade into it rather than into a hard black */}
        <color attach="background" args={[FOG_COLOR]} />
        <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
        <FogDrift />
        {/* Encloses the scene so every pixel goes through the fog shader;
          empty background otherwise skips fog and its lit glow */}
        <mesh position={[0.5, 3, 0]}>
          <sphereGeometry args={[14, 32, 16]} />
          <meshBasicMaterial color="black" side={BackSide} />
        </mesh>
        {/* Low fill from above: catches the top edges of the casings as a
          faint rim without washing out the scene */}
        <hemisphereLight intensity={0.18} groundColor="black" />
        <spotLight
          decay={0}
          position={[15, 20, 1]}
          angle={0.2}
          penumbra={1}
          intensity={0.4}
          color="#83b7ff"
          castShadow
          shadow-mapSize={2048}
          shadow-camera-near={20}
          shadow-camera-far={30}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
        />
        {/* Warm desk lamp. `distance` cuts it off so it lights its corner
          instead of the whole scene. */}
        {LAMP_ON && (
          <pointLight
            position={[-2.9845, 3.583, 0.732]}
            intensity={3}
            distance={4}
            color={LAMP_COLOR}
            castShadow
            shadow-mapSize={2048}
            shadow-camera-near={0.1}
            shadow-camera-far={20}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
        )}

        {/* Main Scene */}
        <group position={[-0, -1, 0]}>
          <Model scale={0.5} lampOn={LAMP_ON} />
          <Computers scale={0.5} />
        </group>

        <Smoke glowCenter={SMOKE_GLOW_CENTER} />
        {LAMP_ON && <LampSpot />}
        <DeviceGlow />

        {/* Postprocessing */}
        <EffectComposer>
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            // @ts-expect-error
            offset={[0.0001, 0.0001]}
          />
          <DepthOfField
            target={[
              CAMERA_TARGET_POSITION.x,
              CAMERA_TARGET_POSITION.y,
              CAMERA_TARGET_POSITION.z,
            ]}
            focalLength={2.1}
            bokehScale={3}
            height={700}
          />
          {/* No threshold, so dim screens glow too; brighter things (the
            boosted screens, the lamp bulb) just glow more */}
          <Bloom
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            mipmapBlur
            intensity={2}
            radius={0.85}
          />
          {/* Stronger bloom on just the screens, for a halo like the hover
              glow without brightening the screen faces */}
          <ScreenBloom intensity={3.75} radius={0.9} />
          {/* Cool blue lift in the shadows; after bloom so the haze is graded
            too, before posterize so the bands come from graded colours */}
          <ColorGrade shadowTint="#1a4a5c" shadowStrength={0.03} contrast={0.35} />
          <AdaptivePixelation baseGranularity={2} referenceWidth={1920} />
          <Noise
            premultiply
            blendFunction={BlendFunction.ADD}
            opacity={0.2}
          />
        </EffectComposer>
        <BakeShadows />
        <CameraRig />
      </Suspense>
    </Three>
  );
};

const MAX_PIXELATION_GRANULARITY_MULTIPLIER = 1;

function AdaptivePixelation({
  baseGranularity,
  referenceWidth,
}: {
  baseGranularity: number;
  referenceWidth: number;
}) {
  const { size } = useThree();
  const scaled = baseGranularity * (size.width / referenceWidth);
  const capped = Math.min(scaled, baseGranularity * MAX_PIXELATION_GRANULARITY_MULTIPLIER);
  const granularity = Math.max(1, Math.round(capped));
  return (
    <>
      <Pixelation granularity={granularity} />
      {/* After bloom and pixelation so the bands stay hard, with one dither
          value per pixelated block */}
      <PosterizationEffect bits={5} dither={1} pixelSize={granularity} />
    </>
  );
}

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

// Desk lamp bulb and the lampshade's axis, measured from the model in world
// space; the beam follows the shade rather than pointing straight down
// Warm, but closer to incandescent white than orange
// Desk lamp switched off for now: its warm light competed with the screens.
// Flip to bring back the bulb glow, its spot on the desk and its fog halo.
const LAMP_ON = false;
const LAMP_COLOR = "#ffe6c8";
const LAMP_BULB: [number, number, number] = [-2.991, 4.5, 1.097];
const LAMP_DIRECTION: [number, number, number] = [0.556, -0.755, 0.348];
const LAMP_TARGET = LAMP_BULB.map(
  (value, i) => value + LAMP_DIRECTION[i] * 3,
) as [number, number, number];

// Warm light from the lamp, aimed along the shade at the desk
function LampSpot() {
  const target = useMemo(() => new Object3D(), []);

  // Glow in the fog around the shade, stronger along where it points
  useEffect(
    () =>
      addFogLight({
        position: new Vector3(...LAMP_BULB),
        color: LAMP_COLOR,
        intensity: 0.6,
        direction: new Vector3(...LAMP_DIRECTION),
        coneAngle: 0.6,
      }),
    [],
  );

  return (
    <>
      <primitive object={target} position={LAMP_TARGET} />
      <spotLight
        target={target}
        position={LAMP_BULB}
        color={LAMP_COLOR}
        intensity={8}
        distance={4}
        decay={2}
        angle={0.5}
        penumbra={0.6}
      />
    </>
  );
}

// Advances the drifting fog's noise and applies fog lights' live levels
function FogDrift() {
  useFrame((_, delta) => {
    fogTime.value += delta;
    updateFogLights();
  });
  return null;
}

// Small light sources on the props, in world space (measured from the model):
// the radio's clock display and the recorder's gauge panel. Both are flat
// faces, so each gets an area light the size of the face, plus a faint glow
// in the fog.
const CLOCK_FACE = {
  center: new Vector3(3.763, 1.996, 0.072),
  normal: new Vector3(-0.98, 0, -0.199).normalize(),
  width: 0.23,
  height: 0.086,
  color: "#ff2a1a",
};
const GAUGE_FACE = {
  center: new Vector3(-3.217, 1.869, -0.91),
  normal: new Vector3(1, 0, 0.02).normalize(),
  width: 0.552,
  height: 0.172,
  color: "#ffc46b",
};

type FaceLightProps = {
  face: typeof CLOCK_FACE;
  intensity: number;
};

const FaceLight = ({ face, intensity }: FaceLightProps) => {
  const ref = useRef<RectAreaLight>(null);
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.position.copy(face.center).addScaledVector(face.normal, 0.01);
    // Lights aim their -Z (the way an area light shines) at the target
    light.lookAt(light.position.clone().add(face.normal));
  }, [face]);
  return (
    <rectAreaLight
      ref={ref}
      width={face.width}
      height={face.height}
      color={face.color}
      intensity={intensity}
    />
  );
};

function DeviceGlow() {
  useEffect(() => {
    const removeClock = addFogLight({
      position: CLOCK_FACE.center.clone().addScaledVector(CLOCK_FACE.normal, 0.2),
      color: CLOCK_FACE.color,
      intensity: 0.08,
    });
    const removeGauges = addFogLight({
      position: GAUGE_FACE.center.clone().addScaledVector(GAUGE_FACE.normal, 0.2),
      color: GAUGE_FACE.color,
      intensity: 0.05,
    });
    return () => {
      removeClock();
      removeGauges();
    };
  }, []);

  return (
    <>
      <LedClock
        center={CLOCK_FACE.center}
        normal={CLOCK_FACE.normal}
        width={CLOCK_FACE.width}
        height={CLOCK_FACE.height}
      />
      <FaceLight face={CLOCK_FACE} intensity={6} />
      <FaceLight face={GAUGE_FACE} intensity={2} />
    </>
  );
}
