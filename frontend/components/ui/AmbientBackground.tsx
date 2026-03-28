"use client";
import * as React from "react";

/**
 * Renders two slow-drifting radial gradient orbs behind all content.
 * Pure CSS animations — zero JS cost after mount.
 * Max 1 blur layer to keep GPU happy.
 * Colors: rose / orange warm palette.
 */
export const AmbientBackground: React.FC = React.memo(() => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Orb 1 — top-left rose/red */}
      <div
        className="orb-1 absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(225,29,72,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Orb 2 — bottom-right orange */}
      <div
        className="orb-2 absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(249,115,22,0.13) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
});
AmbientBackground.displayName = "AmbientBackground";
