import React, { forwardRef, useMemo, Ref } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';

// Shader code
const fragmentShader = `
uniform int bits;

float posterize(float color, int numColors) {
    return floor(color * float(numColors)) / float(numColors - 1);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float numColors = float(1 << bits); // Calculate 2^bits
    outputColor = vec4(
        posterize(inputColor.r, int(numColors)),
        posterize(inputColor.g, int(numColors)),
        posterize(inputColor.b, int(numColors)),
        inputColor.a
    );
}`;

// Effect implementation
interface PosterizationEffectOptions {
  bits?: number;
}
class PosterizationEffectImpl extends Effect {
  constructor({ bits = 4 }: PosterizationEffectOptions = {}) { // Added default empty object
    super('PosterizationEffect', fragmentShader, {
      uniforms: new Map([['bits', new Uniform(bits)]]),
    });
    // this.uniforms.get('bits').value = Number(bits);
  }

  // update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, deltaTime?: number): void {
  //   super.update(renderer, inputBuffer, deltaTime);
  // }
}

// React component
export interface PosterizationProps {
  /**
   * The number of bits to determine the color depth.
   * For example, bits = 3 means 2^3 = 8 colors per channel.
   * @default 4
   */
  bits?: number;
}
export const PosterizationEffect = forwardRef<Effect, PosterizationProps>(
  ({ bits = 4 }: PosterizationProps, ref: Ref<Effect>) => {
    const effect = useMemo(() => new PosterizationEffectImpl({ bits }), [bits]);
    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

PosterizationEffect.displayName = 'Posterization';

export default PosterizationEffect;