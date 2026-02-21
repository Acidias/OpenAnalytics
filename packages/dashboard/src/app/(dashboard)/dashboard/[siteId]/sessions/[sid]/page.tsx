"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSessionTimeline } from "@/lib/mock-data";
import { Eye, MousePointerClick, ArrowDownRight, Sparkles, FileText } from "lucide-react";

const eventIcons: Record<string, React.ReactNode> = {
  pageview: <Eye className="h-4 w-4" />,
  click: <MousePointerClick className="h-4 w-4" />,
  scroll: <ArrowDownRight className="h-4 w-4" />,
  engage: <Sparkles className="h-4 w-4" />,
  custom: <FileText className="h-4 w-4" />,
};

const eventColors: Record<string, string> = {
  pageview: "bg-blue-500",
  click: "bg-amber-500",
  scroll: "bg-emerald-500",
  engage: "bg-purple-500",
  custom: "bg-pink-500",
};

export default function SessionDetailPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session Timeline</h1>
        <p className="text-muted-foreground mt-1">Visitor journey from start to finish</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Duration</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">5m 42s</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pages Viewed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">5</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mockSessionTimeline.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Device</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">Desktop</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {mockSessionTimeline.map((event, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${eventColors[event.type] || "bg-muted"} ring-4 ring-background`} />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {eventIcons[event.type]}
                      <span className="font-medium text-sm capitalize">{event.type === "custom" ? event.name : event.type}</span>
                      <Badge variant="outline" className="text-xs">{event.url}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {event.type === "pageview" && (
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>Duration: {event.duration}s</span>
                        <span>Scroll: {event.scrollDepth}%</span>
                      </div>
                    )}

                    {event.properties && (
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(event.properties).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: <span className="text-foreground">{String(v)}</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
