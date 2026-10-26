import React from "react";
import { useReflow } from "@react-three/flex";
import { Text as TextImpl } from "@react-three/drei";

type Props = Parameters<typeof TextImpl>[0];

// VT323 (SIL Open Font License, see public/VT323-OFL.txt), modelled on the
// DEC VT320 terminal
export const SCREEN_FONT = "/VT323-Regular.ttf";
// VT323 glyphs are 0.4em wide (the original font was 0.6em). 1.5 would
// keep the old characters per line; a bit less keeps text from feeling
// oversized.
export const SCREEN_FONT_SCALE = 1.3;
// Its built-in line spacing is very tight; open it up a little
export const SCREEN_LINE_HEIGHT = 1.1;

export default function Text({
  fontSize = 1,
  lineHeight = SCREEN_LINE_HEIGHT,
  anchorX = "left",
  anchorY = "top",
  textAlign = "left",
  ...props
}: Props) {
  const reflow = useReflow();
  return (
    <TextImpl
      fontSize={fontSize * SCREEN_FONT_SCALE}
      lineHeight={lineHeight}
      anchorX={anchorX}
      anchorY={anchorY}
      textAlign={textAlign}
      font={SCREEN_FONT}
      onSync={reflow}
      {...props}
    />
  );
}
