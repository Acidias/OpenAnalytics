"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3, Globe, Users, MousePointerClick, Activity,
  Layers, Target, Zap, Monitor, MapPin, Settings, ArrowLeft, Home, BookOpen, Sparkles, LogOut
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

export function DashboardSidebar() {
  const pathname = usePathname();

  // Extract siteId from path
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  const siteId = match?.[1];
  const nav = siteId ? siteNav(siteId) : mainNav;

  return (
    <aside className="flex flex-col w-64 border-r bg-card min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">OpenAnalytics</span>
        </Link>
      </div>

      {siteId && (
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
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
