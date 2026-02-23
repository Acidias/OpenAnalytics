"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWebSocketURL, api } from "@/lib/api";
import { Zap } from "lucide-react";

interface LiveEvent {
  time: string;
  event: string;
  path?: string;
  country?: string;
  session_id?: string;
}

const MAX_EVENTS = 50;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function LiveSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero card skeleton */}
      <div className="rounded-lg border bg-card p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="h-12 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        </div>
      </div>
      {/* Feed skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="h-5 w-32 rounded bg-muted animate-pulse mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getEventDotColour(event: string): string {
  if (event === "pageview") return "bg-emerald-500";
  if (event === "engage") return "bg-blue-500";
  return "bg-amber-500";
}

export default function LivePage() {
  const { siteId } = useParams();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Load recent events from the DB so the page shows current visitors immediately
  useEffect(() => {
    api.analytics
      .liveRecent(siteId as string)
      .then((data) => {
        const recent = (data.events as LiveEvent[]).map((e) => ({
          ...e,
          time: e.time || new Date().toISOString(),
        }));
        setEvents(recent);
      })
      .catch(() => {
        // Non-critical - WebSocket will provide events shortly
      })
      .finally(() => setInitialLoading(false));
  }, [siteId]);

  // WebSocket for real-time streaming
  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const { ticket } = await api.auth.wsTicket(siteId as string);
        if (cancelled) return;

        const url = getWebSocketURL(`/api/sites/${siteId}/live?ticket=${ticket}`);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data) as LiveEvent;
            setEvents((prev) => [data, ...prev].slice(0, MAX_EVENTS));
          } catch {
            // ignore malformed messages
          }
        };
      } catch {
        setConnected(false);
      }
    };

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [siteId]);

  // Compute active visitors from recent sessions
  const now = Date.now();
  const activeSessions = new Set(
    events
      .filter((e) => now - new Date(e.time).getTime() < ACTIVE_WINDOW_MS)
      .map((e) => e.session_id)
      .filter(Boolean)
  );

  function timeAgo(time: string) {
    const diff = Math.round((now - new Date(time).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (initialLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-semibold">Live</h1>
        </div>
        <LiveSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Zap className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-semibold">Live</h1>
        <div className="flex items-center gap-2 ml-2">
          <span className="relative flex h-3 w-3">
            {connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400" />
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Active visitors hero card */}
      <Card className="overflow-hidden border-0">
        <div className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 mb-4">
                <Zap className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-6xl font-bold tabular-nums">
                {activeSessions.size}
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                active visitors in the last 5 minutes
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Live event feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Live Event Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">
                Waiting for events... Visit your site to see live data.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((e, i) => (
                <div
                  key={`${e.session_id}-${e.time}-${i}`}
                  className="flex items-center gap-3 text-sm rounded-md px-3 py-2 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-300"
                  style={{ animationDelay: `${i * 20}ms`, animationFillMode: "backwards" }}
                >
                  {/* Coloured dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getEventDotColour(e.event)}`}
                    />
                  </span>

                  {/* Event type badge */}
                  <Badge
                    variant="outline"
                    className="text-xs font-medium min-w-[72px] justify-center"
                  >
                    {e.event}
                  </Badge>

                  {/* Path */}
                  <span className="font-mono text-muted-foreground truncate">
                    {e.path || "-"}
                  </span>

                  {/* Country */}
                  {e.country && (
                    <Badge
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      {e.country}
                    </Badge>
                  )}

                  {/* Timestamp */}
                  <span className="text-xs text-muted-foreground ml-auto shrink-0 tabular-nums">
                    {timeAgo(e.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
