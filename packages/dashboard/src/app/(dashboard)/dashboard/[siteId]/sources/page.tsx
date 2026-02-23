"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";

interface ReferrerRow {
  referrer: string;
  visits: number;
  visitors: number;
}

export default function SourcesPage() {
  const { siteId } = useParams();
  const [referrers, setReferrers] = useState<ReferrerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setReferrers(null);
    api.analytics
      .sources(siteId as string, `period=${period}`)
      .then((data) => setReferrers((data as { referrers: ReferrerRow[] }).referrers))
      .catch(() => setError("Failed to load sources"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!referrers) return <p className="text-muted-foreground">Loading...</p>;

  const totalVisitors = referrers.reduce((sum, r) => sum + Number(r.visitors), 0);
  const chartData = referrers.slice(0, 10).map((r) => ({
    source: r.referrer,
    visitors: Number(r.visitors),
  }));
  const tableData = referrers.map((r) => ({
    source: r.referrer,
    visitors: Number(r.visitors),
    percentage: totalVisitors > 0 ? ((Number(r.visitors) / totalVisitors) * 100).toFixed(1) : "0.0",
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <div className="space-y-4">
        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Top Referrers</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={chartData}
                xKey="source"
                bars={[{ key: "visitors", color: "hsl(var(--primary))", name: "Visitors" }]}
                height={300}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((r) => (
                  <TableRow key={r.source}>
                    <TableCell className="font-medium">{r.source}</TableCell>
                    <TableCell className="text-right">{r.visitors.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.percentage}%</TableCell>
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
