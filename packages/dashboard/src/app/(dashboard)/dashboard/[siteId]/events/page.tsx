"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";
import { Zap } from "lucide-react";

interface EventRow {
  event: string;
  count: number;
  unique_sessions: number;
}

function EventsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-6 pb-3">
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-6 pt-0 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded bg-muted animate-pulse"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
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

  if (error) return <p className="text-destructive p-8">{error}</p>;
  if (!events) return <EventsSkeleton />;

  const maxCount = Math.max(...events.map((e) => Number(e.count)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Custom Events
        </h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">All Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events recorded yet
            </p>
          )}
          <div className="space-y-2">
            {events.map((e) => {
              const count = Number(e.count);
              const unique = Number(e.unique_sessions);
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={e.event} className="group relative">
                  <div
                    className="absolute inset-0 rounded bg-amber-500/8 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between py-1.5 px-2">
                    <Link
                      href={`/dashboard/${siteId}/events/${encodeURIComponent(e.event)}`}
                      className="font-mono text-sm truncate max-w-[60%] hover:underline"
                    >
                      {e.event}
                    </Link>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {unique.toLocaleString()} session{unique !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground font-medium min-w-[3rem] text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
