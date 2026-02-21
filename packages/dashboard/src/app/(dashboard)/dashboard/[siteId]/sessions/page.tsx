"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { mockSessions } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";

export default function SessionsPage() {
  const { siteId } = useParams();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <DateRangePicker />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry Page</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead className="text-right">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/dashboard/${siteId}/sessions/${s.id}`} className="font-mono text-sm text-primary hover:underline">
                      {s.entryPage}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{s.pagesVisited}</TableCell>
                  <TableCell className="text-right">{formatDuration(s.duration)}</TableCell>
                  <TableCell><Badge variant="secondary">{s.country}</Badge></TableCell>
                  <TableCell>{s.device}</TableCell>
                  <TableCell className="text-muted-foreground">{s.browser}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {new Date(s.startedAt).toLocaleTimeString()}
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
