"use client";

import * as React from "react";
import api from "@/lib/api";
import { Loader2, Send, TestTube, Check, AlertCircle } from "lucide-react";

interface EmailBlastResult {
  sent: number;
  failed: number;
  total: number;
}

interface EmailBlastResponse {
  data: EmailBlastResult;
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

export default function AdminEmail() {
  const [subject, setSubject] = React.useState("");
  const [html, setHtml] = React.useState("");
  const [testEmail, setTestEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<EmailBlastResult | null>(null);

  const handleSend = async (isTest: boolean) => {
    if (!subject.trim() || !html.trim()) {
      alert("Subject and content are required");
      return;
    }
    if (isTest && !testEmail.trim()) {
      alert("Enter a test email address");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const r = await api.post<EmailBlastResponse>("/admin/email-blast", {
        subject,
        html: html.replace(/\n/g, "<br/>"),
        ...(isTest && { testEmail }),
      });
      setResult(r.data.data);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Email Blast</h1>
        <p className="text-sm text-white/40 mt-1">
          Send update emails to all verified users
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. ChitGPT v2.0 - New Features!"
            className="input-glass w-full"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Email Content (HTML)
          </label>
          <p className="text-xs text-white/25">
            Write the main content. Newlines will be converted to line breaks.
          </p>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Hello! We have exciting updates to share..."
            rows={10}
            className="input-glass w-full resize-none text-sm font-mono"
          />
        </div>

        {/* Test Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Test Email (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-glass flex-1"
            />
            <button
              onClick={() => handleSend(true)}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/20 transition-all"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <TestTube className="w-4 h-4" /> Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => handleSend(false)}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-all"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Send to All Users
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-xs text-amber-400/70">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>
              Sends to all verified, non-guest users
            </span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-fade-in-up">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>
              Sent: <strong>{result.sent}</strong> / {result.total} users
              {result.failed > 0 && (
                <span className="text-red-400 ml-2">
                  ({result.failed} failed)
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
