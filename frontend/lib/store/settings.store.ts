import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FontSize = "sm" | "base" | "lg";
export type MessageDensity = "compact" | "comfortable" | "spacious";
export type AIProvider = "localai" | "gemini" | "openai" | "groq";

export interface SettingsState {
  // Custom API keys
  useCustomKey: boolean;
  customGeminiKey: string;
  customOpenAIKey: string;
  customGroqKey: string;
  // AI preferences
  preferredProvider: AIProvider;
  preferredModel: string;
  // Personalization
  userName: string;
  customSystemPrompt: string;
  // Display
  fontSize: FontSize;
  messageDensity: MessageDensity;
  showTimestamps: boolean;
  sendOnEnter: boolean;
  // Actions
  updateSettings: (partial: Partial<Omit<SettingsState, "updateSettings" | "resetSettings">>) => void;
  resetSettings: () => void;
}

const DEFAULTS = {
  useCustomKey: false,
  customGeminiKey: "",
  customOpenAIKey: "",
  customGroqKey: "",
  preferredProvider: "localai" as AIProvider,
  preferredModel: "",
  userName: "",
  customSystemPrompt: "",
  fontSize: "base" as FontSize,
  messageDensity: "comfortable" as MessageDensity,
  showTimestamps: false,
  sendOnEnter: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      updateSettings: (partial) => set((s) => ({ ...s, ...partial })),
      resetSettings: () => set((s) => ({ ...s, ...DEFAULTS })),
    }),
    { name: "chit-settings", storage: createJSONStorage(() => localStorage) }
  )
);
