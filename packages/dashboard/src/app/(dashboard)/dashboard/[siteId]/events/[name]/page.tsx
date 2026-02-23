"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AreaChart } from "@/components/charts/area-chart";
import { api } from "@/lib/api";
import { Hash, Users, Divide } from "lucide-react";

interface EventDetailData {
  total: number;
  unique_sessions: number;
  daily: { day: string; count: number }[];
}

function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-4 w-40 rounded bg-muted animate-pulse mt-2" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
      <div className="h-[340px] rounded-lg border bg-card animate-pulse" />
    </div>
  );
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

  if (error) return <p className="text-destructive p-8">{error}</p>;
  if (!data) return <EventDetailSkeleton />;

  const total = Number(data.total) || 0;
  const unique = Number(data.unique_sessions) || 0;
  const avgPerSession = unique > 0 ? (total / unique).toFixed(1) : "0";
  const chartData = data.daily.map((d) => ({
    date: new Date(d.day).toISOString().split("T")[0],
    count: Number(d.count),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-mono">
          {decodeURIComponent(name as string)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Event details and daily trend
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard
          title="Total Count"
          value={total.toLocaleString()}
          icon={<Hash className="h-4 w-4" />}
          sparkData={chartData}
          sparkKey="count"
          color="#f59e0b"
        />
        <StatsCard
          title="Unique Sessions"
          value={unique.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          color="#3b82f6"
        />
        <StatsCard
          title="Avg per Session"
          value={avgPerSession}
          icon={<Divide className="h-4 w-4" />}
          color="#8b5cf6"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Daily Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {chartData.length > 0 ? (
            <AreaChart
              data={chartData}
              xKey="date"
              areas={[{ key: "count", color: "#f59e0b", name: "Count" }]}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              No data for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
