import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Brand } from './Brand'
import { useAuth } from '@/auth/useAuth'
import { authService } from '@/auth/authService'
import { navSections } from '@/app/navigation'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const logout = () => { authService.logout(); onNavigate?.(); navigate('/login', { replace: true }) }
  return (
    <aside
      className="flex h-full w-[216px] flex-col bg-[#111111] px-2 py-3 text-white"
    >
      {/* Logo */}
      <div className="mb-5 flex h-14 items-center rounded-xl bg-[#222222] px-3">
        <Brand size="sm" light subtitle="Administración" />
      </div>

      {/* Nav */}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-1">
        {navSections.map((section, si) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item, ii) => {
                const Icon = item.icon
                return (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: si * 0.05 + ii * 0.04, duration: 0.25 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-[#292929] text-gold-400'
                            : 'text-white/65 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4.5 w-4.5 shrink-0 transition-colors',
                              isActive ? 'text-gold-400' : 'text-white/55 group-hover:text-white',
                            )}
                          />
                          <span className="flex-1 leading-none">{item.label}</span>
                          {item.hint ? (
                            <span
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{ background: 'rgba(253,186,0,0.15)', color: '#fdba00' }}
                            >
                              {item.hint}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-3 rounded-xl bg-[#222222] p-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-xs font-bold text-black">{(user?.name || 'PX').slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{user?.name || 'Administrador'}</span><span className="block truncate text-[10px] text-white/45">{user?.role === 'super_admin' ? 'Super administrador' : 'Administrador'} · v{env.appVersion}</span></span>
          <button type="button" onClick={logout} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión"><LogOut className="size-4" /></button>
        </div>
      </div>
    </aside>
  )
}
