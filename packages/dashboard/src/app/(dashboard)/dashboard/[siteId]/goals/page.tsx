"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockGoals } from "@/lib/mock-data";
import { Plus, Target } from "lucide-react";

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
        <Button><Plus className="mr-2 h-4 w-4" /> New Goal</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockGoals.map((goal) => {
          const progress = (goal.current / goal.goal) * 100;
          return (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="capitalize">{goal.period}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold">{typeof goal.current === "number" && goal.current % 1 !== 0 ? goal.current.toFixed(1) : goal.current}</span>
                    <span className="text-muted-foreground ml-1">/ {goal.goal}</span>
                  </div>
                  <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Tracking: <span className="font-mono">{goal.target}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
