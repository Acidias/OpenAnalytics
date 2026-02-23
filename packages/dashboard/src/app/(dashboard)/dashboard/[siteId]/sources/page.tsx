"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Share2, Users } from "lucide-react";

interface ReferrerRow {
  referrer: string;
  visits: number;
  visitors: number;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SourcesPage() {
  const { siteId } = useParams();
  const [referrers, setReferrers] = useState<ReferrerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setReferrers(null);
    api.analytics
      .sources(siteId as string, `period=${period}`)
      .then((data) => setReferrers((data as { referrers: ReferrerRow[] }).referrers))
      .catch(() => setError("Failed to load sources"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!referrers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
        <div className="rounded-lg border bg-card animate-pulse">
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rows = referrers.map((r) => ({
    source: r.referrer,
    hostname: extractHostname(r.referrer),
    visitors: Number(r.visitors),
  }));

  const totalSources = rows.length;
  const totalVisitors = rows.reduce((sum, r) => sum + r.visitors, 0);
  const maxVisitors = Math.max(...rows.map((r) => r.visitors), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Sources
            </span>
            <Share2 className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatNumber(totalSources)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Visitors
            </span>
            <Users className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatNumber(totalVisitors)}</p>
        </div>
      </div>

      {/* Sources List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">All Sources</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No referrer data yet
              </p>
            )}
            {rows.map((r) => {
              const pct = maxVisitors > 0 ? (r.visitors / maxVisitors) * 100 : 0;
              const percentage = totalVisitors > 0
                ? ((r.visitors / totalVisitors) * 100).toFixed(1)
                : "0.0";
              return (
                <div key={r.source} className="group relative">
                  <div
                    className="absolute inset-0 rounded bg-violet-500/8 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between py-1.5 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${r.hostname}&sz=32`}
                        alt=""
                        className="h-4 w-4 rounded-sm flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-sm truncate">{r.hostname}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm tabular-nums text-muted-foreground font-medium">
                        {r.visitors.toLocaleString()}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground/70 w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
