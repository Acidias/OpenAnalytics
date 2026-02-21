"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { mockSources } from "@/lib/mock-data";

export default function SourcesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
        <DateRangePicker />
      </div>

      <Tabs defaultValue="referrers">
        <TabsList>
          <TabsTrigger value="referrers">Referrers</TabsTrigger>
          <TabsTrigger value="utm">UTM Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="referrers" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Referrers</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={mockSources.referrers}
                xKey="source"
                bars={[{ key: "visitors", color: "hsl(var(--primary))", name: "Visitors" }]}
                height={300}
              />
            </CardContent>
          </Card>

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
                  {mockSources.referrers.map((r) => (
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
        </TabsContent>

        <TabsContent value="utm" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Visitors</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSources.utmSources.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.source}</TableCell>
                      <TableCell>{u.medium}</TableCell>
                      <TableCell className="font-mono text-sm">{u.campaign}</TableCell>
                      <TableCell className="text-right">{u.visitors.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{u.conversions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
