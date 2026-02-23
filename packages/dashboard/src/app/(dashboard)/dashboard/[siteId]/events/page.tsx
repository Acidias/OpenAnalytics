"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";

interface EventRow {
  event: string;
  count: number;
  unique_sessions: number;
}

export default function EventsPage() {
  const { siteId } = useParams();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setEvents(null);
    api.analytics
      .events(siteId as string, `period=${period}`)
      .then((data) => setEvents((data as { events: EventRow[] }).events))
      .catch(() => setError("Failed to load events"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!events) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Custom Events</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

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
                <TableHead className="text-right">Unique Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.event}>
                  <TableCell>
                    <Link href={`/dashboard/${siteId}/events/${encodeURIComponent(e.event)}`} className="font-mono text-sm text-primary hover:underline">
                      {e.event}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{Number(e.count).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(e.unique_sessions).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
