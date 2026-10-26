"use client";

import * as THREE from "three";

import {
  MutableRefObject,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SCREEN_FONT, SCREEN_FONT_SCALE, SCREEN_LINE_HEIGHT } from "./Text";

import { Text as DreiText } from "@react-three/drei";
import { fadeToward } from "./IndicatorLights";
import { useFrame } from "@react-three/fiber";

// Terminal-style details drawn inside the screens: bars, rules, brackets,
// chevrons and status text. Coordinates are in the screens' 13x13 portal
// space (centre 0,0). VT323 has no box-drawing or block glyphs, so frames
// and bars are plain geometry and all text is ASCII.

// Sporadic CRT flicker: steady at full level, then every few seconds a
// short burst of dips (usually one, sometimes two, rarely three). Returns
// the target level (0-1) at time t; useFlickerLevel fades toward it.
export const makeSporadicFlicker = ({
  depth = 0.5,
  minGap = 3,
  maxGap = 12,
} = {}) => {
  let nextBurst = minGap + Math.random() * (maxGap - minGap);
  const dips: [number, number, number][] = []; // [start, end, level]
  return (t: number) => {
    if (t >= nextBurst) {
      let start = t;
      const roll = Math.random();
      const count = roll < 0.65 ? 1 : roll < 0.9 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        const end = start + 0.05 + Math.random() * 0.07;
        dips.push([start, end, 1 - depth * (0.6 + Math.random() * 0.4)]);
        start = end + 0.04 + Math.random() * 0.08;
      }
      nextBurst = start + minGap + Math.random() * (maxGap - minGap);
    }
    while (dips.length && dips[0][1] < t) dips.shift();
    const dip = dips.find(([start, end]) => t >= start && t < end);
    return dip ? dip[2] : 1;
  };
};

// Seconds for a flicker to fade down or back up: just enough to soften the
// edges without blurring quick dips
const FLICKER_FADE_SECONDS = 0.04;

// A flicker level updated every frame, to share between several elements.
// Eases toward each dip and back rather than snapping.
export const useFlickerLevel = (
  options?: Parameters<typeof makeSporadicFlicker>[0],
) => {
  const level = useRef(1);
  const [flicker] = useState(() => makeSporadicFlicker(options));
  useFrame(({ clock }, delta) => {
    level.current = fadeToward(
      level.current,
      flicker(clock.elapsedTime),
      delta,
      FLICKER_FADE_SECONDS,
    );
  });
  return level;
};

type TermTextProps = {
  children: ReactNode;
  position: [number, number];
  size?: number;
  color: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  // Wrap past this width (centred lines)
  maxWidth?: number;
};

// Single line of screen text at an exact spot
export const TermText = ({
  children,
  position,
  size = 0.6,
  color,
  anchorX = "left",
  anchorY = "middle",
  maxWidth,
}: TermTextProps) => (
  <DreiText
    font={SCREEN_FONT}
    fontSize={size * SCREEN_FONT_SCALE}
    lineHeight={SCREEN_LINE_HEIGHT}
    color={color}
    anchorX={anchorX}
    anchorY={anchorY}
    maxWidth={maxWidth}
    textAlign="center"
    position={[position[0], position[1], 0.02]}
  >
    {children}
  </DreiText>
);

type RectProps = {
  position: [number, number];
  size: [number, number];
  color: string;
  // Optional shared flicker level to dim the colour by
  level?: MutableRefObject<number>;
};

export const Rect = ({ position, size, color, level }: RectProps) => {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const base = useMemo(() => new THREE.Color(color), [color]);
  useFrame(() => {
    if (level && material.current) {
      material.current.color.copy(base).multiplyScalar(level.current);
    }
  });
  return (
    <mesh position={[position[0], position[1], 0.01]}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={material} color={color} />
    </mesh>
  );
};

// Thin L-shaped brackets in each corner, like a selectable field. They
// flicker together now and then.
export const CornerBrackets = ({
  inset,
  length,
  thickness = 0.14,
  color,
}: {
  inset: number;
  length: number;
  thickness?: number;
  color: string;
}) => {
  const level = useFlickerLevel({ depth: 0.8 });
  return (
    <>
      {[
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].map(([sx, sy], i) => {
        const x = sx * inset;
        const y = sy * inset;
        return (
          <group key={i}>
            <Rect
              position={[x - (sx * length) / 2, y - (sy * thickness) / 2]}
              size={[length, thickness]}
              color={color}
              level={level}
            />
            <Rect
              position={[x - (sx * thickness) / 2, y - (sy * length) / 2]}
              size={[thickness, length]}
              color={color}
              level={level}
            />
          </group>
        );
      })}
    </>
  );
};

// A row of chevrons lighting up one after another in `direction`
export const Chevrons = ({
  direction,
  y,
  color,
  dimColor,
  count = 3,
  spacing = 1.1,
  size = 1.4,
}: {
  direction: "left" | "right";
  y: number;
  color: string;
  dimColor: string;
  count?: number;
  spacing?: number;
  size?: number;
}) => {
  const refs = useRef<({ color: THREE.ColorRepresentation } | null)[]>([]);
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const dim = useMemo(() => new THREE.Color(dimColor), [dimColor]);
  const glyph = direction === "right" ? ">" : "<";

  useFrame(({ clock }) => {
    // One step every 0.2s; a pause step at the end of each run
    const step = Math.floor(clock.elapsedTime / 0.2) % (count + 1);
    refs.current.forEach((text, i) => {
      if (!text) return;
      const order = direction === "right" ? i : count - 1 - i;
      text.color = order === step ? lit : dim;
    });
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <DreiText
          key={i}
          ref={(text: { color: THREE.ColorRepresentation } | null) => {
            refs.current[i] = text;
          }}
          font={SCREEN_FONT}
          fontSize={size * SCREEN_FONT_SCALE}
          color={dimColor}
          anchorX="center"
          anchorY="middle"
          position={[(i - (count - 1) / 2) * spacing, y, 0.02]}
        >
          {glyph}
        </DreiText>
      ))}
    </>
  );
};

const pad = (n: number) => n.toString().padStart(2, "0");

// Time since the page loaded, as T+HH:MM:SS
export const Uptime = ({
  position,
  color,
  size,
  anchorX,
}: Omit<TermTextProps, "children">) => {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.floor((now - start) / 1000);
  const text = `T+${pad(Math.floor(seconds / 3600))}:${pad(
    Math.floor(seconds / 60) % 60,
  )}:${pad(seconds % 60)}`;
  return (
    <TermText position={position} color={color} size={size} anchorX={anchorX}>
      {text}
    </TermText>
  );
};

// Voiceprint-style level meter: a row of bars that bounce gently at idle
// and spike for a moment whenever `burstKey` changes (e.g. a new quote)
export const Waveform = ({
  burstKey,
  y,
  width,
  maxHeight,
  color,
  bars = 25,
}: {
  burstKey: unknown;
  y: number;
  width: number;
  maxHeight: number;
  color: string;
  bars?: number;
}) => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const energy = useRef(1);
  const lastKey = useRef(burstKey);
  const seeds = useMemo(
    () =>
      Array.from({ length: bars }, () => ({
        speed: 4 + Math.random() * 9,
        phase: Math.random() * Math.PI * 2,
      })),
    [bars],
  );
  const barWidth = (width / bars) * 0.55;

  useFrame(({ clock }, delta) => {
    if (lastKey.current !== burstKey) {
      lastKey.current = burstKey;
      energy.current = 1;
    }
    // Burst decays over about a second and a half down to an idle murmur
    energy.current = Math.max(0, energy.current - delta * 0.7);
    const amplitude = 0.5 + 0.5 * energy.current;
    const t = clock.elapsedTime;
    refs.current.forEach((bar, i) => {
      if (!bar) return;
      const { speed, phase } = seeds[i];
      // Taller towards the middle, like a voice envelope
      const envelope = 1 - Math.abs(i / (bars - 1) - 0.5) * 1.2;
      const wobble = 0.35 + 0.65 * Math.abs(Math.sin(t * speed + phase));
      bar.scale.y = Math.max(0.04, amplitude * envelope * wobble);
    });
  });

  return (
    <>
      {seeds.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            refs.current[i] = mesh;
          }}
          position={[(i / (bars - 1) - 0.5) * width, y, 0.01]}
        >
          <planeGeometry args={[barWidth, maxHeight]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
};

// Dashed frame whose dashes crawl around the edge ("marching ants")
export const MarchingBorder = ({
  half,
  color,
  dash = 0.55,
  gap = 0.4,
  thickness = 0.14,
  speed = 1.2,
}: {
  // Half the frame's side length
  half: number;
  color: string;
  dash?: number;
  gap?: number;
  thickness?: number;
  speed?: number;
}) => {
  const perimeter = half * 8;
  const count = Math.floor(perimeter / (dash + gap));
  const spacing = perimeter / count;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  // Point and direction (horizontal or not) at distance s along the frame,
  // clockwise from the top-left corner
  const along = (s: number): [number, number, boolean] => {
    const side = half * 2;
    const d = ((s % perimeter) + perimeter) % perimeter;
    if (d < side) return [-half + d, half, true];
    if (d < side * 2) return [half, half - (d - side), false];
    if (d < side * 3) return [half - (d - side * 2), -half, true];
    return [-half, -half + (d - side * 3), false];
  };

  useFrame(({ clock }) => {
    const offset = clock.elapsedTime * speed;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const [x, y, horizontal] = along(i * spacing + offset);
      mesh.position.set(x, y, 0.01);
      mesh.scale.set(
        horizontal ? dash : thickness,
        horizontal ? thickness : dash,
        1,
      );
    });
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            refs.current[i] = mesh;
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
};

const SCRAMBLE_CHARS = "#%&*+=?@0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const randomChar = () =>
  SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

// Text that now and then (and when `trigger` changes) scrambles into random
// characters and resolves back left to right, like a decrypt effect
export const useDecrypt = (text: string, trigger?: unknown) => {
  const [shown, setShown] = useState(text);
  const start = useRef<number | null>(null);
  const next = useRef(3 + Math.random() * 5);
  const lastTrigger = useRef(trigger);
  const DURATION = 0.7;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lastTrigger.current !== trigger) {
      lastTrigger.current = trigger;
      start.current = t;
    }
    if (start.current === null && t >= next.current) start.current = t;
    if (start.current === null) return;

    const progress = (t - start.current) / DURATION;
    if (progress >= 1) {
      start.current = null;
      next.current = t + 5 + Math.random() * 6;
      if (shown !== text) setShown(text);
      return;
    }
    // Characters before the reveal point are settled; the rest churn
    const settled = Math.floor(progress * text.length);
    const frame = text
      .split("")
      .map((char, i) => (i < settled || char === " " ? char : randomChar()))
      .join("");
    if (frame !== shown) setShown(frame);
  });

  return shown;
};
