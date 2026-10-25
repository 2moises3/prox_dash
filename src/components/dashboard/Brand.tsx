import { cn } from '@/lib/utils'

interface BrandProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
  /** true = logo blanco (para fondos oscuros), false = logo oscuro (fondos claros) */
  light?: boolean
}

/**
 * Isotipo oficial unificado de PROXVEL:
 * Cuadrito en color ámbar/dorado de la marca (#D89B1F) con esquinas redondeadas
 * y el emblema de la brújula náutica en blanco puro al centro.
 */
export function BrandIcon({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dim =
    size === 'sm'
      ? 'h-8 w-8 rounded-lg'
      : size === 'lg'
        ? 'h-11 w-11 rounded-2xl'
        : 'h-9 w-9 rounded-xl'

  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#F5B938] via-[#D89B1F] to-[#BA7E0E] shadow-[0_2px_8px_rgba(216,155,31,0.28)]',
        dim,
        className,
      )}
      title="PROXVEL"
    >
      <svg
        viewBox="0 0 64 64"
        className={cn(iconSize, 'text-white drop-shadow-[0_1px_1px_rgba(74,48,0,0.3)]')}
        fill="currentColor"
      >
        {/* Anillo exterior de la brújula */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32 45C39.1797 45 45 39.1797 45 32C45 24.8203 39.1797 19 32 19C24.8203 19 19 24.8203 19 32C19 39.1797 24.8203 45 32 45ZM32 42C37.5228 42 42 37.5228 42 32C42 26.4772 37.5228 22 32 22C26.4772 22 22 26.4772 22 32C22 37.5228 26.4772 42 32 42Z"
        />

        {/* Puntas cardinales (N, S, E, O) */}
        <polygon points="32,9 29,20 35,20" />
        <polygon points="32,55 35,44 29,44" />
        <polygon points="55,32 44,29 44,35" />
        <polygon points="9,32 20,35 20,29" />

        {/* Puntas intermedias (NE, SE, SO, NO) */}
        <polygon points="48,16 39,22 42,25" />
        <polygon points="48,48 42,39 39,42" />
        <polygon points="16,48 25,42 22,39" />
        <polygon points="16,16 22,25 25,22" />

        {/* Aguja náutica central orientada en diagonal hacia el destino */}
        <polygon points="43.5,20.5 32,30 30,32 20.5,43.5 30,32 32,30" />
        <circle cx="32" cy="32" r="3.2" fill="#D89B1F" />
        <circle cx="32" cy="32" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  )
}

export function Brand({ className, size = 'md', subtitle, light = false }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandIcon size={size} />
      <div className="flex flex-col">
        <span
          className={cn(
            'font-extrabold tracking-wider font-sans leading-tight',
            size === 'sm' ? 'text-base' : 'text-lg',
            light ? 'text-white' : 'text-slate-900',
          )}
        >
          PROXVEL
        </span>
        {subtitle ? (
          <span
            className={cn(
              'text-[9px] font-bold tracking-[0.14em] uppercase leading-none mt-0.5',
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

/** Marca standalone (isotipo unificado en cuadrito dorado) */
export const BrandMark = BrandIcon
