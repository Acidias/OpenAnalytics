"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3, Globe, Users, MousePointerClick, Activity,
  Layers, Target, Zap, Monitor, MapPin, Settings, ArrowLeft, Home, BookOpen, Sparkles, LogOut, UserPlus
} from "lucide-react";
import { logout } from "@/lib/auth";

const mainNav = [
  { label: "Sites", href: "/dashboard", icon: Home },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Setup Guide", href: "/setup", icon: BookOpen },
];

function siteNav(siteId: string) {
  return [
    { label: "Overview", href: `/dashboard/${siteId}`, icon: BarChart3 },
    { label: "Pages", href: `/dashboard/${siteId}/pages`, icon: Layers },
    { label: "Sessions", href: `/dashboard/${siteId}/sessions`, icon: Users },
    { label: "Events", href: `/dashboard/${siteId}/events`, icon: MousePointerClick },
    { label: "Funnels", href: `/dashboard/${siteId}/funnels`, icon: Target },
    { label: "Goals", href: `/dashboard/${siteId}/goals`, icon: Target },
    { label: "Live", href: `/dashboard/${siteId}/live`, icon: Zap },
    { label: "Sources", href: `/dashboard/${siteId}/sources`, icon: Globe },
    { label: "Geography", href: `/dashboard/${siteId}/geo`, icon: MapPin },
    { label: "Devices", href: `/dashboard/${siteId}/devices`, icon: Monitor },
    { label: "AI Setup", href: `/dashboard/${siteId}/ai-setup`, icon: Sparkles },
    { label: "Settings", href: `/dashboard/${siteId}/settings`, icon: Settings },
  ];
}

// Nav items hidden in demo mode (require auth)
const demoHiddenLabels = new Set(["Settings", "Setup Guide", "AI Setup"]);

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(!!sessionStorage.getItem("demo_site_id"));
  }, []);

  // Extract siteId from path
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  const siteId = match?.[1];
  const allNav = siteId ? siteNav(siteId) : mainNav;
  const nav = isDemoMode ? allNav.filter((item) => !demoHiddenLabels.has(item.label)) : allNav;

  return (
    <aside className="flex flex-col w-64 border-r bg-card min-h-screen">
      <div className="p-6">
        <Link href={isDemoMode ? pathname : "/dashboard"} className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">OpenAnalytics</span>
        </Link>
      </div>

      {isDemoMode && (
        <div className="mx-4 mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Demo Mode</span>
        </div>
      )}

      {siteId && !isDemoMode && (
        <div className="px-4 mb-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            All Sites
          </Link>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href || (siteId && pathname.startsWith(item.href) && item.href !== `/dashboard/${siteId}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        {isDemoMode ? (
          <Link
            href="/login"
            onClick={() => sessionStorage.removeItem("demo_site_id")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
          >
            <UserPlus className="h-4 w-4" />
            Sign up for free
          </Link>
        ) : (
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
