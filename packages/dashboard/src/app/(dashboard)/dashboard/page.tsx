"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockSites } from "@/lib/mock-data";
import { Plus, Globe, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground mt-1">Manage and view analytics for your websites</p>
        </div>
        <Link href="/settings/sites/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Site</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockSites.map((site) => (
          <Link key={site.id} href={`/dashboard/${site.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{site.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{site.domain}</p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-2xl font-bold">12.8K</span>
                    <span className="text-muted-foreground ml-2">visitors this month</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
