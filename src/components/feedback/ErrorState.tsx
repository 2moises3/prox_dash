import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ErrorState({
  title = 'No se pudieron cargar los datos',
  message = 'Ocurrió un problema al comunicarse con el backend.',
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 px-6 text-center',
        compact ? 'my-3 py-4' : 'py-12',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
