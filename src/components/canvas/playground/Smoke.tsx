"use client";

import * as THREE from "three";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";

// Drifting smoke: a few large additive planes between the camera and the
// monitors, each running animated fbm noise. Brightness falls off away from
// `glowCenter` so the smoke looks lit by the screens rather than evenly lit.

const vertexShader = `
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const fragmentShader = `
uniform float time;
uniform float seed;
uniform float opacity;
uniform float scale;
uniform vec2 drift;
uniform vec3 color;
uniform vec3 glowCenter;
uniform float glowRadius;

varying vec2 vUv;
varying vec3 vWorld;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = vUv * scale + seed * 13.0;
  // Warp the lookup by a second noise field so it billows instead of sliding
  vec2 warp = vec2(fbm(p + time * 0.05), fbm(p - time * 0.04 + 5.2));
  float n = fbm(p + warp * 1.5 + drift * time);

  float density = smoothstep(0.55, 0.9, n);

  // Lit by the monitors: brightest near them, fading into the dark
  float glow = 1.0 - smoothstep(0.0, glowRadius, distance(vWorld, glowCenter));

  // Soft plane edges so the layers never show a hard border
  vec2 edge = smoothstep(vec2(0.0), vec2(0.25), vUv) * smoothstep(vec2(0.0), vec2(0.25), 1.0 - vUv);

  gl_FragColor = vec4(color, density * glow * edge.x * edge.y * opacity);
}`;

type SmokeLayerProps = {
  position: [number, number, number];
  size: [number, number];
  opacity: number;
  seed: number;
  drift: [number, number];
  glowCenter: THREE.Vector3;
  glowRadius: number;
  color: THREE.Color;
};

const SmokeLayer = ({
  position,
  size,
  opacity,
  seed,
  drift,
  glowCenter,
  glowRadius,
  color,
}: SmokeLayerProps) => {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      seed: { value: seed },
      opacity: { value: opacity },
      scale: { value: 3 },
      drift: { value: new THREE.Vector2(...drift) },
      color: { value: color },
      glowCenter: { value: glowCenter },
      glowRadius: { value: glowRadius },
    }),
    [seed, opacity, drift, color, glowCenter, glowRadius]
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.time.value += delta;
  });

  return (
    // Planes face +Z; the camera looks down +Z from behind, so flip them
    <mesh position={position} rotation={[0, Math.PI, 0]} renderOrder={1}>
      <planeGeometry args={size} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

type SmokeProps = {
  // World position the smoke is lit from (the middle of the monitor bank)
  glowCenter: [number, number, number];
  glowRadius?: number;
  color?: string;
  opacity?: number;
};

export const Smoke = ({
  glowCenter,
  glowRadius = 3.5,
  color = "#8fb8a4",
  opacity = 0.08,
}: SmokeProps) => {
  const center = useMemo(() => new THREE.Vector3(...glowCenter), [glowCenter]);
  const tint = useMemo(() => new THREE.Color(color), [color]);
  const [cx, cy, cz] = glowCenter;

  // Layers from just in front of the monitors back toward the camera, each
  // drifting a different way so they slide past each other
  return (
    <group>
      <SmokeLayer
        position={[cx, cy, cz - 0.6]}
        size={[9, 5]}
        opacity={opacity}
        seed={0.1}
        drift={[0.03, 0.01]}
        glowCenter={center}
        glowRadius={glowRadius}
        color={tint}
      />
      <SmokeLayer
        position={[cx, cy - 0.3, cz - 1.6]}
        size={[9, 5]}
        opacity={opacity * 0.8}
        seed={0.47}
        drift={[-0.02, 0.015]}
        glowCenter={center}
        glowRadius={glowRadius}
        color={tint}
      />
      <SmokeLayer
        position={[cx, cy + 0.2, cz - 2.6]}
        size={[9, 5]}
        opacity={opacity * 0.6}
        seed={0.83}
        drift={[0.015, -0.01]}
        glowCenter={center}
        glowRadius={glowRadius}
        color={tint}
      />
    </group>
  );
};
