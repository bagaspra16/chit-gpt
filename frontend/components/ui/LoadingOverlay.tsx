"use client";

import * as React from "react";
import { useLoadingStore } from "@/lib/store/loading.store";
import { Sparkles } from "lucide-react";
import { MorphingSquare } from "@/components/ui/morphing-square";

/* ── Thin NProgress-style top bar (no shimmer) ──────────────── */
const TopBar: React.FC<{ active: boolean; leaving: boolean }> = ({
  active,
  leaving,
}) => {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    setWidth(0);
    const t1 = setTimeout(() => setWidth(40), 80);
    const t2 = setTimeout(() => setWidth(78), 700);
    const t3 = setTimeout(() => setWidth(90), 3_000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active]);

  React.useEffect(() => {
    if (leaving) setWidth(100);
  }, [leaving]);

  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          transition:
            width === 0
              ? "none"
              : width === 100
                ? "width 0.25s ease-in"
                : "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
          /* Solid rose→orange gradient — no shimmer animation */
          background: "linear-gradient(90deg, #e11d48, #fb7185, #f97316)",
        }}
      />
    </div>
  );
};

/* ── Spinner ring ───────────────────────────────────────────── */
const SpinnerRing: React.FC = () => (
  <div className="relative w-12 h-12">
    {/* Track */}
    <div className="absolute inset-0 rounded-full border-2 border-rose-500/15" />
    {/* Spinning arc */}
    <div
      className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-400"
      style={{ animation: "loading-spin 0.72s linear infinite" }}
    />
    {/* Inner glow dot */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
    </div>
  </div>
);

/* ── Floating orbs — rose / orange palette ──────────────────── */
const MiniOrbs: React.FC = () => (
  <>
    <div
      className="absolute -top-[30%] -left-[15%] w-[50vw] h-[50vw] rounded-full pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(225,29,72,0.18) 0%, transparent 65%)",
        filter: "blur(48px)",
        animation: "orb-drift-1 18s ease-in-out infinite",
      }}
    />
    <div
      className="absolute -bottom-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(249,115,22,0.14) 0%, transparent 65%)",
        filter: "blur(56px)",
        animation: "orb-drift-2 24s ease-in-out infinite",
      }}
    />
  </>
);

/* ── Pulsing brand icon ─────────────────────────────────────── */
const BrandIcon: React.FC = () => (
  <div
    className="w-14 h-14 rounded-2xl flex items-center justify-center"
    style={{
      background: "rgba(225,29,72,0.10)",
      border: "1px solid rgba(251,113,133,0.22)",
      boxShadow:
        "0 0 24px rgba(225,29,72,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
      animation: "brand-pulse 2.4s ease-in-out infinite",
    }}
  >
    <Sparkles className="w-6 h-6 text-rose-400" />
  </div>
);

/* ── Dot ellipsis ───────────────────────────────────────────── */
const Ellipsis: React.FC = () => {
  const [dots, setDots] = React.useState("");
  React.useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      420,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-block w-5 text-left text-rose-400/60">{dots}</span>
  );
};

/* ── Main overlay ───────────────────────────────────────────── */
export const LoadingOverlay: React.FC = () => {
  const { isLoading, message } = useLoadingStore();

  const [visible, setVisible] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const fadeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setLeaving(false);
      setVisible(true);
    } else {
      setLeaving(true);
      fadeTimer.current = setTimeout(() => {
        setVisible(false);
        setLeaving(false);
      }, 380);
    }
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes loading-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes brand-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(225,29,72,0.14), inset 0 1px 0 rgba(255,255,255,0.06); }
          50%       { box-shadow: 0 0 40px rgba(225,29,72,0.28), inset 0 1px 0 rgba(255,255,255,0.10); }
        }
        @keyframes overlay-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlay-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes card-in  {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes card-out {
          from { opacity: 1; transform: translateY(0)  scale(1);    }
          to   { opacity: 0; transform: translateY(-6px) scale(0.98); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[300] overflow-hidden"
        style={{
          background: "rgba(6, 5, 12, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          animation: leaving
            ? "overlay-out 0.38s ease forwards"
            : "overlay-in 0.22s ease forwards",
        }}
      >
        <MiniOrbs />
        <TopBar active={isLoading} leaving={leaving} />

        {/* ── Centre card ── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-6"
            style={{
              animation: leaving
                ? "card-out 0.32s ease forwards"
                : "card-in 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <MorphingSquare className="bg-rose-500 w-14 h-14 shadow-[0_0_30px_rgba(225,29,72,0.4)]" />

            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-[15px] font-medium text-white/70 tracking-wide flex items-baseline gap-0.5">
                <span>{message.replace(/…$/, "")}</span>
                <Ellipsis />
              </p>
              <p className="text-[11px] text-white/20 tracking-wider uppercase font-medium">
                ChitGPT
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
