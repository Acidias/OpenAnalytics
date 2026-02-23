import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/charts/area-chart";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
  sparkData?: Record<string, unknown>[];
  sparkKey?: string;
  color?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  sparkData,
  sparkKey,
  color = "hsl(var(--primary))",
}: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {icon && (
          <div className="text-muted-foreground/60">{icon}</div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                "text-xs font-medium mt-0.5",
                change >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {change >= 0 ? "\u2191" : "\u2193"}{" "}
              {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>

        {sparkData && sparkKey && sparkData.length > 1 && (
          <div className="w-24 flex-shrink-0 opacity-80">
            <Sparkline data={sparkData} dataKey={sparkKey} color={color} height={36} />
          </div>
        )}
      </div>
    </div>
  );
}
