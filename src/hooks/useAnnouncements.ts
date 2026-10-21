import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { announcementsApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import type { AnnouncementPayload } from '@/types'

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements', 'list'],
    queryFn: announcementsApi.list,
    staleTime: 30_000,
  })
}

export function useAnnouncement(id: number | undefined) {
  return useQuery({
    queryKey: ['announcements', 'detail', id],
    queryFn: () => announcementsApi.detail(id as number),
    enabled: Boolean(id),
  })
}

export function useAnnouncementMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['announcements'] })
    void qc.invalidateQueries({ queryKey: ['metrics'] })
  }

  const create = useMutation({
    mutationFn: (payload: AnnouncementPayload) => announcementsApi.create(payload),
    onSuccess: () => {
      toast.success('Anuncio creado correctamente')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo crear el anuncio')),
  })

  const update = useMutation({
    mutationFn: (vars: { id: number; payload: Partial<AnnouncementPayload> }) =>
      announcementsApi.update(vars.id, vars.payload),
    onSuccess: () => {
      toast.success('Anuncio actualizado correctamente')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo actualizar el anuncio')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => announcementsApi.remove(id),
    onSuccess: () => {
      toast.success('Anuncio eliminado correctamente')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo eliminar el anuncio')),
  })

  const uploadImage = useMutation({
    mutationFn: (vars: { id: number; file: File }) =>
      announcementsApi.uploadImage(vars.id, vars.file),
    onSuccess: () => {
      toast.success('Imagen de fondo actualizada')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo subir la imagen')),
  })

  const removeImage = useMutation({
    mutationFn: (id: number) => announcementsApi.removeImage(id),
    onSuccess: () => {
      toast.success('Imagen quitada')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'No se pudo quitar la imagen')),
  })

  return { create, update, remove, uploadImage, removeImage }
}
