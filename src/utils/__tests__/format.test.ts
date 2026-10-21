import { describe, expect, it } from 'vitest'

import { formatDate, isoToLocalInput, localInputToIso } from '@/utils/format'

describe('fechas del dashboard', () => {
  it('lo escrito en el formulario vuelve igual después de guardarse (sin correr horas)', () => {
    const local = '2026-12-24T18:30'
    const iso = localInputToIso(local)
    expect(iso).toMatch(/Z$/)
    expect(isoToLocalInput(iso)).toBe(local)
  })

  it('una fecha UTC del backend se muestra en hora local', () => {
    const iso = '2026-01-01T15:00:00Z'
    const expected = new Date(iso)
    const shown = isoToLocalInput(iso)
    expect(new Date(shown).getTime()).toBe(expected.getTime())
  })

  it('valores vacíos o inválidos', () => {
    expect(localInputToIso('')).toBeNull()
    expect(localInputToIso('no es fecha')).toBeNull()
    expect(isoToLocalInput(null)).toBe('')
    expect(formatDate(null)).toBe('—')
  })
})
