"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { mockCountries } from "@/lib/mock-data";

export default function GeoPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Geography</h1>
        <DateRangePicker />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Visitors by Country</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={mockCountries.slice(0, 8)}
            xKey="country"
            bars={[{ key: "visitors", color: "hsl(var(--primary))", name: "Visitors" }]}
            height={350}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCountries.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="font-medium">{c.country}</TableCell>
                  <TableCell className="text-muted-foreground">{c.code}</TableCell>
                  <TableCell className="text-right">{c.visitors.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
