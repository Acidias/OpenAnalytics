"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";

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

export default function DevicesPage() {
  const { siteId } = useParams();
  const [data, setData] = useState<DevicesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analytics
      .devices(siteId as string)
      .then((d) => setData(d as DevicesData))
      .catch(() => setError("Failed to load device data"));
  }, [siteId]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const devices = withPercentages(data.devices, "device");
  const browsers = withPercentages(data.browsers, "browser");
  const oses = withPercentages(data.operatingSystems, "os");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Device Type</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={devices} xKey="name" bars={[{ key: "visitors", color: "hsl(var(--primary))" }]} height={200} />
            <div className="mt-4 space-y-2">
              {devices.map((d) => (
                <div key={d.name} className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">{d.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Browser</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={browsers} xKey="name" bars={[{ key: "visitors", color: "#8b5cf6" }]} height={200} />
            <div className="mt-4 space-y-2">
              {browsers.map((b) => (
                <div key={b.name} className="flex justify-between text-sm">
                  <span>{b.name}</span>
                  <span className="text-muted-foreground">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Operating System</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={oses} xKey="name" bars={[{ key: "visitors", color: "#f59e0b" }]} height={200} />
            <div className="mt-4 space-y-2">
              {oses.map((o) => (
                <div key={o.name} className="flex justify-between text-sm">
                  <span>{o.name}</span>
                  <span className="text-muted-foreground">{o.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
