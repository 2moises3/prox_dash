import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeleteUser, useScheduleDeletion } from '@/hooks/useUsers'
import { useAuth } from '@/auth/useAuth'
import type { AdminUser, DeleteUserMode } from '@/types'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const deleteUser = useDeleteUser()
  const scheduleDeletion = useScheduleDeletion()
  
  const [mode, setMode] = useState<DeleteUserMode | 'schedule'>('schedule')
  const [confirmText, setConfirmText] = useState('')
  const [reason, setReason] = useState('')

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setMode('schedule')
      setConfirmText('')
      setReason('')
    }
    onOpenChange(isOpen)
  }

  function handleConfirm() {
    if (!user) return
    if (mode === 'schedule') {
      scheduleDeletion.mutate(
        { userId: user.user_id, reason: reason || 'A petición del administrador' },
        { onSuccess: () => handleClose(false) }
      )
    } else {
      deleteUser.mutate(
        { userId: user.user_id, mode },
        { onSuccess: () => handleClose(false) },
      )
    }
  }

  const needsTypedConfirm = mode === 'full'
  const isConfirmed = !needsTypedConfirm || confirmText === 'ELIMINAR'
  const isPending = deleteUser.isPending || scheduleDeletion.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 className="h-5 w-5" />
            Eliminar usuario
          </DialogTitle>
          <DialogDescription>
            Selecciona qué tipo de eliminación aplicar a <strong>{user?.name || user?.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Option: Schedule */}
          <label
            htmlFor="mode-schedule"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              mode === 'schedule'
                ? 'border-indigo-400 bg-indigo-50/50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              id="mode-schedule"
              name="delete-mode"
              value="schedule"
              checked={mode === 'schedule'}
              onChange={() => setMode('schedule')}
              className="mt-1 accent-indigo-500"
            />
            <div className="w-full">
              <p className="text-sm font-semibold text-slate-900">Programar eliminación</p>
              <p className="mt-0.5 text-xs text-slate-500">
                La cuenta será desactivada ahora y se eliminará definitivamente al finalizar el periodo de gracia. <br/>
                <strong>Periodo de gracia: 14 días.</strong>
              </p>
              {mode === 'schedule' && (
                <div className="mt-3">
                  <Input
                    placeholder="Motivo de la eliminación (opcional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </label>

          {/* Option: Data Only */}
          <label
            htmlFor="mode-data-only"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              mode === 'data_only'
                ? 'border-amber-400 bg-amber-50/50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              id="mode-data-only"
              name="delete-mode"
              value="data_only"
              checked={mode === 'data_only'}
              onChange={() => setMode('data_only')}
              className="mt-1 accent-amber-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Limpiar solo datos</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Mantiene la cuenta activa. Elimina favoritos, visitas, perfil viajero y preferencias.
                Las reseñas quedan anónimas.
              </p>
            </div>
          </label>

          {/* Option: Full (solo super admin) */}
          {isSuperAdmin && (
            <label
              htmlFor="mode-full"
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                mode === 'full'
                  ? 'border-rose-400 bg-rose-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                id="mode-full"
                name="delete-mode"
                value="full"
                checked={mode === 'full'}
                onChange={() => setMode('full')}
                className="mt-1 accent-rose-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Eliminar cuenta y datos (Hard Delete)</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Eliminación inmediata. <strong>Esta acción es irreversible y no pasa por periodo de gracia.</strong>
                </p>
              </div>
            </label>
          )}

          {/* Typed confirm for full deletion */}
          {needsTypedConfirm && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                Confirmación requerida
              </div>
              <p className="mb-3 text-xs text-rose-600">
                Escribe <strong className="font-mono">ELIMINAR</strong> para confirmar la eliminación permanente.
              </p>
              <Input
                id="delete-confirm-input"
                placeholder="Escribe ELIMINAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border-rose-200 bg-white text-sm focus:border-rose-400 focus:ring-rose-400/20"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant={mode === 'schedule' ? 'primary' : 'danger'}
            onClick={handleConfirm}
            disabled={!isConfirmed || isPending}
            loading={isPending}
          >
            {mode === 'full' ? 'Eliminar permanentemente' : mode === 'schedule' ? 'Programar' : 'Limpiar datos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
