import { describe, expect, it } from 'vitest'

import {
  APP_SCREEN_OPTIONS,
  PLACEMENT_HELP,
  PLACEMENT_LABELS,
  TEMPLATE_GRADIENTS,
  TEMPLATE_LABELS,
  buildCtaUrl,
  ctaKindOf,
  describeCta,
  parseCtaUrl,
} from '@/utils/announcements'

const empty = { destination: '', screen: '', link: '' }

describe('acción del botón del anuncio', () => {
  it('identifica el tipo de acción', () => {
    expect(ctaKindOf(null)).toBe('none')
    expect(ctaKindOf('')).toBe('none')
    expect(ctaKindOf('/destination/machu_picchu')).toBe('destination')
    expect(ctaKindOf('/search')).toBe('screen')
    expect(ctaKindOf('https://tuboleto.cultura.pe')).toBe('url')
  })

  it('arma la URL que guarda el backend', () => {
    expect(buildCtaUrl({ ...empty, kind: 'none' })).toBeNull()
    expect(buildCtaUrl({ ...empty, kind: 'destination', destination: 'chan_chan' })).toBe('/destination/chan_chan')
    expect(buildCtaUrl({ ...empty, kind: 'destination' })).toBeNull()
    expect(buildCtaUrl({ ...empty, kind: 'screen', screen: '/map' })).toBe('/map')
    expect(buildCtaUrl({ ...empty, kind: 'url', link: '  https://a.pe  ' })).toBe('https://a.pe')
  })

  it('ida y vuelta: lo guardado se vuelve a cargar igual en el editor', () => {
    for (const url of ['/destination/valle_colca', '/profile/preferences', 'https://tuboleto.cultura.pe']) {
      expect(buildCtaUrl(parseCtaUrl(url))).toBe(url)
    }
    expect(parseCtaUrl(null)).toEqual({ kind: 'none', ...empty })
  })

  it('describe la acción para el listado', () => {
    const names = (id: string) => ({ machu_picchu: 'Machu Picchu' })[id]
    expect(describeCta(null)).toBe('Sin botón')
    expect(describeCta('/destination/machu_picchu', names)).toBe('Abre Machu Picchu')
    expect(describeCta('/destination/otro', names)).toBe('Abre otro')
    expect(describeCta('/favorites')).toBe('Abre Mis favoritos')
    expect(describeCta('https://tuboleto.cultura.pe/compra')).toBe('Abre tuboleto.cultura.pe')
  })

  it('las pantallas ofrecidas coinciden con las que acepta el backend', () => {
    expect(APP_SCREEN_OPTIONS.map((o) => o.value).sort()).toEqual(
      ['/favorites', '/map', '/notifications', '/profile/preferences', '/search'],
    )
  })
})

describe('catálogos de anuncios', () => {
  it('cada ubicación tiene nombre y ayuda; cada plantilla, nombre y colores', () => {
    for (const p of ['app_start', 'home_top', 'destination_detail', 'global_modal'] as const) {
      expect(PLACEMENT_LABELS[p]).toBeTruthy()
      expect(PLACEMENT_HELP[p].length).toBeGreaterThan(20)
    }
    for (const t of ['image_banner', 'gradient_card', 'minimal_notice', 'tourism_highlight', 'maintenance_notice'] as const) {
      expect(TEMPLATE_LABELS[t]).toBeTruthy()
      expect(TEMPLATE_GRADIENTS[t]).toMatch(/^from-.+ to-.+$/)
    }
  })
})
