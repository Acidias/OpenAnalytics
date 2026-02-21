"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { mockFunnelDetail } from "@/lib/mock-data";
import { formatPercent } from "@/lib/utils";

export default function FunnelDetailPage() {
  const funnel = mockFunnelDetail;
  const conversionRate = (funnel.steps[funnel.steps.length - 1].visitors / funnel.steps[0].visitors) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{funnel.name}</h1>
        <p className="text-muted-foreground mt-1">Funnel visualization and conversion analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Entered" value={funnel.steps[0].visitors.toLocaleString()} />
        <StatsCard title="Converted" value={funnel.steps[funnel.steps.length - 1].visitors.toLocaleString()} />
        <StatsCard title="Conversion Rate" value={formatPercent(conversionRate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={funnel.steps} />
        </CardContent>
      </Card>
    </div>
  );
}
