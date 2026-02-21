"use client";

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

export function FunnelChart({ steps }: FunnelChartProps) {
  const maxVisitors = steps[0]?.visitors || 1;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const width = (step.visitors / maxVisitors) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{step.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{step.visitors.toLocaleString()} visitors</span>
                {i > 0 && (
                  <span className="text-red-500 text-xs">-{step.dropoff.toFixed(1)}%</span>
                )}
              </div>
            </div>
            <div className="h-10 w-full rounded-md bg-muted overflow-hidden">
              <div
                className="h-full rounded-md bg-primary transition-all duration-500"
                style={{ width: `${width}%`, opacity: 1 - i * 0.15 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
