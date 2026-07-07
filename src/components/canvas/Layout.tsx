"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});

interface LayoutProps {
  children?: React.ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const ref = useRef(null!);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 w-full h-full overflow-auto touch-auto"
    >
      {children}
      <Scene
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: -1,
        }}
        eventSource={ref}
        eventPrefix="client"
        shadows="soft"
        dpr={[1, 1.5]}
      />
    </div>
  );
};

export { Layout };
