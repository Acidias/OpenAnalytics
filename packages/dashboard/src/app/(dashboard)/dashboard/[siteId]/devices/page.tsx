"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { mockDevices } from "@/lib/mock-data";

export default function DevicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Device Type</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={mockDevices.devices} xKey="name" bars={[{ key: "visitors", color: "hsl(var(--primary))" }]} height={200} />
            <div className="mt-4 space-y-2">
              {mockDevices.devices.map((d) => (
                <div key={d.name} className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">{d.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Browser</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={mockDevices.browsers} xKey="name" bars={[{ key: "visitors", color: "#8b5cf6" }]} height={200} />
            <div className="mt-4 space-y-2">
              {mockDevices.browsers.map((b) => (
                <div key={b.name} className="flex justify-between text-sm">
                  <span>{b.name}</span>
                  <span className="text-muted-foreground">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Operating System</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={mockDevices.os} xKey="name" bars={[{ key: "visitors", color: "#f59e0b" }]} height={200} />
            <div className="mt-4 space-y-2">
              {mockDevices.os.map((o) => (
                <div key={o.name} className="flex justify-between text-sm">
                  <span>{o.name}</span>
                  <span className="text-muted-foreground">{o.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
