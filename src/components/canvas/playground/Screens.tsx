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
import { PerspectiveCamera, useFBO } from "@react-three/drei";
import { ReactNode, Suspense, useMemo, useState } from "react";
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
    console.log("showPreviousQuote", quoteIndex);
    setQuoteIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  };
  const showNextQuote = () => {
    console.log("showNextQuote", quoteIndex);
    setQuoteIndex((prev) =>
      prev === (!!data && data.length - 1) ? 0 : prev + 1
    );
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
      {/* Top center small screen */}
      <ScreenText
        quote={data[quoteIndex]}
        panel={nodes.Small_Monitor_Screen002.geometry}
        position={[1.455, 10.681, 2.422]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Far left small screen */}
      <ScreenText
        quote={data[quoteIndex]}
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
      delay: new THREE.Vector2(0.5, 6.0),
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
} & JSX.IntrinsicElements["group"];

const Screen = ({ panel, children, ...props }: ScreenProps) => {
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

const ScreenText = ({ quote, ...props }: ScreenTextProps) => {
  return (
    <Screen {...props}>
      <color attach="background" args={["#020E09"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
    </Screen>
  );
};

const MainQuoteScreen = ({ quote, ...props }: ScreenTextProps) => {
  return (
    <Screen {...props}>
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 16]}
      />
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
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 16]}
      />
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
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 16]}
      />
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
            {`${quote.date.toLocaleString("default", { month: "long" })} ${quote.date.getDay() + 1}`}
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
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 16]}
      />
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
