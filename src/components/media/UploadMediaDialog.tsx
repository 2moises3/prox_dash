import { useRef, useState } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/ui/select'
import type { ReactNode } from 'react'
import type { MediaType } from '@/types'
import { useMediaMutations } from '@/hooks/useMedia'

const MAX_SIZE_MB = 5
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface UploadMediaDialogProps {
  destinationId: string
  defaultType?: MediaType
  trigger: ReactNode
}

export function UploadMediaDialog({
  destinationId,
  defaultType = 'gallery',
  trigger,
}: UploadMediaDialogProps) {
  const { upload } = useMediaMutations(destinationId)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<MediaType>(defaultType)
  const [altText, setAltText] = useState('')
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFiles([])
    setPreviews([])
    setAltText('')
    setProgress(0)
    setMediaType(defaultType)
    setIsUploading(false)
  }

  const validateAndSet = (selected: FileList | null) => {
    if (!selected) return
    const validFiles: File[] = []
    const newPreviews: string[] = []
    
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i]
      if (!ALLOWED.includes(f.type)) {
        toast.error(`Formato no permitido para ${f.name}.`)
        continue
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`La imagen ${f.name} supera el máximo de ${MAX_SIZE_MB} MB.`)
        continue
      }
      validFiles.push(f)
      newPreviews.push(URL.createObjectURL(f))
    }
    
    setFiles((prev) => [...prev, ...validFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
    
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Selecciona al menos una imagen primero.')
      return
    }
    setIsUploading(true)
    let successCount = 0
    
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      try {
        await upload.mutateAsync({
          file: f,
          mediaType,
          altText: altText.trim() || undefined,
          onProgress: (p) => setProgress(Math.round(((i * 100) + p) / files.length))
        })
        successCount++
      } catch (err) {
        console.error('Error uploading file:', f.name, err)
      }
    }
    
    setIsUploading(false)
    if (successCount === files.length) {
      setOpen(false)
      reset()
    } else if (successCount > 0) {
      toast.error(`Se subieron ${successCount} de ${files.length} imágenes.`)
      setOpen(false)
      reset()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir imagen</DialogTitle>
          <DialogDescription>
            La imagen se sube de forma segura a través del backend (nunca directo a Cloudinary).
            Máximo {MAX_SIZE_MB} MB · JPG, PNG, WEBP o GIF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {previews.length > 0 ? (
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2">
              <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center">
                <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} className="text-xs">
                  <UploadCloud className="mr-2 h-3.5 w-3.5" />
                  Agregar más imágenes
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center transition-colors hover:border-jungle-300 hover:bg-jungle-50/40"
            >
              <UploadCloud className="h-8 w-8 text-slate-300" />
              <span className="text-sm font-medium text-slate-600">
                Haz clic para seleccionar una imagen
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED.join(',')}
            className="hidden"
            onChange={(e) => validateAndSet(e.target.files)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo de imagen</Label>
              <SelectField
                value={mediaType}
                onValueChange={(v) => setMediaType(v as MediaType)}
                options={[
                  { value: 'cover', label: 'Portada' },
                  { value: 'gallery', label: 'Galería' },
                ]}
              />
            </div>
            <div>
              <Label htmlFor="alt">Texto alternativo</Label>
              <Input
                id="alt"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descripción de la imagen"
              />
            </div>
          </div>

          {isUploading ? (
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-jungle-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isUploading} disabled={files.length === 0}>
            {files.length > 1 ? `Subir ${files.length} imágenes` : 'Subir imagen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
