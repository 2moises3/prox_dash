/**
 * Superficie de API tipada del dashboard.
 * Cada función desenvuelve el envelope { success, message, data } del backend.
 */

import { apiClient } from './apiClient'
import type {
  AdminUser,
  ApiEnvelope,
  Announcement,
  AnnouncementPayload,
  AppRelease,
  AspectScores,
  AuthUser,
  CreateUserPayload,
  DeleteUserMode,
  DestinationDetail,
  DestinationMedia,
  DestinationSummary,
  DestinationUpdatePayload,
  LoginResponse,
  MediaItem,
  MediaType,
  MetricsOverview,
  ReleaseCreatePayload,
  Review,
  UserRole,
} from '@/types'

function unwrap<T>(payload: ApiEnvelope<T>): T {
  return payload.data
}

/* ------------------------------- Auth ------------------------------------- */

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', {
      email,
      password,
    })
    return unwrap(data)
  },
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me')
    return unwrap(data)
  },
}

/* ----------------------------- Destinos ----------------------------------- */

export const destinationsApi = {
  async list(params?: { city?: string; limit?: number }): Promise<DestinationSummary[]> {
    const { data } = await apiClient.get<ApiEnvelope<DestinationSummary[]>>('/destinations', {
      params: { limit: 200, ...params },
    })
    return unwrap(data)
  },
  async detail(id: string): Promise<DestinationDetail> {
    const { data } = await apiClient.get<ApiEnvelope<DestinationDetail>>(`/destinations/${id}`)
    return unwrap(data)
  },
}

export const reviewsApi = {
  async forDestination(id: string): Promise<Review[]> {
    const { data } = await apiClient.get<ApiEnvelope<Review[]>>(`/reviews/destination/${id}`)
    return unwrap(data)
  },
}

export const adminDestinationsApi = {
  /** Lista admin: incluye destinos inactivos (con badge en la UI). */
  async list(): Promise<DestinationSummary[]> {
    const { data } = await apiClient.get<ApiEnvelope<DestinationSummary[]>>('/admin/destinations')
    return unwrap(data)
  },
  async detail(id: string): Promise<DestinationDetail> {
    const { data } = await apiClient.get<ApiEnvelope<DestinationDetail>>(`/admin/destinations/${id}`)
    return unwrap(data)
  },
  async create(payload: import('@/types').DestinationAdminCreate): Promise<{ destination_id: string; destination: string; city?: string | null; region?: string | null; category?: string | null }> {
    const { data } = await apiClient.post<ApiEnvelope<{ destination_id: string; destination: string; city?: string | null; region?: string | null; category?: string | null }>>('/admin/destinations', payload)
    return unwrap(data)
  },
  async setStatus(id: string, isActive: boolean): Promise<DestinationDetail> {
    const { data } = await apiClient.patch<ApiEnvelope<DestinationDetail>>(`/admin/destinations/${id}/status`, { is_active: isActive })
    return unwrap(data)
  },
  async updateAbsaScores(id: string, scores: Partial<AspectScores>): Promise<DestinationDetail> {
    const { data } = await apiClient.patch<ApiEnvelope<DestinationDetail>>(
      `/admin/destinations/${id}/absa-scores`,
      scores,
    )
    return unwrap(data)
  },
  async update(id: string, payload: DestinationUpdatePayload): Promise<DestinationDetail> {
    const { data } = await apiClient.patch<ApiEnvelope<DestinationDetail>>(`/admin/destinations/${id}`, payload)
    return unwrap(data)
  },
  async allMedia(id: string): Promise<import('@/types').DestinationMediaAdmin> {
    const { data } = await apiClient.get<ApiEnvelope<import('@/types').DestinationMediaAdmin>>(`/admin/destinations/${id}/media`)
    return unwrap(data)
  },
  async permanentDelete(destinationId: string, mediaId: number): Promise<void> {
    await apiClient.delete(`/admin/destinations/${destinationId}/media/${mediaId}/permanent`)
  },
  async syncFromMetrics(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/admin/destinations/sync-from-metrics')
    return unwrap(data)
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/admin/destinations/${id}`)
  },
  async mergeInto(sourceId: string, targetId: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post<ApiEnvelope<Record<string, unknown>>>(
      `/admin/destinations/${sourceId}/merge-into/${targetId}`,
    )
    return unwrap(data)
  },
}

/* ----------------------------- Multimedia --------------------------------- */

export const mediaApi = {
  async forDestination(id: string): Promise<DestinationMedia> {
    const { data } = await apiClient.get<ApiEnvelope<DestinationMedia>>(`/destinations/${id}/media`)
    return unwrap(data)
  },
  async upload(
    id: string,
    payload: { file: File; mediaType: MediaType; altText?: string; credit?: string },
    onProgress?: (percent: number) => void,
  ): Promise<MediaItem> {
    const form = new FormData()
    form.append('file', payload.file)
    form.append('media_type', payload.mediaType)
    if (payload.altText) form.append('alt_text', payload.altText)
    if (payload.credit) form.append('credit', payload.credit)

    const { data } = await apiClient.post<{ success: boolean; message: string; media: MediaItem }>(
      `/destinations/${id}/media/upload`,
      form,
      {
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      },
    )
    return data.media
  },
  async patch(
    id: string,
    mediaId: number,
    updates: Partial<{ alt_text: string; position: number; is_active: boolean; credit: string }>,
  ): Promise<MediaItem> {
    const { data } = await apiClient.patch<{ success: boolean; message: string; media: MediaItem }>(
      `/destinations/${id}/media/${mediaId}`,
      updates,
    )
    return data.media
  },
  async remove(id: string, mediaId: number): Promise<void> {
    await apiClient.delete(`/destinations/${id}/media/${mediaId}`)
  },
}

/* ------------------------------ Usuarios ---------------------------------- */

export const usersApi = {
  async list(): Promise<AdminUser[]> {
    const { data } = await apiClient.get<ApiEnvelope<AdminUser[]>>('/admin/users')
    return unwrap(data)
  },
  async getDetails(userId: string): Promise<import('@/types').AdminUserDetails> {
    const { data } = await apiClient.get<ApiEnvelope<import('@/types').AdminUserDetails>>(`/admin/users/${userId}/details`)
    return unwrap(data)
  },
  async create(payload: CreateUserPayload): Promise<AdminUser> {
    const { data } = await apiClient.post<ApiEnvelope<AdminUser>>('/admin/users', payload)
    return unwrap(data)
  },
  async updateRole(userId: string, role: UserRole): Promise<AdminUser> {
    const { data } = await apiClient.patch<ApiEnvelope<AdminUser>>(`/admin/users/${userId}/role`, { role })
    return unwrap(data)
  },
  async updateStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    const { data } = await apiClient.patch<ApiEnvelope<AdminUser>>(`/admin/users/${userId}/status`, { is_active: isActive })
    return unwrap(data)
  },
  async deleteUser(userId: string, mode: DeleteUserMode): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`, { params: { mode } })
  },
  async scheduleDeletion(userId: string, reason: string): Promise<AdminUser> {
    const { data } = await apiClient.post<ApiEnvelope<AdminUser>>(`/admin/users/${userId}/schedule-deletion`, { reason })
    return unwrap(data)
  },
  async cancelDeletion(userId: string): Promise<AdminUser> {
    const { data } = await apiClient.post<ApiEnvelope<AdminUser>>(`/admin/users/${userId}/cancel-deletion`)
    return unwrap(data)
  },
  async processDeletions(): Promise<{ processed: number }> {
    const { data } = await apiClient.post<ApiEnvelope<{ processed: number }>>('/admin/users/process-deletions')
    return unwrap(data)
  },
}

/* ------------------------------ Métricas ---------------------------------- */

export const metricsApi = {
  async overview(): Promise<MetricsOverview> {
    const { data } = await apiClient.get<ApiEnvelope<MetricsOverview>>('/admin/metrics/overview')
    return unwrap(data)
  },
  async charts(): Promise<import('@/types').ChartData> {
    const { data } = await apiClient.get<ApiEnvelope<import('@/types').ChartData>>('/admin/metrics/charts')
    return unwrap(data)
  },
}

/* ------------------------------ Anuncios ---------------------------------- */

export const announcementsApi = {
  async list(): Promise<Announcement[]> {
    const { data } = await apiClient.get<ApiEnvelope<Announcement[]>>('/admin/announcements')
    return unwrap(data)
  },
  async detail(id: number): Promise<Announcement> {
    const { data } = await apiClient.get<ApiEnvelope<Announcement>>(`/admin/announcements/${id}`)
    return unwrap(data)
  },
  async create(payload: AnnouncementPayload): Promise<Announcement> {
    const { data } = await apiClient.post<ApiEnvelope<Announcement>>('/admin/announcements', payload)
    return unwrap(data)
  },
  async update(id: number, payload: Partial<AnnouncementPayload>): Promise<Announcement> {
    const { data } = await apiClient.patch<ApiEnvelope<Announcement>>(
      `/admin/announcements/${id}`,
      payload,
    )
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/admin/announcements/${id}`)
  },
  async uploadImage(id: number, file: File): Promise<Announcement> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<ApiEnvelope<Announcement>>(
      `/admin/announcements/${id}/image`,
      form,
    )
    return unwrap(data)
  },
}

/* ------------------------------ Releases ---------------------------------- */

export const releasesApi = {
  async list(): Promise<AppRelease[]> {
    const { data } = await apiClient.get<ApiEnvelope<AppRelease[]>>('/admin/releases')
    return unwrap(data)
  },
  async create(payload: ReleaseCreatePayload, onProgress?: (percent: number) => void): Promise<AppRelease> {
    const form = new FormData()
    form.append('version_name', payload.version_name)
    form.append('version_code', String(payload.version_code))
    form.append('platform', payload.platform)
    if (payload.changelog) form.append('changelog', payload.changelog)
    if (payload.apk_url) form.append('apk_url', payload.apk_url)
    if (payload.file) form.append('file', payload.file)

    const { data } = await apiClient.post<ApiEnvelope<AppRelease>>('/admin/releases', form, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    return unwrap(data)
  },
  async update(id: number, payload: Partial<{ version_name: string; version_code: number; platform: string; changelog: string }>): Promise<AppRelease> {
    const { data } = await apiClient.patch<ApiEnvelope<AppRelease>>(`/admin/releases/${id}`, payload)
    return unwrap(data)
  },
  async publish(id: number, isPublished: boolean): Promise<AppRelease> {
    const { data } = await apiClient.patch<ApiEnvelope<AppRelease>>(`/admin/releases/${id}/publish`, { is_published: isPublished })
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/admin/releases/${id}`)
  },
}

/* ------------------------------- Importación ------------------------------ */

export type ImportType = 'absa' | 'tags' | 'clima' | 'aforo'

export interface ImportResult {
  type: ImportType
  rows_processed?: number
  destinations_created?: number
  scores_updated?: number
  records_updated?: number
  errors?: number
  status?: string
  message?: string
}

export const importApi = {
  async upload(type: ImportType, file: File): Promise<ImportResult> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<ApiEnvelope<ImportResult>>(
      `/admin/import/${type}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return unwrap(data)
  },
}

/* ------------------------------- Salud ------------------------------------ */

export interface HealthStatus {
  status: string
  service: string
  version: string
}

export const systemApi = {
  async health(): Promise<HealthStatus> {
    const { data } = await apiClient.get<HealthStatus>('/health')
    return data
  },
}
