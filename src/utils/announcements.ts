import type {
  AnnouncementPlacement,
  AnnouncementStatus,
  AnnouncementTemplate,
} from '@/types'
import type { SelectOption } from '@/components/ui/select'

export const PLACEMENT_LABELS: Record<AnnouncementPlacement, string> = {
  app_start: 'Ventana al abrir la app',
  home_top: 'Carrusel en Explorar',
  destination_detail: 'Tarjeta en el detalle de un destino',
  global_modal: 'Aviso importante',
}

/** Qué ve el viajero en cada ubicación (texto de ayuda del editor). */
export const PLACEMENT_HELP: Record<AnnouncementPlacement, string> = {
  app_start:
    'Ventana centrada al abrir la app. Ideal para promociones o novedades. Se muestra como máximo las veces que indiques por usuario.',
  home_top:
    'Tarjeta en la parte superior de Explorar. Si hay varios anuncios activos se muestran en carrusel. El viajero puede cerrarla.',
  destination_detail:
    'Tarjeta dentro de la ficha de un destino (o de todos). Útil para recordar entradas, eventos o consejos del lugar.',
  global_modal:
    'Ventana al abrir la app que se repite hasta que el viajero pulse «Entendido». Úsala solo para avisos importantes (mantenimiento, cambios de servicio).',
}

export const TEMPLATE_LABELS: Record<AnnouncementTemplate, string> = {
  image_banner: 'Banner con imagen',
  gradient_card: 'Tarjeta con degradado',
  minimal_notice: 'Aviso minimalista',
  tourism_highlight: 'Destacado turístico',
  maintenance_notice: 'Aviso de mantenimiento',
}

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  active: 'Activo',
  scheduled: 'Programado',
  expired: 'Expirado',
  inactive: 'Inactivo',
}

export const STATUS_BADGE: Record<
  AnnouncementStatus,
  'success' | 'info' | 'warning' | 'neutral'
> = {
  active: 'success',
  scheduled: 'info',
  expired: 'warning',
  inactive: 'neutral',
}

export const PLACEMENT_OPTIONS: SelectOption[] = (
  Object.keys(PLACEMENT_LABELS) as AnnouncementPlacement[]
).map((value) => ({ value, label: PLACEMENT_LABELS[value] }))

export const TEMPLATE_OPTIONS: SelectOption[] = (
  Object.keys(TEMPLATE_LABELS) as AnnouncementTemplate[]
).map((value) => ({ value, label: TEMPLATE_LABELS[value] }))

/** Degradados de fondo por plantilla (mismos tonos que la app). */
export const TEMPLATE_GRADIENTS: Record<AnnouncementTemplate, string> = {
  image_banner: 'from-[#334155] to-[#0F172A]',
  gradient_card: 'from-[#141821] to-[#252B3B]',
  minimal_notice: 'from-slate-100 to-slate-200',
  tourism_highlight: 'from-[#B87838] to-[#0C7343]',
  maintenance_notice: 'from-[#F59E0B] to-[#E11D48]',
}

/* ── Acción del botón ── */

export type CtaKind = 'none' | 'destination' | 'screen' | 'url'

/** Pantallas de la app a las que puede llevar el botón (deben coincidir con el backend). */
export const APP_SCREEN_OPTIONS: SelectOption[] = [
  { value: '/search', label: 'Buscar destinos' },
  { value: '/map', label: 'Mapa' },
  { value: '/favorites', label: 'Mis favoritos' },
  { value: '/profile/preferences', label: 'Mis preferencias de viaje' },
  { value: '/notifications', label: 'Notificaciones' },
]

export const CTA_KIND_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'Sin botón' },
  { value: 'destination', label: 'Abrir un destino' },
  { value: 'screen', label: 'Abrir una pantalla de la app' },
  { value: 'url', label: 'Abrir un enlace web' },
]

/** Campos del formulario que describen la acción del botón. */
export interface CtaFields {
  kind: CtaKind
  destination: string
  screen: string
  link: string
}

/** Formulario → cta_url que guarda el backend (null = sin botón). */
export function buildCtaUrl(f: CtaFields): string | null {
  switch (f.kind) {
    case 'destination':
      return f.destination ? `/destination/${f.destination}` : null
    case 'screen':
      return f.screen || null
    case 'url':
      return f.link.trim() || null
    default:
      return null
  }
}

/** cta_url guardada → campos del formulario (inverso de buildCtaUrl). */
export function parseCtaUrl(url: string | null | undefined): CtaFields {
  const kind = ctaKindOf(url)
  return {
    kind,
    destination: kind === 'destination' ? (url ?? '').slice('/destination/'.length) : '',
    screen: kind === 'screen' ? (url ?? '') : '',
    link: kind === 'url' ? (url ?? '') : '',
  }
}

export function ctaKindOf(url: string | null | undefined): CtaKind {
  if (!url) return 'none'
  if (url.startsWith('/destination/')) return 'destination'
  if (url.startsWith('/')) return 'screen'
  return 'url'
}

/** Texto legible de lo que hace el botón, para las tarjetas del listado. */
export function describeCta(url: string | null | undefined, destinationName?: (id: string) => string | undefined): string {
  const kind = ctaKindOf(url)
  if (kind === 'none' || !url) return 'Sin botón'
  if (kind === 'destination') {
    const id = url.slice('/destination/'.length)
    return `Abre ${destinationName?.(id) ?? id}`
  }
  if (kind === 'screen') {
    return `Abre ${APP_SCREEN_OPTIONS.find((o) => o.value === url)?.label ?? url}`
  }
  try {
    return `Abre ${new URL(url).hostname}`
  } catch {
    return 'Abre un enlace'
  }
}
