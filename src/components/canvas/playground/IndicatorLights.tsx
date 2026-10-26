"use client";

import * as THREE from "three";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";

// The little red power LEDs on the monitor casings. Drawn unlit and brighter
// than 1.0 so they bloom, each with a small red point light so they cast a
// faint glow onto the casing and desk around them. A couple of them blink.

export const LED_COLOR = new THREE.Color("#ff1a1a");
export const LED_BRIGHTNESS = 2.6;
// Kept low: the glossy casing's specular reflection of this light can
// otherwise outshine the LED itself
const LED_LIGHT_INTENSITY = 0.05;
// Short reach so each LED only lights what's right around it
const LED_LIGHT_DISTANCE = 0.8;
// How far in front of the LED the light sits (in this group's units). Kept
// tiny: further out, the casing's specular reflection of the light shows up
// as a second red dot beside the LED instead of on top of it.
const LED_LIGHT_OFFSET = 0.03;

// Blink pattern: seconds per cycle, fraction of the cycle spent on, and
// offset into the cycle. null = steady.
type Blink = { period: number; on: number; phase: number } | null;

// Brightness (1 = on) of a blinking light at time t
const blinkLevel = (t: number, blink: Blink) =>
  !blink || (t / blink.period + blink.phase) % 1 < blink.on ? 1 : 0.08;

const MONITOR_BLINK = { period: 1.4, on: 0.5, phase: 0 };

// Seconds for an indicator to fade fully on or off, instead of snapping
const FADE_SECONDS = 0.15;

// Moves a light's level toward its target at the fade rate
export const fadeToward = (level: number, target: number, delta: number) => {
  const step = delta / FADE_SECONDS;
  return level < target
    ? Math.min(target, level + step)
    : Math.max(target, level - step);
};

const BLINKS: Blink[] = [
  null,
  MONITOR_BLINK,
  null,
  null,
  { period: 2.3, on: 0.15, phase: 0.6 },
  null,
];

type IndicatorLightsProps = {
  geometry: THREE.BufferGeometry;
  instanceMatrix: THREE.InstancedBufferAttribute;
};

export const IndicatorLights = ({
  geometry,
  instanceMatrix,
}: IndicatorLightsProps) => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const count = instanceMatrix.count;

  // Where each LED sits, in this group's space, nudged out along its face.
  // The LED is a thin slab whose face points along its local Y, rotated per
  // instance with its monitor, so the offset follows that rather than a
  // fixed axis.
  const positions = useMemo(() => {
    geometry.computeBoundingBox();
    const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
    const matrix = new THREE.Matrix4();
    return Array.from({ length: count }, (_, i) => {
      matrix.fromArray(instanceMatrix.array, i * 16);
      const position = center.clone().applyMatrix4(matrix);
      const normal = new THREE.Vector3(0, 1, 0).transformDirection(matrix);
      // Face toward the camera side of the room (-Z)
      if (normal.z > 0) normal.negate();
      return position.addScaledVector(normal, LED_LIGHT_OFFSET);
    });
  }, [geometry, instanceMatrix, count]);

  const color = useMemo(() => new THREE.Color(), []);

  const levels = useRef<number[]>([]);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const level = fadeToward(
        levels.current[i] ?? 1,
        blinkLevel(t, BLINKS[i % BLINKS.length]),
        delta
      );
      levels.current[i] = level;
      mesh.setColorAt(i, color.copy(LED_COLOR).multiplyScalar(LED_BRIGHTNESS * level));
      const light = lightRefs.current[i];
      if (light) light.intensity = LED_LIGHT_INTENSITY * level;
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={(mesh) => {
          meshRef.current = mesh;
          if (mesh && mesh.instanceMatrix !== instanceMatrix) {
            mesh.instanceMatrix = instanceMatrix;
          }
        }}
        args={[geometry, undefined, count]}
        name="Power"
      >
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {positions.map((position, i) => (
        <pointLight
          key={i}
          ref={(light) => {
            lightRefs.current[i] = light;
          }}
          position={position}
          color={LED_COLOR}
          intensity={LED_LIGHT_INTENSITY}
          distance={LED_LIGHT_DISTANCE}
          decay={2}
        />
      ))}
    </>
  );
};
