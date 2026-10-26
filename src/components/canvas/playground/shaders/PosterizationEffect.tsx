import React, { forwardRef, useEffect, useMemo, Ref } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';

// Shader code
const fragmentShader = `
uniform float levels;
uniform float dither;
uniform float pixelSize;

// 4x4 ordered (Bayer) dither threshold in [0, 1)
float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) {
    return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Quantize in gamma space so the steps are even to the eye; in linear
    // space the first step above black is already very bright
    vec3 color = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));

    // One threshold per pixelation cell so the pattern lines up with the
    // pixelated image instead of being sampled away by it
    vec2 cell = floor(uv * resolution / pixelSize);
    float threshold = bayer4(cell) - 0.5;

    float steps = levels - 1.0;
    color = floor(color * steps + 0.5 + threshold * dither) / steps;

    outputColor = vec4(pow(clamp(color, 0.0, 1.0), vec3(2.2)), inputColor.a);
}`;

// Effect implementation
interface PosterizationEffectOptions {
  bits?: number;
  dither?: number;
  pixelSize?: number;
}
class PosterizationEffectImpl extends Effect {
  constructor({ bits = 4, dither = 1, pixelSize = 1 }: PosterizationEffectOptions = {}) {
    super('PosterizationEffect', fragmentShader, {
      uniforms: new Map([
        ['levels', new Uniform(2 ** bits)],
        ['dither', new Uniform(dither)],
        ['pixelSize', new Uniform(pixelSize)],
      ]),
    });
  }
}

// React component
export interface PosterizationProps {
  /**
   * The number of bits to determine the color depth.
   * For example, bits = 3 means 2^3 = 8 colors per channel.
   * @default 4
   */
  bits?: number;
  /**
   * Ordered dither strength. 0 gives hard bands, 1 breaks each band edge
   * into a full Bayer pattern.
   * @default 1
   */
  dither?: number;
  /**
   * Size of the dither cells in buffer pixels. Match the pixelation
   * granularity so each pixelated block gets one dither value.
   * @default 1
   */
  pixelSize?: number;
}
export const PosterizationEffect = forwardRef<Effect, PosterizationProps>(
  ({ bits = 4, dither = 1, pixelSize = 1 }: PosterizationProps, ref: Ref<Effect>) => {
    // Created once; prop changes (e.g. pixelSize on resize) update uniforms
    // instead of rebuilding the effect
    const effect = useMemo(() => new PosterizationEffectImpl(), []);

    useEffect(() => {
      effect.uniforms.get('levels')!.value = 2 ** bits;
      effect.uniforms.get('dither')!.value = dither;
      effect.uniforms.get('pixelSize')!.value = Math.max(1, pixelSize);
    }, [effect, bits, dither, pixelSize]);

    useEffect(() => () => effect.dispose(), [effect]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

PosterizationEffect.displayName = 'Posterization';

export default PosterizationEffect;
