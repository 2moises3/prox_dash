import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SelectField } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnnouncementPreview } from '@/components/announcements/AnnouncementPreview'
import {
  APP_SCREEN_OPTIONS,
  CTA_KIND_OPTIONS,
  PLACEMENT_HELP,
  PLACEMENT_OPTIONS,
  TEMPLATE_OPTIONS,
  buildCtaUrl,
  parseCtaUrl,
} from '@/utils/announcements'
import { useAnnouncement, useAnnouncementMutations } from '@/hooks/useAnnouncements'
import { useDestinations } from '@/hooks/useDestinations'
import { isoToLocalInput, localInputToIso } from '@/utils/format'
import type { AnnouncementPayload } from '@/types'

const PLACEMENTS = ['app_start', 'home_top', 'destination_detail', 'global_modal'] as const
const TEMPLATES = [
  'image_banner',
  'gradient_card',
  'minimal_notice',
  'tourism_highlight',
  'maintenance_notice',
] as const
const CTA_KINDS = ['none', 'destination', 'screen', 'url'] as const
const MESSAGE_MAX = 600
const ALL_DESTINATIONS = '__all'

const schema = z
  .object({
    title: z.string().trim().min(1, 'El título es obligatorio').max(160, 'Máximo 160 caracteres'),
    message: z.string().trim().min(1, 'El mensaje es obligatorio').max(MESSAGE_MAX, `Máximo ${MESSAGE_MAX} caracteres`),
    placement: z.enum(PLACEMENTS),
    template_type: z.enum(TEMPLATES),
    target_destination_id: z.string(),
    cta_kind: z.enum(CTA_KINDS),
    cta_text: z.string().max(40, 'Máximo 40 caracteres'),
    cta_destination: z.string(),
    cta_screen: z.string(),
    cta_link: z.string(),
    starts_at: z.string(),
    ends_at: z.string(),
    duration_seconds: z
      .number({ message: 'Ingresa los segundos' })
      .int('Debe ser un número entero')
      .min(3, 'Mínimo 3 segundos')
      .max(60, 'Máximo 60 segundos'),
    priority: z
      .number({ message: 'Ingresa una prioridad' })
      .int('Debe ser un número entero')
      .min(0, 'Mínimo 0')
      .max(1000, 'Máximo 1000'),
    frequency_cap: z
      .number({ message: 'Ingresa un número' })
      .int('Debe ser un número entero')
      .min(0, 'Mínimo 0')
      .max(100, 'Máximo 100'),
    is_active: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.starts_at && d.ends_at && new Date(d.ends_at) <= new Date(d.starts_at)) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'La fecha de fin debe ser posterior a la de inicio' })
    }
    if (d.cta_kind === 'none') return
    if (!d.cta_text.trim()) {
      ctx.addIssue({ code: 'custom', path: ['cta_text'], message: 'Escribe el texto del botón' })
    }
    if (d.cta_kind === 'destination' && !d.cta_destination) {
      ctx.addIssue({ code: 'custom', path: ['cta_destination'], message: 'Elige el destino' })
    }
    if (d.cta_kind === 'screen' && !d.cta_screen) {
      ctx.addIssue({ code: 'custom', path: ['cta_screen'], message: 'Elige la pantalla' })
    }
    if (d.cta_kind === 'url' && !/^https:\/\/[^\s]+\.[^\s]+$/.test(d.cta_link.trim())) {
      ctx.addIssue({ code: 'custom', path: ['cta_link'], message: 'Ingresa un enlace que empiece con https://' })
    }
  })

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  title: '',
  message: '',
  placement: 'home_top',
  template_type: 'gradient_card',
  target_destination_id: ALL_DESTINATIONS,
  cta_kind: 'none',
  cta_text: '',
  cta_destination: '',
  cta_screen: '',
  cta_link: '',
  starts_at: '',
  ends_at: '',
  duration_seconds: 6,
  priority: 0,
  frequency_cap: 1,
  is_active: true,
}

function ctaUrlFrom(d: FormValues): string | null {
  return buildCtaUrl({ kind: d.cta_kind, destination: d.cta_destination, screen: d.cta_screen, link: d.cta_link })
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null
}

export function AnnouncementEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  // Imagen elegida antes de guardar un anuncio nuevo: se sube justo después de crearlo.
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const pendingPreview = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : null), [pendingFile])
  useEffect(() => () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
  }, [pendingPreview])

  const existing = useAnnouncement(numericId)
  const destinations = useDestinations()
  const { create, update, uploadImage, removeImage } = useAnnouncementMutations()

  const destinationOptions = useMemo(
    () =>
      (destinations.data ?? [])
        .map((d) => ({ value: d.destination_id, label: d.destination }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [destinations.data],
  )
  const destinationName = (destId: string) => destinationOptions.find((o) => o.value === destId)?.label

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  // Cargar valores al editar
  useEffect(() => {
    if (isEdit && existing.data) {
      const a = existing.data
      const cta = parseCtaUrl(a.cta_url)
      reset({
        title: a.title,
        message: a.message,
        placement: a.placement,
        template_type: a.template_type,
        target_destination_id: a.target_destination_id ?? ALL_DESTINATIONS,
        cta_kind: cta.kind,
        cta_text: a.cta_text ?? '',
        cta_destination: cta.destination,
        cta_screen: cta.screen,
        cta_link: cta.link,
        starts_at: isoToLocalInput(a.starts_at),
        ends_at: isoToLocalInput(a.ends_at),
        duration_seconds: Math.min(60, Math.max(3, a.duration_seconds)),
        priority: a.priority,
        frequency_cap: a.frequency_cap ?? 0,
        is_active: a.is_active,
      })
    }
  }, [isEdit, existing.data, reset])

  const values = useWatch({ control })
  const placement = values.placement ?? 'home_top'
  const ctaKind = values.cta_kind ?? 'none'

  const buildPayload = (data: FormValues): AnnouncementPayload => {
    const ctaUrl = ctaUrlFrom(data)
    return {
      title: data.title.trim(),
      message: data.message.trim(),
      placement: data.placement,
      template_type: data.template_type,
      target_destination_id:
        data.placement === 'destination_detail' && data.target_destination_id !== ALL_DESTINATIONS
          ? data.target_destination_id
          : null,
      cta_text: ctaUrl ? data.cta_text.trim() : null,
      cta_url: ctaUrl,
      starts_at: localInputToIso(data.starts_at || null),
      ends_at: localInputToIso(data.ends_at || null),
      duration_seconds: data.duration_seconds,
      priority: data.priority,
      frequency_cap: data.frequency_cap,
      is_active: data.is_active,
    }
  }

  const onSubmit = (data: FormValues) => {
    const payload = buildPayload(data)
    if (isEdit && numericId) {
      update.mutate({ id: numericId, payload }, { onSuccess: () => navigate('/anuncios') })
      return
    }
    create.mutate(payload, {
      onSuccess: (created) => {
        if (!pendingFile) {
          navigate('/anuncios')
          return
        }
        uploadImage.mutate(
          { id: created.id, file: pendingFile },
          // Si la imagen falla, el anuncio ya existe: lo abrimos para reintentar.
          { onSettled: (_, err) => navigate(err ? `/anuncios/${created.id}` : '/anuncios') },
        )
      },
    })
  }

  const handleImage = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5 MB.')
      return
    }
    if (numericId) {
      uploadImage.mutate({ id: numericId, file })
    } else {
      setPendingFile(file)
    }
  }

  if (isEdit && existing.isLoading) {
    return (
      <div>
        <PageHeader title="Editar anuncio" backTo="/anuncios" backLabel="Volver a anuncios" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  const imageUrl = existing.data?.background_image_url ?? pendingPreview
  const saving = isSubmitting || create.isPending || update.isPending || uploadImage.isPending
  const targetId = values.target_destination_id ?? ALL_DESTINATIONS

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar anuncio' : 'Nuevo anuncio'}
        description="Elige dónde aparece, escribe el mensaje y define qué hace el botón."
        backTo="/anuncios"
        backLabel="Volver a anuncios"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Dónde aparece</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Ubicación en la app</Label>
                  <Controller
                    control={control}
                    name="placement"
                    render={({ field }) => (
                      <SelectField ariaLabel="Ubicación" value={field.value} onValueChange={field.onChange} options={PLACEMENT_OPTIONS} />
                    )}
                  />
                </div>
                <div>
                  <Label>Estilo</Label>
                  <Controller
                    control={control}
                    name="template_type"
                    render={({ field }) => (
                      <SelectField ariaLabel="Estilo" value={field.value} onValueChange={field.onChange} options={TEMPLATE_OPTIONS} />
                    )}
                  />
                </div>
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{PLACEMENT_HELP[placement]}</p>
              {placement === 'destination_detail' ? (
                <div>
                  <Label>¿En qué destino?</Label>
                  <Controller
                    control={control}
                    name="target_destination_id"
                    render={({ field }) => (
                      <SelectField
                        ariaLabel="Destino donde aparece"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[{ value: ALL_DESTINATIONS, label: 'Todos los destinos' }, ...destinationOptions]}
                      />
                    )}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Contenido */}
          <Card>
            <CardHeader>
              <CardTitle>Mensaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input id="title" {...register('title')} placeholder="Temporada seca en Huaraz" />
                <FieldError message={errors.title?.message} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Mensaje *</Label>
                  <span className="text-[11px] text-slate-400">
                    {(values.message ?? '').length}/{MESSAGE_MAX}
                  </span>
                </div>
                <Textarea
                  id="message"
                  rows={4}
                  {...register('message')}
                  placeholder="Mayo a septiembre es la mejor época para la Laguna 69: cielos despejados y caminos secos."
                />
                <FieldError message={errors.message?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Botón */}
          <Card>
            <CardHeader>
              <CardTitle>Botón</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>¿Qué hace el botón?</Label>
                  <Controller
                    control={control}
                    name="cta_kind"
                    render={({ field }) => (
                      <SelectField ariaLabel="Acción del botón" value={field.value} onValueChange={field.onChange} options={CTA_KIND_OPTIONS} />
                    )}
                  />
                </div>
                {ctaKind !== 'none' ? (
                  <div>
                    <Label htmlFor="cta_text">Texto del botón *</Label>
                    <Input id="cta_text" {...register('cta_text')} placeholder="Ver destino" />
                    <FieldError message={errors.cta_text?.message} />
                  </div>
                ) : null}
              </div>
              {ctaKind === 'destination' ? (
                <div>
                  <Label>Destino que abre</Label>
                  <Controller
                    control={control}
                    name="cta_destination"
                    render={({ field }) => (
                      <SelectField
                        ariaLabel="Destino que abre el botón"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={destinationOptions}
                        placeholder="Elige un destino…"
                      />
                    )}
                  />
                  <FieldError message={errors.cta_destination?.message} />
                </div>
              ) : null}
              {ctaKind === 'screen' ? (
                <div>
                  <Label>Pantalla que abre</Label>
                  <Controller
                    control={control}
                    name="cta_screen"
                    render={({ field }) => (
                      <SelectField
                        ariaLabel="Pantalla que abre el botón"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={APP_SCREEN_OPTIONS}
                        placeholder="Elige una pantalla…"
                      />
                    )}
                  />
                  <FieldError message={errors.cta_screen?.message} />
                </div>
              ) : null}
              {ctaKind === 'url' ? (
                <div>
                  <Label htmlFor="cta_link">Enlace</Label>
                  <Input id="cta_link" {...register('cta_link')} placeholder="https://tuboleto.cultura.pe" />
                  <p className="mt-1 text-[11px] text-slate-400">Se abre en el navegador del teléfono.</p>
                  <FieldError message={errors.cta_link?.message} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Programación */}
          <Card>
            <CardHeader>
              <CardTitle>Cuándo y cuántas veces</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="starts_at">Inicio</Label>
                <Input id="starts_at" type="datetime-local" {...register('starts_at')} />
                <p className="mt-1 text-[11px] text-slate-400">Vacío = desde ahora.</p>
              </div>
              <div>
                <Label htmlFor="ends_at">Fin</Label>
                <Input id="ends_at" type="datetime-local" {...register('ends_at')} />
                <p className="mt-1 text-[11px] text-slate-400">Vacío = sin fecha de fin.</p>
                <FieldError message={errors.ends_at?.message} />
              </div>
              {placement === 'app_start' ? (
                <div>
                  <Label htmlFor="frequency_cap">Veces que lo ve cada viajero</Label>
                  <Input id="frequency_cap" type="number" min={0} max={100} {...register('frequency_cap', { valueAsNumber: true })} />
                  <p className="mt-1 text-[11px] text-slate-400">1 = una sola vez. 0 = cada vez que abre la app.</p>
                  <FieldError message={errors.frequency_cap?.message} />
                </div>
              ) : null}
              {placement === 'home_top' ? (
                <div>
                  <Label htmlFor="duration_seconds">Segundos antes de pasar al siguiente</Label>
                  <Input id="duration_seconds" type="number" min={3} max={60} {...register('duration_seconds', { valueAsNumber: true })} />
                  <p className="mt-1 text-[11px] text-slate-400">Solo aplica si hay varios anuncios en el carrusel.</p>
                  <FieldError message={errors.duration_seconds?.message} />
                </div>
              ) : null}
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Input id="priority" type="number" min={0} max={1000} {...register('priority', { valueAsNumber: true })} />
                <p className="mt-1 text-[11px] text-slate-400">Mayor número = se muestra primero.</p>
                <FieldError message={errors.priority?.message} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Anuncio activo</p>
                  <p className="text-xs text-slate-400">
                    Si está inactivo no se mostrará en la app aunque esté en rango de fechas.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Imagen */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-20 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-300">Sin imagen</div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleImage(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                  loading={uploadImage.isPending}
                  leftIcon={<ImagePlus className="h-4 w-4" />}
                >
                  {imageUrl ? 'Cambiar imagen' : 'Elegir imagen'}
                </Button>
                {imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => (numericId ? removeImage.mutate(numericId) : setPendingFile(null))}
                    loading={removeImage.isPending}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                JPG o PNG de hasta 5 MB, horizontal (por ejemplo 1200 × 600). El estilo «Aviso minimalista» no muestra imagen.
                {!isEdit && pendingFile ? ' Se subirá al guardar el anuncio.' : ''}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/anuncios')}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              {isEdit ? 'Guardar cambios' : 'Crear anuncio'}
            </Button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <AnnouncementPreview
              title={values.title ?? ''}
              message={values.message ?? ''}
              template={values.template_type ?? 'gradient_card'}
              placement={placement}
              ctaText={ctaKind !== 'none' ? values.cta_text : null}
              backgroundImageUrl={imageUrl}
              destinationName={targetId !== ALL_DESTINATIONS ? destinationName(targetId) : null}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
