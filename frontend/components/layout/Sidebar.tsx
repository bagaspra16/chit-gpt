"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useChatStore } from "@/lib/store/chat.store";
import { useLoadingStore } from "@/lib/store/loading.store";
import { useUIStore } from "@/lib/store/ui.store";
import {
  MessageSquarePlus,
  LogOut,
  Loader2,
  Sparkles,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { SettingsModal } from "@/components/ui/SettingsModal";
import type { Chat } from "@/lib/store/chat.store";

/* ── helpers ──────────────────────────────────────────────── */
function groupChats(chats: Chat[]): Record<string, Chat[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const week = new Date(today);
  week.setDate(today.getDate() - 7);
  const month = new Date(today);
  month.setDate(today.getDate() - 30);

  const groups: Record<string, Chat[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    "Last 30 days": [],
    Older: [],
  };

  for (const chat of chats) {
    const d = new Date(chat.updated_at);
    if (d >= today) groups["Today"].push(chat);
    else if (d >= yesterday) groups["Yesterday"].push(chat);
    else if (d >= week) groups["Last 7 days"].push(chat);
    else if (d >= month) groups["Last 30 days"].push(chat);
    else groups["Older"].push(chat);
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([, v]) => v.length > 0),
  );
}

/* ── ChatItem ─────────────────────────────────────────────── */
const ChatItem: React.FC<{
  chat: Chat;
  isActive: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSwitchLoading: () => void;
}> = React.memo(({ chat, isActive, onDelete, onRename, onSwitchLoading }) => {
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [draft, setDraft] = React.useState(chat.title);
  const [hovered, setHovered] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      setDraft(chat.title);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, chat.title]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== chat.title) onRename(chat.id, trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setDeleting(false);
      }}
      className={cn(
        "group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer",
        isActive
          ? "bg-rose-500/10 border border-rose-500/20 text-white"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80 border border-transparent",
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-white/90 text-sm min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Link
          href={`/chat/${chat.id}`}
          className="flex-1 truncate min-w-0"
          onClick={() => {
            if (!isActive) onSwitchLoading();
            setMobileSidebarOpen(false);
          }}
        >
          {chat.title}
        </Link>
      )}

      {!editing && (hovered || isActive) && (
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onClick={(e) => e.preventDefault()}
        >
          {deleting ? (
            <>
              <span className="text-[10px] text-red-400 mr-1">Delete?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
                className="p-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(false);
                }}
                className="p-1 rounded-md hover:bg-white/[0.08] text-white/40 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="p-1 rounded-md hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors"
                title="Rename"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(true);
                }}
                className="p-1 rounded-md hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});
ChatItem.displayName = "ChatItem";

/* ── Sidebar ──────────────────────────────────────────────── */
export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const {
    chats,
    setChats,
    addChat,
    removeChat,
    updateChatTitle,
    activeChatId,
    clearActiveChat,
  } = useChatStore();
  const { startLoading, stopLoading } = useLoadingStore();

  const [isCreating, setIsCreating] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    api
      .get("/chats")
      .then((r) => {
        if (mounted) setChats(r.data.data.chats);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, setChats]);

  const handleNewChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    startLoading("newChat");
    try {
      const res = await api.post("/chats", { title: "New Chat" });
      const chat = res.data.data.chat;
      addChat(chat);
      clearActiveChat();
      router.push(`/chat/${chat.id}`);
      setMobileSidebarOpen(false);
      // stopLoading is called automatically by AppShell pathname watcher
    } catch (e) {
      console.error(e);
      stopLoading(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    startLoading("deleting");
    try {
      await api.delete(`/chats/${id}`);
      removeChat(id);
      if (pathname === `/chat/${id}`) {
        clearActiveChat();
        router.push("/chat");
        // stopLoading via pathname watcher
      } else {
        stopLoading(true);
      }
    } catch (e) {
      console.error(e);
      stopLoading(true);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await api.put(`/chats/${id}`, { title });
      updateChatTitle(id, title);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchLoading = React.useCallback(() => {
    startLoading("switching");
  }, [startLoading]);

  const filtered = React.useMemo(
    () =>
      query.trim()
        ? chats.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()),
          )
        : chats,
    [chats, query],
  );

  const grouped = React.useMemo(() => groupChats(filtered), [filtered]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "glass-subtle h-full w-[17rem] flex-shrink-0 flex flex-col border-r border-white/[0.06] rounded-none z-50",
          "absolute md:relative top-0 left-0 bottom-0",
          "transition-transform duration-300 ease-in-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-semibold text-white/90 tracking-wide text-[15px]">
            ChitGPT
          </span>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={handleNewChat}
            disabled={isCreating}
            className={cn(
              "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl",
              "bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30",
              "text-rose-300 hover:text-rose-200 text-sm font-medium transition-all duration-150 pressable",
            )}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="w-4 h-4" />
            )}
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="input-glass w-full pl-8 py-2 text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6 text-white/20">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-xs text-white/25 px-2 py-3 text-center italic">
              {query
                ? "No chats match your search."
                : "No chats yet. Start one above!"}
            </p>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-2 mb-1.5">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {items.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={
                        pathname === `/chat/${chat.id}` ||
                        activeChatId === chat.id
                      }
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onSwitchLoading={handleSwitchLoading}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.05] space-y-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          {user?.is_admin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/[0.05] transition-all"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-rose-300 font-bold">
                  {user?.is_guest
                    ? "G"
                    : (user?.email?.[0]?.toUpperCase() ?? "U")}
                </span>
              </div>
              <span className="text-xs text-white/40 truncate group-hover:text-white/60 transition-colors">
                {user?.is_guest ? "Guest Session" : user?.email}
              </span>
            </div>
            <button
              onClick={() => {
                startLoading("logout");
                logout();
                router.push("/auth");
              }}
              className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
