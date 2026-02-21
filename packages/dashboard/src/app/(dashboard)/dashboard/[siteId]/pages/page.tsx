"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { mockTopPages } from "@/lib/mock-data";
import { formatDuration, formatPercent } from "@/lib/utils";

export default function PagesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
        <DateRangePicker />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Avg. Duration</TableHead>
                <TableHead className="text-right">Avg. Scroll</TableHead>
                <TableHead className="text-right">Bounce Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopPages.map((page) => (
                <TableRow key={page.path}>
                  <TableCell className="font-mono text-sm">{page.path}</TableCell>
                  <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatDuration(page.avgDuration)}</TableCell>
                  <TableCell className="text-right">{formatPercent(page.avgScroll)}</TableCell>
                  <TableCell className="text-right">{formatPercent(page.bounceRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
