"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { LineChart } from "@/components/charts/line-chart";
import { mockEvents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const trendData = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(2026, 1, i + 7).toISOString().split("T")[0],
  events: Math.floor(500 + Math.random() * 300),
}));

export default function EventsPage() {
  const { siteId } = useParams();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Custom Events</h1>
        <DateRangePicker />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={trendData} xKey="date" lines={[{ key: "events", color: "hsl(var(--primary))", name: "Events" }]} height={250} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead className="text-right">Total Count</TableHead>
                <TableHead className="text-right">Unique Users</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEvents.map((e) => (
                <TableRow key={e.name}>
                  <TableCell>
                    <Link href={`/dashboard/${siteId}/events/${e.name}`} className="font-mono text-sm text-primary hover:underline">
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{e.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{e.uniqueUsers.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={cn(e.trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {e.trend >= 0 ? "+" : ""}{e.trend}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
