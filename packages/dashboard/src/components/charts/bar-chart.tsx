"use client";

import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color: string; name?: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
}

export function BarChart({ data, xKey, bars, height = 300, layout = "horizontal" }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout={layout === "vertical" ? "vertical" : "horizontal"} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis dataKey={xKey} type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
        />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[4, 4, 0, 0]} name={bar.name || bar.key} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
