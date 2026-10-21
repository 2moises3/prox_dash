/**
 * Tipos de dominio alineados con los contratos reales del backend PROXVEL.
 * Patrón de respuesta del backend: { success, message, data, count? }.
 */

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  count?: number
  detail?: string
}

export type UserRole = 'traveler' | 'admin' | 'super_admin'

export interface AuthUser {
  user_id: string
  name: string | null
  email: string
  role: UserRole
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

/** Usuario en la vista de administración (6B). */
export interface AdminUser {
  user_id: string
  name: string | null
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  avatar_url?: string | null
  account_status: string
  deletion_requested_at?: string | null
  deletion_scheduled_at?: string | null
  deleted_at?: string | null
  deletion_reason?: string | null
  deletion_requested_by?: string | null
}

/** Detalles completos de usuario (Extensión de lectura) */
export interface AdminUserDetails extends AdminUser {
  favorites_count: number
  aspects: string[]
}

/** Payload para crear usuario desde el dashboard (Extensión 6B). */
export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: 'admin' | 'traveler'
}

/** Modo de eliminación de usuario (Extensión 6B). */
export type DeleteUserMode = 'data_only' | 'full'

/** Versión de la APP (Release Manager, 6B). */
export interface AppRelease {
  id: number
  version_name: string
  version_code: number
  platform: string
  apk_url: string | null
  file_public_id: string | null
  file_size: number | null
  changelog: string | null
  is_published: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseCreatePayload {
  version_name: string
  version_code: number
  platform: string
  changelog?: string
  apk_url?: string
  file?: File
}

/* -------------------------------------------------------------------------- */
/* Destinos                                                                    */
/* -------------------------------------------------------------------------- */

export interface DestinationSummary {
  destination_id: string
  destination: string
  city: string | null
  category: string | null
  region: string | null
  cover_image_url: string | null
  is_active: boolean
  /** Participa en las recomendaciones (independiente de is_active). */
  in_engine?: boolean
  /** Nivel de costo estimado (dato editorial; no entra al motor). */
  cost_level?: string | null
  data_status?: string | null
}

export interface AspectScores {
  accesibilidad: number | null
  aforo_multitudes: number | null
  alojamiento: number | null
  atencion_servicio: number | null
  atractivos: number | null
  clima: number | null
  costos: number | null
  gastronomia: number | null
  limpieza: number | null
  seguridad: number | null
}

export interface ContextScores {
  weather_score: number | null
  crowd_score: number | null
  weather_category: string | null
  crowd_level: string | null
}

export interface TourismInfo {
  altitude_m?: number | null
  description?: string | null
  activities_summary?: string | null
  visitor_info_summary?: string | null
  accessibility_summary?: string | null
  /** Ej. "Medio día", "2 a 3 días". */
  recommended_duration?: string | null
  how_to_get?: string | null
  /** facil | moderada | exigente */
  difficulty?: string | null
  official_website?: string | null
  latitude?: number | null
  longitude?: number | null
  gallery_images?: string[]
}

export interface DestinationDetail extends DestinationSummary {
  aspect_scores: AspectScores | null
  context: ContextScores | null
  weather_detail: Record<string, unknown> | null
  crowd_detail: Record<string, unknown> | null
  tourism_info: TourismInfo | null
}

/** Payload de actualización admin: ficha comercial del destino. */
export interface DestinationUpdatePayload {
  name?: string
  /** bajo | medio | alto. Cadena vacía lo borra. */
  cost_level?: string
  /** facil | moderada | exigente. Cadena vacía lo borra. */
  difficulty?: string
  city?: string
  region?: string
  category?: string
  altitude_m?: number | null
  description?: string
  activities_summary?: string
  visitor_info_summary?: string
  accessibility_summary?: string
  recommended_duration?: string
  how_to_get?: string
  official_website?: string
  latitude?: number | null
  longitude?: number | null
}

export interface ReviewAspectRating {
  aspect: string
  rating: number
  comment?: string | null
}

export interface Review {
  review_id: string
  user_id: string
  destination_id: string
  rating_general: number
  review_text: string
  status: string
  processing_month?: string | null
  aspect_ratings: ReviewAspectRating[]
  image_url?: string | null
  /** Nombre corto del autor («Lucía P.»). */
  author_name?: string | null
  /** Veces que otros viajeros la reportaron (solo equipo). */
  report_count?: number
  is_hidden?: boolean
}

/* -------------------------------------------------------------------------- */
/* Multimedia                                                                  */
/* -------------------------------------------------------------------------- */

export interface MediaItem {
  id: number
  url: string | null
  public_id: string | null
  provider: string
  alt_text: string | null
  position: number
  is_active: boolean
  media_type: MediaType
}

export interface DestinationMedia {
  cover: MediaItem | null
  gallery: MediaItem[]
}

/** Respuesta del endpoint admin: incluye items inactivos */
export interface DestinationMediaAdmin {
  cover: MediaItem | null
  inactive_covers: MediaItem[]
  gallery: MediaItem[]
  inactive_gallery: MediaItem[]
}

export type MediaType = 'cover' | 'gallery'

export interface DestinationAdminCreate {
  name: string
  destination_id?: string
  city?: string
  region?: string
  category?: string
  description?: string
}

/* -------------------------------------------------------------------------- */
/* Métricas                                                                    */
/* -------------------------------------------------------------------------- */

export interface MetricsOverview {
  destinations: {
    total: number
    with_cover: number
    without_cover: number
    with_media: number
    without_media: number
  }
  map_markers: number
  reviews: { total: number }
  users: {
    total: number
    travelers: number
    admins: number
    super_admins: number
  }
  announcements: { total: number; active: number }
  generated_at: string
}

/* -------------------------------------------------------------------------- */
/* Anuncios                                                                    */
/* -------------------------------------------------------------------------- */

export type AnnouncementPlacement =
  | 'app_start'
  | 'home_top'
  | 'destination_detail'
  | 'global_modal'

export type AnnouncementTemplate =
  | 'image_banner'
  | 'gradient_card'
  | 'minimal_notice'
  | 'tourism_highlight'
  | 'maintenance_notice'

export type AnnouncementStatus = 'active' | 'scheduled' | 'expired' | 'inactive'

export interface Announcement {
  id: number
  title: string
  message: string
  placement: AnnouncementPlacement
  template_type: AnnouncementTemplate
  background_image_url: string | null
  media_public_id: string | null
  cta_text: string | null
  cta_url: string | null
  starts_at: string | null
  ends_at: string | null
  duration_seconds: number
  priority: number
  frequency_cap: number | null
  is_active: boolean
  audience: string
  /** Solo para placement=destination_detail. null = todos los destinos. */
  target_destination_id: string | null
  target_destination_name: string | null
  impressions: number
  clicks: number
  dismissals: number
  created_by: string | null
  created_at: string
  updated_at: string
  status: AnnouncementStatus
}

export interface AnnouncementPayload {
  title: string
  message: string
  placement: AnnouncementPlacement
  template_type: AnnouncementTemplate
  cta_text?: string | null
  cta_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
  duration_seconds: number
  priority: number
  /** Veces que un mismo dispositivo ve el anuncio de inicio. 0 = cada vez que abre la app. */
  frequency_cap: number | null
  target_destination_id: string | null
  is_active: boolean
}

export interface ActivityItem {
  type: 'user' | 'review' | 'media' | 'announcement' | 'release'
  title: string
  subtitle: string
  at: string
  link: string
  destination_id?: string
}

export interface DashboardPriorities {
  reviews_pending: number
  destinations_out_of_engine: number
  announcements_expiring_7d: number
}

export interface ChartData {
  user_growth: { month: string; users: number }[]
  reviews_by_month: { month: string; reviews: number }[]
  destinations_by_category: { name: string; value: number }[]
  destinations_by_region: { name: string; value: number }[]
}

/* ------------------------------ Motor ------------------------------------- */

export interface EngineConfig {
  /** Peso de ABSA en la afinidad (tesis: 0.25). El resto va a intereses. */
  alpha_absa: number
  /** Peso del contexto clima/aforo en el score final (tesis: 0.30). */
  beta_contexto: number
  /** Peso del clima dentro del contexto (tesis: 0.5). */
  w_clima: number
  /** Peso del aforo dentro del contexto (tesis: 0.5). */
  w_aforo: number
}

export interface EngineDestination {
  destination_id: string
  destination: string
  region: string | null
  is_active: boolean
  in_engine: boolean
  /** Cumple los datos mínimos para entrar al motor. */
  eligible: boolean
  missing: string[]
  /** is_active + in_engine + eligible: aparece hoy en las recomendaciones. */
  recommendable: boolean
}

export interface EngineStatus {
  config: EngineConfig
  defaults: EngineConfig
  destinations: EngineDestination[]
  counts: { total: number; in_engine: number; recommendable: number }
}

/** Respuesta de POST /admin/users/{id}/reset-password. La contraseña se entrega una sola vez. */
export interface PasswordResetResult {
  user_id: string
  name: string | null
  email: string
  temporary_password: string
  sessions_invalidated: boolean
}
