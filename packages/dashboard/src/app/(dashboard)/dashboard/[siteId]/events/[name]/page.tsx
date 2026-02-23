"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LineChart } from "@/components/charts/line-chart";
import { api } from "@/lib/api";

interface EventDetailData {
  total: number;
  unique_sessions: number;
  daily: { day: string; count: number }[];
}

export default function EventDetailPage() {
  const { siteId, name } = useParams();
  const [data, setData] = useState<EventDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analytics
      .event(siteId as string, decodeURIComponent(name as string))
      .then((d) => setData(d as EventDetailData))
      .catch(() => setError("Failed to load event details"));
  }, [siteId, name]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const total = Number(data.total) || 0;
  const unique = Number(data.unique_sessions) || 0;
  const chartData = data.daily.map((d) => ({
    date: new Date(d.day).toISOString().split("T")[0],
    count: Number(d.count),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono">{decodeURIComponent(name as string)}</h1>
        <p className="text-muted-foreground mt-1">Event details and daily trend</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Count" value={total.toLocaleString()} />
        <StatsCard title="Unique Sessions" value={unique.toLocaleString()} />
        <StatsCard title="Avg per Session" value={unique > 0 ? (total / unique).toFixed(1) : "0"} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={chartData} xKey="date" lines={[{ key: "count", color: "hsl(var(--primary))", name: "Count" }]} height={250} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
