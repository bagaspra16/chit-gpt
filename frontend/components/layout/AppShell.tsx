"use client";

import * as React from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import { useLoadingStore } from "@/lib/store/loading.store";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { fontSize, messageDensity } = useSettingsStore();
  const { stopLoading } = useLoadingStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  // Mark hydration complete once on mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auth guard — only runs after hydration to avoid redirecting on stale state
  // Excluded routes: /auth (login page) and / (landing page — public)
  React.useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !pathname.startsWith("/auth") && pathname !== "/") {
      router.replace("/auth");
    }
  }, [mounted, isAuthenticated, pathname, router]);

  // ── Loading stop on navigation completion ──────────────────
  // Every time the pathname changes it means Next.js finished navigating.
  // We tell the loading store the real work is done; it will respect the
  // minimum random display window before hiding the overlay.
  const prevPathname = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!mounted) return;

    // Skip the very first run (initial mount — no navigation happened yet)
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }

    // Only fire when the pathname actually changed
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      stopLoading();
    }
  }, [pathname, mounted, stopLoading]);

  if (!mounted) return null;

  const fontClass = `text-fs-${fontSize}`;
  const densityClass = `density-${messageDensity}`;

  // Landing page and auth pages render without shell (no sidebar)
  // Admin pages have their own layout
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/admin") || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "flex h-[100dvh] w-full overflow-hidden",
        fontClass,
        densityClass,
      )}
    >
      <Sidebar />
      <main className="flex-1 relative h-full flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
