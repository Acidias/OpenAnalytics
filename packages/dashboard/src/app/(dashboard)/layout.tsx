"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { isLoggedIn } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Allow unauthenticated access only when viewing the demo site
    const demoSiteId = sessionStorage.getItem("demo_site_id");
    const siteIdInPath = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
    if (demoSiteId && siteIdInPath === demoSiteId) {
      setChecked(true);
      return;
    }

    isLoggedIn().then((loggedIn) => {
      if (!mounted) return;
      if (!loggedIn) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
