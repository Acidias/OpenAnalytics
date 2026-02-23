"use client";

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AreaDef {
  key: string;
  color: string;
  name?: string;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: AreaDef[];
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showTooltip?: boolean;
}

export function AreaChart({
  data,
  xKey,
  areas,
  height = 300,
  showGrid = true,
  showAxes = true,
  showTooltip = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={
          showAxes
            ? { top: 8, right: 8, left: -12, bottom: 0 }
            : { top: 4, right: 0, left: 0, bottom: 0 }
        }
      >
        <defs>
          {areas.map((area) => (
            <linearGradient
              key={area.key}
              id={`gradient-${area.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={area.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
        )}
        {showAxes && (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
          </>
        )}
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            labelStyle={{
              color: "hsl(var(--foreground))",
              fontWeight: 600,
              marginBottom: 4,
            }}
            itemStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
        )}
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stroke={area.color}
            strokeWidth={2}
            fill={`url(#gradient-${area.key})`}
            name={area.name || area.key}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

// Tiny sparkline variant for stat cards - no axes, grid, or tooltip
export function Sparkline({
  data,
  dataKey,
  color,
  height = 40,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
      >
        <defs>
          <linearGradient
            id={`spark-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`}
          dot={false}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
