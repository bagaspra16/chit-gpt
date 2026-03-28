"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Zap,
  Gauge,
  Megaphone,
  Mail,
  Heart,
  LogOut,
  Sparkles,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/chats", label: "Chats & Messages", icon: MessageSquare },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Zap },
  { href: "/admin/rate-limits", label: "Rate Limits", icon: Gauge },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/email", label: "Email Blast", icon: Mail },
  { href: "/admin/about", label: "About Developer", icon: Heart },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (!user?.is_admin) {
      router.replace("/chat");
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || !user?.is_admin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080810]">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#080810] text-white overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0a12] z-50",
          "fixed lg:relative top-0 left-0 bottom-0 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="font-semibold text-white/90 text-sm tracking-wide">
              ChitGPT
            </span>
            <span className="block text-[10px] text-amber-400/70 font-medium uppercase tracking-widest">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                  active
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] space-y-1">
          <Link
            href="/chat"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/auth");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white/70">Admin Panel</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
