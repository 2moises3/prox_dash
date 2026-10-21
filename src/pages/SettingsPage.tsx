import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, LogOut, Server, ShieldCheck, Wifi, WifiOff } from 'lucide-react'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/auth/useAuth'
import { authService } from '@/auth/authService'
import { useSystemHealth } from '@/hooks/useMetrics'
import { useLoadDestinationContent } from '@/hooks/useEngine'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { env } from '@/config/env'

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const health = useSystemHealth()
  const loadContent = useLoadDestinationContent()
  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const isSuperAdmin = user?.role === 'super_admin'

  const apiOnline = health.isSuccess
  const apiOffline = health.isError

  const handleLogout = () => {
    authService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Información técnica de la sesión y conexión del dashboard."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-jungle-600" />
              Sesión administrativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Nombre" value={user?.name || '—'} />
            <InfoRow
              label="Rol"
              value={
                <Badge variant={user?.role === 'super_admin' ? 'info' : 'success'}>
                  {user?.role ?? '—'}
                </Badge>
              }
            />
            <InfoRow
              label="Estado de sesión"
              value={<Badge variant="success">Autenticado</Badge>}
            />
            <InfoRow
              label="Cuenta activa"
              value={user?.is_active ? 'Sí' : 'No'}
            />
            <Button variant="danger" className="mt-4 w-full" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-lake-600" />
              Conexión y entorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Estado de la API"
              value={
                apiOnline ? (
                  <Badge variant="success">
                    <Wifi className="h-3 w-3" /> Disponible
                  </Badge>
                ) : apiOffline ? (
                  <Badge variant="danger">
                    <WifiOff className="h-3 w-3" /> No disponible
                  </Badge>
                ) : (
                  <Badge variant="neutral">Verificando…</Badge>
                )
              }
            />
            <InfoRow label="Base URL" value={<code className="text-xs">{env.apiBaseUrl}</code>} />
            <InfoRow label="Servicio" value={health.data?.service ?? '—'} />
            <InfoRow label="Versión backend" value={health.data?.version ?? '—'} />
            <InfoRow label="Versión dashboard" value={`v${env.appVersion}`} />
            <InfoRow label="Estado del producto" value={<Badge variant="warning">Beta interna</Badge>} />
            <p className="mt-4 text-xs text-slate-400">
              Por seguridad, el dashboard nunca almacena ni muestra secretos del backend
              (claves de Cloudinary, SECRET_KEY de JWT, credenciales de base de datos).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-jungle-600" />
            Datos de los destinos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Carga automáticamente la ficha de cada destino (descripción, ubicación, cómo llegar, duración, dificultad,
            sitio oficial) desde el archivo de datos del servidor. Sirve para dejar una base nueva lista para usar.
            Es un borrador: revisa los textos antes de publicarlos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => loadContent.mutate(false)}
              loading={loadContent.isPending && !overwriteOpen}
              leftIcon={<Database className="h-4 w-4" />}
            >
              Cargar datos de destinos
            </Button>
            {isSuperAdmin && (
              <Button variant="secondary" onClick={() => setOverwriteOpen(true)} disabled={loadContent.isPending}>
                Sobrescribir con los datos del archivo
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            «Cargar» solo completa los campos vacíos: lo que hayas editado a mano no se toca.
            {isSuperAdmin ? ' «Sobrescribir» reemplaza también lo ya existente.' : ''}
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={overwriteOpen}
        onOpenChange={setOverwriteOpen}
        title="Sobrescribir datos de destinos"
        description="Se reemplazarán los textos y coordenadas de los destinos del archivo, incluso los que hayas editado a mano. Esta acción no se puede deshacer."
        confirmLabel="Sobrescribir"
        variant="danger"
        loading={loadContent.isPending}
        onConfirm={() => loadContent.mutate(true, { onSettled: () => setOverwriteOpen(false) })}
      />
    </div>
  )
}
