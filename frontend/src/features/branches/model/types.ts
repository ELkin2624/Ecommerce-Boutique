import type { LocationType, Branch } from '@/shared/types/api';

export type TabType = 'branches' | 'warehouses' | 'pos' | 'cities';

export interface EnrichedLocation {
  id: string;
  name: string;
  type: LocationType;
  stocksCount: number;
  branch: {
    id: string;
    name: string;
    address: string;
    city?: { id: string; name: string };
  };
  sharedByBranches?: Array<{
    id: string;
    name: string;
    address: string;
    city?: { id: string; name: string };
  }>;
  isShared?: boolean;
}

export interface BranchModalsState {
  isBranchDialogOpen: boolean;
  branchToEdit: Branch | null;
  branchToDelete: Branch | null;
  isAddLocationOpen: boolean;
  locationBranchTarget: Branch | null;
  addLocationType: LocationType;
  locationToEdit: EnrichedLocation | null;
  locationToDelete: EnrichedLocation | null;
  branchForAssignWarehouse: Branch | null;
}
