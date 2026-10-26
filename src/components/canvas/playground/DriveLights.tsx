"use client";

import * as THREE from "three";

import { LED_BRIGHTNESS, LED_COLOR, fadeToward } from "./IndicatorLights";
import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";

// Lights on a tuner unit's front, which has two bays stacked vertically:
// - an amber drive-activity LED under the right end of each drive slot,
//   quiet for a while, then flickering hard in random bursts
// - the cream buttons, lit red: steady, with the occasional brief flicker
// - the three small panels at the right of each bay, lighting up one after
//   another, left to right, in a slow subtle pale yellow
// Each kind also casts a faint light of its colour.
//
// Lives inside the tuner's group, so positions are in the tuner's local
// space: the front faces +Y, and +Z is up.

const ACTIVITY_COLOR = new THREE.Color("#ff8a1a");
const ACTIVITY_BRIGHTNESS = 3;
const ACTIVITY_SIZE = 0.09;
// Activity LED position relative to its drive slot's right end (local -X is
// screen right): inset from the end, and just below the slot
const ACTIVITY_INSET = 0.09;
const ACTIVITY_DROP = 0.075;
const ACTIVITY_LIGHT = 0.25;

const BUTTON_LIGHT = 0.12;

const PANEL_COLOR = new THREE.Color("#ffe6a0");
const PANEL_BRIGHTNESS = 0.5;
// Seconds per step of the panel sequence: one lit, two lit, three lit, off
const PANEL_STEP = 0.9;
const PANEL_LIGHT = 0.08;

const LIGHT_DISTANCE = 1.6;

// Bumped to make every drive light burst at once (e.g. on a quote change)
let burstRequests = 0;
export const triggerDriveBurst = () => {
  burstRequests++;
};

// Disk-style activity: a long quiet stretch with the LED off, then a burst
// of rapid random flicker, then quiet again. A requested burst starts one
// straight away.
const makeActivity = () => {
  let lit = false;
  let quietUntil = 2 + Math.random() * 8;
  let busyUntil = 0;
  let nextToggle = 0;
  let seenRequests = burstRequests;
  return (t: number) => {
    const requested = burstRequests !== seenRequests;
    seenRequests = burstRequests;
    if (requested || (t >= quietUntil && t >= busyUntil)) {
      // Start a burst, and schedule the quiet stretch after it
      busyUntil =
        t + (requested ? 0.6 + Math.random() * 0.6 : 0.5 + Math.random() * 1.5);
      quietUntil = busyUntil + 6 + Math.random() * 10;
    }
    if (t >= busyUntil) return (lit = false);
    if (t >= nextToggle) {
      lit = Math.random() < 0.6;
      nextToggle = t + 0.02 + Math.random() * 0.07;
    }
    return lit;
  };
};

// Power light that stays on, dropping out briefly now and then (sometimes
// twice in quick succession), on its own random schedule
const makeFlicker = () => {
  let nextFlicker = 2 + Math.random() * 10;
  let offUntil = 0;
  let pendingDouble = false;
  return (t: number) => {
    if (t >= nextFlicker) {
      offUntil = t + 0.05 + Math.random() * 0.12;
      if (pendingDouble) {
        pendingDouble = false;
        nextFlicker = t + 4 + Math.random() * 10;
      } else {
        pendingDouble = Math.random() < 0.35;
        nextFlicker = pendingDouble
          ? offUntil + 0.08 + Math.random() * 0.1
          : t + 4 + Math.random() * 10;
      }
    }
    return t < offUntil ? 0.08 : 1;
  };
};

// Splits geometry into connected pieces (triangles sharing vertex positions)
const pieces = (geometry: THREE.BufferGeometry) => {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = flat.getAttribute("position");
  const key = (i: number) =>
    `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position
      .getZ(i)
      .toFixed(4)}`;
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    while (parent.get(k) !== k) k = parent.get(k)!;
    return k;
  };
  for (let tri = 0; tri < position.count; tri += 3) {
    const keys = [key(tri), key(tri + 1), key(tri + 2)];
    keys.forEach((k) => parent.has(k) || parent.set(k, k));
    parent.set(find(keys[0]), find(keys[1]));
    parent.set(find(keys[1]), find(keys[2]));
  }
  const groups = new Map<string, number[]>();
  for (let tri = 0; tri < position.count; tri += 3) {
    const root = find(key(tri));
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(tri);
  }
  return Array.from(groups.values()).map((tris) => {
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(flat.attributes)) {
      const attribute = flat.getAttribute(name);
      const values: number[] = [];
      for (const tri of tris) {
        for (let v = tri; v < tri + 3; v++) {
          for (let c = 0; c < attribute.itemSize; c++) {
            values.push(attribute.getComponent(v, c));
          }
        }
      }
      g.setAttribute(
        name,
        new THREE.Float32BufferAttribute(values, attribute.itemSize),
      );
    }
    g.computeBoundingBox();
    return g;
  });
};

// Splits a geometry's triangles by whether they sit in front of the unit
// (local Y > 0). The tuner's small-panel mesh also holds its feet, which are
// far below, so this separates the panels from them.
const splitFront = (geometry: THREE.BufferGeometry) => {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const attributes = Object.keys(flat.attributes);
  const out = [true, false].map(() =>
    Object.fromEntries(attributes.map((name) => [name, [] as number[]])),
  );
  const position = flat.getAttribute("position");
  for (let tri = 0; tri < position.count; tri += 3) {
    const front =
      position.getY(tri) > 0 &&
      position.getY(tri + 1) > 0 &&
      position.getY(tri + 2) > 0;
    const target = out[front ? 0 : 1];
    for (const name of attributes) {
      const attribute = flat.getAttribute(name);
      for (let v = tri; v < tri + 3; v++) {
        for (let c = 0; c < attribute.itemSize; c++) {
          target[name].push(attribute.getComponent(v, c));
        }
      }
    }
  }
  return out.map((arrays) => {
    const g = new THREE.BufferGeometry();
    for (const name of attributes) {
      const itemSize = flat.getAttribute(name).itemSize;
      g.setAttribute(
        name,
        new THREE.Float32BufferAttribute(arrays[name], itemSize),
      );
    }
    return g;
  });
};

type DriveLightsProps = {
  // The tuner's two cream buttons (one mesh)
  strip: THREE.BufferGeometry;
  // The two drive slots (one mesh)
  slots: THREE.BufferGeometry;
  // Mesh holding the small panels at the right of each bay (plus the
  // unit's feet, which keep the plain material)
  panelSource: THREE.BufferGeometry;
  panelMaterial: THREE.MeshStandardMaterial;
  // Offset (seconds) into the panel sequence, so units differ
  panelPhase: number;
};

export const DriveLights = ({
  strip,
  slots,
  panelSource,
  panelMaterial,
  panelPhase,
}: DriveLightsProps) => {
  const activityRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const panelRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const buttonRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  // Current faded levels (0-1) of the buttons and panels
  const buttonLevels = useRef<number[]>([]);
  const panelLevels = useRef<number[]>([]);
  const activityLight = useRef<THREE.PointLight>(null);
  const buttonLight = useRef<THREE.PointLight>(null);
  const panelLight = useRef<THREE.PointLight>(null);

  const [panels, feet] = useMemo(() => splitFront(panelSource), [panelSource]);

  // The faceplate, level with the front of the small panels
  const front = useMemo(() => {
    panels.computeBoundingBox();
    return panels.boundingBox!.max.y + 0.003;
  }, [panels]);

  const leds = useMemo(
    () =>
      pieces(slots)
        // The slot mesh has other parts too; the slots are the thin
        // recesses on the front (very short in Z)
        .filter((slot) => {
          const box = slot.boundingBox!;
          return box.max.y > 0.5 && box.max.z - box.min.z < 0.1;
        })
        .map((slot) => {
          const box = slot.boundingBox!;
          return {
            position: new THREE.Vector3(
              box.min.x + ACTIVITY_INSET,
              front,
              box.min.z - ACTIVITY_DROP,
            ),
            activity: makeActivity(),
          };
        }),
    [slots, front],
  );

  // Each button separately, so each flickers on its own
  const buttons = useMemo(
    () =>
      pieces(strip).map((geometry) => ({ geometry, flicker: makeFlicker() })),
    [strip],
  );

  // Each small panel separately, with its place in the left-to-right
  // sequence of its bay (local +X is screen left, so higher X goes first)
  const panelPieces = useMemo(() => {
    const all = pieces(panels);
    const center = (g: THREE.BufferGeometry) =>
      g.boundingBox!.getCenter(new THREE.Vector3());
    const midZ = all.reduce((sum, g) => sum + center(g).z, 0) / all.length;
    return all.map((geometry) => {
      const c = center(geometry);
      const bay = all.filter((g) => center(g).z < midZ === c.z < midZ);
      const order = bay
        .map((g) => center(g).x)
        .sort((a, b) => b - a)
        .indexOf(c.x);
      // Top bay is 0
      return { geometry, order, bay: c.z < midZ ? 1 : 0 };
    });
  }, [panels]);

  const [unitCenter, panelCenter] = useMemo(() => {
    panels.computeBoundingBox();
    const out = new THREE.Vector3(0, 0.2, 0);
    return [
      leds[0].position.clone().lerp(leds[1].position, 0.5).add(out),
      panels.boundingBox!.getCenter(new THREE.Vector3()).add(out),
    ];
  }, [leds, panels]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    let active = 0;
    leds.forEach((led, i) => {
      const lit = led.activity(t);
      if (lit) active++;
      activityRefs.current[i]?.color
        .copy(ACTIVITY_COLOR)
        .multiplyScalar(lit ? ACTIVITY_BRIGHTNESS : 0.06);
    });
    if (activityLight.current) {
      activityLight.current.intensity = (ACTIVITY_LIGHT * active) / leds.length;
    }

    let buttonsLit = 0;
    buttons.forEach(({ flicker }, bay) => {
      const level = fadeToward(
        buttonLevels.current[bay] ?? 1,
        flicker(t),
        delta,
      );
      buttonLevels.current[bay] = level;
      buttonsLit += level;
      buttonRefs.current[bay]?.color
        .copy(LED_COLOR)
        .multiplyScalar(LED_BRIGHTNESS * level);
    });
    if (buttonLight.current) {
      buttonLight.current.intensity =
        (BUTTON_LIGHT * buttonsLit) / buttons.length;
    }

    // Panels fill in left to right, one per step, then all go dark a step
    // The two bays run two steps apart, so they never light together
    const step = Math.floor((t + panelPhase) / PANEL_STEP);
    let litPanels = 0;
    panelPieces.forEach(({ order, bay }, i) => {
      const lit = order < (step + bay * 2) % 4;
      const level = fadeToward(panelLevels.current[i] ?? 0, lit ? 1 : 0, delta);
      panelLevels.current[i] = level;
      litPanels += level;
      const material = panelRefs.current[i];
      if (material) material.emissiveIntensity = PANEL_BRIGHTNESS * level;
    });
    if (panelLight.current) {
      panelLight.current.intensity =
        (PANEL_LIGHT * litPanels) / panelPieces.length;
    }
  });

  return (
    <>
      {/* Buttons, lit red */}
      {buttons.map(({ geometry }, bay) => (
        <mesh key={bay} geometry={geometry}>
          <meshBasicMaterial
            ref={(material) => {
              buttonRefs.current[bay] = material;
            }}
            toneMapped={false}
          />
        </mesh>
      ))}
      {panelPieces.map(({ geometry }, i) => (
        // Own material per panel so each can light on its own
        <mesh key={i} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            ref={(material) => {
              panelRefs.current[i] = material;
            }}
            color={panelMaterial.color}
            roughness={panelMaterial.roughness}
            metalness={panelMaterial.metalness}
            emissive={PANEL_COLOR}
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh geometry={feet} material={panelMaterial} castShadow receiveShadow />

      {leds.map((led, i) => (
        // Plane faces +Z by default; turn it to face the front (+Y)
        <mesh key={i} position={led.position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ACTIVITY_SIZE, ACTIVITY_SIZE * 0.6]} />
          <meshBasicMaterial
            ref={(material) => {
              activityRefs.current[i] = material;
            }}
            toneMapped={false}
          />
        </mesh>
      ))}

      <pointLight
        ref={activityLight}
        position={unitCenter}
        color={ACTIVITY_COLOR}
        intensity={0}
        distance={LIGHT_DISTANCE}
        decay={2}
      />
      <pointLight
        ref={buttonLight}
        position={unitCenter}
        color={LED_COLOR}
        intensity={0}
        distance={LIGHT_DISTANCE}
        decay={2}
      />
      <pointLight
        ref={panelLight}
        position={panelCenter}
        color={PANEL_COLOR}
        intensity={0}
        distance={LIGHT_DISTANCE}
        decay={2}
      />
    </>
  );
};
