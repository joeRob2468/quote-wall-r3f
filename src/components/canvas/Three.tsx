"use client";

import { Props } from "@react-three/fiber";
import { r3f } from "@/lib/three";

export const Three = ({ children }: Props) => {
  return <r3f.In>{children}</r3f.In>;
};
