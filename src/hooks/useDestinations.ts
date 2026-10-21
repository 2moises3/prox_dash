import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminDestinationsApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import type { AspectScores, DestinationAdminCreate } from '@/types'

export function useDestinations() {
  return useQuery({
    // Lista admin: incluye inactivos para poder gestionarlos con badge.
    queryKey: ['destinations', 'list'],
    queryFn: () => adminDestinationsApi.list(),
    staleTime: 60_000,
  })
}

export function useSetDestinationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminDestinationsApi.setStatus(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Destino activado' : 'Destino desactivado')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['destinations', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del destino')),
  })
}

export function useDestinationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['destinations', 'detail', id],
    queryFn: () => adminDestinationsApi.detail(id as string),
    enabled: Boolean(id),
  })
}

export function useDestinationReviews(id: string | undefined) {
  return useQuery({
    queryKey: ['destinations', 'reviews', id],
    queryFn: () => import('@/api/endpoints').then(m => m.reviewsApi.forDestination(id as string)),
    enabled: Boolean(id),
  })
}

export function useCreateDestination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DestinationAdminCreate) => adminDestinationsApi.create(payload),
    onSuccess: () => {
      toast.success('Destino creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo crear el destino')),
  })
}

export function useUpdateDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminDestinationsApi.update>[1] }) =>
      adminDestinationsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['destinations', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
    },
  })
}

export function useUpdateAbsaScores() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scores }: { id: string; scores: Partial<AspectScores> }) =>
      adminDestinationsApi.updateAbsaScores(id, scores),
    onSuccess: (_, variables) => {
      toast.success('Puntajes ABSA actualizados')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'detail', variables.id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudieron guardar los puntajes ABSA')),
  })
}

export function useSyncFromMetrics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminDestinationsApi.syncFromMetrics(),
    onSuccess: () => {
      toast.success('Sincronización completada')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo sincronizar con las métricas')),
  })
}

export function useDeleteDestination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminDestinationsApi.remove(id),
    onSuccess: () => {
      toast.success('Destino eliminado permanentemente')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo eliminar el destino')),
  })
}

export function useMergeDestination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      adminDestinationsApi.mergeInto(sourceId, targetId),
    onSuccess: () => {
      toast.success('Destinos fusionados correctamente')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo fusionar los destinos')),
  })
}

export function useSetReviewHidden(destinationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, hidden }: { reviewId: string; hidden: boolean }) =>
      import('@/api/endpoints').then((m) => m.reviewsApi.setHidden(reviewId, hidden)),
    onSuccess: (_, vars) => {
      toast.success(vars.hidden ? 'Reseña oculta para los viajeros' : 'Reseña visible de nuevo')
      queryClient.invalidateQueries({ queryKey: ['destinations', 'reviews', destinationId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cambiar la visibilidad')),
  })
}
