import { Color, Uniform } from 'three';

import { Effect } from 'postprocessing';

// CRT touches for the monitor screens: an RGB phosphor mask (aperture grille
// stripes) and a faint bar rolling down the screen that glows and wobbles the
// picture sideways as it passes. Only colour and UV changes, no convolution,
// so it can share an EffectPass with the other screen effects.
const fragmentShader = `
uniform float maskTriads;
uniform float maskStrength;
uniform float barStrength;
uniform float barSpeed;
uniform float barWidth;
uniform float barPhase;
uniform vec3 barColor;
uniform float barDistortion;

// 1 at the rolling bar's centre, falling to 0 at barWidth away
float rollBar(float y) {
    // Bar centre travels top to bottom, wrapping
    float center = 1.0 - fract(time * barSpeed + barPhase);
    float d = abs(y - center);
    d = min(d, 1.0 - d);
    return 1.0 - smoothstep(0.0, barWidth, d);
}

void mainUv(inout vec2 uv) {
    // Sync tear: rows inside the bar shift sideways in one direction, most at
    // the centre. Squaring the falloff keeps the bend tight to the bar.
    float bar = rollBar(uv.y);
    uv.x += bar * bar * barDistortion;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Each triad is three stripes: R, G, B. Dim the other two channels on
    // each stripe, then normalize so the mask doesn't darken the screen.
    float stripe = mod(floor(uv.x * maskTriads * 3.0), 3.0);
    float dim = 1.0 - maskStrength;
    vec3 mask = mix(vec3(dim), vec3(1.0), vec3(equal(vec3(stripe), vec3(0.0, 1.0, 2.0))));
    vec3 color = inputColor.rgb * mask * (3.0 / (1.0 + 2.0 * dim));

    float bar = rollBar(uv.y);
    // Added rather than multiplied: the screens are mostly near-black, and
    // scaling near-black stays near-black
    color += bar * barStrength * barColor;

    outputColor = vec4(color, inputColor.a);
}`;

export interface CRTEffectOptions {
  /** Phosphor triads across the screen width */
  maskTriads?: number;
  /** 0 = no mask, 1 = pure R/G/B stripes */
  maskStrength?: number;
  /** Glow added at the centre of the rolling bar (linear colour) */
  barStrength?: number;
  /** Tint of the rolling bar's glow */
  barColor?: Color;
  /** Screen heights per second */
  barSpeed?: number;
  /** Random +/- fraction applied to barSpeed per instance, so monitors
   * don't all roll at the same rate */
  barSpeedVariation?: number;
  /** Half-height of the bar's falloff, in screen heights */
  barWidth?: number;
  /** Offset into the roll, so screens don't all roll in sync */
  barPhase?: number;
  /** Sideways shift at the bar's centre, as a fraction of screen width.
   * Negative shifts the other way. */
  barDistortion?: number;
}

export class CRTEffect extends Effect {
  constructor({
    maskTriads = 100,
    maskStrength = 0.2,
    barStrength = 0.005,
    barColor = new Color('#65FFBD'),
    barSpeed = 0.2,
    barSpeedVariation = 0.25,
    barWidth = 0.15,
    barPhase = 0,
    barDistortion = 0.002,
  }: CRTEffectOptions = {}) {
    const speed = barSpeed * (1 + (Math.random() * 2 - 1) * barSpeedVariation);

    super('CRTEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['maskTriads', new Uniform(maskTriads)],
        ['maskStrength', new Uniform(maskStrength)],
        ['barStrength', new Uniform(barStrength)],
        ['barSpeed', new Uniform(speed)],
        ['barWidth', new Uniform(barWidth)],
        ['barPhase', new Uniform(barPhase)],
        ['barColor', new Uniform(barColor)],
        ['barDistortion', new Uniform(barDistortion)],
      ]),
    });
  }

  set maskTriads(value: number) {
    this.uniforms.get('maskTriads')!.value = value;
  }
}
