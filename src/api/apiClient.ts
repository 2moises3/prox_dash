/**
 * Cliente Axios central del dashboard.
 * - Inyecta el JWT en cada petición.
 * - Maneja 401 (sesión inválida/expirada → logout) y 403 (sin permisos) de forma global.
 * - Nunca expone secretos; solo usa el token del usuario admin autenticado.
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

import { env } from '@/config/env'
import { authStore } from '@/auth/authStore'

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20000,
})

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('/auth/login') || lowerUrl.includes('login')
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string; error?: string }>) => {
    const status = error.response?.status
    const url = error.config?.url
    const data = error.response?.data
    const msg = data?.detail || data?.message || data?.error
    const lowerMsg = msg ? msg.toLowerCase() : ''

    if (status === 401) {
      if (!isAuthEndpoint(url)) {
        // Token inválido o expirado → cerrar sesión globalmente.
        if (authStore.getToken()) {
          authStore.clearSession()
          // Evitar mostrar este mensaje si estamos activamente en la página de login intentando entrar
          if (window.location.pathname !== '/login') {
            toast.error('Tu sesión ha expirado o es inválida. Inicia sesión nuevamente.')
          }
        }
      }
    } else if (status === 403) {
      if (lowerMsg.includes('desactivada') || lowerMsg.includes('eliminación') || lowerMsg.includes('deleted') || lowerMsg.includes('inactive')) {
        toast.error('Tu cuenta administrativa se encuentra inactiva o deshabilitada.')
      } else {
        toast.error(msg || 'No tienes permisos administrativos para esta acción.')
      }
    } else if (status === 500) {
      toast.error('Error interno del servidor. Inténtalo más tarde.')
    } else if (error.code === 'ERR_NETWORK') {
      // El backend no responde; los componentes muestran su propio estado de error.
      // Evitamos saturar con toasts en peticiones en segundo plano.
    }

    return Promise.reject(error)
  },
)

/** Extrae un mensaje de error legible de un error de Axios. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado en el servidor. Intenta nuevamente.'): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No pudimos conectar con el servidor. Verifica tu conexión.'
    }
    const data = error.response?.data as { detail?: string; message?: string; error?: string } | undefined
    const msg = data?.detail || data?.message || data?.error
    const status = error.response?.status
    
    if (msg) {
      const lowerMsg = msg.toLowerCase()
      if (status === 401 && (lowerMsg.includes('incorrect username') || lowerMsg.includes('incorrect email') || lowerMsg.includes('incorrect password') || lowerMsg.includes('credenciales inválidas'))) {
        return 'Correo o contraseña incorrectos.'
      }
      if (status === 403 && (lowerMsg.includes('inactive user') || lowerMsg.includes('desactivada') || lowerMsg.includes('eliminación'))) {
        return 'Tu cuenta administrativa se encuentra inactiva o deshabilitada.'
      }
      if (status === 404 && !msg) {
        return 'El recurso solicitado no existe o ya no está disponible.'
      }
      return msg
    }
    
    if (status === 404) return 'El recurso solicitado no existe o ya no está disponible.'
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.'
    if (status === 403) return 'No tienes permisos para realizar esta acción.'
    if (status && status >= 500) return 'Ocurrió un problema inesperado en el servidor. Intenta nuevamente.'
    
    return fallback
  }
  return fallback
}
