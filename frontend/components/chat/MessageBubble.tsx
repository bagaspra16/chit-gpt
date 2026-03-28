"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check, RefreshCw, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settings.store";
import { format } from "date-fns";

interface Props {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
  isLast?: boolean;
  onRegenerate?: () => void;
}

const CopyButton: React.FC<{ text: string; className?: string }> = ({
  text,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all duration-150",
        copied
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-white/30 hover:text-white/70 hover:bg-white/[0.06]",
        className,
      )}
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

export const MessageBubble: React.FC<Props> = React.memo(
  ({ role, content, createdAt, isStreaming, isLast, onRegenerate }) => {
    const { fontSize, showTimestamps } = useSettingsStore();

    const isUser = role === "user";
    const isAssistant = role === "assistant";

    const fontClass = {
      sm: "text-fs-sm",
      base: "text-fs-base",
      lg: "text-fs-lg",
    }[fontSize];

    const timestamp = createdAt ? format(new Date(createdAt), "h:mm a") : null;

    return (
      <div
        className={cn(
          "msg-bubble flex gap-3 animate-fade-in-up group",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center self-start mt-0.5",
            isUser
              ? "bg-rose-500/20 border border-rose-500/30"
              : "bg-white/[0.06] border border-white/[0.1]",
          )}
        >
          {isUser ? (
            <User className="w-3.5 h-3.5 text-rose-300" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-white/50" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "flex flex-col gap-1.5",
            isUser ? "items-end" : "items-start",
            "max-w-[85%]",
          )}
        >
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3",
              isUser
                ? "bg-rose-500/15 border border-rose-500/20 rounded-tr-sm"
                : "bg-white/[0.04] border border-white/[0.08] rounded-tl-sm",
            )}
          >
            {/* Streaming cursor */}
            {isStreaming && isAssistant && !content && (
              <span className="inline-block w-4 h-4 rounded-sm bg-rose-400/60 animate-pulse" />
            )}

            {isAssistant ? (
              <div
                className={cn(
                  "prose-glass",
                  fontClass,
                  isStreaming && content && "cursor-blink",
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Prevent react-markdown's default <pre> from double-wrapping code blocks
                    pre({ children }) {
                      return <>{children}</>;
                    },
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeStr = String(children).replace(/\n$/, "");
                      const isBlock = codeStr.includes("\n") || !!match;
                      if (isBlock) {
                        return (
                          <div className="code-block my-3">
                            <div className="code-block-header">
                              <span>{match?.[1] || "code"}</span>
                              <CopyButton text={codeStr} />
                            </div>
                            <SyntaxHighlighter
                              style={
                                oneDark as Record<string, React.CSSProperties>
                              }
                              language={match?.[1] || "text"}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                padding: "14px 16px",
                                background: "transparent",
                                fontSize: "13px",
                                lineHeight: "1.6",
                              }}
                            >
                              {codeStr}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-rose-200 font-mono text-[0.88em]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p
                className={cn(
                  "text-white/90 whitespace-pre-wrap break-words",
                  fontClass,
                )}
              >
                {content}
              </p>
            )}
          </div>

          {/* Actions row */}
          <div
            className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            <CopyButton text={content} />
            {showTimestamps && timestamp && (
              <span className="text-[10px] text-white/20 px-1">
                {timestamp}
              </span>
            )}
            {isAssistant && isLast && !isStreaming && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                title="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);
MessageBubble.displayName = "MessageBubble";
