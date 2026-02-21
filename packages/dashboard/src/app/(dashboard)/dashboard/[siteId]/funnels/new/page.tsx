"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface FunnelStep {
  name: string;
  type: "pageview" | "event";
  match: string;
}

export default function NewFunnelPage() {
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<FunnelStep[]>([
    { name: "Step 1", type: "pageview", match: "/" },
    { name: "Step 2", type: "pageview", match: "" },
  ]);

  const addStep = () => {
    setSteps([...steps, { name: `Step ${steps.length + 1}`, type: "pageview", match: "" }]);
  };

  const removeStep = (i: number) => {
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, field: keyof FunnelStep, value: string) => {
    const newSteps = [...steps];
    newSteps[i] = { ...newSteps[i], [field]: value };
    setSteps(newSteps);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Funnel</h1>
        <p className="text-muted-foreground mt-1">Define steps to track conversion flow</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Funnel Name</Label>
            <Input id="name" placeholder="e.g., Signup Flow" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Step Name</Label>
                    <Input placeholder="Step name" value={step.name} onChange={(e) => updateStep(i, "name", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Match Type</Label>
                    <Select value={step.type} onValueChange={(v) => updateStep(i, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pageview">Page View</SelectItem>
                        <SelectItem value="event">Custom Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{step.type === "pageview" ? "URL Pattern" : "Event Name"}</Label>
                  <Input placeholder={step.type === "pageview" ? "/pricing" : "signup_click"} value={step.match} onChange={(e) => updateStep(i, "match", e.target.value)} />
                </div>
              </div>
              {steps.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => removeStep(i)} className="mt-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addStep} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Step
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button>Create Funnel</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}
