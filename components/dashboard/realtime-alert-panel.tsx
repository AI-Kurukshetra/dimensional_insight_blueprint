"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { demoOverview } from "@/lib/demo-data";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { AlertItem } from "@/lib/types";

export function RealtimeAlertPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>(demoOverview.alerts);

  useEffect(() => {
    let mounted = true;

    fetch("/api/alerts")
      .then((response) => response.json())
      .then((data: AlertItem[]) => {
        if (mounted) {
          setAlerts(data);
        }
      })
      .catch(() => undefined);

    if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
      return () => {
        mounted = false;
      };
    }

    const supabase = createClient();
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetch("/api/alerts")
            .then((response) => response.json())
            .then((data: AlertItem[]) => {
              if (mounted) {
                setAlerts(data);
              }
            })
            .catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return <AlertsList alerts={alerts} />;
}
