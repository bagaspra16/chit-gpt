"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useLoadingStore } from "@/lib/store/loading.store";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Sparkles, Loader2, Mail, Lock } from "lucide-react";

type ApiError = {
  response?: {
    data?: {
      details?: { message: string }[];
      message?: string;
    };
  };
};

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const { startLoading, stopLoading } = useLoadingStore();

  const [isLogin, setIsLogin] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/chat");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMsg("");

    const endpoint = isLogin ? "/auth/login" : "/auth/register";

    // Start global loading overlay with contextual message
    startLoading(isLogin ? "login" : "register");

    try {
      const res = await api.post(endpoint, { email, password });

      if (isLogin) {
        setAuth(res.data.data.user, res.data.data.token);
        // Navigation will trigger stopLoading via AppShell pathname watcher
        router.push("/chat");
      } else {
        // For register there's no navigation — stop loading immediately after API responds
        stopLoading(true);
        setMsg(
          "Registration successful! Check your email to verify your account.",
        );
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: unknown) {
      // On error, force-stop immediately so the overlay doesn't linger
      stopLoading(true);
      const apiErr = err as ApiError;
      setError(
        apiErr.response?.data?.details?.[0]?.message ||
          apiErr.response?.data?.message ||
          "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    startLoading("guest");
    try {
      const res = await api.post("/auth/guest");
      setAuth(res.data.data.user, res.data.data.token);
      // Navigation will trigger stopLoading via AppShell pathname watcher
      router.push("/chat");
    } catch {
      stopLoading(true);
      setError("Failed to create guest session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-glass backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome to ChitGPT
          </h1>
          <p className="text-white/50 text-sm">
            Experience the next generation of AI chat
          </p>
        </div>

        <GlassCard
          intensity="high"
          className="p-6 sm:p-8 w-full border border-white/10"
        >
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          {msg && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] flex justify-center items-center h-12"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            <span className="text-xs text-white/40 uppercase font-medium tracking-wide">
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={isLoading}
            className="w-full mt-6 bg-white/5 border border-white/10 text-white font-medium rounded-xl py-3 hover:bg-white/10 transition-colors h-12 flex items-center justify-center text-sm"
          >
            Continue as Guest
          </button>

          <div className="mt-8 text-center text-sm text-white/40">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
