import { useState } from 'react'
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useResetUserPassword } from '@/hooks/useUsers'
import type { AdminUser, PasswordResetResult } from '@/types'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const reset = useResetUserPassword()
  // La contraseña vive solo en este estado: se descarta al cerrar el diálogo.
  const [result, setResult] = useState<PasswordResetResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setResult(null)
      setErrorMsg('')
      setCopied(false)
      reset.reset()
    }
    onOpenChange(next)
  }

  if (!user) return null

  const label = user.name?.trim() || user.email

  const handleConfirm = () => {
    setErrorMsg('')
    reset.mutate(user.user_id, {
      onSuccess: (data) => setResult(data),
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } } }
        setErrorMsg(e.response?.data?.detail || 'No se pudo restablecer la contraseña.')
      },
    })
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.temporary_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMsg('No se pudo copiar automáticamente. Selecciónala y cópiala a mano.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-gold-600" />
                Contraseña temporal
              </DialogTitle>
              <DialogDescription>
                Entrégasela a <strong>{label}</strong> por un canal seguro. Sus sesiones abiertas ya se cerraron.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="select-all break-all text-center font-mono text-2xl font-bold tracking-wider text-slate-900">
                {result.temporary_password}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copiada' : 'Copiar contraseña'}
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Se muestra <strong>una sola vez</strong>: al cerrar esta ventana no se podrá volver a ver. Si la pierdes,
                genera otra.
              </p>
            </div>

            {errorMsg ? <p className="mt-2 text-xs text-rose-600">{errorMsg}</p> : null}

            <DialogFooter className="mt-4">
              <Button onClick={() => handleOpenChange(false)}>Ya la copié, cerrar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-gold-600" />
                Restablecer contraseña
              </DialogTitle>
              <DialogDescription>
                Se generará una contraseña temporal para <strong>{label}</strong> ({user.email}).
              </DialogDescription>
            </DialogHeader>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>La contraseña actual dejará de funcionar de inmediato.</li>
              <li>Se cerrarán todas sus sesiones abiertas.</li>
              <li>La contraseña temporal se mostrará una sola vez.</li>
              <li>La acción queda registrada con tu usuario.</li>
            </ul>

            {errorMsg ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errorMsg}</div>
            ) : null}

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={reset.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} loading={reset.isPending}>
                Restablecer contraseña
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
