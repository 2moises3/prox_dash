import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Accent = 'gold' | 'navy' | 'slate' | 'rose'

const ICON_STYLES: Record<Accent, { bg: string; color: string }> = {
  gold:  { bg: 'rgba(216,155,31,0.12)', color: '#c0841a' },
  navy:  { bg: 'rgba(23,23,23,0.08)',   color: '#171717' },
  slate: { bg: 'rgba(100,116,139,0.10)', color: '#475569' },
  rose:  { bg: 'rgba(244,63,94,0.10)',   color: '#e11d48' },
}

const LEFT_BORDER: Record<Accent, string> = {
  gold:  'border-l-gold-400',
  navy:  'border-l-navy-900',
  slate: 'border-l-slate-400',
  rose:  'border-l-rose-400',
}

interface MetricCardProps {
  label: string
  value: number | string | null | undefined
  icon: LucideIcon
  accent?: Accent
  hint?: string
  loading?: boolean
  index?: number
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'gold',
  hint,
  loading = false,
  index = 0,
}: MetricCardProps) {
  const iconStyle = ICON_STYLES[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-xl border-l-4 border border-slate-200/80 bg-white px-5 py-4 shadow-soft transition-shadow hover:shadow-soft-lg',
        LEFT_BORDER[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1.5 text-3xl font-black tracking-tight text-navy-900">
              {value ?? '—'}
            </p>
          )}
          {hint ? <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p> : null}
        </div>

        <motion.div
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconStyle.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconStyle.color }} />
        </motion.div>
      </div>
    </motion.div>
  )
}
