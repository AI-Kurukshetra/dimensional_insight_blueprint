import { create } from "zustand";

type PlatformState = {
  selectedOrganizationId?: string;
  selectedFacilityId?: string;
  setSelectedOrganizationId: (organizationId: string) => void;
  setSelectedFacilityId: (facilityId: string) => void;
};

export const usePlatformStore = create<PlatformState>((set) => ({
  selectedOrganizationId: undefined,
  selectedFacilityId: undefined,
  setSelectedOrganizationId: (selectedOrganizationId) => set({ selectedOrganizationId }),
  setSelectedFacilityId: (selectedFacilityId) => set({ selectedFacilityId })
}));
