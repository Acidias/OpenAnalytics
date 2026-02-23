"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";
import { Monitor, Globe, Laptop } from "lucide-react";

interface DeviceRow { device: string; visitors: number }
interface BrowserRow { browser: string; visitors: number }
interface OsRow { os: string; visitors: number }

interface DevicesData {
  devices: DeviceRow[];
  browsers: BrowserRow[];
  operatingSystems: OsRow[];
}

function withPercentages<T extends { visitors: number }>(items: T[], nameKey: string) {
  const total = items.reduce((sum, i) => sum + Number(i.visitors), 0);
  return items.map((i) => ({
    name: (i as Record<string, unknown>)[nameKey] as string,
    visitors: Number(i.visitors),
    percentage: total > 0 ? ((Number(i.visitors) / total) * 100).toFixed(1) : "0.0",
  }));
}

function ProgressBarList({
  items,
  tintClass,
}: {
  items: { name: string; visitors: number; percentage: string }[];
  tintClass: string;
}) {
  const max = Math.max(...items.map((i) => i.visitors), 1);
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No data yet
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const pct = max > 0 ? (item.visitors / max) * 100 : 0;
        return (
          <div key={item.name} className="group relative">
            <div
              className={`absolute inset-0 rounded ${tintClass} transition-all`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between py-1.5 px-2">
              <span className="text-sm truncate max-w-[55%]">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-muted-foreground font-medium">
                  {item.visitors.toLocaleString()}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DevicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card">
            <div className="p-6 pb-3">
              <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            </div>
            <div className="p-6 pt-0 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const { siteId } = useParams();
  const [data, setData] = useState<DevicesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setData(null);
    api.analytics
      .devices(siteId as string, `period=${period}`)
      .then((d) => setData(d as DevicesData))
      .catch(() => setError("Failed to load device data"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!data) return <DevicesSkeleton />;

  const devices = withPercentages(data.devices, "device");
  const browsers = withPercentages(data.browsers, "browser");
  const oses = withPercentages(data.operatingSystems, "os");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Device Type</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ProgressBarList items={devices} tintClass="bg-cyan-500/8" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Browser</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ProgressBarList items={browsers} tintClass="bg-violet-500/8" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Operating System</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ProgressBarList items={oses} tintClass="bg-amber-500/8" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
