"use client";

import { BlendFunction, SelectiveBloomEffect } from "postprocessing";
import { useContext, useEffect, useMemo } from "react";

import { EffectComposerContext } from "@react-three/postprocessing";
import { Object3D } from "three";
import { matchBloomMipChain } from "./pixelBlock";

// Extra bloom on just the screens, for a glow halo like the hover state's
// without brightening the screen faces.
//
// Built directly on postprocessing's SelectiveBloomEffect rather than the
// <SelectiveBloom> component: that component rebuilds the effect on every
// render, and each new effect claims a fresh render layer (only 31 exist),
// so selections wrapped around and left stray layers toggled on the screen
// meshes, making screens vanish. Here the effect is created once, on a fixed
// layer, and screens register their panels through addScreenBloomTarget.

const SCREEN_BLOOM_LAYER = 11;

const targets = new Set<Object3D>();
const listeners = new Set<() => void>();

// Adds an object to the screen bloom. Returns a function that removes it.
export const addScreenBloomTarget = (object: Object3D) => {
  targets.add(object);
  listeners.forEach((sync) => sync());
  return () => {
    targets.delete(object);
    object.layers.disable(SCREEN_BLOOM_LAYER);
    listeners.forEach((sync) => sync());
  };
};

type ScreenBloomProps = {
  intensity: number;
  radius: number;
  // Pixelation block size, for matching the mip chain (see pixelBlock.ts)
  block: number;
};

export const ScreenBloom = ({ intensity, radius, block }: ScreenBloomProps) => {
  const { scene, camera } = useContext(EffectComposerContext);

  const effect = useMemo(() => {
    const bloom = new SelectiveBloomEffect(scene, camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    });
    bloom.selection.layer = SCREEN_BLOOM_LAYER;
    bloom.ignoreBackground = true;
    return bloom;
  }, [scene, camera]);

  useEffect(() => {
    effect.intensity = intensity;
    effect.mipmapBlurPass.radius = radius;
  }, [effect, intensity, radius]);

  useEffect(() => matchBloomMipChain(effect, block), [effect, block]);

  useEffect(() => {
    const sync = () => effect.selection.set(targets);
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
      effect.selection.clear();
    };
  }, [effect]);

  // r3f replaces a primitive's dispose with null when dispose={null} is
  // passed, so call the class's own method
  useEffect(() => () => SelectiveBloomEffect.prototype.dispose.call(effect), [effect]);

  return <primitive object={effect} dispose={null} />;
};
