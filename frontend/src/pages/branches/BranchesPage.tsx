import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import type { Branch, City, LocationType } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { SubNavigation, type SubNavigationItem } from '@/shared/ui/SubNavigation';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import {
  type TabType,
  type EnrichedLocation,
  useBranchesData,
  BranchFilters,
  BranchesTable,
  LocationsTable,
  CitiesTable,
  BranchFormDialog,
  AddLocationDialog,
  EditLocationDialog,
  AssignWarehouseDialog,
  CityFormDialog,
} from '@/features/branches';

export function BranchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('branches');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modals state: Sucursales
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // Modals state: Ubicaciones
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [locationBranchTarget, setLocationBranchTarget] = useState<Branch | null>(null);
  const [addLocationType, setAddLocationType] = useState<LocationType>('WAREHOUSE');
  const [locationToEdit, setLocationToEdit] = useState<EnrichedLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<EnrichedLocation | null>(null);
  const [branchForAssignWarehouse, setBranchForAssignWarehouse] = useState<Branch | null>(null);

  // Modals state: Ciudades
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [cityToEdit, setCityToEdit] = useState<City | null>(null);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  const {
    branches,
    cities,
    isLoadingBranches,
    filteredBranches,
    filteredWarehouses,
    filteredPos,
    filteredCities,
    allWarehouses,
    deleteBranch,
    isDeletingBranch,
    deleteLocation,
    isDeletingLocation,
    unassignWarehouse,
    isUnassigningWarehouse,
    deleteCity,
    isDeletingCity,
  } = useBranchesData({ searchTerm, cityFilter, branchFilter });

  const navigationTabs: SubNavigationItem[] = [
    { id: 'branches', label: 'Sucursales', count: branches.length, badgeVariant: 'default' },
    { id: 'warehouses', label: 'Almacenes', count: allWarehouses.length, badgeVariant: 'warning' },
    { id: 'pos', label: 'Puntos de Venta (POS)', count: filteredPos.length, badgeVariant: 'success' },
    { id: 'cities', label: 'Ciudades', count: cities.length, badgeVariant: 'secondary' },
  ];

  const handleOpenAddLocation = (targetBranch?: Branch | null, type?: LocationType) => {
    setLocationBranchTarget(targetBranch || null);
    setAddLocationType(type || (activeTab === 'pos' ? 'SALES_FLOOR' : 'WAREHOUSE'));
    setIsAddLocationOpen(true);
  };

  const handleViewLocationsForBranch = (branchId: string, type: 'WAREHOUSE' | 'SALES_FLOOR') => {
    setBranchFilter(branchId);
    setActiveTab(type === 'WAREHOUSE' ? 'warehouses' : 'pos');
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Gestión de Sucursales, Almacenes y Ciudades</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Control de tiendas físicas, depósitos internos, mostradores POS y ciudades de cobertura
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cities' ? (
            <Button
              onClick={() => {
                setCityToEdit(null);
                setIsCityDialogOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Ciudad</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                setBranchToEdit(null);
                setIsBranchDialogOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Sucursal</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. SubNavigation Tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <SubNavigation
          items={navigationTabs}
          activeId={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as TabType);
            setBranchFilter('ALL');
            if (tabId === 'cities') {
              setCityFilter('ALL');
            }
          }}
          variant="pills"
        />
      </div>

      {/* 3. Filters */}
      <BranchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        cities={cities}
        branches={branches}
        showCityFilter={activeTab !== 'cities'}
        showBranchFilter={activeTab !== 'branches' && activeTab !== 'cities'}
        searchPlaceholder={
          activeTab === 'branches'
            ? 'Buscar sucursal por nombre o dirección...'
            : activeTab === 'warehouses'
            ? 'Buscar almacén o sucursal...'
            : activeTab === 'pos'
            ? 'Buscar mostrador POS o sucursal...'
            : 'Buscar ciudad o región...'
        }
      />

      {/* 4. Active Tab Content */}
      {activeTab === 'branches' && (
        <BranchesTable
          branches={filteredBranches}
          isLoading={isLoadingBranches}
          onEdit={(b) => {
            setBranchToEdit(b);
            setIsBranchDialogOpen(true);
          }}
          onDelete={(b) => setBranchToDelete(b)}
          onAddLocation={(b, type) => handleOpenAddLocation(b, type)}
          onAssignWarehouse={(b) => setBranchForAssignWarehouse(b)}
          onViewLocations={handleViewLocationsForBranch}
        />
      )}

      {activeTab === 'warehouses' && (
        <LocationsTable
          type="WAREHOUSE"
          locations={filteredWarehouses}
          isLoading={isLoadingBranches}
          onAddNew={() => handleOpenAddLocation(null, 'WAREHOUSE')}
          onEdit={(loc) => setLocationToEdit(loc)}
          onDelete={(loc) => setLocationToDelete(loc)}
          onUnassign={(loc) => unassignWarehouse({ branchId: branchFilter, warehouseId: loc.id })}
          isUnassigning={isUnassigningWarehouse}
        />
      )}

      {activeTab === 'pos' && (
        <LocationsTable
          type="SALES_FLOOR"
          locations={filteredPos}
          isLoading={isLoadingBranches}
          onAddNew={() => handleOpenAddLocation(null, 'SALES_FLOOR')}
          onEdit={(loc) => setLocationToEdit(loc)}
          onDelete={(loc) => setLocationToDelete(loc)}
        />
      )}

      {activeTab === 'cities' && (
        <CitiesTable
          cities={filteredCities}
          isLoading={isLoadingBranches}
          onAddNew={() => {
            setCityToEdit(null);
            setIsCityDialogOpen(true);
          }}
          onEdit={(city) => {
            setCityToEdit(city);
            setIsCityDialogOpen(true);
          }}
          onDelete={(city) => setCityToDelete(city)}
          onViewBranchesForCity={(cityName) => {
            setCityFilter(cityName);
            setActiveTab('branches');
          }}
        />
      )}

      {/* 5. Dialogs */}
      <BranchFormDialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen} branchToEdit={branchToEdit} />
      <AddLocationDialog
        open={isAddLocationOpen}
        onOpenChange={setIsAddLocationOpen}
        branchTarget={locationBranchTarget}
        branches={branches}
        defaultType={addLocationType}
      />
      <EditLocationDialog
        open={Boolean(locationToEdit)}
        onOpenChange={(open) => !open && setLocationToEdit(null)}
        location={locationToEdit}
        branches={branches}
      />
      <AssignWarehouseDialog
        open={Boolean(branchForAssignWarehouse)}
        onOpenChange={(open) => !open && setBranchForAssignWarehouse(null)}
        branch={branchForAssignWarehouse}
        availableWarehouses={allWarehouses}
      />
      <CityFormDialog
        open={isCityDialogOpen}
        onOpenChange={setIsCityDialogOpen}
        cityToEdit={cityToEdit}
      />

      {/* Confirm Delete Modals */}
      <ConfirmDeleteDialog
        open={Boolean(branchToDelete)}
        onClose={() => setBranchToDelete(null)}
        onConfirm={() => branchToDelete && deleteBranch(branchToDelete.id)}
        title="¿Dar de baja esta sucursal?"
        itemName={branchToDelete?.name}
        description="La sucursal pasará a estado inactivo (Baja Lógica). Se conservará intacto todo su historial de ventas pasadas, movimientos de inventario y trazabilidad contable."
        confirmText="Dar de baja"
        isPending={isDeletingBranch}
      />

      <ConfirmDeleteDialog
        open={Boolean(locationToDelete)}
        onClose={() => setLocationToDelete(null)}
        onConfirm={() => locationToDelete && deleteLocation(locationToDelete.id)}
        title={locationToDelete?.type === 'SALES_FLOOR' ? '¿Desactivar punto POS?' : '¿Desactivar almacén?'}
        itemName={locationToDelete?.name}
        description="La ubicación se desactivará de forma segura (Baja Lógica). Se desvincularán los accesos compartidos conservando el registro histórico para auditoría."
        confirmText="Desactivar"
        isPending={isDeletingLocation}
      />

      <ConfirmDeleteDialog
        open={Boolean(cityToDelete)}
        onClose={() => setCityToDelete(null)}
        onConfirm={() => cityToDelete && deleteCity(cityToDelete.id)}
        title="¿Eliminar esta ciudad?"
        itemName={cityToDelete?.name}
        description="Solo se puede eliminar una ciudad si no tiene ninguna sucursal activa asignada a ella."
        confirmText="Eliminar Ciudad"
        isPending={isDeletingCity}
      />
    </div>
  );
}
