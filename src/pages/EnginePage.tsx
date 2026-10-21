import { useMemo, useState } from 'react'
import { AlertTriangle, Lock, RotateCcw, Save, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/auth/useAuth'
import {
  useEngineStatus,
  useResetEngineConfig,
  useSetDestinationInEngine,
  useUpdateEngineConfig,
} from '@/hooks/useEngine'
import type { EngineConfig, EngineDestination } from '@/types'

type ConfigForm = Record<keyof EngineConfig, string>

const toForm = (c: EngineConfig): ConfigForm => ({
  alpha_absa: String(c.alpha_absa),
  beta_contexto: String(c.beta_contexto),
  w_clima: String(c.w_clima),
  w_aforo: String(c.w_aforo),
})

const round3 = (n: number) => Math.round(n * 1000) / 1000

function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

interface ParamFieldProps {
  id: keyof EngineConfig
  label: string
  help: string
  thesis: number
  value: string
  disabled: boolean
  readOnlyValue?: boolean
  onChange: (v: string) => void
}

function ParamField({ id, label, help, thesis, value, disabled, readOnlyValue, onChange }: ParamFieldProps) {
  const num = Number(value)
  const changed = Number.isFinite(num) && round3(num) !== round3(thesis)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-[11px] text-slate-400">Tesis: {thesis}</span>
      </div>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled || readOnlyValue}
        onChange={(e) => onChange(e.target.value)}
        className={changed ? 'border-gold-400' : undefined}
      />
      <p className="mt-1 text-xs text-slate-500">{help}</p>
    </div>
  )
}

function DestinationRow({
  d,
  busy,
  onToggle,
}: {
  d: EngineDestination
  busy: boolean
  onToggle: (inEngine: boolean) => void
}) {
  const blocked = !d.in_engine && !d.eligible
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/destinos/${d.destination_id}`}
            className="truncate font-semibold text-slate-900 hover:text-jungle-700"
          >
            {d.destination}
          </Link>
          {d.recommendable ? (
            <Badge variant="success">Se recomienda</Badge>
          ) : d.in_engine && !d.is_active ? (
            <Badge variant="warning">En el motor, pero inactivo</Badge>
          ) : d.in_engine ? (
            <Badge variant="warning">Datos incompletos</Badge>
          ) : (
            <Badge variant="neutral">Fuera del motor</Badge>
          )}
          {!d.is_active ? <Badge variant="danger">Inactivo en la app</Badge> : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {d.region ?? 'Sin región'} · <code className="font-mono text-[11px] text-slate-400">{d.destination_id}</code>
        </p>
        {blocked ? (
          <p className="mt-1 text-xs text-amber-700">Falta: {d.missing.join('; ')}.</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-slate-500">{d.in_engine ? 'Incluido' : 'Excluido'}</span>
        <Switch
          checked={d.in_engine}
          disabled={busy || blocked}
          onCheckedChange={onToggle}
          aria-label={`${d.in_engine ? 'Excluir' : 'Incluir'} ${d.destination} del motor`}
          title={blocked ? `No se puede incluir. Falta: ${d.missing.join('; ')}` : undefined}
        />
      </div>
    </div>
  )
}

export function EnginePage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const { data, isLoading, isError, refetch } = useEngineStatus()
  const update = useUpdateEngineConfig()
  const reset = useResetEngineConfig()
  const setDestination = useSetDestinationInEngine()

  // Borrador local: null = sin cambios, se muestra lo guardado en el servidor.
  const [draft, setDraft] = useState<ConfigForm | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const form: ConfigForm | null = draft ?? (data ? toForm(data.config) : null)
  const setField = (key: keyof ConfigForm, value: string) => {
    if (form) setDraft({ ...form, [key]: value })
  }

  const parsed = useMemo(() => {
    if (!form) return null
    const n = {
      alpha_absa: Number(form.alpha_absa),
      beta_contexto: Number(form.beta_contexto),
      w_clima: Number(form.w_clima),
      w_aforo: round3(1 - Number(form.w_clima)),
    }
    const inRange = (x: number) => Number.isFinite(x) && x >= 0 && x <= 1
    const valid = inRange(n.alpha_absa) && inRange(n.beta_contexto) && inRange(n.w_clima)
    return { values: n as EngineConfig, valid }
  }, [form])

  const dirty = useMemo(() => {
    if (!data || !parsed) return false
    const c = data.config
    const v = parsed.values
    return (
      round3(v.alpha_absa) !== round3(c.alpha_absa) ||
      round3(v.beta_contexto) !== round3(c.beta_contexto) ||
      round3(v.w_clima) !== round3(c.w_clima)
    )
  }, [data, parsed])

  const differsFromThesis = useMemo(() => {
    if (!data) return false
    const c = data.config
    const t = data.defaults
    return (Object.keys(t) as (keyof EngineConfig)[]).some((k) => round3(c[k]) !== round3(t[k]))
  }, [data])

  const handleSave = () => {
    if (!parsed?.valid) return
    update.mutate(parsed.values, { onSuccess: () => setDraft(null) })
  }

  if (isLoading || !form || !data || !parsed) {
    return (
      <div>
        <PageHeader title="Motor de recomendación" description="Parámetros y destinos que participan en las recomendaciones." />
        {isError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-slate-600">No pudimos cargar el estado del motor.</p>
              <Button className="mt-4" variant="secondary" onClick={() => refetch()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </div>
    )
  }

  const { counts, destinations, defaults } = data
  const lowUniverse = counts.recommendable < 5

  return (
    <div>
      <PageHeader
        title="Motor de recomendación"
        description="Define qué destinos entran a las recomendaciones y con qué pesos se calculan."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Se recomiendan hoy" value={counts.recommendable} hint="Activos, en el motor y con datos completos" />
        <StatTile label="Incluidos en el motor" value={counts.in_engine} />
        <StatTile label="Destinos totales" value={counts.total} />
      </div>

      {lowUniverse ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Hay pocos destinos en el motor. Las puntuaciones se normalizan entre los destinos incluidos, así que con
            tan pocos los resultados pierden variedad.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-600" />
              Parámetros
            </CardTitle>
            <CardDescription>
              Score = afinidad + peso del contexto × (clima y aforo − 0.5). La afinidad mezcla intereses y puntajes ABSA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSuperAdmin ? (
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Solo un super administrador puede modificar los parámetros.
              </div>
            ) : null}

            <ParamField
              id="alpha_absa"
              label="Peso de ABSA en la afinidad"
              help="Cuánto pesa la calidad percibida frente al emparejamiento de intereses (el resto)."
              thesis={defaults.alpha_absa}
              value={form.alpha_absa}
              disabled={!isSuperAdmin}
              onChange={(v) => setField('alpha_absa', v)}
            />
            <ParamField
              id="beta_contexto"
              label="Peso del contexto"
              help="Cuánto mueve el ranking el clima y la afluencia del mes consultado."
              thesis={defaults.beta_contexto}
              value={form.beta_contexto}
              disabled={!isSuperAdmin}
              onChange={(v) => setField('beta_contexto', v)}
            />
            <ParamField
              id="w_clima"
              label="Peso del clima dentro del contexto"
              help="Proporción del contexto que corresponde al clima."
              thesis={defaults.w_clima}
              value={form.w_clima}
              disabled={!isSuperAdmin}
              onChange={(v) => setField('w_clima', v)}
            />
            <ParamField
              id="w_aforo"
              label="Peso del aforo dentro del contexto"
              help="Se calcula solo: es lo que falta para llegar a 1."
              thesis={defaults.w_aforo}
              value={Number.isFinite(parsed.values.w_aforo) ? String(parsed.values.w_aforo) : ''}
              disabled
              readOnlyValue
              onChange={() => undefined}
            />

            {!parsed.valid ? (
              <p className="text-xs text-rose-600">Cada valor debe estar entre 0 y 1.</p>
            ) : null}

            {differsFromThesis ? (
              <div className="flex items-start gap-2 rounded-lg border border-gold-400/40 bg-gold-500/10 p-3 text-xs text-slate-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" />
                Los parámetros actuales difieren de los validados en la tesis. Los resultados con otros valores no
                tienen esa validación.
              </div>
            ) : null}

            {isSuperAdmin ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={handleSave}
                  disabled={!dirty || !parsed.valid}
                  loading={update.isPending}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Guardar cambios
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setResetOpen(true)}
                  disabled={!differsFromThesis && !dirty}
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                >
                  Restablecer a la tesis
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Destinos del motor</CardTitle>
            <CardDescription>
              Un destino puede mostrarse en la app (detalle, mapa, búsqueda) sin ser recomendado. Para entrar al motor
              necesita puntajes ABSA, clima y aforo de los 12 meses y tags de interés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {destinations.map((d) => (
              <DestinationRow
                key={d.destination_id}
                d={d}
                busy={setDestination.isPending && pendingId === d.destination_id}
                onToggle={(inEngine) => {
                  setPendingId(d.destination_id)
                  setDestination.mutate({ id: d.destination_id, inEngine })
                }}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restablecer parámetros"
        description="Los parámetros volverán a los valores validados en la tesis. Las recomendaciones cambiarán de inmediato para todos los usuarios."
        confirmLabel="Restablecer"
        loading={reset.isPending}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => setDraft(null),
            onSettled: () => setResetOpen(false),
          })
        }
      />
    </div>
  )
}
