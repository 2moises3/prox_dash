import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usersApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import type { CreateUserPayload, DeleteUserMode, UserRole } from '@/types'

export function useUsers() {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.list(),
    staleTime: 30_000,
  })
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['users', 'details', userId],
    queryFn: () => (userId ? usersApi.getDetails(userId) : Promise.reject('No ID')),
    enabled: !!userId,
    staleTime: 60_000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success('Usuario creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo crear el usuario')),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => {
      toast.success('Rol actualizado')
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cambiar el rol')),
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.updateStatus(userId, isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Usuario activado' : 'Usuario desactivado')
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del usuario')),
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => usersApi.resetPassword(userId),
    // Sin onSuccess/toast con datos: la contraseña solo se muestra en el diálogo.
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, mode }: { userId: string; mode: DeleteUserMode }) =>
      usersApi.deleteUser(userId, mode),
    onSuccess: (_, variables) => {
      const msg = variables.mode === 'full'
        ? 'Usuario y datos eliminados'
        : 'Datos del usuario limpiados'
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo procesar la eliminación')),
  })
}

export function useScheduleDeletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      usersApi.scheduleDeletion(userId, reason),
    onSuccess: (data) => {
      const formattedDate = data.deletion_scheduled_at 
        ? new Date(data.deletion_scheduled_at).toLocaleString() 
        : 'finalizar el periodo de gracia';
      toast.success(`Eliminación programada para ${formattedDate}`)
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo programar la eliminación')),
  })
}

export function useCancelDeletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.cancelDeletion(userId),
    onSuccess: () => {
      toast.success('Eliminación cancelada')
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo cancelar la eliminación')),
  })
}

export function useProcessDeletions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => usersApi.processDeletions(),
    onSuccess: (data) => {
      toast.success(`Se procesaron ${data.processed} eliminaciones pendientes`)
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al procesar eliminaciones')),
  })
}
