"use client";

import * as React from "react";
import {
  Heart,
  Code,
  Globe,
  ExternalLink,
  Sparkles,
  GitBranch,
} from "lucide-react";

export default function AdminAbout() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">
          About the Developer
        </h1>
        <p className="text-sm text-white/40 mt-1">
          The person behind ChitGPT
        </p>
      </div>

      {/* Developer Card */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-violet-500/20 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white/10" />
          </div>
        </div>

        <div className="p-6 space-y-6 -mt-12 relative">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 border-4 border-[#0a0a12] flex items-center justify-center">
            <span className="text-3xl font-bold text-white">BP</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white/90">
              Bagas Pratama Junianika
            </h2>
            <p className="text-sm text-rose-400/80 font-medium">
              Full-Stack Developer & Creator of ChitGPT
            </p>
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            A passionate full-stack developer focused on building modern,
            production-grade web applications. ChitGPT is an AI chat platform
            built with cutting-edge technologies, featuring multi-provider AI
            support (Gemini, OpenAI, Groq), real-time streaming, and a sleek
            glassmorphism UI design.
          </p>

          {/* Skills */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "React",
                "Next.js",
                "TypeScript",
                "Node.js",
                "Express",
                "PostgreSQL",
                "Tailwind CSS",
                "Zustand",
                "Groq API",
                "OpenAI API",
                "Gemini API",
                "Vercel",
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-white/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Links
            </h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://bagaspra16-portfolio.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/15 transition-all"
              >
                <Globe className="w-4 h-4" />
                Portfolio
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://github.com/bagaspra16"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06] transition-all"
              >
                <GitBranch className="w-4 h-4" />
                GitHub
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              About ChitGPT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Code className="w-5 h-5 text-indigo-400 mb-2" />
                <p className="text-sm font-medium text-white/80">Open Source</p>
                <p className="text-xs text-white/40 mt-1">
                  Built with modern best practices and clean architecture
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-sm font-medium text-white/80">
                  Multi-AI Provider
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Supports Gemini, OpenAI, and Groq with real-time streaming
                </p>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="pt-4 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/25 flex items-center justify-center gap-1.5">
              Made with <Heart className="w-3 h-3 text-rose-400" /> by Bagas
              Pratama Junianika
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              &copy; {new Date().getFullYear()} ChitGPT. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
