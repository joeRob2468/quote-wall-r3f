"use client";

import * as THREE from "three";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { addScreenBloomTarget } from "./ScreenBloom";

// Red seven-segment clock showing the viewer's local time, drawn to a canvas
// and laid over the radio's display. Unlit segments stay faintly visible like
// a real LED display, and the colon blinks once a second.

const CANVAS_W = 512;
const CANVAS_H = 192;
const LIT = "#ff2a1a";
const GHOST = "#3a0806";
const FACE = "#120202";
// Pushes lit segments past 1.0 so they bloom
const BRIGHTNESS = 3.2;

// Segment order: a (top), b (top right), c (bottom right), d (bottom),
// e (bottom left), f (top left), g (middle)
const DIGITS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

const drawDigit = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: string
) => {
  const t = w * 0.18; // segment thickness
  const slant = w * 0.12; // italic lean, like most LED clocks
  const half = h / 2;
  const segs: Record<string, [number, number, number, number]> = {
    a: [x + t, y, w - 2 * t, t],
    g: [x + t, y + half - t / 2, w - 2 * t, t],
    d: [x + t, y + h - t, w - 2 * t, t],
    f: [x, y + t, t, half - 1.5 * t],
    b: [x + w - t, y + t, t, half - 1.5 * t],
    e: [x, y + half + t / 2, t, half - 1.5 * t],
    c: [x + w - t, y + half + t / 2, t, half - 1.5 * t],
  };
  for (const [name, [sx, sy, sw, sh]] of Object.entries(segs)) {
    ctx.fillStyle = lit.includes(name) ? LIT : GHOST;
    // Shear around the digit's vertical middle for the lean
    const lean = (py: number) => slant * (0.5 - (py - y) / h);
    ctx.beginPath();
    ctx.moveTo(sx + lean(sy), sy);
    ctx.lineTo(sx + sw + lean(sy), sy);
    ctx.lineTo(sx + sw + lean(sy + sh), sy + sh);
    ctx.lineTo(sx + lean(sy + sh), sy + sh);
    ctx.closePath();
    ctx.fill();
  }
};

const drawClock = (ctx: CanvasRenderingContext2D, now: Date) => {
  ctx.fillStyle = FACE;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const hours = now.getHours() % 12 || 12;
  const text = `${hours.toString().padStart(2, " ")}${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const digitW = 82;
  const digitH = 136;
  const gap = 24;
  const colonW = 40;
  const totalW = digitW * 4 + gap * 3 + colonW;
  let x = (CANVAS_W - totalW) / 2;
  const y = (CANVAS_H - digitH) / 2;

  text.split("").forEach((char, i) => {
    drawDigit(ctx, x, y, digitW, digitH, DIGITS[char] ?? "");
    x += digitW + gap;
    if (i === 1) {
      // Colon, blinking with the seconds
      ctx.fillStyle = now.getSeconds() % 2 === 0 ? LIT : GHOST;
      const dot = 14;
      const cx = x - gap / 2 + colonW / 2 - dot / 2;
      ctx.fillRect(cx, y + digitH * 0.3 - dot / 2, dot, dot);
      ctx.fillRect(cx, y + digitH * 0.7 - dot / 2, dot, dot);
      x += colonW;
    }
  });
};

type LedClockProps = {
  // World-space centre and outward normal of the display face
  center: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
  height: number;
};

export const LedClock = ({ center, normal, width, height }: LedClockProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const [canvas, texture] = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return [c, tex];
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tick = () => {
      drawClock(ctx, new Date());
      texture.needsUpdate = true;
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
      texture.dispose();
    };
  }, [canvas, texture]);

  // Face the display's outward normal, sitting just in front of it
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.copy(center).addScaledVector(normal, 0.004);
    mesh.lookAt(mesh.position.clone().add(normal));
  }, [center, normal]);

  // Also gets the screens' extra bloom halo
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    return addScreenBloomTarget(meshRef.current);
  }, []);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        color={[BRIGHTNESS, BRIGHTNESS, BRIGHTNESS]}
      />
    </mesh>
  );
};
