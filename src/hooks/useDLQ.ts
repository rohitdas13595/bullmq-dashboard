import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface DLQOverview {
  total: number
  health: 'Healthy' | 'Low' | 'Medium' | 'High'
  topReason: string
  pendingRetry: number
  failureTypes: number
  byQueue: Record<string, number>
  failureDistribution: { reason: string; count: number }[]
}

export interface DLQJob {
  id: string
  name: string
  failedReason?: string
  attemptsMade: number
  timestamp: number
  data: Record<string, unknown>
  stacktrace?: string[]
}

export function useDLQOverview(live: boolean) {
  return useQuery({
    queryKey: ['dlq', 'overview'],
    queryFn: () => apiClient.get<DLQOverview>('/api/dlq'),
    refetchInterval: live ? 2000 : false,
  })
}

export function useDLQJobs(queue: string, params: {
  reason?: string
  sort?: string
  search?: string
  page?: number
  limit?: number
}, live: boolean) {
  const searchParams = new URLSearchParams()
  if (params.reason) searchParams.set('reason', params.reason)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.search) searchParams.set('search', params.search)
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())

  return useQuery({
    queryKey: ['dlq', queue, params],
    queryFn: () => apiClient.get<{ jobs: DLQJob[]; total: number }>(`/api/dlq/${queue}?${searchParams}`),
    refetchInterval: live ? 2000 : false,
    enabled: !!queue,
  })
}

export function useRetryDLQJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ queue, jobId }: { queue: string; jobId: string }) =>
      apiClient.post(`/api/dlq/${queue}/${jobId}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlq'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}

export function useRetryAllDLQ() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (queue: string) => apiClient.post(`/api/dlq/${queue}/retry-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlq'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}

export function usePurgeDLQ() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (queue: string) => apiClient.delete(`/api/dlq/${queue}/purge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlq'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}
