import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/ui/select'
import { useUpdateUserRole } from '@/hooks/useUsers'
import type { AdminUser, UserRole } from '@/types'

const ALLOWED_ROLES = [
  { value: 'traveler', label: 'Viajero' },
  { value: 'admin', label: 'Administrador' },
]

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
}

export function ChangeRoleDialog({ open, onOpenChange, user }: ChangeRoleDialogProps) {
  const updateRole = useUpdateUserRole()
  const [role, setRole] = useState<UserRole>('traveler')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user && open) {
      // Usar setTimeout para evitar cascadas de renders y cumplir con linting
      const t = setTimeout(() => {
        setRole(user.role === 'super_admin' ? 'admin' : user.role)
        setErrorMsg('')
      }, 0)
      return () => clearTimeout(t)
    }
  }, [user, open])

  if (!user) return null

  const handleConfirm = () => {
    setErrorMsg('')
    updateRole.mutate(
      { userId: user.user_id, role },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { detail?: string } } }
          const message = error.response?.data?.detail || 'Ocurrió un error al cambiar el rol.'
          setErrorMsg(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar rol de usuario</DialogTitle>
          <DialogDescription>
            Seleccione el nuevo rol para <strong>{user.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nuevo Rol</label>
            <SelectField
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
              options={ALLOWED_ROLES}
              ariaLabel="Seleccionar rol"
              className="w-full"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Cambiar el rol modifica los permisos de acceso del usuario al dashboard y a la aplicación.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
              {errorMsg}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            loading={updateRole.isPending}
            disabled={role === user.role}
          >
            Confirmar Cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
