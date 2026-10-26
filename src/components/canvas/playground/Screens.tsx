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
import { ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";

import { FullQuote } from "@/types/quote";
import type { GLTFResult } from "./Computers";
import Text from "./Text";
import { getQuotes } from "@/data/quote";
import { useQuery } from "@tanstack/react-query";

type ScreensProps = {
  nodes: GLTFResult["nodes"];
  materials: GLTFResult["materials"];
};
export const Screens = ({ nodes, materials }: ScreensProps) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => await getQuotes(),
  });

  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  const showPreviousQuote = () => {
    if (!data?.length) return;
    setQuoteIndex((prev) => (prev <= 0 ? data.length - 1 : prev - 1));
  };
  const showNextQuote = () => {
    if (!data?.length) return;
    setQuoteIndex((prev) => (prev >= data.length - 1 ? 0 : prev + 1));
  };
  const showRandomQuote = () => {
    if (!data || data.length <= 1) return;
    let next: number;
    do {
      next = Math.floor(Math.random() * data.length);
    } while (next === quoteIndex);
    setQuoteIndex(next);
  };

  if (isPending || isError) {
    return (
      <>
        <ScreenLoading
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

  return (
    <>
      {/* Center large screen */}
      <MainQuoteScreen
        quote={data[quoteIndex]}
        panel={nodes.Large_Monitor_Screen.geometry}
        position={[0.678, 7.601, 2.569]}
        rotation={[-Math.PI / 2, 0, -0.088]}
        scale={[1.939, 2.001, 2.169]}
      />
      {/* Bottom left nav screen */}
      <NavScreen
        label="Previous"
        clickEventHandler={showPreviousQuote}
        panel={nodes.Small_Monitor_Screen.geometry}
        position={[3.746, 6.591, 2.599]}
        rotation={[-Math.PI / 2, 0, 0.075]}
      />
      {/* Top left small screen */}
      <DateScreen
        quote={data[quoteIndex]}
        panel={nodes.Small_Monitor_Screen001.geometry}
        position={[3.722, 8.818, 2.51]}
        rotation={[-Math.PI / 2, 0, 0.049]}
      />
      {/* Top center small screen — random nav */}
      <NavScreen
        label="✨Random"
        clickEventHandler={showRandomQuote}
        panel={nodes.Small_Monitor_Screen002.geometry}
        position={[1.455, 10.681, 2.422]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Far left small screen — quote list */}
      <QuoteListScreen
        quotes={data}
        quoteIndex={quoteIndex}
        setQuoteIndex={setQuoteIndex}
        panel={nodes.Small_Monitor_Screen003.geometry}
        position={[5.902, 6.593, 2.304]}
        rotation={[-Math.PI / 2, 0, 0.186]}
      />

      {/* Bottom Right nav screen */}
      <NavScreen
        label="Next"
        clickEventHandler={showNextQuote}
        panel={nodes.Small_Monitor_Screen004.geometry}
        position={[-2.387, 6.673, 1.923]}
        rotation={[-Math.PI / 2, 0, -0.253]}
      />
      {/* Top right small screen */}
      <MetaScreen
        quote={data[quoteIndex]}
        panel={nodes.Small_Monitor_Screen005.geometry}
        position={[-2.345, 8.876, 1.829]}
        rotation={[-Math.PI / 2, 0, -0.257]}
      />
    </>
  );
};

const ScreenRenderer = ({ buffer }: { buffer: THREE.WebGLRenderTarget }) => {
  const { gl, camera, scene } = useThree();

  let composer = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.autoRenderToScreen = false;

    const renderPass = new RenderPass(scene, camera);
    const copyPass = new CopyPass(buffer);

    const scanlineEffectPass = new EffectPass(
      camera,
      new ScanlineEffect({
        blendFunction: BlendFunction.OVERLAY,
        density: 0.5,
      })
    );

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
      delay: new THREE.Vector2(1.0, 10.0),
      duration: new THREE.Vector2(0.1, 0.5),
      strength: new THREE.Vector2(0.3, 0.75),
      ratio: 0.45,
    });
    glitchEffect.mode = GlitchMode.SPORADIC;
    const glitchEffectPass = new EffectPass(camera, glitchEffect);

    const lensDistortionEffectPass = new EffectPass(
      camera,
      new LensDistortionEffect({
        distortion: new THREE.Vector2(0.05, 0.05),
        principalPoint: new THREE.Vector2(0.0, 0.0),
        focalLength: new THREE.Vector2(0.9, 0.95),
      })
    );

    composer.addPass(renderPass);
    composer.addPass(scanlineEffectPass);
    composer.addPass(glitchEffectPass);
    composer.addPass(chromaticEffectPass);
    composer.addPass(lensDistortionEffectPass);
    composer.addPass(copyPass);

    return composer;
  }, [gl, scene, camera, buffer]);

  useFrame((state) => {
    gl.setRenderTarget(buffer);
    if (composer) composer.render();
    //gl.render(state.scene, state.camera);
    gl.setRenderTarget(null);
  });

  return <></>;
};

type ScreenProps = {
  panel: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  children?: ReactNode;
  fov?: number;
} & JSX.IntrinsicElements["group"];

const Screen = ({ panel, children, fov, ...props }: ScreenProps) => {
  const [scene] = useState(() => new THREE.Scene());
  const buffer = useFBO(512, 512);

  return (
    <group {...props}>
      {createPortal(
        <>
          <Suspense fallback={null}>
            <PerspectiveCamera
              makeDefault
              manual
              aspect={1 / 1}
              position={[0, 0, 16]}
              {...(fov !== undefined && { fov })}
            />
            {children}
            <ScreenRenderer buffer={buffer} />
          </Suspense>
        </>,
        scene
      )}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial toneMapped={false} map={buffer.texture} />
      </mesh>
    </group>
  );
};

const ScreenLoading = ({ ...props }: ScreenProps) => {
  useFrame((state) => {});
  return (
    <Screen {...props}>
      <color attach="background" args={["#333333"]} />
    </Screen>
  );
};

type ScreenTextProps = {
  quote: FullQuote;
} & ScreenProps;


const MainQuoteScreen = ({ quote, ...props }: ScreenTextProps) => {
  return (
    <Screen {...props}>
      <color attach="background" args={["#020E09"]} />
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
          <Text maxWidth={13} color={"#65FFBD"} textAlign="center">
            {quote.body}
          </Text>
        </Box>
      </Flex>
    </Screen>
  );
};

const MetaScreen = ({ quote, ...props }: ScreenTextProps) => {
  return (
    <Screen {...props}>
      <color attach="background" args={["#020E09"]} />
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
        <Box marginBottom={1}>
          <Text
            maxWidth={13}
            color={"#65FFBD"}
            fontSize={2.5}
            textAlign="center"
          >
            {quote.author.name}
          </Text>
        </Box>
        <Box>
          <Text maxWidth={13} color={"#65FFBD"} fontSize={1.25} textAlign="center">
            {quote.context}
          </Text>
        </Box>
      </Flex>
    </Screen>
  );
};

const DateScreen = ({ quote, ...props }: ScreenTextProps) => {
  return (
    <Screen {...props}>
      <color attach="background" args={["#020E09"]} />
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
          <Text
            maxWidth={13}
            color={"#65FFBD"}
            fontSize={1.5}
            textAlign="center"
          >
            {`${quote.date.toLocaleString("default", { month: "long" })} ${quote.date.getDate()}`}
          </Text>
        </Box>
        <Box>
          <Text maxWidth={13} color={"#65FFBD"} fontSize={2} textAlign="center">
            {quote.date.getFullYear()}
          </Text>
        </Box>
      </Flex>
    </Screen>
  );
};

const LIST_ROW_HEIGHT = 3;
const LIST_WIDTH = 11.2;
const LIST_VISIBLE_HEIGHT = 13;
const SCROLLBAR_X = 5.9;
const SCROLLBAR_W = 0.5;
const LIST_VISIBLE_ROWS = Math.ceil(LIST_VISIBLE_HEIGHT / LIST_ROW_HEIGHT);
const LIST_WINDOW_BUFFER = 4;

type QuoteRowProps = {
  quote: FullQuote;
  isActive: boolean;
  isHovered: boolean;
  y: number;
};

const QuoteRow = ({ quote, isActive, isHovered, y }: QuoteRowProps) => {
  const bgColor = isActive ? "#0A3020" : isHovered ? "#0A3020" : "#020E09";
  const textColor = "#65FFBD";
  const truncated =
    quote.body.length > 48 ? quote.body.substring(0, 45) + "..." : quote.body;

  return (
    <group position={[-6.5, y, 0]}>
      <mesh position={[LIST_WIDTH / 2, -(LIST_ROW_HEIGHT - 0.1) / 2, 0]}>
        <planeGeometry args={[LIST_WIDTH, LIST_ROW_HEIGHT - 0.1]} />
        <meshBasicMaterial color={bgColor} />
      </mesh>
      <DreiText
        maxWidth={LIST_WIDTH - 0.6}
        color={textColor}
        fontSize={0.85}
        font="/IBMPlexMono-Medium.ttf"
        anchorX="left"
        anchorY="top"
        textAlign="left"
        position={[0.3, -0.35, 0.01]}
      >
        {quote.author.name}
      </DreiText>
      <DreiText
        maxWidth={LIST_WIDTH - 0.6}
        color={textColor}
        fontSize={0.6}
        font="/IBMPlexMono-Medium.ttf"
        anchorX="left"
        anchorY="top"
        textAlign="left"
        position={[0.3, -1.3, 0.01]}
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
    const rowTopY = 6.0 - i * LIST_ROW_HEIGHT + scrollOffset.current;
    const rowBottomY = 6.0 - (i + 1) * LIST_ROW_HEIGHT + scrollOffset.current;

    let target = scrollOffset.current;
    if (rowTopY > 6.2) {
      // Row is above the viewport — snap so it appears at the top
      target = i * LIST_ROW_HEIGHT;
    } else if (rowBottomY < -6.2) {
      // Row is below the viewport — snap so it appears at the bottom
      target = (i + 1) * LIST_ROW_HEIGHT - 12.2;
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
        6.5 - thumbHeight / 2 - ratio * thumbTravel;
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
    const contentY = portalY - scrollOffset.current;
    const i = Math.floor((6.0 - contentY) / LIST_ROW_HEIGHT);
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
              ? 6.5 - thumbHeight / 2 - (scrollOffset.current / maxScroll) * thumbTravel
              : 6.5 - thumbHeight / 2;
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
          const ratio = (6.5 - thumbHeight / 2 - thumbCenter) / thumbTravel;
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
      <color attach="background" args={["#020E09"]} />
      <ambientLight intensity={0.5} />

      {/* Scrollbar track */}
      <mesh position={[SCROLLBAR_X, 0, 0]}>
        <planeGeometry args={[SCROLLBAR_W, LIST_VISIBLE_HEIGHT]} />
        <meshBasicMaterial color="#0A2A1A" />
      </mesh>

      {/* Scrollbar thumb */}
      <mesh
        ref={thumbRef}
        position={[SCROLLBAR_X, 6.5 - thumbHeight / 2, 0.01]}
      >
        <planeGeometry args={[SCROLLBAR_W, thumbHeight]} />
        <meshBasicMaterial color="#65FFBD" />
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
              y={6.0 - i * LIST_ROW_HEIGHT}
            />
          );
        })}
      </group>
    </Screen>
  );
};

type NavScreenProps = {
  label: String;
  clickEventHandler: () => void;
  invert?: boolean;
} & ScreenProps;

const NavScreen = ({
  label,
  clickEventHandler,
  invert,
  ...props
}: NavScreenProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Screen
      {...props}
      onClick={() => clickEventHandler()}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <color attach="background" args={[hovered ? "#66AE8F" : "#020E09"]} />
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
          <Text
            maxWidth={13}
            color={!hovered ? "#65FFBD" : "#020E09"}
            fontSize={2}
            textAlign="center"
          >
            {label}
          </Text>
        </Box>
      </Flex>
    </Screen>
  );
};
