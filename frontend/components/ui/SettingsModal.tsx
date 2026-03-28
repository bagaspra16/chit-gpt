"use client";
import * as React from "react";
import { Modal } from "./Modal";
import { useSettingsStore } from "@/lib/store/settings.store";
import { Bot, Palette, Key, ChevronDown, RotateCcw, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "ai" | "persona" | "display";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TabBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full",
      active
        ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
        : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]",
    )}
  >
    {icon}
    {label}
  </button>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
      {label}
    </label>
    {hint && <p className="text-xs text-white/30 -mt-0.5">{hint}</p>}
    {children}
  </div>
);

const modelOptions: Record<string, string[]> = {
  gemini: [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
  ],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "groq/compound",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b",
    "canopylabs/orpheus-v1-english"
  ],
};

const GeminiIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="-3 -3 30 30" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M11.045 23.955c-.135-4.409-1.398-7.581-4.043-10.27C4.316 11.046 1.192 9.835.045 9.71a.885.885 0 0 1 0-1.42C4.305 8.165 7.429 6.953 10.045 4.318c2.656-2.655 3.92-5.78 4.043-10.27a.885.885 0 0 1 1.42 0c.135 4.409 1.41 7.58 4.055 10.27 2.655 2.656 5.827 3.908 10.392 4.01a.885.885 0 0 1 0 1.42c-4.409.135-7.581 1.398-10.27 4.043-2.656 2.655-3.92 5.78-4.043 10.27a.885.885 0 0 1-1.42 0Z" />
  </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="-3 -3 30 30" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.597 8.3829a.0804.0804 0 0 1-.0379-.0615V2.7388a4.4992 4.4992 0 0 1 6.1408 1.6464 4.4708 4.4708 0 0 1 .5346 3.0137l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0v6.7369l2.0201-1.1685a.0757.0757 0 0 1 .0332-.052v-5.5826a4.504 4.504 0 0 1 4.4944-4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1 .5346-3.0137l-.142-.0852L4.3888 1.7689a.7712.7712 0 0 0-.7806 0L-1.454 5.1374v-2.3324a.0804.0804 0 0 1 .0332-.0615L2.43 1.0498a4.4992 4.4992 0 0 1 6.1408 1.6464z" />
  </svg>
);

export const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const settings = useSettingsStore();
  const [tab, setTab] = React.useState<Tab>("ai");
  const [saved, setSaved] = React.useState(false);

  const update = settings.updateSettings;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const models = modelOptions[settings.preferredProvider] || [];

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex min-h-[500px]">
        {/* ── Sidebar tabs */}
        <div className="w-44 flex-shrink-0 p-3 space-y-1 border-r border-white/[0.06]">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2 pt-1 pb-2">
            Settings
          </p>
          <TabBtn
            active={tab === "ai"}
            onClick={() => setTab("ai")}
            icon={<Key className="w-4 h-4" />}
            label="AI"
          />
          <TabBtn
            active={tab === "persona"}
            onClick={() => setTab("persona")}
            icon={<Bot className="w-4 h-4" />}
            label="Persona"
          />
          <TabBtn
            active={tab === "display"}
            onClick={() => setTab("display")}
            icon={<Palette className="w-4 h-4" />}
            label="Display"
          />
        </div>

        {/* ── Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* ── AI TAB */}
            {tab === "ai" && (
              <>
                <Field label="AI Provider">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {(["gemini", "openai", "groq"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          update({
                            preferredProvider: p,
                            preferredModel: modelOptions[p][0],
                          });
                        }}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-medium border transition-all",
                          settings.preferredProvider === p
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                            : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]",
                        )}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {p === "gemini" ? (
                            <>
                              <GeminiIcon className="w-4 h-4" />
                              Gemini
                            </>
                          ) : p === "groq" ? (
                            <>
                              <Zap className="w-4 h-4" />
                              Groq
                            </>
                          ) : (
                            <>
                              <OpenAIIcon className="w-4 h-4" />
                              OpenAI
                            </>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Model">
                  <div className="relative">
                    <select
                      value={settings.preferredModel || models[0]}
                      onChange={(e) =>
                        update({ preferredModel: e.target.value })
                      }
                      className="input-glass w-full appearance-none pr-8 cursor-pointer"
                    >
                      {models.map((m) => (
                        <option key={m} value={m} className="bg-[#0d0d16]">
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  </div>
                </Field>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div>
                    <p className="text-sm text-white/80 font-medium">
                      Use my own API key
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      Your key, your quota
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      update({ useCustomKey: !settings.useCustomKey })
                    }
                    className={cn(
                      "relative w-11 h-6 rounded-full border transition-all duration-200",
                      settings.useCustomKey
                        ? "bg-rose-500/40 border-rose-500/50"
                        : "bg-white/[0.08] border-white/[0.12]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200",
                        settings.useCustomKey
                          ? "left-[22px] bg-rose-300"
                          : "left-0.5 bg-white/40",
                      )}
                    />
                  </button>
                </div>

                {settings.useCustomKey && (
                  <div className="space-y-3 animate-fade-in-up">
                    <Field
                      label={
                        settings.preferredProvider === "gemini"
                          ? "Gemini API Key"
                          : settings.preferredProvider === "groq"
                          ? "Groq API Key"
                          : "OpenAI API Key"
                      }
                      hint="Stored locally, never sent to our servers"
                    >
                      <input
                        type="password"
                        value={
                          settings.preferredProvider === "gemini"
                            ? settings.customGeminiKey
                            : settings.preferredProvider === "groq"
                            ? settings.customGroqKey
                            : settings.customOpenAIKey
                        }
                        onChange={(e) =>
                          update(
                            settings.preferredProvider === "gemini"
                              ? { customGeminiKey: e.target.value }
                              : settings.preferredProvider === "groq"
                              ? { customGroqKey: e.target.value }
                              : { customOpenAIKey: e.target.value },
                          )
                        }
                        placeholder={
                          settings.preferredProvider === "gemini"
                            ? "AIzaSy..."
                            : "..."
                        }
                        className="input-glass w-full font-mono text-sm"
                      />
                    </Field>
                  </div>
                )}
              </>
            )}

            {/* ── PERSONA TAB */}
            {tab === "persona" && (
              <>
                <Field
                  label="Your name"
                  hint="Used to personalise AI responses"
                >
                  <input
                    type="text"
                    value={settings.userName}
                    onChange={(e) => update({ userName: e.target.value })}
                    placeholder="e.g. Alex"
                    className="input-glass w-full"
                  />
                </Field>

                <Field
                  label="Custom system prompt"
                  hint="Replaces the default ChitGPT persona. Leave blank for default."
                >
                  <textarea
                    value={settings.customSystemPrompt}
                    onChange={(e) =>
                      update({ customSystemPrompt: e.target.value })
                    }
                    placeholder="You are a concise coding assistant who always uses TypeScript..."
                    rows={6}
                    className="input-glass w-full resize-none text-sm"
                  />
                </Field>
              </>
            )}

            {/* ── DISPLAY TAB */}
            {tab === "display" && (
              <>
                <Field label="Font size">
                  <div className="grid grid-cols-3 gap-2">
                    {(["sm", "base", "lg"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ fontSize: s })}
                        className={cn(
                          "py-2 rounded-xl text-sm border transition-all",
                          settings.fontSize === s
                            ? "bg-rose-500/15 border-rose-500/25 text-rose-300"
                            : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]",
                        )}
                      >
                        {s === "sm"
                          ? "Small"
                          : s === "base"
                            ? "Default"
                            : "Large"}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Message spacing">
                  <div className="grid grid-cols-3 gap-2">
                    {(["compact", "comfortable", "spacious"] as const).map(
                      (d) => (
                        <button
                          key={d}
                          onClick={() => update({ messageDensity: d })}
                          className={cn(
                            "py-2 rounded-xl text-sm border transition-all capitalize",
                            settings.messageDensity === d
                              ? "bg-rose-500/15 border-rose-500/25 text-rose-300"
                              : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]",
                          )}
                        >
                          {d}
                        </button>
                      ),
                    )}
                  </div>
                </Field>

                <div className="space-y-3">
                  {[
                    {
                      key: "showTimestamps" as const,
                      label: "Show timestamps",
                      hint: "Display time under each message",
                    },
                    {
                      key: "sendOnEnter" as const,
                      label: "Enter to send",
                      hint: "Shift+Enter for new line",
                    },
                  ].map(({ key, label, hint }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]"
                    >
                      <div>
                        <p className="text-sm text-white/80">{label}</p>
                        <p className="text-xs text-white/30 mt-0.5">{hint}</p>
                      </div>
                      <button
                        onClick={() => update({ [key]: !settings[key] })}
                        className={cn(
                          "relative w-11 h-6 rounded-full border transition-all duration-200",
                          settings[key]
                            ? "bg-rose-500/40 border-rose-500/50"
                            : "bg-white/[0.08] border-white/[0.12]",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200",
                            settings[key]
                              ? "left-[22px] bg-rose-300"
                              : "left-0.5 bg-white/40",
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => {
                settings.resetSettings();
                setSaved(false);
              }}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset defaults
            </button>
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                saved
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-white text-black hover:bg-gray-200",
              )}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
