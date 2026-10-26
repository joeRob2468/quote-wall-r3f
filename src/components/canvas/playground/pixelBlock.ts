import { BloomEffect } from "postprocessing";
import { useThree } from "@react-three/fiber";

// The scene is pixelated by rendering it at one pixel per block and letting
// the canvas upscale with hard edges (image-rendering: pixelated, see
// globals.css). It used to render every pixel and average blocks down in a
// pass, which shaded each block four times over. The canvas's pixel ratio
// is set from blockPixelRatio in canvas/Layout.tsx.

// Block size at REFERENCE_WIDTH, in render pixels at the canvas's normal
// pixel ratio; scaled with the canvas width, rounded, and capped there
const BASE_BLOCK = 2;
const REFERENCE_WIDTH = 1920;
const MAX_BLOCK = 2;

// Pixel ratio the scene would render at without the blocks
const MAX_BASE_PIXEL_RATIO = 1.5;

const pixelBlockFor = (width: number) => {
  const scaled = BASE_BLOCK * (width / REFERENCE_WIDTH);
  return Math.max(1, Math.min(MAX_BLOCK, Math.round(scaled)));
};

// Block size for the canvas, from inside it
export const usePixelBlock = () =>
  pixelBlockFor(useThree((state) => state.size.width));

// Pixel ratio that renders one pixel per block, for a full-window canvas
export const blockPixelRatio = () => {
  const base = Math.min(Math.max(window.devicePixelRatio, 1), MAX_BASE_PIXEL_RATIO);
  return base / pixelBlockFor(window.innerWidth);
};

// Bloom's mip chain starts at half the size of its input. At block
// resolution that loses the finest level the full-resolution chain had, and
// the glow spreads wider; this sizes the chain from the full-resolution size
// instead, so it has the same levels as before. Returns an undo.
export const matchBloomMipChain = (effect: BloomEffect, block: number) => {
  const baseSetSize = Object.getPrototypeOf(effect).setSize as BloomEffect["setSize"];
  effect.setSize = (width, height) => {
    baseSetSize.call(effect, width, height);
    effect.mipmapBlurPass.setSize(width * block, height * block);
  };
  const { baseWidth, baseHeight } = effect.resolution;
  effect.setSize(baseWidth, baseHeight);
  return () => {
    effect.setSize = baseSetSize;
    effect.setSize(effect.resolution.baseWidth, effect.resolution.baseHeight);
  };
};

// Offset, in render pixels, of the four texture taps the screens take per
// pixel. The old pass sampled each 2x2 block's centre with bilinear
// filtering, i.e. averaged four full-resolution pixels; tapping at their
// centres keeps the screens' text and scanlines exactly as they were.
// Zero when blocks are a single pixel, which were never averaged.
export const screenTapOffset = { value: 0 };
