"use client";

import { useEffect, useMemo, useState } from "react";
import type { PermissionName } from "@/lib/rbac";

type AuthzPayload = {
  authenticated: boolean;
  role?: string | null;
  permissions?: string[];
};

export function usePermission(permission: PermissionName) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const payload = (await response.json()) as AuthzPayload;
        if (!mounted) {
          return;
        }

        const granted = new Set(payload.permissions ?? []);
        setAllowed(Boolean(payload.authenticated && granted.has(permission)));
        setRole(payload.role ?? null);
      } catch {
        if (!mounted) {
          return;
        }
        setAllowed(false);
        setRole(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [permission]);

  return { loading, allowed, role };
}

export function usePermissions() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const payload = (await response.json()) as AuthzPayload;
        if (!mounted) {
          return;
        }
        setRole(payload.role ?? null);
        setPermissions(new Set(payload.permissions ?? []));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const hasPermission = useMemo(
    () => (permission: PermissionName | string) => permissions.has(permission),
    [permissions]
  );

  return {
    loading,
    role,
    permissions: Array.from(permissions),
    hasPermission
  };
}
