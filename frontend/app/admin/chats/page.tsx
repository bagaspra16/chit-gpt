"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Search,
  Trash2,
  Loader2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface Chat {
  id: string;
  title: string;
  user_email: string;
  user_id: string;
  message_count: string;
  created_at: string;
  updated_at: string;
}

interface ChatsResponse {
  data: {
    chats: Chat[];
  };
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const apiError = error as ApiErrorShape;
    return apiError.response?.data?.message || fallback;
  }

  return fallback;
};

export default function AdminChats() {
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const fetchChats = React.useCallback(() => {
    setLoading(true);
    api
      .get<ChatsResponse>("/admin/chats", {
        params: { page, limit: 20, search: search || undefined },
      })
      .then((r) => setChats(r.data.data.chats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  React.useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleDelete = async (chatId: string) => {
    if (!confirm("Delete this chat and all its messages?")) return;
    try {
      await api.delete(`/admin/chats/${chatId}`);
      fetchChats();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to delete chat"));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Chats & Messages</h1>
        <p className="text-sm text-white/40 mt-1">
          Browse and manage all user conversations
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search chats..."
          className="input-glass w-full pl-9"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-white/30" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No chats found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/[0.06]">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Messages</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.04] text-white/70 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/chats/${c.id}`}
                        className="flex items-center gap-2 hover:text-white/90 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        <span className="truncate max-w-[250px]">
                          {c.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white/50 text-xs">
                      {c.user_email || "Guest"}
                    </td>
                    <td className="px-5 py-3 text-white/50">
                      {c.message_count}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs">
                      {format(new Date(c.updated_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/chats/${c.id}`}
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors text-xs"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1 rounded hover:bg-white/[0.08] text-white/40 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/50">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="p-1 rounded hover:bg-white/[0.08] text-white/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
