"use client";
import * as React from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";

import api from "@/lib/api";
import { useChatStore } from "@/lib/store/chat.store";
import { useRouter } from "next/navigation";

interface Props {
  chatId: string;
  title: string;
}

export const ChatHeader: React.FC<Props> = ({ chatId, title }) => {
  const { updateChatTitle, removeChat, clearActiveChat } = useChatStore();
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep draft in sync when title changes (e.g. auto-rename after first message)
  React.useEffect(() => {
    setDraft(title);
  }, [title]);

  React.useEffect(() => {
    if (editing)
      setTimeout(() => {
        inputRef.current?.select();
      }, 0);
  }, [editing]);

  const commitRename = async () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === title) return;
    try {
      await api.put(`/chats/${chatId}`, { title: trimmed });
      updateChatTitle(chatId, trimmed);
    } catch {
      setDraft(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setDraft(title);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this chat and all its messages?")) return;
    try {
      await api.delete(`/chats/${chatId}`);
      removeChat(chatId);
      clearActiveChat();
      router.push("/chat");
    } catch {
      console.error("Failed to delete chat");
    }
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-white/90 font-medium text-sm border-b border-rose-500/50 pb-0.5"
          />
        ) : (
          <h2 className="text-sm font-medium text-white/80 truncate">
            {title}
          </h2>
        )}

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all flex-shrink-0"
            title="Rename chat"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={commitRename}
              className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setDraft(title);
                setEditing(false);
              }}
              className="p-1 rounded-md text-white/30 hover:bg-white/[0.06]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
