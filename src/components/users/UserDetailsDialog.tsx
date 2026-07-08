import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPinned, Calendar, Compass } from 'lucide-react'
import { useUserDetails } from '@/hooks/useUsers'

interface Props {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({ userId, open, onOpenChange }: Props) {
  const { data: user, isLoading, isError } = useUserDetails(userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles del Viajero</DialogTitle>
          <DialogDescription>
            Información básica e intereses de viaje.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl mt-4" />
          </div>
        ) : isError || !user ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No se pudo cargar la información del usuario.
          </div>
        ) : user.account_status === 'deleted' ? (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Compass className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Usuario eliminado</h3>
              <p className="mt-2 text-sm text-slate-500 px-4">
                Este usuario fue eliminado o anonimizado. La información personal ya no está disponible.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="neutral">Eliminado</Badge>
              {user.deleted_at && (
                <Badge variant="neutral" className="bg-slate-100 font-normal">
                  {new Date(user.deleted_at).toLocaleDateString('es-ES')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-4 font-mono">ID: {user.user_id}</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Cabecera / Perfil */}
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || 'Avatar'}
                  className="h-16 w-16 rounded-full object-cover shadow-sm border border-slate-100"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xl font-bold text-white shadow-sm">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </div>
              )}
              
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {user.name || 'Sin nombre'}
                </h3>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant={user.role === 'super_admin' ? 'navy' : user.role === 'admin' ? 'gold' : 'neutral'}>
                    {user.role}
                  </Badge>
                  {user.account_status === 'active' ? (
                    <Badge variant="success">Activo</Badge>
                  ) : user.account_status === 'pending_deletion' ? (
                    <Badge variant="warning">Pendiente elim.</Badge>
                  ) : (
                    <Badge variant="danger">Inactivo</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Registro
                </div>
                <p className="mt-1 text-sm text-slate-900">
                  {new Date(user.created_at).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPinned className="h-4 w-4 text-slate-400" />
                  Favoritos
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {user.favorites_count} {user.favorites_count === 1 ? 'destino' : 'destinos'}
                </p>
              </div>
            </div>

            {/* Aspectos */}
            <div className="rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 mb-3">
                <Compass className="h-4 w-4 text-navy-500" />
                Intereses de viaje
              </div>
              
              {user.aspects && user.aspects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.aspects.map((aspect) => (
                    <Badge key={aspect} variant="neutral" className="font-normal text-slate-700 bg-slate-100">
                      {aspect}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Este viajero aún no ha definido sus intereses.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
