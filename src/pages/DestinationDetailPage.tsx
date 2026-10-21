import { useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  ImageIcon,
  MapPin,
  Tag,
  ThermometerSun,
  Users2,
  ExternalLink,
  Pencil,
  Save,
  X,
  Info,
  Star,
  MessageSquare,
  Power,
  PowerOff,
  GitMerge,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MergeDestinationDialog } from '@/components/destinations/MergeDestinationDialog'
import { useSetDestinationInEngine } from '@/hooks/useEngine'
import { Switch } from '@/components/ui/switch'
import { SelectField } from '@/components/ui/select'
import { useDestinationDetail, useUpdateDestination, useUpdateAbsaScores, useDestinationReviews, useSetDestinationStatus, useSetReviewHidden } from '@/hooks/useDestinations'
import { MediaManager } from '@/pages/MediaManagerPage'
import type { AspectScores } from '@/types'
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_LABELS,
  buildInfoForm,
  infoFormToPayload,
  type InfoFormState,
} from '@/utils/destinationForm'
import { cn } from '@/lib/utils'

const ASPECT_LABELS: Record<keyof AspectScores, string> = {
  accesibilidad: 'Accesibilidad',
  aforo_multitudes: 'Aforo / multitudes',
  alojamiento: 'Alojamiento',
  atencion_servicio: 'Atención y servicio',
  atractivos: 'Atractivos',
  clima: 'Clima',
  costos: 'Costos',
  gastronomia: 'Gastronomía',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
}

function AspectScoresCard({ scores }: { scores: AspectScores | null }) {
  const entries = (Object.keys(ASPECT_LABELS) as (keyof AspectScores)[]).map((key) => ({
    key,
    label: ASPECT_LABELS[key],
    value: scores?.[key] ?? null,
  }))

  const hasRealScores = entries.some((e) => e.value !== null && e.value !== undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aspectos ABSA</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRealScores ? (
          <p className="text-sm text-slate-400">
            Sin puntajes ABSA disponibles. Usa «Editar contexto» para configurarlos.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const val = e.value ?? 0.5
              const pct = Math.round(val * 100)
              const isNeutral = e.value === null || e.value === undefined
              return (
                <div key={e.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{e.label}</span>
                    <span className={cn('tabular-nums', isNeutral ? 'text-slate-300' : 'text-slate-400')}>
                      {isNeutral ? '—' : `${pct}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        isNeutral
                          ? 'bg-slate-200'
                          : 'bg-gradient-to-r from-jungle-400 to-jungle-600',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type AbsaFormState = Record<keyof AspectScores, number>

function buildAbsaForm(scores: AspectScores | null): AbsaFormState {
  const defaults = Object.fromEntries(
    (Object.keys(ASPECT_LABELS) as (keyof AspectScores)[]).map((k) => [
      k,
      Math.round(((scores?.[k] ?? 0.5) as number) * 100),
    ]),
  ) as AbsaFormState
  return defaults
}

function AspectScoresEditor({
  form,
  onChange,
}: {
  form: AbsaFormState
  onChange: (key: keyof AspectScores, pct: number) => void
}) {
  return (
    <div className="space-y-4">
      {(Object.keys(ASPECT_LABELS) as (keyof AspectScores)[]).map((key) => {
        const pct = form[key]
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{ASPECT_LABELS[key]}</span>
              <span className="tabular-nums font-semibold text-jungle-700">{pct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="w-full accent-jungle-600"
            />
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Formulario de información (catálogo turístico completo)                      */
/* -------------------------------------------------------------------------- */

export function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useDestinationDetail(id)
  const updateMutation = useUpdateDestination()
  const updateAbsaMutation = useUpdateAbsaScores()
  const setInEngine = useSetDestinationInEngine()
  const setStatus = useSetDestinationStatus()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)

  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam === 'multimedia' ? 'media' : tabParam === 'comments' ? 'comments' : 'info'
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'context' | 'tech' | 'comments'>(defaultTab as 'info' | 'media' | 'context' | 'tech' | 'comments')

  const { data: reviewsData, isLoading: isLoadingReviews } = useDestinationReviews(id)
  const setReviewHidden = useSetReviewHidden(id)

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [isEditingContext, setIsEditingContext] = useState(false)
  const [abssaForm, setAbsaForm] = useState<AbsaFormState>(() => buildAbsaForm(null))

  // Form states — todos los campos como string para los inputs; los numéricos
  // se convierten al guardar.
  const [formData, setFormData] = useState<InfoFormState>(() => buildInfoForm(null))

  const setField = (key: keyof InfoFormState, value: string) =>
    setFormData((f) => ({ ...f, [key]: value }))

  // Sync form data when edit is cancelled or started
  const startEditing = () => {
    setFormData(buildInfoForm(data ?? null))
    setIsEditingInfo(true)
  }

  const handleSaveInfo = () => {
    if (!id) return
    updateMutation.mutate(
      { id, payload: infoFormToPayload(formData) },
      {
        onSuccess: () => {
          toast.success('Información del destino actualizada')
          setIsEditingInfo(false)
        },
        onError: (err) => {
          toast.error('Error al actualizar el destino')
          console.error(err)
        },
      }
    )
  }

  const handleCancelInfo = () => {
    setIsEditingInfo(false)
    setFormData(buildInfoForm(data ?? null))
  }

  const startEditingContext = () => {
    setAbsaForm(buildAbsaForm(data?.aspect_scores ?? null))
    setIsEditingContext(true)
  }

  const handleSaveContext = () => {
    if (!id) return
    const scores = Object.fromEntries(
      (Object.keys(abssaForm) as (keyof AspectScores)[]).map((k) => [k, abssaForm[k] / 100]),
    ) as Record<keyof AspectScores, number>
    updateAbsaMutation.mutate(
      { id, scores },
      { onSuccess: () => setIsEditingContext(false) },
    )
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Detalle de destino" backTo="/destinos" backLabel="Volver a destinos" />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Detalle de destino" backTo="/destinos" backLabel="Volver a destinos" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  const tourism = data.tourism_info
  const gallery = tourism?.gallery_images ?? []
  const location = [data.city, data.region].filter(Boolean).join(', ')

  return (
    <div>
      <PageHeader
        title={data.destination}
        backTo="/destinos"
        backLabel="Volver a destinos"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              title="Si está activo, este destino puede aparecer en las recomendaciones de la app"
            >
              En el motor
              <Switch
                checked={Boolean(data.in_engine)}
                disabled={setInEngine.isPending}
                onCheckedChange={(v) => setInEngine.mutate({ id: data.destination_id, inEngine: v })}
                aria-label="Incluir en el motor de recomendación"
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMergeOpen(true)}
              leftIcon={<GitMerge className="h-4 w-4" />}
              title="Fusionar este destino con otro (para eliminar duplicados)"
            >
              Fusionar
            </Button>
            <Button
              variant={data.is_active ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setConfirmOpen(true)}
              loading={setStatus.isPending}
              disabled={!data.is_active && data.data_status !== 'ready'}
              leftIcon={data.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              title={data.is_active ? 'Desactivar destino' : (!data.is_active && data.data_status !== 'ready') ? 'No se puede activar: no cumple con métricas o info' : 'Activar destino'}
            >
              {data.is_active ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={data.is_active ? 'Desactivar destino' : 'Activar destino'}
        description={
          data.is_active
            ? 'El destino dejará de mostrarse en la app (catálogo y mapa), pero se conserva en el sistema. Podrás reactivarlo cuando quieras.'
            : 'El destino volverá a mostrarse en la app pública.'
        }
        confirmLabel={data.is_active ? 'Desactivar' : 'Activar'}
        variant={data.is_active ? 'danger' : 'primary'}
        loading={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: data.destination_id, isActive: !data.is_active },
            { onSuccess: () => setConfirmOpen(false) },
          )
        }
      />

      <MergeDestinationDialog
        source={data}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />

      {/* Hero portada */}
      <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-72">
        {data.cover_image_url ? (
          <img
            src={data.cover_image_url}
            alt={data.destination}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm">Sin portada · gestiona la multimedia para agregar una</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-slate-900/70 to-transparent p-4">
          {data.category ? (
            <Badge variant="success" className="bg-white/90 shadow-sm">
              <Tag className="h-3 w-3" /> {data.category}
            </Badge>
          ) : null}
          {location ? (
            <Badge variant="info" className="bg-white/90 shadow-sm">
              <MapPin className="h-3 w-3" /> {location}
            </Badge>
          ) : null}
          <Badge variant={data.is_active ? 'success' : 'danger'} className="bg-white/90 shadow-sm">
            {data.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
          {data.data_status === 'pending_info' && (
            <Badge variant="warning" className="bg-white/90 shadow-sm text-amber-700">Pendiente de info</Badge>
          )}
          {data.data_status === 'metrics_incomplete' && (
            <Badge variant="danger" className="bg-white/90 shadow-sm text-rose-700">Métricas incompletas</Badge>
          )}
          {data.in_engine === false && (
            <Badge variant="neutral" className="bg-white/90 shadow-sm text-slate-700" title="No participa en las recomendaciones">Fuera del motor</Badge>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="mt-6 flex overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'info'
              ? 'border-jungle-600 text-jungle-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Información
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'media'
              ? 'border-jungle-600 text-jungle-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Multimedia
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'context'
              ? 'border-jungle-600 text-jungle-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Contexto turístico
        </button>
        <button
          onClick={() => setActiveTab('tech')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'tech'
              ? 'border-jungle-600 text-jungle-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Estado técnico
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'comments'
              ? 'border-jungle-600 text-jungle-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Comentarios
        </button>
      </div>

      <div className="mt-6">
        {/* TAB INFORMACIÓN */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              {!isEditingInfo && (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar información
                </Button>
              )}
              {isEditingInfo && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleCancelInfo} disabled={updateMutation.isPending}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveInfo} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Guardando...' : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {isEditingInfo ? (
                  <>
                    {/* ── Qué es ── */}
                    <Card>
                      <CardHeader><CardTitle>Datos básicos</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <EditField label="Nombre del destino" value={formData.name} onChange={(v) => setField('name', v)} />
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Categoría</label>
                            <SelectField
                              ariaLabel="Categoría"
                              value={formData.category || '__none'}
                              onValueChange={(v) => setField('category', v === '__none' ? '' : v)}
                              options={[
                                { label: 'Sin definir', value: '__none' },
                                ...(formData.category && !CATEGORY_OPTIONS.includes(formData.category)
                                  ? [{ label: formData.category, value: formData.category }]
                                  : []),
                                ...CATEGORY_OPTIONS.map((c) => ({ label: c, value: c })),
                              ]}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Descripción</label>
                          <Textarea rows={4} value={formData.description} onChange={(e) => setField('description', e.target.value)} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* ── Dónde está ── */}
                    <Card>
                      <CardHeader><CardTitle>Ubicación</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <EditField label="Ciudad base" value={formData.city} onChange={(v) => setField('city', v)} />
                          <EditField label="Región" value={formData.region} onChange={(v) => setField('region', v)} />
                          <EditField label="Altitud (m)" type="number" value={formData.altitude_m} onChange={(v) => setField('altitude_m', v)} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <EditField label="Latitud" type="number" value={formData.latitude} onChange={(v) => setField('latitude', v)} placeholder="-13.16" />
                          <EditField label="Longitud" type="number" value={formData.longitude} onChange={(v) => setField('longitude', v)} placeholder="-72.54" />
                        </div>
                        <p className="text-[11px] text-slate-400">Copia las coordenadas del punto de acceso desde Google Maps (clic derecho sobre el mapa).</p>
                      </CardContent>
                    </Card>

                    {/* ── Para decidir e ir ── */}
                    <Card>
                      <CardHeader><CardTitle>Información para el visitante</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <EditField label="Duración recomendada" value={formData.recommended_duration} onChange={(v) => setField('recommended_duration', v)} placeholder="Medio día" />
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Dificultad</label>
                            <SelectField
                              ariaLabel="Dificultad"
                              value={formData.difficulty || '__none'}
                              onValueChange={(v) => setField('difficulty', v === '__none' ? '' : v)}
                              options={[
                                { label: 'Sin definir', value: '__none' },
                                { label: 'Fácil', value: 'facil' },
                                { label: 'Moderada', value: 'moderada' },
                                { label: 'Exigente', value: 'exigente' },
                              ]}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Nivel de costo estimado</label>
                            <SelectField
                              ariaLabel="Nivel de costo estimado"
                              value={formData.cost_level || '__none'}
                              onValueChange={(v) => setField('cost_level', v === '__none' ? '' : v)}
                              options={[
                                { label: 'Sin definir', value: '__none' },
                                { label: 'Bajo', value: 'bajo' },
                                { label: 'Medio', value: 'medio' },
                                { label: 'Alto', value: 'alto' },
                              ]}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">Dificultad y costo alimentan los filtros del buscador de la app. No afectan las recomendaciones.</p>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Cómo llegar</label>
                          <Textarea rows={3} value={formData.how_to_get} onChange={(e) => setField('how_to_get', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Qué hacer (actividades)</label>
                          <Textarea rows={3} value={formData.activities_summary} onChange={(e) => setField('activities_summary', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Antes de ir (consejos, horarios, entradas)</label>
                          <Textarea rows={3} value={formData.visitor_info_summary} onChange={(e) => setField('visitor_info_summary', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Accesibilidad</label>
                          <Textarea rows={3} value={formData.accessibility_summary} onChange={(e) => setField('accessibility_summary', e.target.value)} />
                        </div>
                        <EditField label="Sitio oficial (para comprar entradas o ver horarios)" value={formData.official_website} onChange={(v) => setField('official_website', v)} placeholder="https://..." />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* ── Vista de solo lectura ── */}
                    <Card>
                      <CardHeader><CardTitle>Datos básicos</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Nombre del destino" value={data.destination} />
                          <Field label="Categoría" value={data.category} />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Descripción</p>
                          {tourism?.description ? (
                            <p className="text-sm leading-relaxed text-slate-600">{tourism.description}</p>
                          ) : (
                            <p className="text-sm italic text-slate-400">
                              Este destino aún no tiene una descripción registrada.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Ubicación</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Ciudad base" value={data.city} />
                          <Field label="Región" value={data.region} />
                          <Field label="Altitud (m)" value={tourism?.altitude_m != null ? String(tourism.altitude_m) : null} />
                          <div />
                          <Field label="Latitud" value={tourism?.latitude != null ? String(tourism.latitude) : null} mono />
                          <Field label="Longitud" value={tourism?.longitude != null ? String(tourism.longitude) : null} mono />
                        </div>
                        {tourism?.latitude != null && tourism?.longitude != null && (
                          <a
                            href={`https://www.google.com/maps?q=${tourism.latitude},${tourism.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-lake-600 hover:text-lake-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver en Google Maps
                          </a>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Información para el visitante</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Field label="Duración recomendada" value={tourism?.recommended_duration} />
                          <Field label="Dificultad" value={tourism?.difficulty ? (DIFFICULTY_LABELS[tourism.difficulty] ?? tourism.difficulty) : null} />
                          <Field label="Nivel de costo estimado" value={data.cost_level ? data.cost_level.charAt(0).toUpperCase() + data.cost_level.slice(1) : null} />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Cómo llegar</p>
                          <p className="text-sm text-slate-600">{tourism?.how_to_get || <span className="italic text-slate-400">Sin información</span>}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Qué hacer</p>
                          <p className="text-sm text-slate-600">{tourism?.activities_summary || <span className="italic text-slate-400">Sin información</span>}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Antes de ir</p>
                          <p className="text-sm text-slate-600">{tourism?.visitor_info_summary || <span className="italic text-slate-400">Sin información</span>}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Accesibilidad</p>
                          <p className="text-sm text-slate-600">{tourism?.accessibility_summary || <span className="italic text-slate-400">Sin información</span>}</p>
                        </div>
                        {tourism?.official_website ? (
                          <a
                            href={tourism.official_website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-lake-600 hover:text-lake-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Sitio oficial
                          </a>
                        ) : (
                          <Field label="Sitio oficial" value={null} />
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Sidebar Right (Gallery Summary) */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Galería</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gallery.length === 0 ? (
                      <p className="text-sm italic text-slate-400">
                        Sin imágenes en la galería. Ve a la pestaña de Multimedia para subir fotos.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {gallery.slice(0, 4).map((url, i) => (
                          <div
                            key={i}
                            className="aspect-square overflow-hidden rounded-xl bg-slate-100"
                          >
                            <img src={url} alt={`${data.destination} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
                    <Button variant="ghost" className="w-full mt-4 text-xs" onClick={() => setActiveTab('media')}>
                      Ver multimedia completa
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB MULTIMEDIA */}
        {activeTab === 'media' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {id && <MediaManager id={id} />}
          </div>
        )}

        {/* TAB CONTEXTO TURÍSTICO */}
        {activeTab === 'context' && (
          <div className="space-y-6">
            <div className="flex items-center justify-end gap-2">
              {!isEditingContext ? (
                <Button variant="outline" onClick={startEditingContext}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar puntajes ABSA
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditingContext(false)}
                    disabled={updateAbsaMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveContext} disabled={updateAbsaMutation.isPending}>
                    {updateAbsaMutation.isPending ? 'Guardando...' : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar puntajes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {isEditingContext && (
              <div className="flex items-start gap-3 rounded-xl border border-lake-200 bg-lake-50/50 p-4 text-sm text-lake-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Los puntajes van de <strong>0%</strong> (muy bajo) a <strong>100%</strong> (excelente).
                  El motor IA usa estos valores para calcular la compatibilidad con el perfil del viajero.
                  Destinos sin puntajes reales usan <strong>50%</strong> por defecto.
                </p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {isEditingContext ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Editar Aspectos ABSA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AspectScoresEditor
                        form={abssaForm}
                        onChange={(key, pct) => setAbsaForm((prev) => ({ ...prev, [key]: pct }))}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <AspectScoresCard scores={data.aspect_scores} />
                )}
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Clima y Aforo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ContextRow
                      icon={<ThermometerSun className="h-4 w-4 text-sand-500" />}
                      label="Clima"
                      value={data.context?.weather_category}
                      score={data.context?.weather_score}
                    />
                    <ContextRow
                      icon={<Users2 className="h-4 w-4 text-lake-500" />}
                      label="Aforo"
                      value={data.context?.crowd_level}
                      score={data.context?.crowd_score}
                    />
                    {(() => {
                      const w = (data.weather_detail ?? {}) as Record<string, number | string | null>
                      const c = (data.crowd_detail ?? {}) as Record<string, number | string | null>
                      const items = [
                        typeof w.temp_prom === 'number' ? `${w.temp_prom.toFixed(1)} °C de temperatura media` : null,
                        typeof w.pp === 'number' ? `${Math.round(w.pp)} mm de lluvia en el mes` : null,
                        typeof c.visitantes_mes === 'number' ? `${Math.round(c.visitantes_mes).toLocaleString('es-PE')} visitantes en un mes típico` : null,
                      ].filter(Boolean)
                      return items.length ? (
                        <ul className="space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {items.map((t) => <li key={t as string}>{t}</li>)}
                        </ul>
                      ) : null
                    })()}
                    <p className="mt-2 text-xs text-slate-400">
                      Datos del mes {String((data.weather_detail as Record<string, unknown> | null)?.month_name ?? 'actual')} (tesis, Fase 4).
                      Para cambiarlos, importa clima_scores.csv o aforo_scores.csv en «Importar datos».
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB ESTADO TÉCNICO */}
        {activeTab === 'tech' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atributos Técnicos Completos (Solo lectura)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Field label="ID" value={data.destination_id} mono />
                  <Field label="Estado público" value={data.is_active ? 'Activo' : 'Inactivo'} />
                  <Field label="Estado de datos (data_status)" value={data.data_status || 'desconocido'} />
                  <Field label="Participa en recomendaciones" value={data.in_engine ? 'Sí' : 'No'} />
                  <Field label="Categoría BD" value={data.category} />
                  <Field label="Cant. Imágenes" value={`${gallery.length + (data.cover_image_url ? 1 : 0)}`} />
                  <Field label="Portada Configurada" value={data.cover_image_url ? "Sí" : "No"} />
                  <Field label="Galería Configurada" value={gallery.length > 0 ? "Sí" : "No"} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB COMENTARIOS */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-jungle-600" />
                  Comentarios y Reseñas
                </CardTitle>
                <Badge variant="neutral">{reviewsData?.length || 0} reseñas</Badge>
              </CardHeader>
              <CardContent>
                {isLoadingReviews ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                ) : !reviewsData || reviewsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <MessageSquare className="mb-3 h-10 w-10 text-slate-200" />
                    <p>Aún no hay comentarios para este destino.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsData.map((review) => (
                      <div key={review.review_id} className={`flex flex-col sm:flex-row gap-4 rounded-xl border p-4 ${review.is_hidden ? "border-rose-200 bg-rose-50/40 opacity-80" : (review.report_count ?? 0) > 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-slate-50/50"}`}>
                        {review.image_url ? (
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                            <img src={review.image_url} alt="Review" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-jungle-50 text-jungle-600 border border-jungle-100">
                            <span className="text-2xl font-bold">{review.rating_general.toFixed(1)}</span>
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-800 line-clamp-2">"{review.review_text}"</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {review.author_name ?? 'Viajero'} · {review.user_id} • {review.processing_month || 'Fecha desconocida'}
                              </p>
                              {((review.report_count ?? 0) > 0 || review.is_hidden) && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {(review.report_count ?? 0) > 0 && (
                                    <Badge variant="warning">{review.report_count} reporte{review.report_count === 1 ? '' : 's'}</Badge>
                                  )}
                                  {review.is_hidden && <Badge variant="danger">Oculta para viajeros</Badge>}
                                </div>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="mt-2"
                                loading={setReviewHidden.isPending}
                                onClick={() => setReviewHidden.mutate({ reviewId: review.review_id, hidden: !review.is_hidden })}
                              >
                                {review.is_hidden ? 'Mostrar de nuevo' : 'Ocultar reseña'}
                              </Button>
                            </div>
                            {review.image_url && (
                              <div className="flex items-center gap-1 shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                <Star className="h-3 w-3 fill-jungle-500 text-jungle-500" />
                                {review.rating_general.toFixed(1)}
                              </div>
                            )}
                          </div>
                          
                          {review.aspect_ratings && review.aspect_ratings.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-2">
                              {review.aspect_ratings.map((aspect, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] border border-slate-200 shadow-sm">
                                  <span className="font-medium text-slate-600 capitalize">{aspect.aspect}</span>
                                  <span className="flex items-center text-slate-400">
                                    <Star className="h-2.5 w-2.5 fill-current text-amber-400 mr-0.5" />
                                    {aspect.rating.toFixed(1)}
                                  </span>
                                  {aspect.comment && (
                                    <span className="text-slate-400 ml-1 italic line-clamp-1 max-w-[150px]">
                                      "{aspect.comment}"
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('mt-0.5 truncate text-sm text-slate-700', mono && 'font-mono text-xs')}>
        {value || '—'}
      </p>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ContextRow({
  icon,
  label,
  value,
  score,
}: {
  icon: ReactNode
  label: string
  value?: string | null
  score?: number | null
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-600">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-medium text-slate-800">
        {value || '—'}
        {score !== null && score !== undefined ? (
          <span className="ml-1 text-xs text-slate-400">({Number(score).toFixed(2)})</span>
        ) : null}
      </span>
    </div>
  )
}
