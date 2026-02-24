"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DemoEntryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/demo`)
      .then((res) => {
        if (!res.ok) throw new Error("No demo site available");
        return res.json();
      })
      .then((data: { site: { id: string } }) => {
        sessionStorage.setItem("demo_site_id", data.site.id);
        router.replace(`/dashboard/${data.site.id}`);
      })
      .catch(() => {
        setError("No demo site is available at the moment. Please try again later.");
      });
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{error}</p>
          <Link href="/" className="text-primary hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Activity className="h-10 w-10 text-primary mx-auto animate-pulse" />
        <p className="text-muted-foreground">Loading demo dashboard...</p>
      </div>
    </div>
  );
}
