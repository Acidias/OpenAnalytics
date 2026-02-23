"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { LineChart } from "@/components/charts/line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatNumber, formatDuration, formatPercent } from "@/lib/utils";
import { Users, Eye, Clock, ArrowDownRight, Sparkles } from "lucide-react";

interface OverviewData {
  pageviews: number;
  unique_sessions: number;
  avg_duration_ms: number | null;
  avg_scroll_pct: number | null;
  engagement_rate: number | null;
  topPages: { path: string; views: number; visitors: number }[];
  topReferrers: { referrer: string; count: number }[];
  topCountries: { country: string; visitors: number }[];
}

interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
  [key: string]: unknown;
}

export default function SiteOverviewPage() {
  const { siteId } = useParams();
  const [data, setData] = useState<OverviewData | null>(null);
  const [chart, setChart] = useState<TimeseriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analytics.overview(siteId as string),
      api.analytics.timeseries(siteId as string),
    ])
      .then(([overview, ts]) => {
        setData(overview as OverviewData);
        const timeseries = (ts as { timeseries: TimeseriesPoint[] }).timeseries;
        setChart(timeseries.map((p) => ({
          ...p,
          date: new Date(p.date).toISOString().split("T")[0],
          visitors: Number(p.visitors),
          pageviews: Number(p.pageviews),
        })));
      })
      .catch(() => setError("Failed to load overview data"));
  }, [siteId]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const visitors = Number(data.unique_sessions) || 0;
  const pageviews = Number(data.pageviews) || 0;
  const avgTimeSec = data.avg_duration_ms ? Math.round(Number(data.avg_duration_ms) / 1000) : 0;
  const avgScroll = data.avg_scroll_pct ? Number(data.avg_scroll_pct) : 0;
  const engagement = data.engagement_rate ? Number(data.engagement_rate) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <DateRangePicker />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Visitors" value={formatNumber(visitors)} icon={<Users className="h-4 w-4" />} />
        <StatsCard title="Pageviews" value={formatNumber(pageviews)} icon={<Eye className="h-4 w-4" />} />
        <StatsCard title="Avg. Time on Page" value={formatDuration(avgTimeSec)} icon={<Clock className="h-4 w-4" />} />
        <StatsCard title="Avg. Scroll Depth" value={formatPercent(avgScroll)} icon={<ArrowDownRight className="h-4 w-4" />} />
        <StatsCard title="Engagement Rate" value={formatPercent(engagement)} icon={<Sparkles className="h-4 w-4" />} />
      </div>

      {/* Chart */}
      {chart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitors & Pageviews</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={chart}
              xKey="date"
              lines={[
                { key: "visitors", color: "hsl(var(--primary))", name: "Visitors" },
                { key: "pageviews", color: "#8b5cf6", name: "Pageviews" },
              ]}
              height={350}
            />
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPages.slice(0, 5).map((p) => (
                  <TableRow key={p.path}>
                    <TableCell className="font-mono text-xs">{p.path}</TableCell>
                    <TableCell className="text-right">{Number(p.views).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topReferrers.slice(0, 5).map((r) => (
                  <TableRow key={r.referrer}>
                    <TableCell>{r.referrer}</TableCell>
                    <TableCell className="text-right">{Number(r.count).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCountries.slice(0, 5).map((c) => (
                  <TableRow key={c.country}>
                    <TableCell>{c.country}</TableCell>
                    <TableCell className="text-right">{Number(c.visitors).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
