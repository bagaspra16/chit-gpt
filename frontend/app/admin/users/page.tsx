"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Search,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface User {
  id: string;
  email: string | null;
  is_guest: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  chat_count: string;
  message_count: string;
}

interface UserDetail extends User {
  updated_at?: string;
}

interface UserAIUsage {
  provider: string;
  model: string;
  count: number;
  tokens_in: number;
  tokens_out: number;
}

interface RecentChat {
  id: string;
  title: string;
}

interface SelectedUser {
  user: UserDetail;
  aiUsage: UserAIUsage[];
  recentChats: RecentChat[];
}

interface UsersResponse {
  data: {
    users: User[];
    total: number;
  };
}

interface UserDetailResponse {
  data: SelectedUser;
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

export default function AdminUsers() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState<SelectedUser | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = React.useState(false);

  const limit = 20;

  const fetchUsers = React.useCallback(() => {
    setLoading(true);
    api
      .get<UsersResponse>("/admin/users", {
        params: { page, limit, search: search || undefined },
      })
      .then((r) => {
        setUsers(r.data.data.users);
        setTotal(r.data.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-admin`);
      fetchUsers();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to toggle admin"));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to delete user"));
    }
  };

  const viewDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const r = await api.get<UserDetailResponse>(`/admin/users/${userId}`);
      setSelectedUser(r.data.data);
    } catch {
      alert("Failed to load user detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Users</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email..."
          className="input-glass w-full pl-9"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-white/30" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/[0.06]">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Chats</th>
                  <th className="px-5 py-3">Messages</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.04] text-white/70 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {u.is_verified ? (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <UserX className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">
                          {u.email || "Guest"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                          u.is_guest
                            ? "bg-white/[0.06] text-white/40"
                            : "bg-blue-500/10 text-blue-400",
                        )}
                      >
                        {u.is_guest ? "Guest" : "Registered"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_admin ? (
                        <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">User</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-white/50">
                      {u.chat_count}
                    </td>
                    <td className="px-5 py-3 text-white/50">
                      {u.message_count}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => viewDetail(u.id)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!u.is_guest && (
                          <button
                            onClick={() => handleToggleAdmin(u.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-white/30 hover:text-amber-400 transition-colors"
                            title={
                              u.is_admin
                                ? "Remove admin"
                                : "Make admin"
                            }
                          >
                            {u.is_admin ? (
                              <ShieldOff className="w-3.5 h-3.5" />
                            ) : (
                              <Shield className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                          title="Delete user"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-white/30">
              {total} users total
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded hover:bg-white/[0.08] text-white/40 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/50">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded hover:bg-white/[0.08] text-white/40 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-raised rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold text-white/90">User Detail</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-white/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
              </div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider">
                    Profile
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Email:</strong>{" "}
                    {selectedUser.user.email || "N/A"}
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Guest:</strong>{" "}
                    {selectedUser.user.is_guest ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Admin:</strong>{" "}
                    {selectedUser.user.is_admin ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Joined:</strong>{" "}
                    {format(
                      new Date(selectedUser.user.created_at),
                      "PPpp",
                    )}
                  </p>
                </div>

                {selectedUser.aiUsage.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 uppercase tracking-wider">
                      AI Usage
                    </p>
                    {selectedUser.aiUsage.map((usage, index) => (
                      <p key={`${usage.provider}-${usage.model}-${index}`} className="text-sm text-white/70">
                        {usage.provider} / {usage.model}: {usage.count} requests
                        (tokens: {usage.tokens_in} in / {usage.tokens_out} out)
                      </p>
                    ))}
                  </div>
                )}

                {selectedUser.recentChats.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 uppercase tracking-wider">
                      Recent Chats
                    </p>
                    {selectedUser.recentChats.map((chat) => (
                      <p key={chat.id} className="text-sm text-white/70 truncate">
                        {chat.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
