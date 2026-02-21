"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockFunnels } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function FunnelsPage() {
  const { siteId } = useParams();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Funnels</h1>
        <Link href={`/dashboard/${siteId}/funnels/new`}>
          <Button><Plus className="mr-2 h-4 w-4" /> New Funnel</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Steps</TableHead>
                <TableHead className="text-right">Entered</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFunnels.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link href={`/dashboard/${siteId}/funnels/${f.id}`} className="font-medium text-primary hover:underline">
                      {f.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{f.steps}</TableCell>
                  <TableCell className="text-right">{f.totalEntered.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{f.conversionRate}%</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{f.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
