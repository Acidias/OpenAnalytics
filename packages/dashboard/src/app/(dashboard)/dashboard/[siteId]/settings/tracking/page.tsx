"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface TrackingRule {
  id: string;
  selector: string;
  eventName: string;
  type: "click" | "visibility";
}

const initialRules: TrackingRule[] = [
  { id: "r1", selector: "button.cta-primary", eventName: "cta_click", type: "click" },
  { id: "r2", selector: ".pricing-card", eventName: "pricing_view", type: "visibility" },
  { id: "r3", selector: "a[href*='signup']", eventName: "signup_link_click", type: "click" },
];

export default function TrackingSettingsPage() {
  const [rules, setRules] = useState<TrackingRule[]>(initialRules);
  const [newSelector, setNewSelector] = useState("");
  const [newEventName, setNewEventName] = useState("");

  const addRule = () => {
    if (!newSelector || !newEventName) return;
    setRules([...rules, { id: `r${Date.now()}`, selector: newSelector, eventName: newEventName, type: "click" }]);
    setNewSelector("");
    setNewEventName("");
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Track Rules</h1>
        <p className="text-muted-foreground mt-1">Define CSS selectors to automatically track user interactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Rule</CardTitle>
          <CardDescription>Track clicks or visibility of elements matching a CSS selector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>CSS Selector</Label>
              <Input placeholder="button.my-class, #my-id" value={newSelector} onChange={(e) => setNewSelector(e.target.value)} />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Event Name</Label>
              <Input placeholder="my_event_name" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} />
            </div>
            <Button onClick={addRule}><Plus className="mr-2 h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Selector</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-sm">{rule.selector}</TableCell>
                  <TableCell className="font-mono text-sm">{rule.eventName}</TableCell>
                  <TableCell><Badge variant="secondary">{rule.type}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button>Save Rules</Button>
    </div>
  );
}
