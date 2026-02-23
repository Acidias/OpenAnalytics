"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWebSocketURL, api } from "@/lib/api";
import { getToken } from "@/lib/auth";
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

export default function LivePage() {
  const { siteId } = useParams();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
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
      });
  }, [siteId]);

  // WebSocket for real-time streaming
  useEffect(() => {
    const token = getToken();
    const url = getWebSocketURL(`/api/sites/${siteId}/live${token ? `?token=${token}` : ""}`);
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

    return () => {
      ws.close();
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Live</h1>
        <div className="flex items-center gap-2">
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
          <span className="text-muted-foreground text-sm">{connected ? "Connected" : "Connecting..."}</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <div className="text-5xl font-bold">{activeSessions.size}</div>
            <p className="text-muted-foreground mt-2">active visitors (last 5 min)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Event Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Waiting for events... Visit your site to see live data.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Badge variant="outline" className="text-xs">{e.event}</Badge>
                  <span className="font-mono text-muted-foreground">{e.path || "-"}</span>
                  {e.country && <Badge variant="secondary" className="text-xs">{e.country}</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">{timeAgo(e.time)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
