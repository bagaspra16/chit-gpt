"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap,
  MessageSquare,
  Key,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useLoadingStore } from "@/lib/store/loading.store";
import api from "@/lib/api";
import { MorphingSquare } from "@/components/ui/morphing-square";

/* ── Animated words ─────────────────────────────────────────── */
const WORDS = ["intelligent", "limitless", "powerful", "seamless", "creative"];

/* ── Feature pills data ─────────────────────────────────────── */
const PILLS = [
  { icon: Zap, label: "Live response generation" },
  { icon: MessageSquare, label: "Context-aware memory" },
  { icon: Key, label: "Bring your own API key" },
  { icon: Shield, label: "No account needed" },
];

/* ══════════════════════════════════════════════════════════════
   HERO VIDEO BACKGROUND
   Video + frame overlays inside overflow-hidden.
   Bottom fade sits OUTSIDE so it can bleed into the page bg.
══════════════════════════════════════════════════════════════ */
const HeroVideo: React.FC = () => (
  <>
    {/* Video + per-frame overlays — strictly clipped to section bounds */}
    <div className="absolute inset-0 overflow-hidden z-0">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://videos.pexels.com/video-files/18526841/uhd_30fps.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />

      {/* Dark veil — light enough to see the video */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(6,5,12,0.45)" }}
      />

      {/* Rose bloom from top-centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.16) 0%, transparent 68%)",
        }}
      />

      {/* Side vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 42%, rgba(6,5,12,0.42) 100%)",
        }}
      />
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   TOP NAV
══════════════════════════════════════════════════════════════ */
const Nav: React.FC<{
  isAuthenticated: boolean;
  onGuest: () => void;
  guestLoading: boolean;
}> = ({ isAuthenticated, onGuest, guestLoading }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4">
    {/* Brand pill */}
    <div
      className="flex items-center gap-2.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "14px",
        padding: "8px 14px",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center"
        style={{
          background: "rgba(225,29,72,0.18)",
          border: "1px solid rgba(251,113,133,0.28)",
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
      </div>
      <span className="text-sm font-semibold text-white/85 tracking-wide">
        ChitGPT
      </span>
    </div>

    {/* Right actions */}
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      {isAuthenticated ? (
        <Link
          href="/chat"
          className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/[0.06]"
        >
          Open Chat <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <>
          <button
            onClick={onGuest}
            disabled={guestLoading}
            className="text-sm text-white/50 hover:text-white/80 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/[0.05] disabled:opacity-40"
          >
            {guestLoading ? "Starting…" : "Try as guest"}
          </button>
          <Link
            href="/auth"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl text-white transition-all hover:brightness-110"
            style={{
              background:
                "linear-gradient(135deg, rgba(225,29,72,0.90), rgba(249,115,22,0.80))",
              border: "1px solid rgba(251,113,133,0.28)",
              boxShadow: "0 0 18px rgba(225,29,72,0.22)",
            }}
          >
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  </nav>
);

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE — hero only
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const { startLoading, stopLoading } = useLoadingStore();

  const [wordIndex, setWordIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [guestLoading, setGuestLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  /* Cycle words slower to make it readable */
  React.useEffect(() => {
    const t = setTimeout(
      () => setWordIndex((i) => (i + 1) % WORDS.length),
      5_000,
    );
    return () => clearTimeout(t);
  }, [wordIndex]);

  const handleOpenChat = () => {
    startLoading("chat");
    router.push("/chat");
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    startLoading("guest");
    try {
      const res = await api.post("/auth/guest");
      setAuth(res.data.data.user, res.data.data.token);
      router.push("/chat");
    } catch {
      stopLoading(true);
      setGuestLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#06050C] z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <MorphingSquare 
            message="Initializing..." 
            className="bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]" 
          />
        </motion.div>
      </div>
    );
  }

  return (
    /* Single-page: no scroll needed, bg matches page colour below fade */
    <div className="fixed inset-0 w-full h-full overflow-hidden touch-none overscroll-none bg-[#06050C]">
      <Nav
        isAuthenticated={isAuthenticated}
        onGuest={handleGuest}
        guestLoading={guestLoading}
      />

      {/* ══════════════════════════════════════════════════════
          HERO — full viewport, vertically centred content
      ══════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center w-full h-full px-4 text-center">
        <HeroVideo />

        {/* Content — z-20 above all overlay layers */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-4xl mx-auto mt-6">
          {/* ── Headline + animated word ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
            className="w-full mb-7"
          >
            {/* New Info Badge above Main Text */}
            <div
              className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mx-auto"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(240,240,245,0.8)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>Free Advanced AI Chatbot Assistant</span>
            </div>

            {/* Static line */}
            <h1
              className="font-extrabold tracking-tight text-white leading-tight"
              style={{
                fontSize: "clamp(2.6rem, 8vw, 6rem)",
                letterSpacing: "-0.03em",
                textShadow: "0 2px 28px rgba(0,0,0,0.65)",
              }}
            >
              The AI that&apos;s
            </h1>

            {/*
              ANIMATED WORD — container font-size matches the word font-size
              so that h-[1em] is computed at the right value and clips cleanly.
              Previously the container had no font-size so em = body ~16px → clipped.
            */}
            <div
              className="relative overflow-hidden mt-1 mx-auto"
              style={{
                fontSize: "clamp(2.6rem, 8vw, 6rem)",
                lineHeight: 1,
                height:
                  "1.35em" /* increased to prevent vertical shadow clipping */,
                width: "120%",
                left: "-10%",
                letterSpacing: "-0.03em",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: "0.55em", filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: "-0.4em", filter: "blur(6px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 32,
                    damping: 16,
                    mass: 1.1,
                  }}
                  className="absolute inset-0 flex items-center justify-center font-extrabold"
                  style={{
                    /*
                      White text with layered warm glow.
                      text-shadow works on solid-colour text (no clip issues).
                      Gradient-clip + blur-duplicate was being clipped by
                      overflow-hidden AND similar hues blended with the video.
                    */
                    color: "#ffffff",
                    textShadow: [
                      "0 0  3px rgba(255,220,150, 1.00)",
                      "0 0 10px rgba(255,140, 60, 0.95)",
                      "0 0 22px rgba(255, 90, 60, 0.70)",
                      "0 0 40px rgba(225, 29, 72, 0.35)",
                    ].join(", "),
                  }}
                >
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Subtitle ──────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
            className="max-w-lg leading-relaxed mb-9"
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
              color: "rgba(240,240,245,0.52)",
              lineHeight: 1.7,
            }}
          >
            ChitGPT is a next-generation AI chat assistant — responses arrive
            word by word as they are generated, context-aware, and fully
            customisable. Jump straight in as a guest, no sign-up needed.
          </motion.p>

          {/* ── Feature pills ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.27, ease: "easeOut" }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "rgba(240,240,245,0.60)",
                }}
              >
                <Icon
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "rgba(251,113,133,0.85)" }}
                />
                {label}
              </div>
            ))}
          </motion.div>

          {/* ── CTAs ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8"
          >
            {isAuthenticated ? (
              <button
                onClick={handleOpenChat}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg,#e11d48 0%,#f97316 100%)",
                  boxShadow:
                    "0 0 32px rgba(225,29,72,0.30), 0 4px 16px rgba(0,0,0,0.30)",
                  border: "1px solid rgba(251,113,133,0.30)",
                }}
              >
                Open my chats <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background:
                      "linear-gradient(135deg,#e11d48 0%,#f97316 100%)",
                    boxShadow:
                      "0 0 32px rgba(225,29,72,0.30), 0 4px 16px rgba(0,0,0,0.30)",
                    border: "1px solid rgba(251,113,133,0.30)",
                  }}
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleGuest}
                  disabled={guestLoading}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-medium transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    color: "rgba(240,240,245,0.58)",
                  }}
                >
                  {guestLoading ? "Starting…" : "Continue as guest"}
                </button>
              </>
            )}
          </motion.div>

          {/* ── Trust line ────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            style={{ fontSize: "11px", color: "rgba(240,240,245,0.22)" }}
            className="tracking-wide"
          >
            No credit card required &nbsp;·&nbsp; Free to use &nbsp;·&nbsp; Own
            your API key
          </motion.p>
        </div>
      </section>
    </div>
  );
}
