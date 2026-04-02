"use client";
import * as React from "react";
import { useChatStore } from "@/lib/store/chat.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import api, { API_URL } from "@/lib/api";
import { parseStream } from "@/lib/streaming";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { StreamingIndicator } from "./StreamingIndicator";
import { ChatHeader } from "./ChatHeader";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  chatId: string;
}

export const ChatWindow: React.FC<Props> = ({ chatId }) => {
  const {
    messages,
    setMessages,
    addMessage,
    updateLastMessage,
    isStreaming,
    setIsStreaming,
    abortController,
    setAbortController,
    setActiveChat,
    updateChatTitle,
    chats,
  } = useChatStore();

  const token = useAuthStore((s) => s.token);

  const {
    useCustomKey,
    customGeminiKey,
    customOpenAIKey,
    customGroqKey,
    preferredProvider,
    preferredModel,
    customSystemPrompt,
    userName,
    messageDensity,
    fontSize,
  } = useSettingsStore();

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isUserScrolling = React.useRef(false);

  // Current chat title from store
  const chatTitle = React.useMemo(
    () => chats.find((c) => c.id === chatId)?.title ?? "New Chat",
    [chats, chatId],
  );

  // Fetch history
  React.useEffect(() => {
    setActiveChat(chatId);
    let live = true;
    api
      .get(`/chats/${chatId}/messages`)
      .then((r) => {
        if (live) setMessages(r.data.data.messages || []);
      })
      .catch(console.error);
    return () => {
      live = false;
    };
  }, [chatId, setActiveChat, setMessages]);

  // Auto-scroll
  const scrollToBottom = React.useCallback(() => {
    if (!isUserScrolling.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
    isUserScrolling.current = !atBottom;
  }, []);

  /* ── Send message ─────────────────────────────────────── */
  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Optimistic user message
    addMessage({
      id: `tmp_${Date.now()}`,
      role: "user",
      content,
      chat_id: chatId,
      created_at: new Date().toISOString(),
    });
    setIsStreaming(true);
    isUserScrolling.current = false;

    const ctrl = new AbortController();
    setAbortController(ctrl);

    // Resolve custom key (LocalAI is free/self-hosted — no key required)
    const customApiKey =
      useCustomKey && preferredProvider !== "localai"
        ? preferredProvider === "gemini"
          ? customGeminiKey || undefined
          : preferredProvider === "groq"
          ? customGroqKey || undefined
          : customOpenAIKey || undefined
        : undefined;

    // Build extra system prompt suffix if userName set
    const systemSuffix = userName ? `\n\nThe user's name is ${userName}.` : "";
    const systemPrompt = customSystemPrompt
      ? customSystemPrompt + systemSuffix
      : undefined;

    try {
      const response = await fetch(
        `${API_URL}/chats/${chatId}/messages/stream`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            ...(customApiKey && { customApiKey }),
            ...(preferredProvider && { aiProvider: preferredProvider }),
            ...(preferredModel && { model: preferredModel }),
            ...(systemPrompt && { systemPrompt }),
          }),
        },
      );

      if (!response.ok) throw new Error("Stream request failed");

      // Optimistic assistant message
      addMessage({
        id: `stream_${Date.now()}`,
        role: "assistant",
        content: "",
        chat_id: chatId,
        created_at: new Date().toISOString(),
      });

      await parseStream(response, (event) => {
        if (event.type === "chunk" && event.content) {
          updateLastMessage(event.content);
        } else if (event.type === "done") {
          // Sync auto-renamed title into sidebar
          if (event.titleUpdate) {
            updateChatTitle(chatId, event.titleUpdate);
          }
        } else if (event.type === "error") {
          updateLastMessage(`\n\n*${event.message}*`);
        }
      });
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        addMessage({
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          chat_id: chatId,
          created_at: new Date().toISOString(),
        });
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  /* ── Stop generation ──────────────────────────────────── */
  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    setAbortController(null);
  };

  /* ── Regenerate ───────────────────────────────────────── */
  const handleRegenerate = async () => {
    // Find the last user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Remove the last assistant message and re-send
    const withoutLast = messages.filter((_, i) => i < messages.length - 1);
    setMessages(withoutLast);
    await handleSend(lastUser.content);
  };

  const isAwaitingChunk =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  const densityClass = `density-${messageDensity}`;
  const fontClass = `text-fs-${fontSize}`;

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header */}
      <ChatHeader chatId={chatId} title={chatTitle} />

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-36 scroll-smooth"
      >
        <div
          className={cn(
            "max-w-3xl mx-auto w-full flex flex-col min-h-full",
            densityClass,
            fontClass,
          )}
        >
          {messages.length === 0 && !isStreaming && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-rose-400/70" />
              </div>
              <div>
                <h3 className="text-white/60 font-medium text-lg">
                  How can I help?
                </h3>
                <p className="text-white/25 text-sm mt-1">
                  Ask me anything — I remember this conversation.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || idx}
              role={msg.role}
              content={msg.content}
              createdAt={msg.created_at}
              isStreaming={isStreaming && idx === messages.length - 1}
              isLast={idx === messages.length - 1}
              onRegenerate={handleRegenerate}
            />
          ))}

          {isAwaitingChunk && (
            <div className="flex justify-start mb-4 pl-10">
              <StreamingIndicator />
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input — fixed to bottom of flex column */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080810] via-[#080810]/90 to-transparent pt-12 pb-2">
        <InputBar
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
};
