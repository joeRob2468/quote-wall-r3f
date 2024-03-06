"use client";

import { Mesh } from "three";
import { OrbitControls } from "@react-three/drei";
import { Three } from "@/components/canvas/Three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const Box = () => {
  const mesh = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    mesh.current.rotation.y += delta;
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry />
      <meshPhongMaterial color={"#4C4C9D"} />
    </mesh>
  );
};

export const Playground = () => {
  return (
    <Three>
      <Box />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Three>
  );
};
