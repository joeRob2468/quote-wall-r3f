"use client";

import { getQuotes } from "@/data/quote";
import { PerspectiveCamera, RenderTexture, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useRef } from "react";
import * as THREE from "three";
import type { GLTFResult } from "./Computers";
import { FullQuote } from "@/types/quote";

type ScreensProps = {
  nodes: GLTFResult["nodes"];
  materials: GLTFResult["materials"];
};
export const Screens = ({ nodes, materials }: ScreensProps) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => await getQuotes(),
  });

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
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        panel={nodes.Large_Monitor_Screen.geometry}
        position={[0.678, 7.601, 2.569]}
        rotation={[-Math.PI / 2, 0, -0.088]}
        scale={[1.939, 2.001, 2.169]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        invert
        panel={nodes.Small_Monitor_Screen.geometry}
        position={[3.746, 6.591, 2.599]}
        rotation={[-Math.PI / 2, 0, 0.075]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        panel={nodes.Small_Monitor_Screen001.geometry}
        position={[3.722, 8.818, 2.51]}
        rotation={[-Math.PI / 2, 0, 0.049]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        invert
        panel={nodes.Small_Monitor_Screen002.geometry}
        position={[1.455, 10.681, 2.422]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        panel={nodes.Small_Monitor_Screen003.geometry}
        position={[5.902, 6.593, 2.304]}
        rotation={[-Math.PI / 2, 0, 0.186]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        invert
        panel={nodes.Small_Monitor_Screen004.geometry}
        position={[-2.387, 6.673, 1.923]}
        rotation={[-Math.PI / 2, 0, -0.253]}
      />
      <ScreenText
        quote={data[Math.round(Math.random() * (data.length - 1))]}
        panel={nodes.Small_Monitor_Screen005.geometry}
        position={[-2.345, 8.876, 1.829]}
        rotation={[-Math.PI / 2, 0, -0.257]}
      />
    </>
  );
};

type ScreenProps = {
  panel: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  children?: ReactNode;
} & JSX.IntrinsicElements["group"];

const Screen = ({ panel, children, ...props }: ScreenProps) => {
  return (
    <group {...props}>
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
    </group>
  );
};

const ScreenLoading = ({ ...props }: ScreenProps) => {
  useFrame((state) => {});
  return (
    <Screen {...props}>
      <color attach="background" args={["#6acf65"]} />
    </Screen>
  );
};

type ScreenTextProps = {
  quote: FullQuote;
  invert?: boolean;
  x?: number;
  y?: number;
} & ScreenProps;

const ScreenText = ({ quote, invert, x = 0, y = 0, ...props }: ScreenTextProps) => {
  const textRef = useRef<any>(null!);
  const rand = Math.random() * 1000;

  useFrame((state) => {
    textRef.current.position.x =
      x + Math.sin(rand + state.clock.elapsedTime / 2) * 12;
  });
  return (
    <Screen {...props}>
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={[invert ? "black" : "#6acf65"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Text
        font="/IBMPlexMono-Medium.ttf"
        position={[x, y, 0]}
        ref={textRef}
        fontSize={2}
        letterSpacing={0}
        color={!invert ? "black" : "#6acf65"}
      >
        {quote.body}
      </Text>
    </Screen>
  );
};
