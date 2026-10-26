import React, { forwardRef, useEffect, useMemo, Ref } from 'react';
import { Color, Uniform } from 'three';
import { Effect } from 'postprocessing';

// Contrast S-curve plus split toning: the curve deepens blacks and lifts
// highlights, then the darkest tones get a lift toward a tint (cool blue by
// default) so shadows and fog read blue-black while the screens keep their
// green.
const fragmentShader = `
uniform vec3 shadowTint;
uniform float shadowStrength;
uniform float shadowRange;
uniform float contrast;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // S-curve in gamma space, where it acts evenly to the eye
    // (only on 0-1; anything brighter, like the boosted screens, passes the
    // excess through unchanged so bloom input isn't altered)
    vec3 color = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
    vec3 base = min(color, 1.0);
    vec3 curved = base * base * (3.0 - 2.0 * base);
    color = pow(mix(base, curved, contrast) + max(color - 1.0, 0.0), vec3(2.2));

    // Weight by perceived brightness so "dark" matches what the eye sees
    float luma = pow(max(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0.0), 1.0 / 2.2);
    float shadows = 1.0 - smoothstep(0.0, shadowRange, luma);
    color += shadowTint * shadows * shadowStrength;
    outputColor = vec4(color, inputColor.a);
}`;

interface ColorGradeEffectOptions {
  shadowTint?: Color;
  shadowStrength?: number;
  shadowRange?: number;
  contrast?: number;
}

class ColorGradeEffectImpl extends Effect {
  constructor({
    shadowTint = new Color('#1a3a7a'),
    shadowStrength = 0.02,
    shadowRange = 0.35,
    contrast = 0,
  }: ColorGradeEffectOptions = {}) {
    super('ColorGradeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['shadowTint', new Uniform(shadowTint)],
        ['shadowStrength', new Uniform(shadowStrength)],
        ['shadowRange', new Uniform(shadowRange)],
        ['contrast', new Uniform(contrast)],
      ]),
    });
  }
}

export interface ColorGradeProps {
  /**
   * Colour added to the shadows.
   * @default '#1a3a7a'
   */
  shadowTint?: string;
  /**
   * How much tint is added at pure black (linear colour units).
   * @default 0.02
   */
  shadowStrength?: number;
  /**
   * Perceived brightness (0-1) where the tint has fully faded out.
   * @default 0.35
   */
  shadowRange?: number;
  /**
   * S-curve strength: 0 leaves tones alone, 1 is a full smoothstep curve
   * (deeper blacks, brighter highlights).
   * @default 0
   */
  contrast?: number;
}

export const ColorGrade = forwardRef<Effect, ColorGradeProps>(
  (
    {
      shadowTint = '#1a3a7a',
      shadowStrength = 0.02,
      shadowRange = 0.35,
      contrast = 0,
    }: ColorGradeProps,
    ref: Ref<Effect>
  ) => {
    // Created once; prop changes update uniforms instead of rebuilding
    const effect = useMemo(() => new ColorGradeEffectImpl(), []);

    useEffect(() => {
      (effect.uniforms.get('shadowTint')!.value as Color).set(shadowTint);
      effect.uniforms.get('shadowStrength')!.value = shadowStrength;
      effect.uniforms.get('shadowRange')!.value = shadowRange;
      effect.uniforms.get('contrast')!.value = contrast;
    }, [effect, shadowTint, shadowStrength, shadowRange, contrast]);

    // r3f replaces a primitive's dispose with null when dispose={null} is
    // passed, so call the class's own method
    useEffect(() => () => Effect.prototype.dispose.call(effect), [effect]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

ColorGrade.displayName = 'ColorGrade';

export default ColorGrade;
