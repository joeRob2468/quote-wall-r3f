"use client";

import * as THREE from "three";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";

// The recorder's two tape spools. The model has them as one mesh, side by
// side along local X with their axles along local Y, so it's split into two
// meshes at the midpoint, each centred on its own axle so it can spin in
// place.

// Radians per second; the take-up spool turns a little slower, as it would
// with more tape wound on it
const SPEEDS = [0.45, 0.32];

const splitAtX = (geometry: THREE.BufferGeometry, midX: number) => {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = flat.getAttribute("position");
  const normal = flat.getAttribute("normal");
  const sides: [number[], number[]][] = [
    [[], []],
    [[], []],
  ];
  for (let tri = 0; tri < position.count; tri += 3) {
    const cx =
      (position.getX(tri) + position.getX(tri + 1) + position.getX(tri + 2)) /
      3;
    const [positions, normals] = sides[cx < midX ? 0 : 1];
    for (let v = tri; v < tri + 3; v++) {
      positions.push(position.getX(v), position.getY(v), position.getZ(v));
      if (normal) normals.push(normal.getX(v), normal.getY(v), normal.getZ(v));
    }
  }
  return sides.map(([positions, normals]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length) {
      g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    }
    // Centre on the axle (X/Z), keep Y so it stays flush with the deck
    g.computeBoundingBox();
    const center = g.boundingBox!.getCenter(new THREE.Vector3());
    g.translate(-center.x, 0, -center.z);
    return { geometry: g, axle: new THREE.Vector3(center.x, 0, center.z) };
  });
};

type SpinningReelsProps = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
};

export const SpinningReels = ({ geometry, material }: SpinningReelsProps) => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const reels = useMemo(() => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    return splitAtX(geometry, (box.min.x + box.max.x) / 2);
  }, [geometry]);

  useFrame((_, delta) => {
    refs.current.forEach((mesh, i) => {
      if (mesh) mesh.rotation.y -= SPEEDS[i] * delta;
    });
  });

  return (
    <>
      {reels.map((reel, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            refs.current[i] = mesh;
          }}
          geometry={reel.geometry}
          material={material}
          position={reel.axle}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
};
