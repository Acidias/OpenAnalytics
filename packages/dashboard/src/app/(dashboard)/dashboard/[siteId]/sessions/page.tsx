"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/utils";
import { Users } from "lucide-react";

interface SessionRow {
  session_id: string;
  started_at: string;
  ended_at: string;
  page_count: number;
  entry_page: string;
  country: string | null;
  device: string | null;
  was_engaged: boolean;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => c.charCodeAt(0) + offset)
  );
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " " + d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-6 pb-3">
          <div className="h-5 w-36 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-1">
            {/* Header row skeleton */}
            <div className="h-10 rounded bg-muted/50 animate-pulse" />
            {/* Data row skeletons */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded bg-muted animate-pulse"
                style={{ opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { siteId } = useParams();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setSessions(null);
    api.analytics
      .sessions(siteId as string, `period=${period}`)
      .then((data) => setSessions((data as { sessions: SessionRow[] }).sessions))
      .catch(() => setError("Failed to load sessions"));
  }, [siteId, period]);

  if (error) return <p className="text-destructive p-8">{error}</p>;

  if (!sessions) return <SessionsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Session Explorer</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No sessions for this period
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Entry Page</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Engaged</TableHead>
                  <TableHead className="text-right">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => {
                  const durationSec = s.started_at && s.ended_at
                    ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                    : 0;
                  return (
                    <TableRow key={s.session_id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Link
                          href={`/dashboard/${siteId}/sessions/${s.session_id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                        >
                          {s.session_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground max-w-[200px] truncate">
                        {s.entry_page || "/"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{Number(s.page_count)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatDuration(durationSec)}
                      </TableCell>
                      <TableCell>
                        {s.country ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-base leading-none">{countryFlag(s.country)}</span>
                            <span className="text-sm">{s.country}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.device ? (
                          <Badge variant="secondary" className="font-normal">
                            {s.device}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.was_engaged ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-normal">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatSessionDate(s.started_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
