import { useRef, useState } from 'react'
import { MoreVertical, Pencil, Trash2, Star, RefreshCw, EyeOff, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useMediaMutations } from '@/hooks/useMedia'
import type { MediaItem, MediaType } from '@/types'
import { cn } from '@/lib/utils'

interface MediaCardProps {
  destinationId: string
  media: MediaItem
  type: MediaType
  /** Cuando true el item es inactivo (soft-deleted) */
  inactive?: boolean
  /** Handle de drag (ícono) inyectado desde MediaManager */
  dragHandle?: React.ReactNode
}

export function MediaCard({ destinationId, media, type, inactive = false, dragHandle }: MediaCardProps) {
  const { patch, deactivate, activate, permanentDelete } = useMediaMutations(destinationId)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete, setConfirmDelete]         = useState(false)
  const [editAltOpen, setEditAltOpen]             = useState(false)
  const [altText, setAltText]                     = useState(media.alt_text ?? '')
  const replaceRef = useRef<HTMLInputElement>(null)

  const handleSaveAlt = () => {
    patch.mutate({ mediaId: media.id, updates: { alt_text: altText.trim() } }, { onSuccess: () => setEditAltOpen(false) })
  }

  const handleReplace = (file: File | undefined) => {
    if (!file) return
    // Subir nueva imagen con mismo tipo + desactivar la actual
    // El upload ya crea un nuevo registro; luego soft-delete el actual
    const formData = new FormData()
    formData.append('file', file)
    // Reusar upload mutation
    import('@/api/endpoints').then(({ mediaApi }) => {
      mediaApi.upload(destinationId, { file, mediaType: type }).then(() => {
        deactivate.mutate(media.id)
      })
    })
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-white shadow-soft transition-all',
        inactive
          ? 'border-slate-200 opacity-55 grayscale'
          : 'border-slate-200 hover:shadow-soft-lg',
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] bg-slate-100 select-none">
        {media.url ? (
          <img 
            src={media.url} 
            alt={media.alt_text ?? ''} 
            className="h-full w-full object-cover pointer-events-none" 
            draggable={false}
            loading="lazy" 
          />
        ) : null}

        {/* Overlay inactivo */}
        {inactive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
            <span className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Inactiva
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {type === 'cover' ? (
            <Badge variant="navy" className="shadow-sm">
              <Star className="h-3 w-3" /> Portada
            </Badge>
          ) : (
            <Badge variant="neutral" className="shadow-sm bg-white/90">Galería</Badge>
          )}
          {!inactive && <Badge variant="gold" className="shadow-sm">Activa</Badge>}
        </div>

        {/* Drag handle */}
        {dragHandle ? (
          <div className="absolute bottom-2 left-2 cursor-grab text-white/70 active:cursor-grabbing">
            {dragHandle}
          </div>
        ) : null}

        {/* Menú acciones */}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-lg bg-white/90 p-1.5 text-slate-600 shadow-sm hover:bg-white"
                aria-label="Acciones"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Editar alt text */}
              <DropdownMenuItem onSelect={() => setEditAltOpen(true)}>
                <Pencil className="h-4 w-4 text-slate-400" />
                Editar texto alternativo
              </DropdownMenuItem>

              {/* Reemplazar imagen */}
              <DropdownMenuItem onSelect={() => replaceRef.current?.click()}>
                <RefreshCw className="h-4 w-4 text-slate-400" />
                Reemplazar imagen
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Toggle activo/inactivo */}
              {inactive ? (
                <DropdownMenuItem
                  onSelect={() => activate.mutate(media.id)}
                  className="text-jungle-700 data-[highlighted]:bg-jungle-50 data-[highlighted]:text-jungle-700"
                >
                  <Eye className="h-4 w-4" />
                  Reactivar imagen
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirmDeactivate(true)}>
                  <EyeOff className="h-4 w-4 text-slate-400" />
                  Desactivar imagen
                </DropdownMenuItem>
              )}

              {/* Eliminar permanentemente */}
              <DropdownMenuItem
                onSelect={() => setConfirmDelete(true)}
                className="text-rose-600 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alt text */}
      <div className="p-3">
        <p className="truncate text-xs text-slate-500">
          {media.alt_text || <span className="italic text-slate-300">Sin texto alternativo</span>}
        </p>
      </div>

      {/* Input oculto para reemplazar imagen */}
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleReplace(e.target.files?.[0])}
      />

      {/* Dialog editar alt */}
      <Dialog open={editAltOpen} onOpenChange={setEditAltOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar texto alternativo</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor={`alt-${media.id}`}>Texto alternativo</Label>
            <Input
              id={`alt-${media.id}`}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descripción accesible de la imagen"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditAltOpen(false)} disabled={patch.isPending}>Cancelar</Button>
            <Button onClick={handleSaveAlt} loading={patch.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm desactivar */}
      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Desactivar imagen"
        description="La imagen dejará de mostrarse en la app pero permanecerá en el sistema. Puedes reactivarla en cualquier momento."
        confirmLabel="Desactivar"
        variant="danger"
        loading={deactivate.isPending}
        onConfirm={() => deactivate.mutate(media.id, { onSuccess: () => setConfirmDeactivate(false) })}
      />

      {/* Confirm eliminar permanentemente */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar imagen permanentemente"
        description="Se eliminará la imagen de Cloudinary y de la base de datos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        variant="danger"
        loading={permanentDelete.isPending}
        onConfirm={() => permanentDelete.mutate(media.id, { onSuccess: () => setConfirmDelete(false) })}
      />
    </div>
  )
}
