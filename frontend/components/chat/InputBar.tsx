"use client";
import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settings.store";

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export const InputBar: React.FC<Props> = ({
  onSend,
  onStop,
  disabled,
  isStreaming,
}) => {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { sendOnEnter } = useSettingsStore();

  const canSend = input.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && sendOnEnter) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const charCount = input.length;
  const nearLimit = charCount > 18000;

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6">
      <div
        className={cn(
          "relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-200",
          "glass border border-white/[0.1]",
          "focus-within:border-white/[0.18] focus-within:bg-white/[0.04]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming ? "ChitGPT is responding…" : "Message ChitGPT…"
          }
          disabled={disabled && !isStreaming}
          className={cn(
            "flex-1 bg-transparent text-white/90 placeholder:text-white/20 resize-none outline-none",
            "px-3 py-2.5 min-h-[46px] max-h-[200px] text-[15px] leading-relaxed",
            "disabled:opacity-50",
          )}
          rows={1}
        />

        {/* Stop / Send button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className={cn(
              "flex-shrink-0 mb-1 w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-red-500/15 border border-red-500/25 text-red-400",
              "hover:bg-red-500/25 transition-all pressable",
            )}
            title="Stop generating"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "flex-shrink-0 mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all pressable",
              canSend
                ? "bg-white text-black hover:bg-gray-100 shadow-sm"
                : "bg-white/[0.06] text-white/20 cursor-not-allowed",
            )}
            title="Send message"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-[11px] text-white/20">
          {sendOnEnter
            ? "Enter to send · Shift+Enter for new line"
            : "Shift+Enter to send"}
        </p>
        {nearLimit && (
          <p
            className={cn(
              "text-[11px]",
              charCount > 19500 ? "text-red-400" : "text-yellow-400/70",
            )}
          >
            {charCount.toLocaleString()} / 20,000
          </p>
        )}
      </div>
    </div>
  );
};
