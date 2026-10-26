"use client";

import { useEffect, useRef, useState } from "react";

import { blockPixelRatio } from "@/components/canvas/playground/pixelBlock";
import dynamic from "next/dynamic";
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});

interface LayoutProps {
  children?: React.ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const ref = useRef(null!);

  // Given as the Canvas prop rather than set from inside the scene: the
  // Canvas re-applies its dpr prop whenever it re-renders (e.g. after a
  // server action), which reset the scene to full resolution. The scene is
  // client-only, so the server's placeholder value is never used.
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 1 : blockPixelRatio()
  );
  useEffect(() => {
    const update = () => setDpr(blockPixelRatio());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 w-full h-full overflow-auto touch-auto"
    >
      {children}
      <Scene
        className="scene-canvas"
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: -1,
        }}
        eventSource={ref}
        eventPrefix="client"
        shadows="soft"
        dpr={dpr}
      />
    </div>
  );
};

export { Layout };
