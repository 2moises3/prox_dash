import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, Settings, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/auth/useAuth'
import { authService } from '@/auth/authService'
import { toast } from 'sonner'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super administrador',
  traveler: 'Viajero',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout()
    toast.success('Sesión cerrada')
    navigate('/login', { replace: true })
  }

  const initials = (user?.name || user?.email || 'PX').slice(0, 2).toUpperCase()
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? 'Administrador'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-soft sm:px-6">
      {/* Hamburger móvil */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-navy-900 transition hover:bg-navy-900/6 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Título desktop */}
      <div className="hidden items-center gap-2 lg:flex">
        <div
          className="h-4 w-0.5 rounded-full bg-gold-500"
        />
        <p className="text-sm font-semibold tracking-wide text-navy-900">
          Panel Administrativo
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Rol badge */}
        <span
          className="hidden rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider sm:inline-block"
          style={{ background: 'rgba(216,155,31,0.12)', color: '#c0841a' }}
        >
          {roleLabel}
        </span>

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm shadow-soft transition hover:border-slate-300 hover:shadow-soft-lg"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: '#0e1730' }}
              >
                {initials}
              </span>
              <span className="hidden max-w-[12rem] truncate font-semibold text-slate-800 sm:block">
                {user?.name || user?.email}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.name || 'Administrador'}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/configuracion')}>
              <Settings className="h-4 w-4 text-slate-400" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/configuracion')}>
              <UserRound className="h-4 w-4 text-slate-400" />
              Mi sesión
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-rose-600 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="hidden text-slate-500 hover:text-rose-600 sm:inline-flex"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
