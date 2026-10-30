import { describe, expect, it } from 'vitest'

import { CATEGORY_OPTIONS, buildInfoForm, infoFormToPayload } from '@/utils/destinationForm'
import type { DestinationDetail } from '@/types'

const detail = {
  destination_id: 'machu_picchu',
  destination: 'Machu Picchu',
  city: 'Aguas Calientes',
  region: 'Cusco',
  category: 'Arqueología',
  cover_image_url: null,
  is_active: true,
  cost_level: 'alto',
  aspect_scores: null,
  context: null,
  weather_detail: null,
  crowd_detail: null,
  tourism_info: {
    altitude_m: 2430,
    latitude: -13.1678145,
    longitude: -72.5449622,
    description: 'Ciudadela inca',
    difficulty: 'moderada',
    official_website: null,
  },
} as DestinationDetail

describe('formulario de la ficha del destino', () => {
  it('carga los datos del backend como texto para los inputs', () => {
    const f = buildInfoForm(detail)
    expect(f.name).toBe('Machu Picchu')
    expect(f.altitude_m).toBe('2430')
    expect(f.latitude).toBe('-13.1678145')
    expect(f.difficulty).toBe('moderada')
    expect(f.official_website).toBe('')
    expect(f.cost_level).toBe('alto')
  })

  it('formulario vacío sin destino cargado', () => {
    const f = buildInfoForm(null)
    expect(f.geofence_radius_meters).toBe('250')
    expect(f.min_dwell_minutes).toBe('20')
    expect(Object.entries(f)
      .filter(([key]) => key !== 'geofence_radius_meters' && key !== 'min_dwell_minutes')
      .every(([, value]) => value === '')).toBe(true)
  })

  it('al guardar: números se convierten, vacío borra y basura se ignora', () => {
    const f = { ...buildInfoForm(detail), altitude_m: '', latitude: ' -9.07 ', longitude: 'abc', city: '  Huaraz ' }
    const p = infoFormToPayload(f)
    expect(p.altitude_m).toBeNull()
    expect(p.latitude).toBe(-9.07)
    expect('longitude' in p).toBe(false)
    expect(p.city).toBe('Huaraz')
  })

  it('envía al backend el radio de 25 km y la permanencia de 1 minuto', () => {
    const form = {
      ...buildInfoForm(detail),
      geofence_radius_meters: '25000',
      min_dwell_minutes: '1',
    }
    const payload = infoFormToPayload(form)
    expect(payload.geofence_radius_meters).toBe(25000)
    expect(payload.min_dwell_minutes).toBe(1)
  })

  it('costo y dificultad vacíos se envían vacíos para borrarlos en el backend', () => {
    const p = infoFormToPayload({ ...buildInfoForm(detail), cost_level: '', difficulty: '' })
    expect(p.cost_level).toBe('')
    expect(p.difficulty).toBe('')
  })

  it('categorías comerciales cerradas', () => {
    expect(CATEGORY_OPTIONS).toEqual(['Arqueología', 'Naturaleza', 'Museo', 'Recreación'])
  })
})
