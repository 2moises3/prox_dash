import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { contentApi, engineApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import type { EngineConfig } from '@/types'

const ENGINE_KEY = ['engine', 'status'] as const

export function useEngineStatus() {
  return useQuery({
    queryKey: ENGINE_KEY,
    queryFn: () => engineApi.status(),
    staleTime: 15_000,
  })
}

export function useUpdateEngineConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: EngineConfig) => engineApi.updateConfig(config),
    onSuccess: (data) => {
      toast.success('Parámetros del motor guardados')
      queryClient.setQueryData(ENGINE_KEY, data)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudieron guardar los parámetros')),
  })
}

export function useResetEngineConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => engineApi.resetConfig(),
    onSuccess: (data) => {
      toast.success('Parámetros restablecidos a los valores de la tesis')
      queryClient.setQueryData(ENGINE_KEY, data)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo restablecer')),
  })
}

export function useSetDestinationInEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, inEngine }: { id: string; inEngine: boolean }) => engineApi.setDestination(id, inEngine),
    onSuccess: (_, variables) => {
      toast.success(variables.inEngine ? 'Destino incluido en el motor' : 'Destino excluido del motor')
      queryClient.invalidateQueries({ queryKey: ENGINE_KEY })
      queryClient.invalidateQueries({ queryKey: ['destinations', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['destinations', 'detail', variables.id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cambiar la participación en el motor')),
  })
}

export function useLoadDestinationContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (overwrite: boolean) => contentApi.load(overwrite),
    onSuccess: (result) => {
      if (result.destinations_updated === 0) {
        toast.info('Los destinos ya tenían todos sus datos. No hubo cambios.')
      } else {
        toast.success(`Datos cargados: ${result.destinations_updated} destinos, ${result.fields_written} campos`)
      }
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
      queryClient.invalidateQueries({ queryKey: ENGINE_KEY })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudieron cargar los datos de los destinos')),
  })
}
