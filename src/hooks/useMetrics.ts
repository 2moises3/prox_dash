import { useQuery } from '@tanstack/react-query'
import { metricsApi, systemApi } from '@/api/endpoints'

export function useMetricsOverview() {
  return useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: metricsApi.overview,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useChartMetrics() {
  return useQuery({
    queryKey: ['metrics', 'charts'],
    queryFn: metricsApi.charts,
    staleTime: 300_000, // 5 min
    retry: 1,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['metrics', 'activity'],
    queryFn: () => metricsApi.activity(6),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDashboardPriorities() {
  return useQuery({
    queryKey: ['metrics', 'priorities'],
    queryFn: metricsApi.priorities,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: systemApi.health,
    staleTime: 30_000,
    retry: 0,
    refetchInterval: 60_000,
  })
}
