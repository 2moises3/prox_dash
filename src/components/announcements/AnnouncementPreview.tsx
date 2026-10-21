import { AlertTriangle, ChevronLeft, Compass, Info, Megaphone, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PLACEMENT_LABELS, TEMPLATE_GRADIENTS } from '@/utils/announcements'
import type { AnnouncementPlacement, AnnouncementTemplate } from '@/types'

interface AnnouncementPreviewProps {
  title: string
  message: string
  template: AnnouncementTemplate
  placement: AnnouncementPlacement
  ctaText?: string | null
  backgroundImageUrl?: string | null
  destinationName?: string | null
}

const TEMPLATE_ICONS: Record<AnnouncementTemplate, LucideIcon> = {
  image_banner: Megaphone,
  gradient_card: Megaphone,
  minimal_notice: Info,
  tourism_highlight: Compass,
  maintenance_notice: AlertTriangle,
}

/** Tarjeta del anuncio con el mismo estilo que pinta la app para cada plantilla. */
function AnnouncementBody({
  title,
  message,
  template,
  ctaText,
  backgroundImageUrl,
  compact,
  closable,
}: {
  title: string
  message: string
  template: AnnouncementTemplate
  ctaText?: string | null
  backgroundImageUrl?: string | null
  compact?: boolean
  closable?: boolean
}) {
  const isMinimal = template === 'minimal_notice'
  const showImage = Boolean(backgroundImageUrl) && !isMinimal
  const Icon = TEMPLATE_ICONS[template]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-sm',
        compact ? 'p-3' : 'p-4',
        isMinimal ? 'border border-slate-200 bg-white text-slate-800' : 'text-white',
        !isMinimal && !showImage && `bg-gradient-to-br ${TEMPLATE_GRADIENTS[template]}`,
      )}
    >
      {showImage ? (
        <>
          <img src={backgroundImageUrl as string} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/35" />
        </>
      ) : null}
      {closable ? (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white">
          <X className="h-3 w-3" />
        </span>
      ) : null}
      <div className="relative">
        <div className="flex items-center gap-1.5 pr-6">
          <Icon className={cn('h-3.5 w-3.5 shrink-0', isMinimal ? 'text-amber-500' : 'text-amber-400')} />
          <h3 className="truncate text-[13px] font-bold leading-tight">{title || 'Título del anuncio'}</h3>
        </div>
        <p className={cn('mt-1 line-clamp-3 text-[11px] leading-snug', isMinimal ? 'text-slate-500' : 'text-white/85')}>
          {message || 'Mensaje del anuncio que verá el viajero en la app móvil.'}
        </p>
        {ctaText ? (
          <span
            className={cn(
              'mt-2.5 inline-block rounded-full px-3 py-1 text-[11px] font-semibold',
              isMinimal ? 'bg-slate-900 text-white' : 'bg-amber-400 text-slate-900',
            )}
          >
            {ctaText}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ModalPreview(props: AnnouncementPreviewProps) {
  const isMinimal = props.template === 'minimal_notice'
  const Icon = TEMPLATE_ICONS[props.template]
  const showImage = Boolean(props.backgroundImageUrl) && !isMinimal
  const important = props.placement === 'global_modal'
  return (
    <div className="relative min-h-[360px] bg-slate-300">
      <div className="absolute inset-0 space-y-2 p-3 opacity-60">
        <div className="h-16 rounded-xl bg-white" />
        <div className="h-24 rounded-xl bg-white" />
        <div className="h-24 rounded-xl bg-white" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full overflow-hidden rounded-2xl bg-white">
          <div
            className={cn(
              'relative flex h-20 items-center justify-center',
              !showImage && `bg-gradient-to-br ${TEMPLATE_GRADIENTS[props.template]}`,
            )}
          >
            {showImage ? (
              <img src={props.backgroundImageUrl as string} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Icon className={cn('h-7 w-7', isMinimal ? 'text-amber-500' : 'text-amber-400')} />
            )}
            {!important ? (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white">
                <X className="h-3 w-3" />
              </span>
            ) : null}
          </div>
          <div className="p-3">
            <h3 className="text-[13px] font-bold text-slate-900">{props.title || 'Título del anuncio'}</h3>
            <p className="mt-1 line-clamp-4 text-[11px] leading-snug text-slate-500">
              {props.message || 'Mensaje del anuncio que verá el viajero en la app móvil.'}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="flex-1 rounded-lg border border-slate-200 py-1.5 text-center text-[11px] font-semibold text-slate-700">
                {important ? 'Entendido' : props.ctaText ? 'Ahora no' : 'Entendido'}
              </span>
              {props.ctaText ? (
                <span className="flex-1 truncate rounded-lg bg-slate-900 px-2 py-1.5 text-center text-[11px] font-semibold text-white">
                  {props.ctaText}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomePreview(props: AnnouncementPreviewProps) {
  return (
    <div className="min-h-[360px] bg-slate-50">
      <div className="bg-[#1A1F2E] px-3 pb-3 pt-2 text-white">
        <p className="text-[10px] text-white/60">Hola, viajero</p>
        <p className="text-sm font-bold">Explora el Perú</p>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5 text-[10px] text-white/60">
          <Search className="h-3 w-3" /> Buscar destinos
        </div>
      </div>
      <div className="p-3">
        <AnnouncementBody {...props} compact closable />
        <div className="mt-2 flex justify-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-slate-700" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-20 rounded-xl bg-white" />
          <div className="h-20 rounded-xl bg-white" />
        </div>
      </div>
    </div>
  )
}

function DetailPreview(props: AnnouncementPreviewProps) {
  return (
    <div className="min-h-[360px] bg-white">
      <div className="relative h-24 bg-gradient-to-br from-slate-400 to-slate-600">
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
          <ChevronLeft className="h-4 w-4 text-slate-700" />
        </span>
        <p className="absolute bottom-2 left-3 text-sm font-bold text-white">
          {props.destinationName || 'Cualquier destino'}
        </p>
      </div>
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <AnnouncementBody {...props} compact closable />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}

export function AnnouncementPreview(props: AnnouncementPreviewProps) {
  const { placement } = props
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="rounded-[2rem] border-8 border-slate-900 bg-slate-900 shadow-soft-lg">
        <div className="overflow-hidden rounded-[1.4rem] bg-slate-50">
          <div className="flex items-center justify-between bg-white px-4 py-1.5 text-[10px] font-medium text-slate-400">
            <span>9:41</span>
            <span>{PLACEMENT_LABELS[placement]}</span>
          </div>
          {placement === 'home_top' ? (
            <HomePreview {...props} />
          ) : placement === 'destination_detail' ? (
            <DetailPreview {...props} />
          ) : (
            <ModalPreview {...props} />
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">Así lo verá el viajero en la app</p>
    </div>
  )
}
