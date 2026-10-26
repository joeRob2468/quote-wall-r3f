"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useLoadState } from "@/components/canvas/playground/loadState";
import { useProgress } from "@react-three/drei";

// Matches the .boot-exit animation in globals.css
const EXIT_MS = 300;
// Lift the overlay anyway if the scene never reports in (e.g. no WebGL), so
// the page isn't stuck behind it
const GIVE_UP_MS = 20000;

type Status = "wait" | "busy" | "ok";

type BootRow = {
  tag: string;
  label: string;
  detail?: string;
  status: Status;
};

const pad3 = (n: number) => String(n).padStart(3, "0");

interface PreloaderProps {
  quoteCount: number;
  // Position of the quote a shared link points at, if it exists
  seekIndex?: number;
}

// Boot screen over the scene until it's actually drawing. Server rendered, so
// it shows while the scripts download; every line tracks a real step.
export function Preloader({ quoteCount, seekIndex }: PreloaderProps) {
  const { sceneMounted, screensMounted, screensLoaded, ready } =
    useLoadState();
  // Items through three's default loading manager, i.e. the scene model
  const { loaded, total } = useProgress();
  const [hydrated, setHydrated] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const timeout = setTimeout(() => setTimedOut(true), GIVE_UP_MS);
    return () => clearTimeout(timeout);
  }, []);

  const done = ready || timedOut;
  useEffect(() => {
    if (!done) return;
    const timeout = setTimeout(() => setGone(true), EXIT_MS);
    return () => clearTimeout(timeout);
  }, [done]);

  if (gone) return null;

  // Loader counts can already have moved by hydration, so they're ignored
  // until then to match the server render. The model can also finish before
  // this subscribes, leaving them at zero; the scene mounting covers that.
  const modelDone =
    sceneMounted || (hydrated && total > 0 && loaded >= total);
  const screensDone = sceneMounted && screensLoaded >= screensMounted;

  const rows: BootRow[] = [
    {
      tag: "SYS",
      label: "Runtime",
      status: hydrated ? "ok" : "busy",
    },
    {
      tag: "IDX",
      label: "Quote index",
      detail: `${quoteCount} REC`,
      status: "ok",
    },
    {
      tag: "TAPE",
      label: "Scene model",
      detail: hydrated && total > 0 ? `${loaded}/${total}` : undefined,
      status: modelDone ? "ok" : hydrated ? "busy" : "wait",
    },
    {
      tag: "CRT",
      label: "Monitors",
      detail: sceneMounted ? `${screensLoaded}/${screensMounted}` : undefined,
      status: screensDone ? "ok" : modelDone ? "busy" : "wait",
    },
    {
      tag: "GPU",
      label: "Shaders",
      status: ready ? "ok" : screensDone ? "busy" : "wait",
    },
  ];
  if (seekIndex !== undefined) {
    rows.push({
      tag: "SEEK",
      label: `Record ${pad3(seekIndex + 1)}`,
      status: ready ? "ok" : "wait",
    });
  }

  const modelFraction = modelDone
    ? 1
    : hydrated && total > 0
      ? loaded / total
      : 0;
  const screensFraction = screensDone
    ? 1
    : screensMounted > 0
      ? screensLoaded / screensMounted
      : 0;
  const progress = done
    ? 1
    : (hydrated ? 0.15 : 0.05) + modelFraction * 0.45 + screensFraction * 0.3;
  const percent = Math.round(progress * 100);

  return (
    <div
      className={cn("boot-screen", done && "boot-exit")}
      aria-busy={!done}
      aria-label="Loading"
    >
      <div className="boot-panel">
        <div className="boot-header">
          <span>{siteConfig.name.toUpperCase()}</span>
          <span className="boot-dim">BOOT</span>
        </div>
        <ul className="boot-rows">
          {rows.map((row) => (
            <li key={row.tag} className={cn("boot-row", `is-${row.status}`)}>
              <span className="boot-tag">{row.tag}</span>
              <span className="boot-label">{row.label}</span>
              <span className="boot-leader" aria-hidden />
              {row.detail ? (
                <span className="boot-dim">{row.detail}</span>
              ) : null}
              <span className="boot-status">
                {row.status === "ok" ? (
                  "OK"
                ) : row.status === "busy" ? (
                  <span className="boot-spinner" aria-label="loading" />
                ) : (
                  "--"
                )}
              </span>
            </li>
          ))}
        </ul>
        <div
          className="boot-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="boot-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="boot-footer">
          <span>
            {done ? "SIGNAL LOCKED" : "LOADING"}
            <span className="boot-cursor">_</span>
          </span>
          <span>{pad3(percent)}%</span>
        </div>
      </div>
    </div>
  );
}
