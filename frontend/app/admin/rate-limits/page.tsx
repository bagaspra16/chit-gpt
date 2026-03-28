"use client";

import * as React from "react";
import api from "@/lib/api";
import { Loader2, Gauge, Check, AlertTriangle } from "lucide-react";

interface RateLimit {
  windowMs: number;
  max: number;
  label: string;
}

interface Limits {
  api: RateLimit;
  auth: RateLimit;
  message: RateLimit;
}

interface RateLimitsResponse {
  data: {
    limits: Limits;
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

export default function AdminRateLimits() {
  const [limits, setLimits] = React.useState<Limits | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [form, setForm] = React.useState({
    api_max: 1000,
    auth_max: 100,
    message_max: 30,
  });

  React.useEffect(() => {
    api
      .get<RateLimitsResponse>("/admin/rate-limits")
      .then((r) => {
        const l = r.data.data.limits;
        setLimits(l);
        setForm({
          api_max: l.api.max,
          auth_max: l.auth.max,
          message_max: l.message.max,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/admin/rate-limits", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  const formatWindow = (ms: number) => {
    if (ms >= 60000) return `${ms / 60000} min`;
    return `${ms / 1000} sec`;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Rate Limits</h1>
        <p className="text-sm text-white/40 mt-1">
          Configure API rate limiting thresholds
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-amber-400/80 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Changes require server restart to take effect</span>
        </div>

        {/* General API */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            General API — max requests per {formatWindow(limits!.api.windowMs)}
          </label>
          <input
            type="number"
            value={form.api_max}
            onChange={(e) =>
              setForm({ ...form, api_max: parseInt(e.target.value, 10) || 0 })
            }
            className="input-glass w-full"
          />
        </div>

        {/* Auth */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-violet-400" />
            Auth — max requests per {formatWindow(limits!.auth.windowMs)}
          </label>
          <input
            type="number"
            value={form.auth_max}
            onChange={(e) =>
              setForm({ ...form, auth_max: parseInt(e.target.value, 10) || 0 })
            }
            className="input-glass w-full"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-rose-400" />
            Message Streaming — max requests per{" "}
            {formatWindow(limits!.message.windowMs)}
          </label>
          <input
            type="number"
            value={form.message_max}
            onChange={(e) =>
              setForm({
                ...form,
                message_max: parseInt(e.target.value, 10) || 0,
              })
            }
            className="input-glass w-full"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-4 h-4" /> Saved
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
