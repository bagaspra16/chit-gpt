"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  creator_email: string;
  created_at: string;
}

type AnnouncementType = "info" | "warning" | "update" | "maintenance";

interface AnnouncementsResponse {
  data: {
    announcements: Announcement[];
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

const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  update: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  update: <RefreshCw className="w-4 h-4" />,
  maintenance: <AlertTriangle className="w-4 h-4" />,
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    type: "info" as AnnouncementType,
  });

  const fetchAnnouncements = React.useCallback(() => {
    setLoading(true);
    api
      .get<AnnouncementsResponse>("/admin/announcements")
      .then((r) => setAnnouncements(r.data.data.announcements))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setCreating(true);
    try {
      await api.post("/admin/announcements", form);
      setForm({ title: "", content: "", type: "info" });
      setShowForm(false);
      fetchAnnouncements();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to create"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/announcements/${id}`, { is_active: !isActive });
      fetchAnnouncements();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to toggle"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to delete"));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Announcements</h1>
          <p className="text-sm text-white/40 mt-1">
            Create and manage notices for users
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            showForm
              ? "bg-white/[0.06] text-white/70 border border-white/[0.1]"
              : "bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20",
          )}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> New Announcement
            </>
          )}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4 animate-fade-in-up">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Announcement title..."
            className="input-glass w-full"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write the announcement content..."
            rows={4}
            className="input-glass w-full resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AnnouncementType })
              }
              className="input-glass text-sm"
            >
              <option value="info" className="bg-[#0d0d16]">Info</option>
              <option value="warning" className="bg-[#0d0d16]">Warning</option>
              <option value="update" className="bg-[#0d0d16]">Update</option>
              <option value="maintenance" className="bg-[#0d0d16]">Maintenance</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-all"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <Megaphone className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/30">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                        typeColors[a.type],
                      )}
                    >
                      {typeIcons[a.type]}
                      {a.type}
                    </span>
                    {!a.is_active && (
                      <span className="text-[10px] text-white/20 uppercase">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white/90">{a.title}</h3>
                  <p className="text-sm text-white/50 whitespace-pre-wrap">
                    {a.content}
                  </p>
                  <p className="text-[10px] text-white/20">
                    {format(new Date(a.created_at), "PPpp")} &middot; by{" "}
                    {a.creator_email || "System"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(a.id, a.is_active)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors"
                    title={a.is_active ? "Deactivate" : "Activate"}
                  >
                    {a.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
