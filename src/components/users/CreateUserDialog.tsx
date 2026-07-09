import { type FormEvent, useState } from 'react'
import { UserPlus, Info } from 'lucide-react'

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
import { Label } from '@/components/ui/label'
import { SelectField, type SelectOption } from '@/components/ui/select'
import { useCreateUser } from '@/hooks/useUsers'

const CREATABLE_ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'traveler', label: 'Viajero' },
]

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateUser()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'traveler'>('admin')

  function resetForm() {
    setName('')
    setEmail('')
    setPassword('')
    setRole('admin')
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    createUser.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      { onSuccess: () => handleClose(false) },
    )
  }

  const isValid =
    name.trim().length >= 1 &&
    email.trim().length >= 5 &&
    email.includes('@') &&
    password.length >= 6

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold-500" />
            Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Crea una cuenta para acceder a la plataforma. Se creará una cuenta base sin perfil de viajero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="create-user-name">Nombre completo</Label>
            <Input
              id="create-user-name"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="create-user-email">Correo electrónico</Label>
            <Input
              id="create-user-email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="create-user-password">Contraseña inicial</Label>
            <Input
              id="create-user-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {/* Rol */}
          <div>
            <Label>Rol</Label>
            <SelectField
              value={role}
              onValueChange={(v) => setRole(v as 'admin' | 'traveler')}
              options={CREATABLE_ROLE_OPTIONS}
              ariaLabel="Rol del nuevo usuario"
            />
          </div>

          {/* Nota informativa */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 text-xs text-slate-500">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                <strong>Nota:</strong> Las preferencias turísticas se completan desde la app móvil. El usuario deberá completar su perfil viajero al iniciar sesión por primera vez para recibir recomendaciones personalizadas.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Por ahora esta contraseña no es temporal. El cambio obligatorio queda pendiente para una fase futura.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                El rol <strong>super_admin</strong> es exclusivo de sistema y no se puede crear desde esta pantalla.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              disabled={createUser.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createUser.isPending}
              loading={createUser.isPending}
            >
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
