"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { formatDuration, formatPercent } from "@/lib/utils";
import { Eye, MousePointerClick, ArrowDownRight, Sparkles, FileText, LogOut } from "lucide-react";

interface TimelineEvent {
  time: string;
  event: string;
  path: string | null;
  referrer: string | null;
  duration_ms: number | null;
  scroll_max_pct: number | null;
  engaged: boolean | null;
  properties: Record<string, unknown> | null;
}

const eventIcons: Record<string, React.ReactNode> = {
  pageview: <Eye className="h-4 w-4" />,
  pageleave: <LogOut className="h-4 w-4" />,
  click: <MousePointerClick className="h-4 w-4" />,
  scroll: <ArrowDownRight className="h-4 w-4" />,
  engage: <Sparkles className="h-4 w-4" />,
};

const eventColors: Record<string, string> = {
  pageview: "bg-blue-500",
  pageleave: "bg-gray-400",
  click: "bg-amber-500",
  scroll: "bg-emerald-500",
  engage: "bg-purple-500",
};

export default function SessionDetailPage() {
  const { siteId, sid } = useParams();
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analytics
      .session(siteId as string, sid as string)
      .then((data) => setEvents((data as { events: TimelineEvent[] }).events))
      .catch(() => setError("Failed to load session"));
  }, [siteId, sid]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!events) return <p className="text-muted-foreground">Loading...</p>;

  const pageviews = events.filter((e) => e.event === "pageview").length;
  const totalDurationSec = events.length >= 2
    ? Math.round((new Date(events[events.length - 1].time).getTime() - new Date(events[0].time).getTime()) / 1000)
    : 0;

  // Build per-page summary from pageleave events (they carry duration + scroll)
  const pageMap = new Map<string, { totalMs: number; maxScroll: number; visits: number; engaged: boolean }>();
  for (const e of events) {
    if (e.event === "pageleave" && e.path) {
      const existing = pageMap.get(e.path);
      const ms = e.duration_ms ?? 0;
      const scroll = e.scroll_max_pct ?? 0;
      const eng = e.engaged ?? false;
      if (existing) {
        existing.totalMs += ms;
        existing.maxScroll = Math.max(existing.maxScroll, scroll);
        existing.visits += 1;
        existing.engaged = existing.engaged || eng;
      } else {
        pageMap.set(e.path, { totalMs: ms, maxScroll: scroll, visits: 1, engaged: eng });
      }
    }
  }
  const pageSummary = Array.from(pageMap.entries())
    .map(([path, s]) => ({ path, ...s }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session Timeline</h1>
        <p className="text-muted-foreground mt-1">Visitor journey from start to finish</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Duration</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatDuration(totalDurationSec)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pages Viewed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pageviews}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Engaged</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{events.some((e) => e.engaged) ? "Yes" : "No"}</div></CardContent>
        </Card>
      </div>

      {pageSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Time Spent</TableHead>
                  <TableHead>Scroll Depth</TableHead>
                  <TableHead>Engaged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageSummary.map((p) => (
                  <TableRow key={p.path}>
                    <TableCell className="font-mono text-sm">{p.path}</TableCell>
                    <TableCell className="text-right">{p.visits}</TableCell>
                    <TableCell className="text-right">{formatDuration(Math.round(p.totalMs / 1000))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.maxScroll} className="h-2 w-20" />
                        <span className="text-xs text-muted-foreground">{formatPercent(p.maxScroll)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.engaged
                        ? <Badge variant="secondary">Yes</Badge>
                        : <span className="text-muted-foreground">No</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {events.map((event, i) => {
                const isCustom = !["pageview", "pageleave", "click", "scroll", "engage", "heartbeat"].includes(event.event);
                const icon = eventIcons[event.event] || <FileText className="h-4 w-4" />;
                const color = eventColors[event.event] || "bg-pink-500";
                const label = isCustom ? event.event : event.event;

                return (
                  <div key={i} className="relative flex items-start gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full ${color} ring-4 ring-background`} />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-sm capitalize">{label}</span>
                        {event.path && <Badge variant="outline" className="text-xs">{event.path}</Badge>}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(event.time).toLocaleTimeString()}
                        </span>
                      </div>

                      {event.event === "pageview" && event.duration_ms && (
                        <div className="text-xs text-muted-foreground flex gap-4">
                          <span>Duration: {Math.round(event.duration_ms / 1000)}s</span>
                          {event.scroll_max_pct !== null && <span>Scroll: {event.scroll_max_pct}%</span>}
                        </div>
                      )}

                      {event.event === "pageleave" && (
                        <div className="text-xs text-muted-foreground flex gap-4">
                          {event.duration_ms !== null && <span>Time on page: {Math.round(event.duration_ms / 1000)}s</span>}
                          {event.scroll_max_pct !== null && <span>Scroll: {event.scroll_max_pct}%</span>}
                        </div>
                      )}

                      {event.properties && Object.keys(event.properties).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(event.properties).map(([k, v]) => (
                            <span key={k} className="mr-3">{k}: <span className="text-foreground">{String(v)}</span></span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
