import React from "react";
import { useReflow } from "@react-three/flex";
import { Text as TextImpl } from "@react-three/drei";

type Props = Parameters<typeof TextImpl>[0] & { bold?: boolean };

export default function Text({
  bold = false,
  anchorX = "left",
  anchorY = "top",
  textAlign = "left",
  ...props
}: Props) {
  const reflow = useReflow();
  const font = bold ? "/IBMPlexMono-Medium.ttf" : "/IBMPlexMono-Medium.ttf";

  return (
    <TextImpl
      anchorX={anchorX}
      anchorY={anchorY}
      textAlign={textAlign}
      font={font}
      onSync={reflow}
      {...props}
    />
  );
}
