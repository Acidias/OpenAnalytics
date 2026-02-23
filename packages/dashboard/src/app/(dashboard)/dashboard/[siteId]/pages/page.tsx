"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";
import { formatDuration, formatPercent } from "@/lib/utils";

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

  if (error) return <p className="text-destructive">{error}</p>;
  if (!pages) return <p className="text-muted-foreground">Loading...</p>;

  // Aggregate rows by path (the API may return hourly buckets)
  const aggregated = new Map<string, { views: number; visitors: number; totalDuration: number; totalScroll: number; count: number }>();
  for (const p of pages) {
    const existing = aggregated.get(p.path);
    const views = Number(p.views) || 0;
    const visitors = Number(p.unique_visitors) || 0;
    const dur = Number(p.avg_duration_ms) || 0;
    const scroll = Number(p.avg_scroll_pct) || 0;
    if (existing) {
      existing.views += views;
      existing.visitors += visitors;
      existing.totalDuration += dur * views;
      existing.totalScroll += scroll * views;
      existing.count += views;
    } else {
      aggregated.set(p.path, { views, visitors, totalDuration: dur * views, totalScroll: scroll * views, count: views });
    }
  }

  const rows = Array.from(aggregated.entries())
    .map(([path, agg]) => ({
      path,
      views: agg.views,
      avgDuration: agg.count > 0 ? Math.round(agg.totalDuration / agg.count / 1000) : 0,
      avgScroll: agg.count > 0 ? agg.totalScroll / agg.count : 0,
    }))
    .sort((a, b) => b.views - a.views);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Avg. Duration</TableHead>
                <TableHead className="text-right">Avg. Scroll</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((page) => (
                <TableRow key={page.path}>
                  <TableCell className="font-mono text-sm">{page.path}</TableCell>
                  <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatDuration(page.avgDuration)}</TableCell>
                  <TableCell className="text-right">{formatPercent(page.avgScroll)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
