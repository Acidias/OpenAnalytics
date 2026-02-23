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

  if (error) return <p className="text-destructive">{error}</p>;
  if (!sessions) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
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
                  <TableRow key={s.session_id}>
                    <TableCell>
                      <Link href={`/dashboard/${siteId}/sessions/${s.session_id}`} className="font-mono text-xs text-primary hover:underline">
                        {s.session_id.slice(0, 6)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.entry_page || "/"}</TableCell>
                    <TableCell className="text-right">{Number(s.page_count)}</TableCell>
                    <TableCell className="text-right">{formatDuration(durationSec)}</TableCell>
                    <TableCell>{s.country ? <Badge variant="secondary">{s.country}</Badge> : "-"}</TableCell>
                    <TableCell>{s.device || "-"}</TableCell>
                    <TableCell>{s.was_engaged ? <Badge variant="secondary">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(s.started_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}{" "}
                      {new Date(s.started_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
