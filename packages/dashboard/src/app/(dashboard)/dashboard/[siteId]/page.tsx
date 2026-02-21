"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { LineChart } from "@/components/charts/line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockOverview, mockChartData, mockTopPages, mockReferrers, mockCountries } from "@/lib/mock-data";
import { formatNumber, formatDuration, formatPercent } from "@/lib/utils";
import { Users, Eye, Clock, ArrowDownRight, Sparkles } from "lucide-react";

export default function SiteOverviewPage() {
  const o = mockOverview;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <DateRangePicker />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Visitors" value={formatNumber(o.visitors)} change={o.visitorsChange} icon={<Users className="h-4 w-4" />} />
        <StatsCard title="Pageviews" value={formatNumber(o.pageviews)} change={o.pageviewsChange} icon={<Eye className="h-4 w-4" />} />
        <StatsCard title="Avg. Time on Page" value={formatDuration(o.avgTimeOnPage)} change={o.avgTimeChange} icon={<Clock className="h-4 w-4" />} />
        <StatsCard title="Avg. Scroll Depth" value={formatPercent(o.avgScrollDepth)} change={o.scrollChange} icon={<ArrowDownRight className="h-4 w-4" />} />
        <StatsCard title="Engagement Rate" value={formatPercent(o.engagementRate)} change={o.engagementChange} icon={<Sparkles className="h-4 w-4" />} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitors & Pageviews</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={mockChartData}
            xKey="date"
            lines={[
              { key: "visitors", color: "hsl(var(--primary))", name: "Visitors" },
              { key: "pageviews", color: "#8b5cf6", name: "Pageviews" },
            ]}
            height={350}
          />
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopPages.slice(0, 5).map((p) => (
                  <TableRow key={p.path}>
                    <TableCell className="font-mono text-xs">{p.path}</TableCell>
                    <TableCell className="text-right">{p.views.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReferrers.slice(0, 5).map((r) => (
                  <TableRow key={r.source}>
                    <TableCell>{r.source}</TableCell>
                    <TableCell className="text-right">{r.visitors.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCountries.slice(0, 5).map((c) => (
                  <TableRow key={c.code}>
                    <TableCell>{c.country}</TableCell>
                    <TableCell className="text-right">{c.visitors.toLocaleString()}</TableCell>
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
