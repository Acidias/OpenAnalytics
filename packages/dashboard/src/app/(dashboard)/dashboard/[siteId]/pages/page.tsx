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

  const rows = pages.map((p) => ({
    path: p.path,
    views: Number(p.views) || 0,
    avgDuration: p.avg_duration_ms ? Math.round(Number(p.avg_duration_ms) / 1000) : 0,
    avgScroll: p.avg_scroll_pct ? Number(p.avg_scroll_pct) : 0,
  }));

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
