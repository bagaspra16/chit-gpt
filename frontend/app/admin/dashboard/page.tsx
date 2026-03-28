"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Users,
  MessageSquare,
  MessageCircle,
  Zap,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalAiRequests: number;
  activeUsersWeek: number;
}

interface ProviderBreakdown {
  provider: string;
  count: string;
  total_tokens_in: string;
  total_tokens_out: string;
}

interface ActivityDay {
  date: string;
  messages: string;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="glass rounded-2xl p-5 space-y-3">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white/90">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [providers, setProviders] = React.useState<ProviderBreakdown[]>([]);
  const [activity, setActivity] = React.useState<ActivityDay[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((r) => {
        const d = r.data.data;
        setStats(d.stats);
        setProviders(d.providerBreakdown || []);
        setActivity(d.activityByDay || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-white/40 py-20">
        Failed to load dashboard data
      </div>
    );
  }

  const maxMessages = Math.max(...activity.map((a) => parseInt(a.messages, 10)), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">
          Overview of your ChitGPT platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-500/10 border border-blue-500/20"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Active (7 days)"
          value={stats.activeUsersWeek}
          color="bg-emerald-500/10 border border-emerald-500/20"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-violet-400" />}
          label="Total Chats"
          value={stats.totalChats}
          color="bg-violet-500/10 border border-violet-500/20"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5 text-rose-400" />}
          label="Total Messages"
          value={stats.totalMessages}
          color="bg-rose-500/10 border border-rose-500/20"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          label="AI Requests"
          value={stats.totalAiRequests}
          color="bg-amber-500/10 border border-amber-500/20"
        />
      </div>

      {/* Provider Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
          AI Provider Usage
        </h2>
        {providers.length === 0 ? (
          <p className="text-sm text-white/30">No AI usage data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/[0.06]">
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Requests</th>
                  <th className="pb-3 pr-4">Tokens In</th>
                  <th className="pb-3">Tokens Out</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr
                    key={p.provider}
                    className="border-b border-white/[0.04] text-white/70"
                  >
                    <td className="py-3 pr-4 capitalize font-medium">
                      {p.provider}
                    </td>
                    <td className="py-3 pr-4">
                      {parseInt(p.count, 10).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      {parseInt(p.total_tokens_in, 10).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {parseInt(p.total_tokens_out, 10).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
          Message Activity (30 days)
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-white/30">No activity data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {activity.map((day) => {
              const count = parseInt(day.messages, 10);
              const height = Math.max((count / maxMessages) * 100, 4);
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${day.date}: ${count} messages`}
                >
                  <div
                    className="w-full rounded-t bg-amber-500/40 hover:bg-amber-500/60 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-2 text-[10px] text-white/20">
          <span>{activity[0]?.date || ""}</span>
          <span>{activity[activity.length - 1]?.date || ""}</span>
        </div>
      </div>
    </div>
  );
}
