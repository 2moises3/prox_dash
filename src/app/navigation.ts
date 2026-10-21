import {
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Sparkles,
  Users,
  Settings,
  ShieldCheck,
  Smartphone,
  Upload,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Etiqueta opcional (p.ej. "Próximamente"). */
  hint?: string
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/destinos', label: 'Destinos turísticos', icon: MapPinned },
      { to: '/anuncios', label: 'Anuncios internos', icon: Megaphone },
      { to: '/motor', label: 'Motor de recomendación', icon: Sparkles },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: Users },
      { to: '/importar-datos', label: 'Importar datos', icon: Upload },
      { to: '/versiones', label: 'Versiones', icon: Smartphone },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
      { to: '/privacidad', label: 'Privacidad y legal', icon: ShieldCheck },
    ],
  },
]
