"use client";

import { useRealtimeActivity } from "@/hooks/use-realtime-activity";

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const events = useRealtimeActivity(limit);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="text-base font-semibold">Live Activity Feed</h3>
      <div className="mt-4 space-y-3">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="rounded-xl border p-3">
              <div className="text-sm font-medium">{event.event_name}</div>
              <div className="text-xs text-muted-foreground">{event.event_type}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(event.occurred_at).toLocaleString()}
                {event.dashboard_slug ? ` • ${event.dashboard_slug}` : ""}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No activity events yet.</div>
        )}
      </div>
    </div>
  );
}
