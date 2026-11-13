import { Skeleton } from '@/components/ui/skeleton'

export function LoadingRows({ label = 'Cargando datos', rows = 4 }: { label?: string; rows?: number }) {
  return <div role="status" className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} aria-hidden="true" className="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-4 p-3 sm:px-5">
        <Skeleton className="size-9 rounded-full" />
        <div className="space-y-2"><Skeleton className="h-3 w-2/3 max-w-44" /><Skeleton className="h-2 w-1/2 max-w-28" /></div>
        <Skeleton className="h-7 w-12 rounded-lg sm:w-20" />
      </div>
    ))}
  </div>
}
