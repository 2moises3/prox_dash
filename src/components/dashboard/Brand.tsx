import { cn } from '@/lib/utils'

interface BrandProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
  /** true = texto blanco (para fondos oscuros), false = texto oscuro (fondos claros) */
  light?: boolean
}

/**
 * Logotipo principal de PROXVEL:
 * La brújula náutica dorada oficial (sin recuadro) acompañada de la tipografía PROXVEL.
 */
export function Brand({ className, size = 'md', subtitle, light = false }: BrandProps) {
  const logoSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg'

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <img
        src="/logo.png"
        alt="PROXVEL"
        className={cn('object-contain flex-shrink-0 drop-shadow-sm', logoSize)}
      />
      <div className="flex flex-col">
        <span
          className={cn(
            'font-bold tracking-[0.16em] font-sans leading-none',
            textSize,
            light ? 'text-white' : 'text-slate-900',
          )}
        >
          PROXVEL
        </span>
        {subtitle ? (
          <span
            className={cn(
              'text-[9px] font-bold tracking-[0.14em] uppercase leading-none mt-1',
              light ? 'text-[#D89B1F]' : 'text-[#B87D0F]',
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** Marca standalone (solo la brújula dorada cuando el menú está colapsado) */
export function BrandMark({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img src="/logo.png" alt="PROXVEL" className={cn('object-contain', dim)} />
    </div>
  )
}
