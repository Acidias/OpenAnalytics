"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";

interface GeoRow {
  country: string;
  visitors: number;
  pageviews: number;
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

  if (error) return <p className="text-destructive">{error}</p>;
  if (!geo) return <p className="text-muted-foreground">Loading...</p>;

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

  const totalVisitors = countries.reduce((sum, c) => sum + c.visitors, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Geography</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {countries.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Visitors by Country</CardTitle></CardHeader>
          <CardContent>
            <BarChart
              data={countries.slice(0, 8)}
              xKey="country"
              bars={[{ key: "visitors", color: "hsl(var(--primary))", name: "Visitors" }]}
              height={350}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((c) => (
                <TableRow key={c.country}>
                  <TableCell className="font-medium">{c.country}</TableCell>
                  <TableCell className="text-right">{c.visitors.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totalVisitors > 0 ? ((c.visitors / totalVisitors) * 100).toFixed(1) : "0.0"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
