"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { WorldMap } from "@/components/charts/world-map";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Globe, Users, Map as MapIcon } from "lucide-react";

interface GeoRow {
  country: string;
  visitors: number;
  pageviews: number;
}

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

export default function GeoPage() {
  const { siteId } = useParams();
  const [geo, setGeo] = useState<GeoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setGeo(null);
    api.analytics
      .geo(siteId as string, `period=${period}`)
      .then((data) => setGeo((data as { geo: GeoRow[] }).geo))
      .catch(() => setError("Failed to load geography data"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!geo) {
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
        <div className="h-[440px] rounded-lg border bg-card animate-pulse" />
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

  // Aggregate by country (API may return country+region+city rows)
  const countryMap = new Map<string, { visitors: number; pageviews: number }>();
  for (const row of geo) {
    const existing = countryMap.get(row.country);
    const v = Number(row.visitors);
    const p = Number(row.pageviews);
    if (existing) {
      existing.visitors += v;
      existing.pageviews += p;
    } else {
      countryMap.set(row.country, { visitors: v, pageviews: p });
    }
  }

  const countries = Array.from(countryMap.entries())
    .map(([country, agg]) => ({ country, ...agg }))
    .sort((a, b) => b.visitors - a.visitors);

  const totalCountries = countries.length;
  const totalVisitors = countries.reduce((sum, c) => sum + c.visitors, 0);
  const maxVisitors = Math.max(...countries.map((c) => c.visitors), 1);

  // Build map data: country code -> visitor count
  const mapData: Record<string, number> = {};
  for (const c of countries) {
    mapData[c.country] = c.visitors;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Geography</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Countries
            </span>
            <Globe className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatNumber(totalCountries)}</p>
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

      {/* World Map */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Visitor Map</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <WorldMap data={mapData} maxValue={maxVisitors} />
        </CardContent>
      </Card>

      {/* Countries List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">All Countries</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {countries.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No country data yet
              </p>
            )}
            {countries.map((c) => {
              const pct = maxVisitors > 0 ? (c.visitors / maxVisitors) * 100 : 0;
              const percentage = totalVisitors > 0
                ? ((c.visitors / totalVisitors) * 100).toFixed(1)
                : "0.0";
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
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm tabular-nums text-muted-foreground font-medium">
                        {c.visitors.toLocaleString()}
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
