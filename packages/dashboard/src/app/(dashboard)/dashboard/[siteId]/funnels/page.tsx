"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Plus, Filter, ChevronRight } from "lucide-react";

interface Funnel {
  id: string;
  name: string;
  steps: unknown[] | null;
  created_at: string;
}

function FunnelsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
            <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function FunnelsPage() {
  const { siteId } = useParams();
  const [funnels, setFunnels] = useState<Funnel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.funnels
      .list(siteId as string)
      .then((data) => setFunnels((data as { funnels: Funnel[] }).funnels))
      .catch(() => setError("Failed to load funnels"));
  }, [siteId]);

  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Funnels</h1>
        </div>
        <Link href={`/dashboard/${siteId}/funnels/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Funnel
          </Button>
        </Link>
      </div>

      {!funnels ? (
        <FunnelsSkeleton />
      ) : funnels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No funnels configured yet. Create one to analyse conversion flows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {funnels.map((f) => {
            const stepCount = Array.isArray(f.steps)
              ? f.steps.filter((s) => s !== null).length
              : 0;

            return (
              <Link
                key={f.id}
                href={`/dashboard/${siteId}/funnels/${f.id}`}
                className="group"
              >
                <Card className="h-full transition-colors hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {f.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {new Date(f.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className="text-xs tabular-nums"
                        >
                          {stepCount} {stepCount === 1 ? "step" : "steps"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
