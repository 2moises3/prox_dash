import { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ImagePlus, ImageIcon, GripVertical, Save, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MediaCard } from '@/components/media/MediaCard'
import { UploadMediaDialog } from '@/components/media/UploadMediaDialog'
import { useAllDestinationMedia, useMediaMutations } from '@/hooks/useMedia'
import type { MediaItem } from '@/types'

/* ── Drag handle para un item de galería ─────────────────────────────────── */
function DragHandle() {
  return <GripVertical className="h-4 w-4 text-white cursor-grab active:cursor-grabbing" />
}

/* ── Item reordenable ────────────────────────────────────────────────────── */
function ReorderItem({ item, destinationId, inactive }: { item: MediaItem; destinationId: string; inactive?: boolean }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      className="touch-none select-none w-[260px] shrink-0"
    >
      <div className="relative">
        <MediaCard
          destinationId={destinationId}
          media={item}
          type="gallery"
          inactive={inactive}
          dragHandle={
            <div
              onPointerDown={(e) => controls.start(e)}
              className="rounded p-1 bg-slate-900/60 hover:bg-slate-900 text-white shadow-sm"
              style={{ touchAction: 'none' }}
            >
              <DragHandle />
            </div>
          }
        />
      </div>
    </Reorder.Item>
  )
}

/* ── MediaManager principal ──────────────────────────────────────────────── */
export function MediaManager({ id }: { id: string }) {
  const media     = useAllDestinationMedia(id)
  const mutations = useMediaMutations(id)

  const [galleryItems, setGalleryItems] = useState<MediaItem[]>(() => media.data?.gallery ?? [])
  const [originalOrder, setOriginalOrder] = useState<MediaItem[]>(() => media.data?.gallery ?? [])
  const [isDirty, setIsDirty]           = useState(false)
  const [syncedData, setSyncedData]     = useState<typeof media.data>(undefined)

  // Sync cuando llegan datos del backend.
  // Patrón recomendado por React: ajustar estado durante el render (no en un
  // useEffect) cuando una dependencia cambia. Mantiene el mismo comportamiento.
  if (media.data && media.data !== syncedData) {
    setSyncedData(media.data)
    setGalleryItems(media.data.gallery)
    setOriginalOrder(media.data.gallery)
    setIsDirty(false)
  }

  const handleReorder = (newOrder: MediaItem[]) => {
    setGalleryItems(newOrder)
    setIsDirty(true)
  }

  const handleSaveOrder = () => {
    const items = galleryItems.map((item, idx) => ({ id: item.id, position: idx + 1 }))
    mutations.saveOrder.mutate(items, { onSuccess: () => setIsDirty(false) })
  }

  const handleResetOrder = () => {
    setGalleryItems(originalOrder)
    setIsDirty(false)
  }

  if (media.isError) return <ErrorState onRetry={() => void media.refetch()} />

  if (media.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="aspect-[4/3] rounded-xl" />
        <Skeleton className="aspect-[4/3] rounded-xl" />
        <Skeleton className="aspect-[4/3] rounded-xl" />
      </div>
    )
  }

  const d = media.data!

  return (
    <div className="space-y-8">

      {/* ── Portada ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Portada</h2>
          <UploadMediaDialog
            destinationId={id}
            defaultType="cover"
            trigger={
              <Button variant="secondary" size="sm">
                <ImagePlus className="h-4 w-4" />
                {d.cover ? 'Reemplazar portada' : 'Agregar portada'}
              </Button>
            }
          />
        </div>

        {d.cover ? (
          <div className="max-w-sm">
            <MediaCard destinationId={id} media={d.cover} type="cover" />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-slate-400">
              <ImageIcon className="h-5 w-5 text-slate-300" />
              Este destino no tiene portada activa.
            </CardContent>
          </Card>
        )}

        {/* Portadas inactivas */}
        {d.inactive_covers.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Portadas inactivas ({d.inactive_covers.length})
            </p>
            <div className="grid max-w-sm grid-cols-1 gap-3">
              {d.inactive_covers.map((item) => (
                <MediaCard key={item.id} destinationId={id} media={item} type="cover" inactive />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Galería ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Galería</h2>
            <Badge variant="neutral">{d.gallery.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <>
                <Button variant="ghost" size="sm" onClick={handleResetOrder}>
                  <RotateCcw className="h-4 w-4" />
                  Restablecer
                </Button>
                <Button size="sm" onClick={handleSaveOrder} loading={mutations.saveOrder.isPending}>
                  <Save className="h-4 w-4" />
                  Guardar orden
                </Button>
              </>
            )}
            <UploadMediaDialog
              destinationId={id}
              defaultType="gallery"
              trigger={
                <Button variant="secondary" size="sm">
                  <ImagePlus className="h-4 w-4" />
                  Subir imagen
                </Button>
              }
            />
          </div>
        </div>

        <div className="h-5 mb-3">
          <p
            className={`text-xs text-gold-600 font-medium transition-opacity duration-300 ${
              isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            Arrastra las imágenes para reordenarlas · El ícono ⠿ es el asa de arrastre
          </p>
        </div>

        {galleryItems.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="Galería vacía"
            description="Aún no hay imágenes de galería activas para este destino."
            action={
              <UploadMediaDialog
                destinationId={id}
                defaultType="gallery"
                trigger={<Button variant="secondary"><ImagePlus className="h-4 w-4" />Subir primera imagen</Button>}
              />
            }
          />
        ) : (
          <div className="overflow-x-auto pb-4 scrollbar-thin px-1 pt-1">
            <Reorder.Group
              axis="x"
              values={galleryItems}
              onReorder={handleReorder}
              className="flex gap-4 items-start w-max"
              as="div"
            >
              {galleryItems.map((item) => (
                <ReorderItem key={item.id} item={item} destinationId={id} />
              ))}
            </Reorder.Group>
          </div>
        )}

        {/* Galería inactiva */}
        {d.inactive_gallery.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Imágenes inactivas ({d.inactive_gallery.length}) — haz clic en ⋮ para reactivar o eliminar
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {d.inactive_gallery.map((item) => (
                <MediaCard key={item.id} destinationId={id} media={item} type="gallery" inactive />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
