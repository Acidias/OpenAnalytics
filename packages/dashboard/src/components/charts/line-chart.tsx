"use client";

import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; color: string; name?: string }[];
  height?: number;
}

export function LineChart({ data, xKey, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={false} name={line.name || line.key} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
