"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Loader2, ChevronLeft, User, Bot } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatInfo {
  title: string;
  email: string;
}

export default function AdminChatDetail({
  params,
}: {
  params: { chatId: string };
}) {
  const [chat, setChat] = React.useState<ChatInfo | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get(`/admin/chats/${params.chatId}/messages`)
      .then((r) => {
        setChat(r.data.data.chat);
        setMessages(r.data.data.messages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.chatId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/chats"
          className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white/90">
            {chat?.title || "Chat"}
          </h1>
          <p className="text-sm text-white/40">
            {chat?.email || "Guest"} &middot; {messages.length} messages
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-rose-500/10 border border-rose-500/15 text-white/80"
                  : "bg-white/[0.04] border border-white/[0.06] text-white/70",
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {msg.role === "user" ? (
                  <User className="w-3 h-3 text-rose-400" />
                ) : (
                  <Bot className="w-3 h-3 text-indigo-400" />
                )}
                <span className="text-[10px] text-white/30">
                  {format(new Date(msg.created_at), "MMM d, HH:mm:ss")}
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            No messages in this chat
          </div>
        )}
      </div>
    </div>
  );
}
