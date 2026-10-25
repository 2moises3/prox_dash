/**
 * Configuración de entorno centralizada (Vite).
 * No contiene secretos. Solo valores públicos de cliente.
 */

function readEnv(key: string, fallback: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined
  return value && value.trim().length > 0 ? value.trim() : fallback
}

export const env = {
  /** URL base del backend FastAPI, p.ej. http://127.0.0.1:8000/api/v1 */
  apiBaseUrl: readEnv(
    'VITE_API_BASE_URL',
    import.meta.env.PROD
      ? 'https://proxback-production.up.railway.app/api/v1'
      : 'http://127.0.0.1:8000/api/v1',
  ).replace(/\/+$/, ''),
  /** Versión visible del dashboard (solo informativa). */
  appVersion: readEnv('VITE_APP_VERSION', '0.1.0-beta'),
} as const
