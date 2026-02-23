"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { AreaChart } from "@/components/charts/area-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatNumber, formatDuration, formatPercent } from "@/lib/utils";
import {
  Users,
  Eye,
  Clock,
  ArrowDownRight,
  Sparkles,
  FileText,
  Globe,
  Share2,
  ArrowRight,
} from "lucide-react";

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

const PERIOD_BUCKETS: Record<string, string> = {
  "24h": "5 minutes",
  "7d": "1 hour",
  "30d": "1 day",
  "90d": "1 day",
  "12m": "1 week",
};

function formatDate(iso: string, period: string): string {
  const d = new Date(iso);
  switch (period) {
    case "24h":
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "7d":
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
  }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Country code -> flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => c.charCodeAt(0) + offset)
  );
}

export default function SiteOverviewPage() {
  const { siteId } = useParams();
  const [data, setData] = useState<OverviewData | null>(null);
  const [chart, setChart] = useState<TimeseriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");
  const [chartMetric, setChartMetric] = useState<"visitors" | "pageviews">(
    "visitors"
  );

  useEffect(() => {
    setData(null);
    setChart([]);
    const bucket = PERIOD_BUCKETS[period] || "1 day";
    const params = `period=${period}&bucket=${bucket}`;

    Promise.all([
      api.analytics.overview(siteId as string, `period=${period}`),
      api.analytics.timeseries(siteId as string, params),
    ])
      .then(([overview, ts]) => {
        setData(overview as OverviewData);
        const timeseries = (ts as { timeseries: TimeseriesPoint[] })
          .timeseries;
        setChart(
          timeseries.map((p) => ({
            ...p,
            date: formatDate(p.date, period),
            visitors: Number(p.visitors),
            pageviews: Number(p.pageviews),
          }))
        );
      })
      .catch(() => setError("Failed to load overview data"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
        <div className="h-[380px] rounded-lg border bg-card animate-pulse" />
      </div>
    );
  }

  const visitors = Number(data.unique_sessions) || 0;
  const pageviews = Number(data.pageviews) || 0;
  const avgTimeSec = data.avg_duration_ms
    ? Math.round(Number(data.avg_duration_ms) / 1000)
    : 0;
  const avgScroll = data.avg_scroll_pct ? Number(data.avg_scroll_pct) : 0;
  const engagement = data.engagement_rate
    ? Number(data.engagement_rate) * 100
    : 0;

  const chartColor =
    chartMetric === "visitors" ? "#3b82f6" : "#8b5cf6";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Visitors"
          value={formatNumber(visitors)}
          icon={<Users className="h-4 w-4" />}
          sparkData={chart}
          sparkKey="visitors"
          color="#3b82f6"
        />
        <StatsCard
          title="Pageviews"
          value={formatNumber(pageviews)}
          icon={<Eye className="h-4 w-4" />}
          sparkData={chart}
          sparkKey="pageviews"
          color="#8b5cf6"
        />
        <StatsCard
          title="Avg. Time on Page"
          value={formatDuration(avgTimeSec)}
          icon={<Clock className="h-4 w-4" />}
          color="#06b6d4"
        />
        <StatsCard
          title="Scroll Depth"
          value={formatPercent(avgScroll)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          color="#f59e0b"
        />
        <StatsCard
          title="Engagement"
          value={formatPercent(engagement)}
          icon={<Sparkles className="h-4 w-4" />}
          color="#10b981"
        />
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Traffic</CardTitle>
            <Tabs
              value={chartMetric}
              onValueChange={(v) =>
                setChartMetric(v as "visitors" | "pageviews")
              }
            >
              <TabsList className="h-8">
                <TabsTrigger value="visitors" className="text-xs px-3 h-6">
                  Visitors
                </TabsTrigger>
                <TabsTrigger value="pageviews" className="text-xs px-3 h-6">
                  Pageviews
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {chart.length > 0 ? (
            <AreaChart
              data={chart}
              xKey="date"
              areas={[
                {
                  key: chartMetric,
                  color: chartColor,
                  name: chartMetric === "visitors" ? "Visitors" : "Pageviews",
                },
              ]}
              height={320}
            />
          ) : (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
              No data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Pages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Top Pages
                </CardTitle>
              </div>
              <Link
                href={`/dashboard/${siteId}/pages`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.topPages.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No page data yet
                </p>
              )}
              {data.topPages.slice(0, 6).map((p) => {
                const maxViews = Math.max(
                  ...data.topPages.slice(0, 6).map((x) => Number(x.views))
                );
                const pct = maxViews > 0 ? (Number(p.views) / maxViews) * 100 : 0;
                return (
                  <div key={p.path} className="group relative">
                    <div
                      className="absolute inset-0 rounded bg-blue-500/8 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between py-1.5 px-2">
                      <span className="text-sm font-mono truncate max-w-[70%]">
                        {p.path}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground font-medium">
                        {Number(p.views).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Top Sources
                </CardTitle>
              </div>
              <Link
                href={`/dashboard/${siteId}/sources`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.topReferrers.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No referrer data yet
                </p>
              )}
              {data.topReferrers.slice(0, 6).map((r) => {
                const maxCount = Math.max(
                  ...data.topReferrers.slice(0, 6).map((x) => Number(x.count))
                );
                const pct =
                  maxCount > 0 ? (Number(r.count) / maxCount) * 100 : 0;
                const hostname = extractHostname(r.referrer);
                return (
                  <div key={r.referrer} className="group relative">
                    <div
                      className="absolute inset-0 rounded bg-violet-500/8 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between py-1.5 px-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                          alt=""
                          className="h-4 w-4 rounded-sm flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span className="text-sm truncate">{hostname}</span>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground font-medium">
                        {Number(r.count).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Top Countries
                </CardTitle>
              </div>
              <Link
                href={`/dashboard/${siteId}/geo`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.topCountries.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No country data yet
                </p>
              )}
              {data.topCountries.slice(0, 6).map((c) => {
                const maxVisitors = Math.max(
                  ...data.topCountries
                    .slice(0, 6)
                    .map((x) => Number(x.visitors))
                );
                const pct =
                  maxVisitors > 0
                    ? (Number(c.visitors) / maxVisitors) * 100
                    : 0;
                return (
                  <div key={c.country} className="group relative">
                    <div
                      className="absolute inset-0 rounded bg-emerald-500/8 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between py-1.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">
                          {countryFlag(c.country)}
                        </span>
                        <span className="text-sm">{c.country}</span>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground font-medium">
                        {Number(c.visitors).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
