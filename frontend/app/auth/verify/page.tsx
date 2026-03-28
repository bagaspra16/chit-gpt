"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

type VerifyState = "loading" | "success" | "error";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = React.useState<VerifyState>("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setState("error");
      setMessage(
        "No verification token found. Please use the link from your email.",
      );
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const res = await api.get(
          `/auth/verify?token=${encodeURIComponent(token)}`,
        );
        if (!cancelled) {
          setState("success");
          setMessage(
            res.data?.message ||
              "Email verified successfully. You can now sign in.",
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setState("error");
          const apiErr = err as { response?: { data?: { message?: string } } };
          setMessage(
            apiErr.response?.data?.message ||
              "Verification failed. The link may have expired or already been used.",
          );
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]" />

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-glass backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            ChitGPT
          </h1>
          <p className="text-white/50 text-sm">Email Verification</p>
        </div>

        <GlassCard
          intensity="high"
          className="p-8 w-full border border-white/10"
        >
          <div className="flex flex-col items-center text-center gap-6">
            {/* Icon area */}
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full
              border border-white/10 bg-white/5"
            >
              {state === "loading" && (
                <Loader2 className="w-7 h-7 text-rose-400 animate-spin" />
              )}
              {state === "success" && (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              )}
              {state === "error" && (
                <XCircle className="w-7 h-7 text-red-400" />
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {state === "loading" && "Verifying your email…"}
                {state === "success" && "Email verified!"}
                {state === "error" && "Verification failed"}
              </h2>

              <p
                className={
                  "text-sm leading-relaxed " +
                  (state === "success"
                    ? "text-emerald-400"
                    : state === "error"
                      ? "text-red-400"
                      : "text-white/50")
                }
              >
                {state === "loading"
                  ? "Please wait while we confirm your email address."
                  : message}
              </p>
            </div>

            {/* Actions — only show once resolved */}
            {state !== "loading" && (
              <Link
                href="/auth"
                className="w-full flex items-center justify-center gap-2 bg-white text-black
                  font-semibold rounded-xl py-3 hover:bg-gray-200 transition-colors
                  shadow-[0_0_20px_rgba(255,255,255,0.15)] h-12 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {state === "success"
                  ? "Sign in to your account"
                  : "Back to sign in"}
              </Link>
            )}

            {/* Hint for expired token */}
            {state === "error" && (
              <p className="text-xs text-white/30 leading-relaxed -mt-2">
                Verification links expire after 24 hours. Register again to
                receive a fresh link.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in Next.js App Router
export default function VerifyPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </React.Suspense>
  );
}
