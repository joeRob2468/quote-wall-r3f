"use client";

import { Canvas, Props } from "@react-three/fiber";

import { Preload } from "@react-three/drei";
import { r3f } from "@/lib/three";

export default function Scene(props: Omit<Props, "children">) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas {...props}>
      <r3f.Out />
      <Preload all />
    </Canvas>
  );
}
