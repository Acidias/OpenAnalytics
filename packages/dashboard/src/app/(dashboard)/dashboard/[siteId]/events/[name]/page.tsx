"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { mockEventDetail } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EventDetailPage() {
  const { name } = useParams();
  const event = mockEventDetail;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono">{decodeURIComponent(name as string)}</h1>
        <p className="text-muted-foreground mt-1">Event details and property breakdown</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Count" value={event.totalCount.toLocaleString()} />
        <StatsCard title="Unique Users" value={event.uniqueUsers.toLocaleString()} />
        <StatsCard title="Avg per User" value={(event.totalCount / event.uniqueUsers).toFixed(1)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={event.trend} xKey="date" lines={[{ key: "count", color: "hsl(var(--primary))", name: "Count" }]} height={250} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(event.properties)[0]}>
            <TabsList>
              {Object.keys(event.properties).map((prop) => (
                <TabsTrigger key={prop} value={prop} className="capitalize">{prop}</TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(event.properties).map(([prop, values]) => (
              <TabsContent key={prop} value={prop}>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <BarChart
                    data={values}
                    xKey="value"
                    bars={[{ key: "count", color: "hsl(var(--primary))", name: "Count" }]}
                    height={200}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {values.map((v) => (
                        <TableRow key={v.value}>
                          <TableCell className="font-medium">{v.value}</TableCell>
                          <TableCell className="text-right">{v.count}</TableCell>
                          <TableCell className="text-right">{v.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
