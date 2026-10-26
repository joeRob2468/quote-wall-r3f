"use client";

import * as THREE from "three";

import {
  BlendFunction,
  ChromaticAberrationEffect,
  CopyPass,
  EffectComposer,
  EffectPass,
  GlitchEffect,
  GlitchMode,
  LensDistortionEffect,
  RenderPass,
  ScanlineEffect,
} from "postprocessing";
import { Box, Flex } from "@react-three/flex";
import { Text as DreiText, PerspectiveCamera, useFBO } from "@react-three/drei";
import {
  ReactNode,
  RefObject,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";

import { CRTEffect } from "./shaders/CRTEffect";
import { FullQuote } from "@/types/quote";
import type { GLTFResult } from "./Computers";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import Text, {
  SCREEN_FONT,
  SCREEN_FONT_SCALE,
  SCREEN_LINE_HEIGHT,
} from "./Text";
import { addFogLight } from "./driftingFog";
import { addScreenBloomTarget } from "./ScreenBloom";
import { triggerDriveBurst } from "./DriveLights";
import { addLoadedScreen, addMountedScreen } from "./loadState";
import {
  Chevrons,
  CornerBrackets,
  Rect,
  TermText,
  MarchingBorder,
  Uptime,
  Waveform,
  useDecrypt,
  useFlickerLevel,
} from "./TerminalDecor";
import { getQuotes } from "@/data/quote";
import { useQuery } from "@tanstack/react-query";
import { QUOTE_PARAM } from "@/config/site";

type ScreensProps = {
  nodes: GLTFResult["nodes"];
  materials: GLTFResult["materials"];
  // From the page URL, so a shared link opens on that quote
  initialQuoteId?: string;
};
export const Screens = ({ nodes, materials, initialQuoteId }: ScreensProps) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => await getQuotes(),
  });

  // Tracked by id rather than position, so a refetch that reorders the list
  // keeps the same quote up. An unknown id (bad link, deleted quote) falls
  // back to the first quote.
  const [quoteId, setQuoteId] = useState(initialQuoteId);
  const quotes = data ?? [];
  const currentIndex = Math.max(
    0,
    quotes.findIndex((quote) => quote.id === quoteId)
  );
  const currentQuoteId = quotes[currentIndex]?.id;

  const showQuoteAt = (index: number) => {
    if (!quotes.length) return;
    setQuoteId(quotes[(index + quotes.length) % quotes.length].id);
  };

  // Drive lights burst whenever the quote changes, like the screen glitch
  const lastQuoteId = useRef(currentQuoteId);
  useEffect(() => {
    if (lastQuoteId.current === currentQuoteId) return;
    lastQuoteId.current = currentQuoteId;
    triggerDriveBurst();
  }, [currentQuoteId]);

  // Keep the address bar on the quote being shown, so it can be shared.
  // Replaced rather than pushed, so Back leaves the page instead of stepping
  // through every quote seen.
  useEffect(() => {
    if (!currentQuoteId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(QUOTE_PARAM) === currentQuoteId) return;
    url.searchParams.set(QUOTE_PARAM, currentQuoteId);
    window.history.replaceState(null, "", url);
  }, [currentQuoteId]);

  const showPreviousQuote = () => showQuoteAt(currentIndex - 1);
  const showNextQuote = () => showQuoteAt(currentIndex + 1);
  // Returns the index it picked, so the Random screen can show it
  const showRandomQuote = () => {
    if (quotes.length <= 1) return null;
    let next: number;
    do {
      next = Math.floor(Math.random() * quotes.length);
    } while (next === currentIndex);
    showQuoteAt(next);
    return next;
  };

  // getQuotes returns [] when the database query fails, so an empty list
  // needs the same handling as a failed request
  if (isPending || isError || !data.length) {
    const message = isPending
      ? undefined
      : isError
        ? "Couldn't load quotes"
        : "No quotes yet";

    return (
      <>
        <ScreenLoading
          message={message}
          resolution={1024}
          panel={nodes.Large_Monitor_Screen.geometry}
          position={[0.678, 7.601, 2.569]}
          rotation={[-Math.PI / 2, 0, -0.088]}
          scale={[1.939, 2.001, 2.169]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen.geometry}
          position={[3.746, 6.591, 2.599]}
          rotation={[-Math.PI / 2, 0, 0.075]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen001.geometry}
          position={[3.722, 8.818, 2.51]}
          rotation={[-Math.PI / 2, 0, 0.049]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen002.geometry}
          position={[1.455, 10.681, 2.422]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen003.geometry}
          position={[5.902, 6.593, 2.304]}
          rotation={[-Math.PI / 2, 0, 0.186]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen004.geometry}
          position={[-2.387, 6.673, 1.923]}
          rotation={[-Math.PI / 2, 0, -0.253]}
        />
        <ScreenLoading
          panel={nodes.Small_Monitor_Screen005.geometry}
          position={[-2.345, 8.876, 1.829]}
          rotation={[-Math.PI / 2, 0, -0.257]}
        />
      </>
    );
  }

  const currentQuote = data[currentIndex];

  return (
    <>
      {/* Center large screen */}
      <MainQuoteScreen
        quote={currentQuote}
        index={currentIndex}
        total={data.length}
        panel={nodes.Large_Monitor_Screen.geometry}
        position={[0.678, 7.601, 2.569]}
        rotation={[-Math.PI / 2, 0, -0.088]}
        scale={[1.939, 2.001, 2.169]}
      />
      {/* Bottom left nav screen */}
      <NavScreen
        label="Previous"
        direction="left"
        keyHint={pad3(
          ((currentIndex - 1 + data.length) % data.length) + 1
        )}
        clickEventHandler={showPreviousQuote}
        panel={nodes.Small_Monitor_Screen.geometry}
        position={[3.746, 6.591, 2.599]}
        rotation={[-Math.PI / 2, 0, 0.075]}
      />
      {/* Top left small screen */}
      <DateScreen
        quote={currentQuote}
        panel={nodes.Small_Monitor_Screen001.geometry}
        position={[3.722, 8.818, 2.51]}
        rotation={[-Math.PI / 2, 0, 0.049]}
      />
      {/* Top center small screen — random nav */}
      <RandomScreen
        total={data.length}
        onRandom={showRandomQuote}
        panel={nodes.Small_Monitor_Screen002.geometry}
        position={[1.455, 10.681, 2.422]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Far left small screen — quote list */}
      <QuoteListScreen
        quotes={data}
        quoteIndex={currentIndex}
        setQuoteIndex={showQuoteAt}
        panel={nodes.Small_Monitor_Screen003.geometry}
        position={[5.902, 6.593, 2.304]}
        rotation={[-Math.PI / 2, 0, 0.186]}
      />

      {/* Bottom Right nav screen */}
      <NavScreen
        label="Next"
        direction="right"
        keyHint={pad3(((currentIndex + 1) % data.length) + 1)}
        clickEventHandler={showNextQuote}
        panel={nodes.Small_Monitor_Screen004.geometry}
        position={[-2.387, 6.673, 1.923]}
        rotation={[-Math.PI / 2, 0, -0.253]}
      />
      {/* Top right small screen */}
      <MetaScreen
        quote={currentQuote}
        index={currentIndex}
        total={data.length}
        panel={nodes.Small_Monitor_Screen005.geometry}
        position={[-2.345, 8.876, 1.829]}
        rotation={[-Math.PI / 2, 0, -0.257]}
      />
    </>
  );
};

// Lit screen background. Bright enough that the whole screen face glows,
// not just the text.
const SCREEN_BACKGROUND = "#06201e";
// Large screen text. Dimmer than the small quote-list text, since big glyphs
// bloom much more and get hard to read at full brightness.
const SCREEN_TEXT = "#9fe8d6";
// Small text (quote list), kept a little brighter than SCREEN_TEXT
const SCREEN_TEXT_SMALL = "#b6f5e6";

// Size of a screen's display plane in world space (its geometry is sized to
// the model's original screen glass, then scaled by the monitor's group)
const panelWorldSize = (panel: THREE.Mesh) => {
  panel.updateWorldMatrix(true, false);
  const { width, height } = (panel.geometry as THREE.PlaneGeometry).parameters;
  const axis = new THREE.Vector3();
  return {
    width: width * axis.setFromMatrixColumn(panel.matrixWorld, 0).length(),
    height: height * axis.setFromMatrixColumn(panel.matrixWorld, 1).length(),
  };
};
// Distance between scanlines in world units, so they're the same height on
// every monitor regardless of its size. Much finer than this and they
// shimmer once the screens are shrunk down on the page.
const SCANLINE_SPACING = 0.011;

// How long a screen glitches hard after its content changes
const GLITCH_BURST_MS = 250;

type ScreenRendererProps = {
  buffer: THREE.WebGLRenderTarget;
  panelRef: RefObject<THREE.Mesh>;
  glitchKey?: unknown;
};

const ScreenRenderer = ({
  buffer,
  panelRef,
  glitchKey,
}: ScreenRendererProps) => {
  const { gl, camera, scene } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const glitchRef = useRef<GlitchEffect | null>(null);
  const lastGlitchKey = useRef(glitchKey);

  // Built in an effect rather than useMemo so every composer gets disposed,
  // including on camera changes and Strict Mode's dev remount
  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.autoRenderToScreen = false;

    const renderPass = new RenderPass(scene, camera);
    // autoResize off, or the pass resizes `buffer` to the main canvas size
    const copyPass = new CopyPass(buffer, false);

    const scanlineEffect = new ScanlineEffect({
      blendFunction: BlendFunction.OVERLAY,
    });

    const chromaticEffectPass = new EffectPass(
      camera,
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset: new THREE.Vector2(0.01, 0.01),
        radialModulation: true,
        modulationOffset: 0.5,
      })
    );

    const glitchEffect = new GlitchEffect({
      // Seconds between random glitches; kept rare now that the screens
      // also flicker
      delay: new THREE.Vector2(10.0, 30.0),
      duration: new THREE.Vector2(0.1, 0.5),
      strength: new THREE.Vector2(0.3, 0.75),
      ratio: 0.45,
    });
    glitchEffect.mode = GlitchMode.SPORADIC;
    glitchRef.current = glitchEffect;

    const lensDistortionEffect = new LensDistortionEffect({
      distortion: new THREE.Vector2(0.05, 0.05),
      principalPoint: new THREE.Vector2(0.0, 0.0),
      // Low enough that the bulge never samples past the image edge (the
      // shader blacks that out): corners need f * (1 + 2 * distortion) <= 1
      focalLength: new THREE.Vector2(0.9, 0.9),
    });

    // UV-only effects share one shader pass. Lens goes before glitch so the
    // sample position is composed the same way as separate passes did.
    // Chromatic aberration is a convolution effect, which postprocessing
    // won't merge with UV transforms, so it keeps its own pass.
    // Random phase so the rolling bars don't sweep every monitor in sync
    const crtEffect = new CRTEffect({ barPhase: Math.random() });

    const distortionEffectPass = new EffectPass(
      camera,
      lensDistortionEffect,
      glitchEffect,
      scanlineEffect,
      crtEffect
    );

    composer.addPass(renderPass);
    composer.addPass(distortionEffectPass);
    composer.addPass(chromaticEffectPass);
    composer.addPass(copyPass);

    // addPass sizes everything to the main canvas, but the screens only
    // need the buffer's resolution
    const { width, height } = buffer;

    // ScanlineEffect draws sin(uv.y * height * density), i.e. one line per
    // 2π of that, so derive density from the panel's on-scene height
    const panel = panelRef.current;
    if (panel) {
      const { width: panelWidth, height: panelHeight } = panelWorldSize(panel);
      const lines = panelHeight / SCANLINE_SPACING;
      scanlineEffect.density = (lines * 2 * Math.PI) / height;
      // One phosphor stripe per scanline width, three stripes per triad
      crtEffect.maskTriads = panelWidth / (3 * SCANLINE_SPACING);
    }

    composer.inputBuffer.setSize(width, height);
    composer.outputBuffer.setSize(width, height);
    composer.passes.forEach((pass) => pass.setSize(width, height));

    composerRef.current = composer;

    return () => {
      composerRef.current = null;
      glitchRef.current = null;
      // The copy pass targets `buffer`, which useFBO owns. Take it out before
      // disposing, or the composer would dispose the screen's texture too.
      composer.removePass(copyPass);
      copyPass.fullscreenMaterial.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera, buffer, panelRef]);

  // Glitch hard for a moment whenever glitchKey changes (e.g. a new quote),
  // then fall back to the occasional random glitches
  useEffect(() => {
    if (lastGlitchKey.current === glitchKey) return;
    lastGlitchKey.current = glitchKey;
    const glitch = glitchRef.current;
    if (!glitch) return;

    glitch.mode = GlitchMode.CONSTANT_WILD;
    const timeout = setTimeout(() => {
      glitch.mode = GlitchMode.SPORADIC;
    }, GLITCH_BURST_MS);

    return () => {
      clearTimeout(timeout);
      glitch.mode = GlitchMode.SPORADIC;
    };
  }, [glitchKey]);

  useFrame(() => {
    const composer = composerRef.current;
    if (!composer) return;
    gl.setRenderTarget(buffer);
    composer.render();
    gl.setRenderTarget(null);
  });

  return <></>;
};

type ScreenProps = {
  panel: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  children?: ReactNode;
  fov?: number;
  // Texture size in pixels. Bigger monitors need more to keep scanlines and
  // text crisp at the same physical size as on the small ones.
  resolution?: number;
  // Changing this triggers a short glitch burst
  glitchKey?: unknown;
} & JSX.IntrinsicElements["group"];

// Screen glow cast onto the desk and casings. Screens are mostly dark with
// green text, so the light is a dim green rather than the text colour.
const SCREEN_LIGHT_COLOR = "#7fdccb";
const SCREEN_LIGHT_INTENSITY = 2;
// Weak light right at the glass that catches the inside walls of the
// casing's recess, brightest by the screen and fading toward the front
const SCREEN_RECESS_LIGHT_INTENSITY = 0.2;
// How much harder the cast light (area lights, fog glow) dips than the
// screen image during a flicker, so the room visibly dims with it
const SCREEN_LIGHT_DIP_GAIN = 1.8;
// Glow each screen puts into the fog around it
const SCREEN_FOG_COLOR = "#9fe0d8";
const SCREEN_FOG_INTENSITY = 0.25;
// Brightness multiplier on the screen image, so it blooms
const SCREEN_GLOW = 2.2;

// Area lights need their lookup tables registered once before first render
RectAreaLightUniformsLib.init();

const Screen = ({
  panel,
  children,
  fov,
  resolution = 512,
  glitchKey,
  ...props
}: ScreenProps) => {
  const [scene] = useState(() => new THREE.Scene());
  const buffer = useFBO(resolution, resolution);
  const panelRef = useRef<THREE.Mesh>(null);
  const panelMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.RectAreaLight>(null);
  const recessLightRef = useRef<THREE.RectAreaLight>(null);

  // Whole-screen brightness dips now and then, like an unsteady CRT. The
  // light the screen gives off (area lights, fog glow) dips with it.
  const brightness = useFlickerLevel({ depth: 0.5, minGap: 4, maxGap: 16 });
  const lightLevel = useRef(1);
  useFrame(() => {
    panelMaterial.current?.color.setScalar(SCREEN_GLOW * brightness.current);
    lightLevel.current = Math.max(
      0.05,
      1 - (1 - brightness.current) * SCREEN_LIGHT_DIP_GAIN
    );
    if (lightRef.current) {
      lightRef.current.intensity = SCREEN_LIGHT_INTENSITY * lightLevel.current;
    }
    if (recessLightRef.current) {
      recessLightRef.current.intensity =
        SCREEN_RECESS_LIGHT_INTENSITY * lightLevel.current;
    }
  });
  // Match the model's screen glass so the image fills the bezel opening.
  // The glass lies flat in its local XZ plane.
  const [panelWidth, panelHeight] = useMemo(() => {
    panel.computeBoundingBox();
    const box = panel.boundingBox!;
    return [box.max.x - box.min.x, box.max.z - box.min.z];
  }, [panel]);

  // Counts toward the boot overlay until the content below has resolved
  useLayoutEffect(addMountedScreen, []);

  // Give the screen the extra screen-only bloom halo
  useLayoutEffect(() => {
    if (!panelRef.current) return;
    return addScreenBloomTarget(panelRef.current);
  }, []);

  // Area lights ignore scale, so size the light from the panel's world size.
  // Also register the screen as a glow in the fog, just in front of it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const light = lightRef.current;
    if (!panel || !light) return;
    const { width, height } = panelWorldSize(panel);
    const axis = new THREE.Vector3();
    light.width = width;
    light.height = height;
    if (recessLightRef.current) {
      recessLightRef.current.width = width;
      recessLightRef.current.height = height;
    }

    const facing = axis.setFromMatrixColumn(panel.matrixWorld, 2).normalize();
    const center = new THREE.Vector3().setFromMatrixPosition(panel.matrixWorld);
    return addFogLight({
      position: center.addScaledVector(facing, 0.15),
      color: SCREEN_FOG_COLOR,
      // Bigger screens light more fog
      intensity: SCREEN_FOG_INTENSITY * width * height * 4,
      // Mostly in front of the screen, like light leaving the tube
      direction: facing,
      coneAngle: 1.1,
      level: lightLevel,
    });
  }, []);

  return (
    <group {...props}>
      {createPortal(
        <>
          <Suspense fallback={null}>
            <PerspectiveCamera
              makeDefault
              manual
              // Same shape as the glass, so content isn't stretched on
              // non-square screens
              aspect={panelWidth / panelHeight}
              position={[0, 0, 16]}
              {...(fov !== undefined && { fov })}
            />
            {children}
            <ScreenContentLoaded />
            <ScreenRenderer
              buffer={buffer}
              panelRef={panelRef}
              glitchKey={glitchKey}
            />
          </Suspense>
        </>,
        scene
      )}
      <mesh ref={panelRef} rotation={[-Math.PI / 2, 0, -Math.PI]}>
        <planeGeometry args={[panelWidth, panelHeight]} />
        {/* Pushed past 1.0 so the screens clear the bloom threshold and glow */}
        <meshBasicMaterial
          ref={panelMaterial}
          toneMapped={false}
          map={buffer.texture}
          color={[SCREEN_GLOW, SCREEN_GLOW, SCREEN_GLOW]}
        />
        {/* Area lights shine along -Z; turn it to face out of the screen.
            Sits about level with the bezel: anything in front catches the
            glow, while the casing fronts beside it stay unlit, so the light
            reads as coming out of the screen. */}
        <rectAreaLight
          ref={lightRef}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, 0.25]}
          color={SCREEN_LIGHT_COLOR}
          intensity={SCREEN_LIGHT_INTENSITY}
        />
        <rectAreaLight
          ref={recessLightRef}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, 0.02]}
          color={SCREEN_LIGHT_COLOR}
          intensity={SCREEN_RECESS_LIGHT_INTENSITY}
        />
      </mesh>
    </group>
  );
};

// Mounts alongside a screen's content, so only once its text has resolved
const ScreenContentLoaded = () => {
  useLayoutEffect(addLoadedScreen, []);
  return null;
};

const ScreenLoading = ({
  message,
  ...props
}: ScreenProps & { message?: string }) => {
  return (
    <Screen {...props}>
      <color
        attach="background"
        args={[message ? SCREEN_BACKGROUND : "#333333"]}
      />
      {message ? (
        <Flex
          plane="xy"
          size={[13, 13, 0]}
          position={[-13 / 2, 13 / 2, 0]}
          flexDirection="column"
          align="center"
          justify="center"
        >
          <Box>
            <Text maxWidth={13} color={SCREEN_TEXT} textAlign="center">
              {message}
            </Text>
          </Box>
        </Flex>
      ) : null}
    </Screen>
  );
};

type ScreenTextProps = {
  quote: FullQuote;
} & ScreenProps;

// Typing speed, raised for long quotes so none takes longer than the cap
const TYPE_CHARS_PER_SECOND = 45;
const TYPE_MAX_SECONDS = 3;
const CURSOR_BLINK_SECONDS = 0.5;
const CURSOR = "_";
const NBSP = "\u00A0";

// What the main screen shows after `chars` characters have been typed.
// The font is monospaced, so swapping untyped characters for non-breaking
// spaces (which troika won't wrap at) keeps every word the same width and
// the layout identical to the finished quote; the cursor is swapped in the
// same way. A trailing " _" slot holds the cursor once typing is done.
const typedText = (body: string, chars: number, cursorOn: boolean) => {
  if (chars >= body.length) {
    return `${body} ${cursorOn ? CURSOR : NBSP}`;
  }

  const rest = Array.from(body.slice(chars), (char) =>
    /\s/.test(char) ? char : NBSP
  );
  // Put the cursor on the next visible character; replacing whitespace
  // would join words and change where lines wrap
  const cursorAt = rest.findIndex((char) => char === NBSP);
  if (cursorOn && cursorAt !== -1) rest[cursorAt] = CURSOR;

  return `${body.slice(0, chars)}${rest.join("")} ${NBSP}`;
};

// Dim teal for terminal chrome (bars, rules, brackets) so it frames the
// content without competing with it
const SCREEN_CHROME = "#2c6b62";
const SCREEN_CHROME_DIM = "#1d4a44";
// Secondary text (key hints): readable, but quieter than SCREEN_TEXT
const SCREEN_TEXT_DIM = "#5f9f92";

const pad3 = (n: number) => n.toString().padStart(3, "0");

type MainQuoteScreenProps = ScreenTextProps & {
  index: number;
  total: number;
};

const MainQuoteScreen = ({
  quote,
  index,
  total,
  ...props
}: MainQuoteScreenProps) => {
  const [typed, setTyped] = useState({ chars: 0, cursorOn: true });
  const elapsed = useRef(0);

  useEffect(() => {
    elapsed.current = 0;
    setTyped({ chars: 0, cursorOn: true });
  }, [quote.id]);

  // The title bar and rules flicker together, separately from the screen
  const chromeLevel = useFlickerLevel({ depth: 0.7 });

  const length = quote.body.length;
  const speed = Math.max(TYPE_CHARS_PER_SECOND, length / TYPE_MAX_SECONDS);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const chars = Math.min(length, Math.floor(elapsed.current * speed));
    const cursorOn =
      Math.floor(elapsed.current / CURSOR_BLINK_SECONDS) % 2 === 0;
    if (chars !== typed.chars || cursorOn !== typed.cursorOn) {
      setTyped({ chars, cursorOn });
    }
  });

  return (
    <Screen resolution={1024} glitchKey={quote.id} {...props}>
      <color attach="background" args={[SCREEN_BACKGROUND]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      {/* Title bar */}
      <Rect
        position={[0, 4.6]}
        size={[10.6, 0.9]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />
      <TermText position={[-5, 4.6]} size={0.55} color={SCREEN_TEXT}>
        QUOTE.DAT
      </TermText>
      <TermText
        position={[5, 4.6]}
        size={0.55}
        color={SCREEN_TEXT}
        anchorX="right"
      >
        {`REC ${pad3(index + 1)}/${pad3(total)}`}
      </TermText>
      <Rect
        position={[0, 3.85]}
        size={[10.6, 0.06]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />

      {/* Quote, kept clear of the bars */}
      <Flex
        plane="xy"
        size={[13, 7.4, 0]}
        position={[-13 / 2, 7.4 / 2, 0]}
        flexDirection="column"
        align="center"
        justify="center"
        wrap="wrap"
      >
        <Box>
          <Text maxWidth={10} color={SCREEN_TEXT} textAlign="center">
            {typedText(quote.body, typed.chars, typed.cursorOn)}
          </Text>
        </Box>
      </Flex>

      {/* Status line */}
      <Rect
        position={[0, -3.85]}
        size={[10.6, 0.06]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />
      <TermText position={[-5, -4.5]} size={0.55} color={SCREEN_TEXT}>
        {"> READY"}
      </TermText>
      <Uptime position={[5, -4.5]} size={0.55} color={SCREEN_TEXT} anchorX="right" />
    </Screen>
  );
};

const AUTHOR_SIZE = 1.8;
const AUTHOR_WIDTH = 9.4;
// VT323 glyph width per unit of TermText size (0.4em at the font scale)
const GLYPH_WIDTH_EM = 0.4 * SCREEN_FONT_SCALE;
const CONTEXT_SIZE = 1.05;
// About two lines of context at its size
const CONTEXT_MAX_CHARS = 32;

const clip = (text: string, max: number) =>
  text.length > max ? text.slice(0, max - 3).trimEnd() + "..." : text;

type MetaScreenProps = ScreenTextProps & {
  index: number;
  total: number;
};

const MetaScreen = ({ quote, index, total, ...props }: MetaScreenProps) => {
  const chromeLevel = useFlickerLevel({ depth: 0.7 });
  return (
    <Screen glitchKey={quote.id} {...props}>
      <color attach="background" args={[SCREEN_BACKGROUND]} />

      {/* Title bar */}
      <Rect
        position={[0, 4.4]}
        size={[10.4, 1.2]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />
      <TermText position={[-4.9, 4.4]} size={0.9} color={SCREEN_TEXT}>
        SPEAKER
      </TermText>
      <TermText
        position={[4.9, 4.4]}
        size={0.9}
        color={SCREEN_TEXT}
        anchorX="right"
      >
        {`${pad3(index + 1)}/${pad3(total)}`}
      </TermText>

      {/* Name on one line, shrunk to fit if it's long */}
      <TermText
        position={[0, 1.9]}
        size={Math.min(
          AUTHOR_SIZE,
          AUTHOR_WIDTH / (quote.author.name.length * GLYPH_WIDTH_EM)
        )}
        color={SCREEN_TEXT}
        anchorX="center"
      >
        {quote.author.name}
      </TermText>
      {quote.context ? (
        <TermText
          position={[0, 0.5]}
          size={CONTEXT_SIZE}
          color={SCREEN_TEXT_DIM}
          anchorX="center"
          anchorY="top"
          maxWidth={AUTHOR_WIDTH}
        >
          {clip(quote.context, CONTEXT_MAX_CHARS)}
        </TermText>
      ) : null}

      {/* Voiceprint, which spikes whenever the quote changes */}
      <Waveform
        burstKey={quote.id}
        y={-4.1}
        width={9.6}
        maxHeight={1.8}
        color={SCREEN_TEXT_DIM}
      />
    </Screen>
  );
};

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const pad2 = (n: number) => n.toString().padStart(2, "0");

const dayOfYear = (date: Date) =>
  Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86_400_000
  );

const DateScreen = ({ quote, ...props }: ScreenTextProps) => {
  const chromeLevel = useFlickerLevel({ depth: 0.7 });
  const date = quote.date;
  const weekday = date.getDay();
  // Dates picked from the calendar are stored at midnight, meaning "no
  // time recorded"
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  const time = hasTime
    ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
    : "--:--";

  return (
    <Screen glitchKey={quote.id} {...props}>
      <color attach="background" args={[SCREEN_BACKGROUND]} />

      {/* Week strip with the quote's day lit */}
      {WEEKDAYS.map((day, i) => {
        const x = (i - 3) * 1.45;
        const lit = i === weekday;
        return (
          <group key={day}>
            {lit && (
              <Rect
                position={[x, 4.3]}
                size={[1.35, 1.15]}
                color={SCREEN_TEXT}
                level={chromeLevel}
              />
            )}
            <TermText
              position={[x, 4.3]}
              size={0.8}
              color={lit ? SCREEN_BACKGROUND : SCREEN_TEXT_DIM}
              anchorX="center"
            >
              {day}
            </TermText>
          </group>
        );
      })}
      <Rect
        position={[0, 3.5]}
        size={[10.4, 0.06]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />

      <TermText position={[0, 1.7]} size={1.35} color={SCREEN_TEXT} anchorX="center">
        {`${date.toLocaleString("default", { month: "long" })} ${date.getDate()}`}
      </TermText>
      <TermText position={[0, -0.3]} size={2} color={SCREEN_TEXT} anchorX="center">
        {date.getFullYear()}
      </TermText>
      <TermText position={[0, -2.2]} size={1.1} color={SCREEN_TEXT_DIM} anchorX="center">
        {time}
      </TermText>

      {/* Status line */}
      <Rect
        position={[0, -3.5]}
        size={[10.4, 0.06]}
        color={SCREEN_CHROME}
        level={chromeLevel}
      />
      <TermText position={[-4.9, -4.3]} size={0.9} color={SCREEN_TEXT}>
        {`DAY ${pad3(dayOfYear(date))}`}
      </TermText>
      <TermText position={[4.9, -4.3]} size={0.9} color={SCREEN_TEXT} anchorX="right">
        {date.getFullYear() % 4 === 0 ? "LEAP YR" : "STD YR"}
      </TermText>
    </Screen>
  );
};

const LIST_ROW_HEIGHT = 3;
// The list sits inside a safe area of the 13×13 screen space: the lens bulge
// and the bezel lip (the glass runs slightly under it) hide the outer edge
const LIST_LEFT = -5.5;
const LIST_WIDTH = 10;
const LIST_TOP = 5.2;
const LIST_VISIBLE_HEIGHT = 10.4;
const LIST_BOTTOM = LIST_TOP - LIST_VISIBLE_HEIGHT;
const SCROLLBAR_X = 5.1;
const SCROLLBAR_W = 0.5;
const LIST_VISIBLE_ROWS = Math.ceil(LIST_VISIBLE_HEIGHT / LIST_ROW_HEIGHT);
const LIST_WINDOW_BUFFER = 4;
// Row text: author line, then one line of quote, laid out from the actual
// sizes so it stays inside the row
const LIST_PADDING = 0.35;
const LIST_AUTHOR_SIZE = 0.8 * SCREEN_FONT_SCALE;
const LIST_BODY_SIZE = 0.62 * SCREEN_FONT_SCALE;
// How many characters of quote fit on that line (VT323 glyphs are 0.4em
// wide), leaving room for the "..."
const LIST_BODY_CHARS = Math.floor((LIST_WIDTH - 0.6) / (LIST_BODY_SIZE * 0.4));

type QuoteRowProps = {
  quote: FullQuote;
  isActive: boolean;
  isHovered: boolean;
  y: number;
};

const QuoteRow = ({ quote, isActive, isHovered, y }: QuoteRowProps) => {
  const bgColor = isActive || isHovered ? "#0f3e3a" : SCREEN_BACKGROUND;
  const textColor = SCREEN_TEXT_SMALL;
  const truncated =
    quote.body.length > LIST_BODY_CHARS
      ? quote.body.substring(0, LIST_BODY_CHARS - 3).trimEnd() + "..."
      : quote.body;

  return (
    <group position={[LIST_LEFT, y, 0]}>
      <mesh position={[LIST_WIDTH / 2, -(LIST_ROW_HEIGHT - 0.1) / 2, 0]}>
        <planeGeometry args={[LIST_WIDTH, LIST_ROW_HEIGHT - 0.1]} />
        <meshBasicMaterial color={bgColor} />
      </mesh>
      <DreiText
        maxWidth={LIST_WIDTH - 0.6}
        color={textColor}
        fontSize={LIST_AUTHOR_SIZE}
        lineHeight={SCREEN_LINE_HEIGHT}
        font={SCREEN_FONT}
        anchorX="left"
        anchorY="top"
        textAlign="left"
        position={[0.3, -LIST_PADDING, 0.01]}
      >
        {quote.author.name}
      </DreiText>
      <DreiText
        maxWidth={LIST_WIDTH - 0.6}
        color={textColor}
        fontSize={LIST_BODY_SIZE}
        lineHeight={SCREEN_LINE_HEIGHT}
        font={SCREEN_FONT}
        anchorX="left"
        anchorY="top"
        textAlign="left"
        position={[
          0.3,
          -LIST_PADDING - LIST_AUTHOR_SIZE * SCREEN_LINE_HEIGHT,
          0.01,
        ]}
      >
        {truncated}
      </DreiText>
    </group>
  );
};

type QuoteListScreenProps = {
  quotes: FullQuote[];
  quoteIndex: number;
  setQuoteIndex: (index: number) => void;
} & ScreenProps;

const QuoteListScreen = ({
  quotes,
  quoteIndex,
  setQuoteIndex,
  ...props
}: QuoteListScreenProps) => {
  const scrollOffset = useRef(0);
  const scrollGroupRef = useRef<THREE.Group>(null);
  const thumbRef = useRef<THREE.Mesh>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isDragging = useRef<"list" | "scrollbar" | null>(null);
  const dragStartV = useRef(0);
  const dragStartScroll = useRef(0);
  const dragScrollbarGrabOffset = useRef(0);
  const hasDragged = useRef(false);

  // Only mount rows near the visible viewport instead of all `quotes.length` at once
  const [windowStart, setWindowStart] = useState(() =>
    Math.max(0, quoteIndex - LIST_WINDOW_BUFFER)
  );
  const [windowEnd, setWindowEnd] = useState(() =>
    Math.min(quotes.length, quoteIndex + LIST_VISIBLE_ROWS + LIST_WINDOW_BUFFER)
  );

  const totalHeight = quotes.length * LIST_ROW_HEIGHT;
  const maxScroll = Math.max(0, totalHeight - LIST_VISIBLE_HEIGHT);
  const thumbHeight = Math.max(
    1.5,
    (LIST_VISIBLE_HEIGHT / totalHeight) * LIST_VISIBLE_HEIGHT
  );
  const thumbTravel = LIST_VISIBLE_HEIGHT - thumbHeight;

  // Scroll so the active quote is visible whenever quoteIndex changes
  useEffect(() => {
    const i = quoteIndex;
    const rowTopY = LIST_TOP - i * LIST_ROW_HEIGHT + scrollOffset.current;
    const rowBottomY =
      LIST_TOP - (i + 1) * LIST_ROW_HEIGHT + scrollOffset.current;

    let target = scrollOffset.current;
    if (rowTopY > LIST_TOP + 0.01) {
      // Row is above the viewport — snap so it appears at the top
      target = i * LIST_ROW_HEIGHT;
    } else if (rowBottomY < LIST_BOTTOM - 0.01) {
      // Row is below the viewport — snap so it appears at the bottom
      target = (i + 1) * LIST_ROW_HEIGHT - LIST_VISIBLE_HEIGHT;
    }

    scrollOffset.current = Math.max(0, Math.min(maxScroll, target));
  }, [quoteIndex, maxScroll]);

  useFrame(() => {
    if (scrollGroupRef.current) {
      scrollGroupRef.current.position.y = scrollOffset.current;
    }
    if (thumbRef.current && maxScroll > 0) {
      const ratio = scrollOffset.current / maxScroll;
      thumbRef.current.position.y =
        LIST_TOP - thumbHeight / 2 - ratio * thumbTravel;
    }

    const start = Math.max(
      0,
      Math.floor(scrollOffset.current / LIST_ROW_HEIGHT) - LIST_WINDOW_BUFFER
    );
    const end = Math.min(
      quotes.length,
      Math.ceil((scrollOffset.current + LIST_VISIBLE_HEIGHT) / LIST_ROW_HEIGHT) +
        LIST_WINDOW_BUFFER
    );
    if (start !== windowStart) setWindowStart(start);
    if (end !== windowEnd) setWindowEnd(end);
  });

  // UV (v=1 = physical top = portal y +6.5, u=0 = physical right = portal x +6.5)
  const uvToRowIndex = (uv: THREE.Vector2): number | null => {
    const portalX = (uv.x - 0.5) * 13;
    // Ignore clicks on the scrollbar column
    if (portalX > SCROLLBAR_X - SCROLLBAR_W) return null;
    const portalY = (uv.y - 0.5) * 13;
    // Ignore clicks in the masked margins above and below the list
    if (portalY > LIST_TOP || portalY < LIST_BOTTOM) return null;
    const contentY = portalY - scrollOffset.current;
    const i = Math.floor((LIST_TOP - contentY) / LIST_ROW_HEIGHT);
    return i >= 0 && i < quotes.length ? i : null;
  };

  const isOnScrollbar = (uv: THREE.Vector2) =>
    (uv.x - 0.5) * 13 > SCROLLBAR_X - SCROLLBAR_W;

  return (
    <Screen
      {...props}
      // Tighter FOV so items outside the 13×13 area are naturally clipped
      fov={44}
      onPointerDown={(e) => {
        if (!e.uv) return;
        hasDragged.current = false;
        if (isOnScrollbar(e.uv)) {
          isDragging.current = "scrollbar";
          const portalY = (e.uv.y - 0.5) * 13;
          const currentThumbY =
            maxScroll > 0
              ? LIST_TOP - thumbHeight / 2 - (scrollOffset.current / maxScroll) * thumbTravel
              : LIST_TOP - thumbHeight / 2;
          dragScrollbarGrabOffset.current = portalY - currentThumbY;
        } else {
          isDragging.current = "list";
          dragStartV.current = e.uv.y;
          dragStartScroll.current = scrollOffset.current;
        }
      }}
      onPointerMove={(e) => {
        if (!e.uv) return;
        if (isDragging.current === "list") {
          hasDragged.current = true;
          const target =
            dragStartScroll.current + (e.uv.y - dragStartV.current) * 13 * 3;
          scrollOffset.current = Math.max(0, Math.min(maxScroll, target));
        } else if (isDragging.current === "scrollbar" && maxScroll > 0) {
          hasDragged.current = true;
          const portalY = (e.uv.y - 0.5) * 13;
          const thumbCenter = portalY - dragScrollbarGrabOffset.current;
          const ratio = (LIST_TOP - thumbHeight / 2 - thumbCenter) / thumbTravel;
          scrollOffset.current = Math.max(
            0,
            Math.min(maxScroll, ratio * maxScroll)
          );
        } else {
          setHoveredIndex(uvToRowIndex(e.uv));
        }
      }}
      onPointerUp={() => {
        isDragging.current = null;
      }}
      onPointerLeave={() => {
        isDragging.current = null;
        setHoveredIndex(null);
      }}
      onClick={(e) => {
        if (!e.uv || hasDragged.current) return;
        const idx = uvToRowIndex(e.uv);
        if (idx !== null) setQuoteIndex(idx);
      }}
      onWheel={(e) => {
        scrollOffset.current = Math.max(
          0,
          Math.min(maxScroll, scrollOffset.current + e.deltaY * 0.02)
        );
      }}
    >
      <color attach="background" args={[SCREEN_BACKGROUND]} />
      <ambientLight intensity={0.5} />

      {/* Scrollbar track */}
      <mesh position={[SCROLLBAR_X, LIST_TOP - LIST_VISIBLE_HEIGHT / 2, 0]}>
        <planeGeometry args={[SCROLLBAR_W, LIST_VISIBLE_HEIGHT]} />
        <meshBasicMaterial color="#0a2a28" />
      </mesh>

      {/* Scrollbar thumb */}
      <mesh
        ref={thumbRef}
        position={[SCROLLBAR_X, LIST_TOP - thumbHeight / 2, 0.01]}
      >
        <planeGeometry args={[SCROLLBAR_W, thumbHeight]} />
        <meshBasicMaterial color={SCREEN_TEXT_SMALL} />
      </mesh>

      {/* Scrollable rows — only the ones near the viewport are mounted */}
      <group ref={scrollGroupRef}>
        {quotes.slice(windowStart, windowEnd).map((quote, localIndex) => {
          const i = windowStart + localIndex;
          return (
            <QuoteRow
              key={quote.id}
              quote={quote}
              isActive={i === quoteIndex}
              isHovered={i === hoveredIndex}
              y={LIST_TOP - i * LIST_ROW_HEIGHT}
            />
          );
        })}
      </group>

      {/* Background-coloured masks hide rows scrolled past the list area */}
      <mesh position={[0, LIST_TOP + 5, 0.05]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color={SCREEN_BACKGROUND} />
      </mesh>
      <mesh position={[0, LIST_BOTTOM - 5, 0.05]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color={SCREEN_BACKGROUND} />
      </mesh>
    </Screen>
  );
};

type RandomScreenProps = {
  total: number;
  // Picks a random quote and returns its index (null if there's no choice)
  onRandom: () => number | null;
} & ScreenProps;

// How long the reel shows the picked number before spinning again
const RANDOM_HOLD_SECONDS = 1.6;

// The big fancy button: a crawling dashed frame, a slot-reel counter that
// spins through quote numbers and locks onto the one picked, and a label
// that scrambles and decrypts itself now and then
const RandomScreen = ({ total, onRandom, ...props }: RandomScreenProps) => {
  const [hovered, setHovered] = useState(false);
  const [reel, setReel] = useState("000");
  const [locked, setLocked] = useState<number | null>(null);
  const lockedUntil = useRef(0);
  const lockPending = useRef(false);
  const nextSpin = useRef(0);
  const label = useDecrypt("RANDOM", hovered);

  const ink = hovered ? SCREEN_BACKGROUND : SCREEN_TEXT;
  const inkDim = hovered ? "#1d4a44" : SCREEN_TEXT_DIM;
  const chrome = hovered ? "#24564f" : SCREEN_CHROME;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lockPending.current) {
      lockPending.current = false;
      lockedUntil.current = t + RANDOM_HOLD_SECONDS;
    }
    if (locked !== null) {
      if (t >= lockedUntil.current) setLocked(null);
      return;
    }
    // Spin faster while hovered
    if (t >= nextSpin.current) {
      nextSpin.current = t + (hovered ? 0.05 : 0.12);
      setReel(pad3(1 + Math.floor(Math.random() * Math.max(total, 1))));
    }
  });

  return (
    <Screen
      {...props}
      onClick={() => {
        const picked = onRandom();
        if (picked === null) return;
        setLocked(picked);
        // Hold timer starts on the next frame, from the render loop's clock
        lockedUntil.current = Infinity;
        lockPending.current = true;
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <color
        attach="background"
        args={[hovered ? "#3e7d75" : SCREEN_BACKGROUND]}
      />
      <MarchingBorder half={5} color={chrome} />
      <TermText position={[0, 2.5]} size={1} color={inkDim} anchorX="center">
        {`[ ${locked !== null ? pad3(locked + 1) : reel} ]`}
      </TermText>
      <TermText position={[0, -0.2]} size={2.3} color={ink} anchorX="center">
        {label}
      </TermText>
      <TermText position={[0, -2.6]} size={0.8} color={inkDim} anchorX="center">
        {locked !== null ? "LOCKED" : "ROLL ?"}
      </TermText>
    </Screen>
  );
};

type NavScreenProps = {
  label: String;
  clickEventHandler: () => void;
  invert?: boolean;
  // Animated chevrons pointing this way above the label
  direction?: "left" | "right";
  // Small hint under the label: the number of the quote it leads to
  keyHint?: string;
} & ScreenProps;

const NavScreen = ({
  label,
  clickEventHandler,
  invert,
  direction,
  keyHint,
  ...props
}: NavScreenProps) => {
  const [hovered, setHovered] = useState(false);
  // Everything inverts on hover, like a selected terminal field
  const ink = hovered ? SCREEN_BACKGROUND : SCREEN_TEXT;
  const chrome = hovered ? "#24564f" : SCREEN_CHROME;
  const chromeDim = hovered ? "#2f6560" : SCREEN_CHROME_DIM;
  const inkDim = hovered ? "#1d4a44" : SCREEN_TEXT_DIM;

  return (
    <Screen
      {...props}
      onClick={() => clickEventHandler()}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <color
        attach="background"
        args={[hovered ? "#3e7d75" : SCREEN_BACKGROUND]}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Flex
        plane="xy"
        size={[13, 13, 0]}
        position={[-13 / 2, 13 / 2, 0]}
        flexDirection="column"
        align="center"
        justify="center"
        wrap="wrap"
      >
        <Box>
          <Text maxWidth={13} color={ink} fontSize={2} textAlign="center">
            {label}
          </Text>
        </Box>
      </Flex>
      <CornerBrackets inset={5} length={1.4} color={chrome} />
      {direction && (
        <Chevrons
          direction={direction}
          y={2.6}
          color={ink}
          dimColor={chromeDim}
        />
      )}
      {keyHint && (
        <TermText position={[0, -2.9]} size={0.9} color={inkDim} anchorX="center">
          {`[ ${keyHint} ]`}
        </TermText>
      )}
    </Screen>
  );
};
