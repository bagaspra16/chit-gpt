"use client";

import * as React from "react";
import api from "@/lib/api";
import { Loader2, Zap, Clock, Hash } from "lucide-react";

interface DailyUsage {
  date: string;
  provider: string;
  requests: string;
  tokens_in: string;
  tokens_out: string;
  avg_latency: string;
}

interface ModelBreakdown {
  model: string;
  provider: string;
  requests: string;
  total_tokens: string;
}

interface Totals {
  total_requests: string;
  total_tokens_in: string;
  total_tokens_out: string;
  avg_latency: string;
}

export default function AdminAiUsage() {
  const [daily, setDaily] = React.useState<DailyUsage[]>([]);
  const [models, setModels] = React.useState<ModelBreakdown[]>([]);
  const [totals, setTotals] = React.useState<Totals | null>(null);
  const [days, setDays] = React.useState(30);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    api
      .get("/admin/ai-usage", { params: { days } })
      .then((r) => {
        setDaily(r.data.data.dailyUsage);
        setModels(r.data.data.modelBreakdown);
        setTotals(r.data.data.totals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">AI Usage</h1>
          <p className="text-sm text-white/40 mt-1">
            Track AI provider usage, tokens, and latency
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="input-glass text-sm"
        >
          <option value={7} className="bg-[#0d0d16]">Last 7 days</option>
          <option value={30} className="bg-[#0d0d16]">Last 30 days</option>
          <option value={90} className="bg-[#0d0d16]">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 space-y-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <p className="text-xl font-bold text-white/90">
              {parseInt(totals.total_requests, 10).toLocaleString()}
            </p>
            <p className="text-xs text-white/40">Total Requests</p>
          </div>
          <div className="glass rounded-2xl p-5 space-y-2">
            <Hash className="w-5 h-5 text-blue-400" />
            <p className="text-xl font-bold text-white/90">
              {parseInt(totals.total_tokens_in, 10).toLocaleString()}
            </p>
            <p className="text-xs text-white/40">Tokens In</p>
          </div>
          <div className="glass rounded-2xl p-5 space-y-2">
            <Hash className="w-5 h-5 text-violet-400" />
            <p className="text-xl font-bold text-white/90">
              {parseInt(totals.total_tokens_out, 10).toLocaleString()}
            </p>
            <p className="text-xs text-white/40">Tokens Out</p>
          </div>
          <div className="glass rounded-2xl p-5 space-y-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <p className="text-xl font-bold text-white/90">
              {totals.avg_latency}ms
            </p>
            <p className="text-xs text-white/40">Avg Latency</p>
          </div>
        </div>
      )}

      {/* Model Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
          Model Usage
        </h2>
        {models.length === 0 ? (
          <p className="text-sm text-white/30">No usage data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/[0.06]">
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Requests</th>
                  <th className="pb-3">Total Tokens</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr
                    key={`${m.provider}-${m.model}`}
                    className="border-b border-white/[0.04] text-white/70"
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{m.model}</td>
                    <td className="py-3 pr-4 capitalize">{m.provider}</td>
                    <td className="py-3 pr-4">
                      {parseInt(m.requests, 10).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {parseInt(m.total_tokens, 10).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
          Daily Breakdown
        </h2>
        {daily.length === 0 ? (
          <p className="text-sm text-white/30">No daily data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/[0.06]">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Requests</th>
                  <th className="pb-3 pr-4">Tokens In</th>
                  <th className="pb-3 pr-4">Tokens Out</th>
                  <th className="pb-3">Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d, i) => (
                  <tr
                    key={`${d.date}-${d.provider}-${i}`}
                    className="border-b border-white/[0.04] text-white/70"
                  >
                    <td className="py-2.5 pr-4 text-xs">{d.date}</td>
                    <td className="py-2.5 pr-4 capitalize">{d.provider}</td>
                    <td className="py-2.5 pr-4">{d.requests}</td>
                    <td className="py-2.5 pr-4">{d.tokens_in}</td>
                    <td className="py-2.5 pr-4">{d.tokens_out}</td>
                    <td className="py-2.5">{d.avg_latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
