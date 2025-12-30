import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.ts';
import { JobSchema } from '../../schemas/job.ts';
import { createPaginatedSchema } from '../../schemas/common.ts';

const JOB_PAGINATED_SCHEMA = createPaginatedSchema(JobSchema);

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: string) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export const useJobsQuery = (page: number, limit: number, status: string, driver: string) => {
  return useQuery({
    queryKey: jobKeys.list(`${page}-${limit}-${status}-${driver}`),
    queryFn: () => 
      api.get(`/jobs?page=${page}&limit=${limit}&status=${status}&driver=${driver}`, JOB_PAGINATED_SCHEMA),
    placeholderData: (previousData) => previousData,
  });
};

export const useJobDetailQuery = (id: string) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.get(`/jobs/${id}`, JobSchema),
    enabled: !!id,
  });
};
