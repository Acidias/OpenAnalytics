"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

interface FunnelStep {
  position: number;
  name: string;
  count: number;
}

interface FunnelData {
  funnel_id: string;
  steps: FunnelStep[];
  conversions: Record<string, string>;
}

export default function FunnelDetailPage() {
  const { siteId, fid } = useParams();
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.funnels
      .get(siteId as string, fid as string)
      .then((d) => setData(d as FunnelData))
      .catch(() => setError("Failed to load funnel"));
  }, [siteId, fid]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const steps = data.steps;
  const entered = steps.length > 0 ? steps[0].count : 0;
  const converted = steps.length > 0 ? steps[steps.length - 1].count : 0;
  const overallRate = Number(data.conversions.overall_conversion_pct) || 0;

  // Map to the shape FunnelChart expects
  const chartSteps = steps.map((s, i) => ({
    name: s.name,
    visitors: s.count,
    dropoff: i > 0 && steps[i - 1].count > 0
      ? ((steps[i - 1].count - s.count) / steps[i - 1].count) * 100
      : 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Funnel Analysis</h1>
        <p className="text-muted-foreground mt-1">Conversion funnel visualisation and analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Entered" value={entered.toLocaleString()} />
        <StatsCard title="Converted" value={converted.toLocaleString()} />
        <StatsCard title="Conversion Rate" value={formatPercent(overallRate)} />
      </div>

      {chartSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart steps={chartSteps} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
