import { useMemo, useState } from 'react'
import { Users, ShieldCheck, Power, PowerOff, Info, Search, UserPlus, Trash2, Clock, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectField, type SelectOption } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { CreateUserDialog } from '@/components/users/CreateUserDialog'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { UserDetailsDialog } from '@/components/users/UserDetailsDialog'
import { useAuth } from '@/auth/useAuth'
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useProcessDeletions, useCancelDeletion } from '@/hooks/useUsers'
import type { AdminUser, UserRole } from '@/types'

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'traveler', label: 'Viajero' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
]

const ROLE_LABEL: Record<UserRole, string> = {
  traveler: 'Viajero',
  admin: 'Admin',
  super_admin: 'Super admin',
}

const ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'traveler', label: 'Viajero' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
]

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

function roleBadgeVariant(role: UserRole): 'navy' | 'gold' | 'neutral' {
  if (role === 'super_admin') return 'navy'
  if (role === 'admin') return 'gold'
  return 'neutral'
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeRemaining(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return ''
  const diff = new Date(scheduledAt).getTime() - new Date().getTime()
  if (diff <= 0) return 'Vence hoy'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `Faltan ${days} día${days === 1 ? '' : 's'}`
  const hours = Math.floor(diff / (1000 * 60 * 60))
  return `Faltan ${hours} hora${hours === 1 ? '' : 's'}`
}

export function UsersPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const { data, isLoading, isError, refetch } = useUsers()
  const updateRole = useUpdateUserRole()
  const updateStatus = useUpdateUserStatus()
  const processDeletions = useProcessDeletions()
  const cancelDeletion = useCancelDeletion()
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)

  // Extensión 6B: dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [detailsTarget, setDetailsTarget] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (data ?? []).filter((u) => {
      const matchesTerm =
        !term ||
        (u.name ?? '').toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.user_id.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active)
      return matchesTerm && matchesRole && matchesStatus
    })
  }, [data, search, roleFilter, statusFilter])

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas: roles y estado de acceso."
        actions={
          <div className="flex items-center gap-2">
            {data ? <Badge variant="neutral">{data.length} usuario{data.length === 1 ? '' : 's'}</Badge> : undefined}
            {isSuperAdmin && (
              <div className="flex gap-2">
                <Button
                  id="btn-process-deletions"
                  size="sm"
                  variant="secondary"
                  leftIcon={<Clock className="h-4 w-4" />}
                  onClick={() => processDeletions.mutate()}
                  loading={processDeletions.isPending}
                >
                  Procesar
                </Button>
                <Button
                  id="btn-new-user"
                  size="sm"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  onClick={() => setShowCreateDialog(true)}
                >
                  Nuevo Usuario
                </Button>
              </div>
            )}
          </div>
        }
      />

      {!isSuperAdmin && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Vista de solo lectura. Solo un <strong>super administrador</strong> puede cambiar roles o activar/desactivar usuarios.</p>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-soft md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, email o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SelectField value={roleFilter} onValueChange={setRoleFilter} options={ROLE_FILTER_OPTIONS} className="w-full md:w-44" ariaLabel="Filtrar por rol" />
          <SelectField value={statusFilter} onValueChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} className="w-full md:w-36" ariaLabel="Filtrar por estado" />
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay usuarios"
          description="El backend no devolvió usuarios."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description="Ningún usuario coincide con la búsqueda o los filtros."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Creado</th>
                {isSuperAdmin && <th className="px-4 py-3 text-right font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isSelf = u.user_id === user?.user_id
                const isOnlySuperAdmin = u.role === 'super_admin'
                return (
                  <tr key={u.user_id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name || 'Avatar'}
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                            {(u.name || u.email).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {u.name || '—'}
                            {isSelf && <span className="ml-1.5 text-xs font-medium text-slate-400">(tú)</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-500">
                        {u.user_id}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <SelectField
                          value={u.role}
                          onValueChange={(v) => updateRole.mutate({ userId: u.user_id, role: v as UserRole })}
                          options={ROLE_OPTIONS}
                          className="w-36"
                          ariaLabel={`Rol de ${u.email}`}
                        />
                      ) : (
                        <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABEL[u.role]}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.account_status === 'active' ? (
                        <Badge variant="success">Activo</Badge>
                      ) : u.account_status === 'disabled' ? (
                        <Badge variant="danger">Inactivo</Badge>
                      ) : u.account_status === 'pending_deletion' ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="warning" className="w-fit">Pendiente elim.</Badge>
                          {u.deletion_scheduled_at && (
                            <div className="text-[10px] leading-tight text-slate-500">
                              <p>Se eliminará el {formatDate(u.deletion_scheduled_at)}</p>
                              <p className="font-semibold text-amber-600">{getTimeRemaining(u.deletion_scheduled_at)}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="neutral" className="w-fit">Eliminado</Badge>
                          {u.deleted_at && (
                            <span className="text-[10px] text-slate-500">
                              {formatDate(u.deleted_at)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalles"
                            onClick={() => setDetailsTarget(u.user_id)}
                            className="text-slate-500 hover:text-navy-700"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          
                          {u.account_status === 'pending_deletion' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                              onClick={() => cancelDeletion.mutate(u.user_id)}
                              loading={cancelDeletion.isPending}
                              leftIcon={<XCircle className="h-4 w-4" />}
                            >
                              Cancelar elim.
                            </Button>
                          ) : u.account_status !== 'deleted' ? (
                            <Button
                              variant={u.is_active ? 'ghost' : 'primary'}
                              size="sm"
                              disabled={isSelf}
                              title={isSelf ? 'No puedes cambiar tu propio estado' : undefined}
                              leftIcon={u.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              onClick={() => setStatusTarget(u)}
                            >
                              {u.is_active ? 'Desactivar' : 'Activar'}
                            </Button>
                          ) : null}

                          {u.account_status !== 'deleted' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSelf || isOnlySuperAdmin}
                              title={
                                isSelf
                                  ? 'No puedes eliminar tu propia cuenta'
                                  : isOnlySuperAdmin
                                    ? 'No se puede eliminar un super_admin'
                                    : 'Eliminar usuario'
                              }
                              onClick={() => setDeleteTarget(u)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isSuperAdmin && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-sm text-slate-500 shadow-soft">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-900" />
          <p>
            El rol <strong>super_admin</strong> es el rol raíz del sistema y no puede crearse desde el dashboard.
            Para bootstrap inicial, use <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">scripts/bootstrap_superadmin.py</code>.
          </p>
        </div>
      )}

      {/* Diálogos */}
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(o) => { if (!o) setStatusTarget(null) }}
        title={statusTarget?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          statusTarget?.is_active
            ? `${statusTarget?.email} perderá el acceso hasta que se reactive su cuenta.`
            : `${statusTarget?.email} podrá volver a iniciar sesión.`
        }
        confirmLabel={statusTarget?.is_active ? 'Desactivar' : 'Activar'}
        variant={statusTarget?.is_active ? 'danger' : 'primary'}
        loading={updateStatus.isPending}
        onConfirm={() =>
          statusTarget &&
          updateStatus.mutate(
            { userId: statusTarget.user_id, isActive: !statusTarget.is_active },
            { onSuccess: () => setStatusTarget(null) },
          )
        }
      />

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <DeleteUserDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        user={deleteTarget}
      />

      <UserDetailsDialog
        userId={detailsTarget}
        open={detailsTarget !== null}
        onOpenChange={(o) => { if (!o) setDetailsTarget(null) }}
      />
    </div>
  )
}
