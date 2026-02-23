"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

interface Funnel {
  id: string;
  name: string;
  steps: unknown[] | null;
  created_at: string;
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
  if (!funnels) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Funnels</h1>
        <Link href={`/dashboard/${siteId}/funnels/new`}>
          <Button><Plus className="mr-2 h-4 w-4" /> New Funnel</Button>
        </Link>
      </div>

      {funnels.length === 0 ? (
        <p className="text-muted-foreground">No funnels configured yet. Create one to analyse conversion flows.</p>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnels.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/dashboard/${siteId}/funnels/${f.id}`} className="font-medium text-primary hover:underline">
                        {f.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{Array.isArray(f.steps) ? f.steps.filter((s) => s !== null).length : 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
