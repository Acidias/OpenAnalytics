"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatsCard } from "@/components/dashboard/stats-card";
import { api } from "@/lib/api";
import { formatDuration, formatPercent, formatNumber } from "@/lib/utils";
import { FileText, Eye, Clock, ArrowDownRight } from "lucide-react";

interface PageRow {
  path: string;
  views: number;
  unique_visitors: number;
  avg_duration_ms: number | null;
  avg_scroll_pct: number | null;
}

export default function PagesPage() {
  const { siteId } = useParams();
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setPages(null);
    api.analytics
      .pages(siteId as string, `period=${period}`)
      .then((data) => setPages((data as { pages: PageRow[] }).pages))
      .catch(() => setError("Failed to load page data"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!pages) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg border bg-card animate-pulse"
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

  const rows = pages.map((p) => ({
    path: p.path,
    views: Number(p.views) || 0,
    uniqueVisitors: Number(p.unique_visitors) || 0,
    avgDuration: p.avg_duration_ms ? Math.round(Number(p.avg_duration_ms) / 1000) : 0,
    avgScroll: p.avg_scroll_pct ? Number(p.avg_scroll_pct) : 0,
  }));

  const totalPages = rows.length;
  const totalViews = rows.reduce((sum, r) => sum + r.views, 0);
  const totalDuration = rows.reduce((sum, r) => sum + r.avgDuration, 0);
  const avgDuration = totalPages > 0 ? Math.round(totalDuration / totalPages) : 0;
  const totalScroll = rows.reduce((sum, r) => sum + r.avgScroll, 0);
  const avgScroll = totalPages > 0 ? totalScroll / totalPages : 0;
  const maxViews = Math.max(...rows.map((r) => r.views), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pages"
          value={formatNumber(totalPages)}
          icon={<FileText className="h-4 w-4" />}
          color="#3b82f6"
        />
        <StatsCard
          title="Total Views"
          value={formatNumber(totalViews)}
          icon={<Eye className="h-4 w-4" />}
          color="#8b5cf6"
        />
        <StatsCard
          title="Avg. Duration"
          value={formatDuration(avgDuration)}
          icon={<Clock className="h-4 w-4" />}
          color="#06b6d4"
        />
        <StatsCard
          title="Avg. Scroll"
          value={formatPercent(avgScroll)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          color="#f59e0b"
        />
      </div>

      {/* Pages List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">All Pages</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No page data yet
              </p>
            )}
            {rows.map((page) => {
              const pct = maxViews > 0 ? (page.views / maxViews) * 100 : 0;
              return (
                <div key={page.path} className="group relative">
                  <div
                    className="absolute inset-0 rounded bg-blue-500/8 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between py-1.5 px-2">
                    <div className="min-w-0 max-w-[70%]">
                      <span className="text-sm font-mono truncate block">
                        {page.path}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(page.avgDuration)} avg
                        {page.avgScroll > 0 && (
                          <> - {formatPercent(page.avgScroll)} scroll</>
                        )}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground font-medium">
                      {page.views.toLocaleString()}
                    </span>
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
