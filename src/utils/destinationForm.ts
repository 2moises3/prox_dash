/* Formulario de la ficha comercial del destino (dashboard): estado ↔ payload del backend. */
import type { DestinationDetail, DestinationUpdatePayload } from '@/types'

const INFO_TEXT_FIELDS = [
  'name', 'city', 'region', 'category', 'description',
  'activities_summary', 'visitor_info_summary', 'accessibility_summary',
  'recommended_duration', 'how_to_get', 'official_website',
  'cost_level', 'difficulty',
] as const

const INFO_NUM_FIELDS = [
  'altitude_m', 'latitude', 'longitude', 'geofence_radius_meters', 'min_dwell_minutes',
] as const

/** Categorías comerciales (lista cerrada; alimenta el filtro del buscador de la app). */
export const CATEGORY_OPTIONS = ['Arqueología', 'Naturaleza', 'Museo', 'Recreación']

export const DIFFICULTY_LABELS: Record<string, string> = {
  facil: 'Fácil',
  moderada: 'Moderada',
  exigente: 'Exigente',
}

export type InfoFormState = Record<
  (typeof INFO_TEXT_FIELDS)[number] | (typeof INFO_NUM_FIELDS)[number],
  string
>

export function buildInfoForm(data: DestinationDetail | null): InfoFormState {
  const t = data?.tourism_info ?? null
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  return {
    name: s(data?.destination),
    city: s(data?.city),
    region: s(data?.region),
    category: s(data?.category),
    description: s(t?.description),
    activities_summary: s(t?.activities_summary),
    visitor_info_summary: s(t?.visitor_info_summary),
    accessibility_summary: s(t?.accessibility_summary),
    recommended_duration: s(t?.recommended_duration),
    how_to_get: s(t?.how_to_get),
    official_website: s(t?.official_website),
    cost_level: s(data?.cost_level),
    difficulty: s(t?.difficulty),
    altitude_m: s(t?.altitude_m),
    latitude: s(t?.latitude),
    longitude: s(t?.longitude),
    geofence_radius_meters: s(t?.geofence_radius_meters ?? 250),
    min_dwell_minutes: s(t?.min_dwell_minutes ?? 20),
  }
}

export function infoFormToPayload(form: InfoFormState): DestinationUpdatePayload {
  const payload: DestinationUpdatePayload = {}
  for (const k of INFO_TEXT_FIELDS) {
    payload[k] = form[k].trim()
  }
  for (const k of INFO_NUM_FIELDS) {
    const raw = form[k].trim()
    // Vacío → null (limpia el campo); valor inválido → se omite.
    if (raw === '') {
      payload[k] = null
    } else {
      const n = Number(raw)
      if (!Number.isNaN(n)) payload[k] = n
    }
  }
  return payload
}
