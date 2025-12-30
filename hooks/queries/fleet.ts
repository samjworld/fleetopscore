import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.ts';
import { VehicleSchema, FuelEventSchema } from '../../schemas/fleet.ts';
import { createPaginatedSchema } from '../../schemas/common.ts';
import { z } from 'zod';

const VEHICLE_PAGINATED_SCHEMA = createPaginatedSchema(VehicleSchema);

export const fleetKeys = {
  all: ['fleet'] as const,
  lists: () => [...fleetKeys.all, 'list'] as const,
  list: (filters: string) => [...fleetKeys.lists(), { filters }] as const,
  details: () => [...fleetKeys.all, 'detail'] as const,
  detail: (id: string) => [...fleetKeys.details(), id] as const,
  fuel: (id: string) => [...fleetKeys.detail(id), 'fuel'] as const,
};

export const useVehiclesQuery = (page: number, limit: number, search: string, status: string) => {
  return useQuery({
    queryKey: fleetKeys.list(`${page}-${limit}-${search}-${status}`),
    queryFn: () => 
      api.get(`/fleet/vehicles?page=${page}&limit=${limit}&search=${search}&status=${status}`, VEHICLE_PAGINATED_SCHEMA),
    placeholderData: (previousData) => previousData,
  });
};

export const useVehicleDetailQuery = (id: string) => {
  return useQuery({
    queryKey: fleetKeys.detail(id),
    queryFn: () => api.get(`/fleet/${id}`, VehicleSchema),
    enabled: !!id,
  });
};

export const useFuelHistoryQuery = (vehicleId: string) => {
  return useQuery({
    queryKey: fleetKeys.fuel(vehicleId),
    queryFn: () => api.get(`/fleet/${vehicleId}/fuel`, z.object({ data: z.array(FuelEventSchema) })),
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000, // Fuel logs update less frequently
  });
};
