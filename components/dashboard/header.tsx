"use client";

import { ChevronDown, Download, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformStore } from "@/stores/platform-store";
import type { Facility, UserProfile } from "@/lib/types";

export function DashboardHeader({
  user,
  facilities
}: {
  user: UserProfile;
  facilities: Facility[];
}) {
  const selectedFacilityId = usePlatformStore((state) => state.selectedFacilityId);
  const setSelectedFacilityId = usePlatformStore((state) => state.setSelectedFacilityId);

  return (
    <div className="flex flex-col gap-4 border-b bg-white/70 px-6 py-5 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">HealthScope Analytics Suite</h1>
          <Badge variant="success">HIPAA-aware design</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Modular dashboards, tenant-aware access controls, and FHIR-ready integration workflows.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full min-w-[240px] md:w-[280px]">
          <Select
            value={selectedFacilityId ?? user.defaultFacilityId}
            onValueChange={setSelectedFacilityId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export report
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 justify-between rounded-xl border px-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {user.fullName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-semibold">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Role: {user.role}
            </DropdownMenuItem>
            <DropdownMenuItem>{user.email}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
