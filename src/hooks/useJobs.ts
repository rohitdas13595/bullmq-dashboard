import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Job {
  id: string
  name: string
  data: Record<string, unknown>
  opts?: Record<string, unknown>
  progress: number | object
  attemptsMade: number
  failedReason?: string
  stacktrace?: string[]
  returnvalue?: unknown
  finishedOn?: number
  processedOn?: number
  timestamp: number
  queue?: string
}

export interface JobsStats {
  total: number
  waiting: number
  active: number
  completed: number
  failed: number
  errorRate: string
  avgDuration: number
}

export interface JobsResponse {
  jobs: Job[]
  total: number
  stats: JobsStats
}

export function useJobs(params: {
  queue?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}, live: boolean) {
  const searchParams = new URLSearchParams()
  if (params.queue) searchParams.set('queue', params.queue)
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())

  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => apiClient.get<JobsResponse>(`/api/jobs?${searchParams}`),
    refetchInterval: live ? 2000 : false,
  })
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => apiClient.get<Job>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => apiClient.delete(`/api/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}

export function useRetryJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => apiClient.post(`/api/jobs/${jobId}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}

export function useBulkDeleteJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => apiClient.post('/api/jobs/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}
