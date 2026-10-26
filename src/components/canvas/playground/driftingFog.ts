import * as THREE from "three";

// Drifting, lit fog: replaces three's built-in fog shader chunks so that
// - FogExp2's density varies through space with slowly moving 3D noise, and
// - registered lights (the lamp, each screen) glow in the fog. For each
//   pixel the light scattered toward the camera along the view ray is
//   computed in closed form (single scattering from a point light in uniform
//   fog, no shadows), which gives real volumetric halos cheaply.
// Patches are global (every fogged material picks them up), so they're
// installed once.
//
// The extra values (time, light list) need uniforms. Built-in materials
// have no slot for them, so a default onBeforeCompile on Material.prototype
// hands every fogged shader the same shared uniform objects. Materials that
// set their own onBeforeCompile (e.g. troika text) get frozen noise and no
// light scattering.

export const fogTime = { value: 0 };

const MAX_FOG_LIGHTS = 10;

const fogLightPositions = {
  value: Array.from({ length: MAX_FOG_LIGHTS }, () => new THREE.Vector3()),
};
// Colour already multiplied by intensity; black means the slot is unused
const fogLightColors = {
  value: Array.from({ length: MAX_FOG_LIGHTS }, () => new THREE.Vector3()),
};
// xyz: direction the light points, w: cosine of its cone edge (-2 = all
// directions)
const fogLightDirections = {
  value: Array.from(
    { length: MAX_FOG_LIGHTS },
    () => new THREE.Vector4(0, 0, 0, -2),
  ),
};
const usedSlots = new Array<boolean>(MAX_FOG_LIGHTS).fill(false);
// Full-strength colour and optional live level (0-1) per slot, for lights
// whose brightness changes (e.g. flickering screens)
const baseColors = Array.from(
  { length: MAX_FOG_LIGHTS },
  () => new THREE.Color(),
);
const levels: ({ current: number } | null)[] = new Array(MAX_FOG_LIGHTS).fill(
  null,
);

// Applies each light's live level; call once per frame
export const updateFogLights = () => {
  levels.forEach((level, slot) => {
    if (!level || !usedSlots[slot]) return;
    const c = baseColors[slot];
    fogLightColors.value[slot].set(c.r, c.g, c.b).multiplyScalar(level.current);
  });
};

type FogLight = {
  position: THREE.Vector3;
  color: THREE.ColorRepresentation;
  intensity: number;
  // Point the glow along this direction instead of all around
  direction?: THREE.Vector3;
  coneAngle?: number;
  // Live brightness multiplier, read every frame by updateFogLights
  level?: { current: number };
};

// Makes a light glow in the fog. Returns a function that removes it again.
export const addFogLight = ({
  position,
  color,
  intensity,
  direction,
  coneAngle = Math.PI / 4,
  level,
}: FogLight) => {
  const slot = usedSlots.indexOf(false);
  if (slot === -1) return () => {};
  usedSlots[slot] = true;

  fogLightPositions.value[slot].copy(position);
  const c = baseColors[slot].set(color).multiplyScalar(intensity);
  fogLightColors.value[slot].set(c.r, c.g, c.b);
  levels[slot] = level ?? null;
  if (direction) {
    const d = direction.clone().normalize();
    fogLightDirections.value[slot].set(d.x, d.y, d.z, Math.cos(coneAngle));
  } else {
    fogLightDirections.value[slot].set(0, 0, 0, -2);
  }

  return () => {
    usedSlots[slot] = false;
    levels[slot] = null;
    fogLightColors.value[slot].set(0, 0, 0);
  };
};

// Overall strength of the light scattered by the fog
const FOG_SCATTER = 0.014;

// How much the noise swings density either side of the scene's fog density
const FOG_VARIATION = 0.6;
// Noise feature size: larger values give smaller, busier patches
const FOG_NOISE_SCALE = 0.45;
// Furthest out (world units) the fog noise is sampled along each view ray
const FOG_SAMPLE_REACH = 6;
// World units per second the noise field drifts
const FOG_DRIFT: [number, number, number] = [0.12, 0.03, 0.05];

let installed = false;

export const installDriftingFog = () => {
  if (installed) return;
  installed = true;

  const chunks = THREE.ShaderChunk as Record<string, string>;

  chunks.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorldPosition;
#endif
`;

  // mvPosition exists in every shader that includes fog_vertex (sprites
  // included), unlike the more usual "transformed"
  chunks.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorldPosition = ( inverse( viewMatrix ) * mvPosition ).xyz;
#endif
`;

  chunks.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogTime;
  varying float vFogDepth;
  varying vec3 vFogWorldPosition;

  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif

  float fogHash( vec3 p ) {
    p = fract( p * 0.3183099 + 0.1 );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
  }

  float fogNoise( vec3 x ) {
    vec3 i = floor( x );
    vec3 f = fract( x );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( mix( fogHash( i ), fogHash( i + vec3( 1, 0, 0 ) ), f.x ),
           mix( fogHash( i + vec3( 0, 1, 0 ) ), fogHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
      mix( mix( fogHash( i + vec3( 0, 0, 1 ) ), fogHash( i + vec3( 1, 0, 1 ) ), f.x ),
           mix( fogHash( i + vec3( 0, 1, 1 ) ), fogHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
      f.z
    );
  }

  // Two octaves: broad banks plus finer wisps
  float fogFbm( vec3 p ) {
    return fogNoise( p ) * 0.65 + fogNoise( p * 2.3 + 7.1 ) * 0.35;
  }

  #define FOG_LIGHTS ${MAX_FOG_LIGHTS}
  uniform vec3 fogLightPositions[ FOG_LIGHTS ];
  uniform vec3 fogLightColors[ FOG_LIGHTS ];
  uniform vec4 fogLightDirections[ FOG_LIGHTS ];

  // Light scattered toward the camera along the ray from \`start\` to \`end\`.
  // For a point light, the integral of 1 / distance^2 along a line has a
  // closed form: (atan((T + b) / h) - atan(b / h)) / h, where h is the
  // light's distance from the line and b where along it the closest point is.
  vec3 fogInscatter( vec3 start, vec3 end ) {
    vec3 ray = end - start;
    float rayLength = length( ray );
    vec3 dir = ray / max( rayLength, 1e-4 );
    vec3 total = vec3( 0.0 );

    for ( int i = 0; i < FOG_LIGHTS; i++ ) {
      vec3 color = fogLightColors[ i ];
      if ( color.r + color.g + color.b <= 0.0 ) continue;

      vec3 fromLight = start - fogLightPositions[ i ];
      float b = dot( fromLight, dir );
      // Floor on h keeps rays passing right by a light (e.g. onto the casing
      // next to a screen) from flaring
      float h = max( sqrt( max( dot( fromLight, fromLight ) - b * b, 0.0 ) ), 0.3 );
      float amount = ( atan( ( rayLength + b ) / h ) - atan( b / h ) ) / h;

      vec4 cone = fogLightDirections[ i ];
      if ( cone.w > -1.5 ) {
        vec3 closest = start + dir * clamp( -b, 0.0, rayLength );
        float facing = dot( normalize( closest - fogLightPositions[ i ] ), cone.xyz );
        amount *= smoothstep( cone.w - 0.3, cone.w + 0.2, facing );
      }

      total += color * amount;
    }
    return total;
  }
#endif
`;

  chunks.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    // Sample the noise in the air between the camera and the surface, not at
    // the surface, so banks of fog hang in front of things (sampling only at
    // the surface paints the noise onto far walls like a texture)
    vec3 fogRay = vFogWorldPosition - cameraPosition;
    float fogReach = min( length( fogRay ), ${FOG_SAMPLE_REACH.toFixed(3)} );
    vec3 fogDir = normalize( fogRay );
    vec3 fogDrift = vec3( ${FOG_DRIFT.map((v) => v.toFixed(3)).join(", ")} ) * fogTime;
    float fogPatch = 0.5 * (
      fogFbm( ( cameraPosition + fogDir * fogReach * 0.4 ) * ${FOG_NOISE_SCALE.toFixed(3)} + fogDrift )
      + fogFbm( ( cameraPosition + fogDir * fogReach * 0.85 ) * ${FOG_NOISE_SCALE.toFixed(3)} + fogDrift )
    );
    float fogDensityHere = fogDensity
      * ( 1.0 + ( fogPatch - 0.5 ) * 2.0 * ${FOG_VARIATION.toFixed(3)} );
    float fogFactor = 1.0 - exp( - fogDensityHere * fogDensityHere * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif

  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

  #ifdef FOG_EXP2
    // Lit fog: thicker patches scatter more
    gl_FragColor.rgb += fogInscatter( cameraPosition, vFogWorldPosition )
      * fogDensityHere * ${FOG_SCATTER.toFixed(3)};
  #endif
#endif
`;

  THREE.Material.prototype.onBeforeCompile = (shader) => {
    if (shader.fragmentShader.includes("#include <fog_fragment>")) {
      shader.uniforms.fogTime = fogTime;
      shader.uniforms.fogLightPositions = fogLightPositions;
      shader.uniforms.fogLightColors = fogLightColors;
      shader.uniforms.fogLightDirections = fogLightDirections;
    }
  };
};
