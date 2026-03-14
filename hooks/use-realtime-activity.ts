"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type ActivityEvent = {
  id: string;
  event_name: string;
  event_type: string;
  dashboard_slug: string | null;
  occurred_at: string;
  payload?: Record<string, unknown>;
};

export function useRealtimeActivity(limit = 20) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const enabled = useMemo(
    () => Boolean(getSupabaseUrl() && getSupabaseAnonKey()),
    []
  );

  useEffect(() => {
    let mounted = true;

    fetch(`/api/admin/activity?limit=${limit}`)
      .then((response) => response.json())
      .then((data: ActivityEvent[]) => {
        if (mounted) {
          setEvents(data);
        }
      })
      .catch(() => undefined);

    if (!enabled) {
      return () => {
        mounted = false;
      };
    }

    const supabase = createClient();

    const channel = supabase
      .channel("healthscope-activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_events" },
        (payload) => {
          if (!mounted) {
            return;
          }

          const next = payload.new as ActivityEvent;
          setEvents((prev) => [next, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, limit]);

  return events;
}
