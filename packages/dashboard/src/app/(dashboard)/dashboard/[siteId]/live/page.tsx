"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockLiveVisitors } from "@/lib/mock-data";
import { Zap, Globe, FileText } from "lucide-react";

export default function LivePage() {
  const live = mockLiveVisitors;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Live</h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-muted-foreground text-sm">Real-time</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <div className="text-5xl font-bold">{live.current}</div>
            <p className="text-muted-foreground mt-2">visitors right now</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Active Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {live.pages.map((p) => (
                  <TableRow key={p.path}>
                    <TableCell className="font-mono text-sm">{p.path}</TableCell>
                    <TableCell className="text-right">{p.visitors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Countries</CardTitle>
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
                {live.countries.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell>{c.country}</TableCell>
                    <TableCell className="text-right">{c.visitors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {live.recentEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Badge variant="outline" className="text-xs">{e.type}</Badge>
                <span className="font-mono text-muted-foreground">{e.type === "event" ? e.name : e.path}</span>
                <Badge variant="secondary" className="text-xs">{e.country}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">{e.timestamp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
