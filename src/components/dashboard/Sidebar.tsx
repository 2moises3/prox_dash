import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Brand } from './Brand'
import { navSections } from '@/app/navigation'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside
      className="flex h-full w-72 flex-col"
      style={{ background: '#1a1f2e' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/8 px-6">
        <Brand size="sm" light />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {navSections.map((section, si) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
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
                          'nav-active-bar group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-white/55 hover:bg-white/6 hover:text-white/90',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4.5 w-4.5 shrink-0 transition-colors',
                              isActive ? 'text-gold-400' : 'text-white/40 group-hover:text-white/70',
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
      <div className="border-t border-white/8 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Beta interna
          </p>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white/40"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            v{env.appVersion}
          </span>
        </div>
      </div>
    </aside>
  )
}
