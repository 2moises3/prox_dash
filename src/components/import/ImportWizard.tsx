import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileUp, Loader2, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { importApi, type ImportDestination, type ImportResult, type ImportType } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { cn } from '@/lib/utils'

interface ImportWizardProps {
  type: ImportType
  title: string
  description: string
  columns: string
  accept?: string
}

type Step = 'idle' | 'evaluating' | 'preview' | 'applying' | 'done'

const STATUS_LABEL: Record<ImportDestination['status'], string> = {
  nuevo: 'Nuevo',
  cambia: 'Se actualiza',
  sin_cambios: 'Sin cambios',
}
const STATUS_BADGE: Record<ImportDestination['status'], 'info' | 'warning' | 'neutral'> = {
  nuevo: 'info',
  cambia: 'warning',
  sin_cambios: 'neutral',
}

/**
 * Importación en tres pasos:
 *  1. Elegir archivo → el backend lo evalúa sin guardar nada.
 *  2. Ver qué destinos son nuevos, cuáles cambian y cuáles quedan igual; elegir cuáles actualizar.
 *  3. Aplicar: los datos del archivo reemplazan a los actuales en los destinos elegidos.
 */
export function ImportWizard({ type, title, description, columns, accept = '.csv,.xlsx' }: ImportWizardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [step, setStep] = useState<Step>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [createNew, setCreateNew] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => preview?.destinations ?? [], [preview])
  const actionable = rows.filter((r) => r.status !== 'sin_cambios')
  const chosen = actionable.filter((r) => selected.has(r.destination_id) && (createNew || r.status !== 'nuevo'))

  const reset = () => {
    setStep('idle')
    setFile(null)
    setPreview(null)
    setResult(null)
    setSelected(new Set())
    setError(null)
  }

  const evaluate = async (f: File) => {
    setFile(f)
    setError(null)
    setStep('evaluating')
    try {
      const data = await importApi.preview(type, f)
      setPreview(data)
      setSelected(new Set((data.destinations ?? []).filter((d) => d.status !== 'sin_cambios').map((d) => d.destination_id)))
      setCreateNew(true)
      setStep('preview')
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo evaluar el archivo'))
      setStep('idle')
    }
  }

  const apply = async () => {
    if (!file) return
    setStep('applying')
    try {
      const allChosen = chosen.length === actionable.length && createNew
      const data = await importApi.apply(type, file, allChosen ? undefined : chosen.map((d) => d.destination_id), createNew)
      setResult(data)
      setStep('done')
      setConfirmOpen(false)
      toast.success(`Datos actualizados en ${(data.summary?.cambian ?? 0) + (data.summary?.nuevos ?? 0)} destino(s)`)
      void qc.invalidateQueries({ queryKey: ['destinations'] })
      void qc.invalidateQueries({ queryKey: ['engine'] })
      void qc.invalidateQueries({ queryKey: ['metrics'] })
    } catch (err) {
      setConfirmOpen(false)
      setError(getApiErrorMessage(err, 'No se pudo aplicar el archivo'))
      setStep('preview')
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <FileUp className="h-[18px] w-[18px] text-amber-600" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-500">
        <strong>Columnas:</strong> {columns}
      </p>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {(step === 'preview' || step === 'applying') && preview ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">{file?.name}</span>
            <Badge variant="info">{preview.summary?.nuevos ?? 0} nuevos</Badge>
            <Badge variant="warning">{preview.summary?.cambian ?? 0} se actualizan</Badge>
            <Badge variant="neutral">{preview.summary?.sin_cambios ?? 0} sin cambios</Badge>
            {preview.errors ? <Badge variant="danger">{preview.errors} filas con error</Badge> : null}
          </div>

          {preview.error_samples?.length ? (
            <ul className="list-disc space-y-0.5 rounded-lg bg-rose-50 py-2 pl-7 pr-3 text-xs text-rose-700">
              {preview.error_samples.map((m) => <li key={m}>{m}</li>)}
              {(preview.errors ?? 0) > preview.error_samples.length ? <li>…y más filas con error (no se importan).</li> : null}
            </ul>
          ) : null}
          {preview.warnings?.length ? (
            <details className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <summary className="cursor-pointer font-medium">{preview.warnings.length} aviso(s)</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {preview.warnings.slice(0, 20).map((m) => <li key={m}>{m}</li>)}
              </ul>
            </details>
          ) : null}

          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">El archivo no trae destinos válidos.</p>
          ) : (
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={actionable.length > 0 && actionable.every((r) => selected.has(r.destination_id))}
                        onChange={(e) =>
                          setSelected(e.target.checked ? new Set(actionable.map((r) => r.destination_id)) : new Set())
                        }
                      />
                    </th>
                    <th className="px-3 py-2">Destino</th>
                    <th className="px-3 py-2">Qué pasa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const disabled = r.status === 'sin_cambios' || (r.status === 'nuevo' && !createNew)
                    return (
                      <tr key={r.destination_id} className={cn('border-t border-slate-100', disabled && 'text-slate-400')}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Actualizar ${r.destination}`}
                            disabled={disabled}
                            checked={!disabled && selected.has(r.destination_id)}
                            onChange={() => toggle(r.destination_id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{r.destination}</span>
                          <span className="ml-2 font-mono text-[11px] text-slate-400">{r.destination_id}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(preview.summary?.nuevos ?? 0) > 0 ? (
            <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>
                Crear los destinos nuevos
                <span className="block text-xs text-slate-400">Quedan inactivos y fuera del motor hasta que los completes.</span>
              </span>
              <Switch checked={createNew} onCheckedChange={setCreateNew} />
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={reset} disabled={step === 'applying'}>
              Cancelar
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={chosen.length === 0 || step === 'applying'}>
              Actualizar {chosen.length} destino{chosen.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'done' && result ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>Datos actualizados.</strong> {result.summary?.cambian ?? 0} destino(s) actualizados
              {result.summary?.nuevos ? ` y ${result.summary.nuevos} creado(s) como inactivos` : ''}.
              {result.errors ? ` ${result.errors} fila(s) con error no se importaron.` : ''}
            </div>
          </div>
          <Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Importar otro archivo
          </Button>
        </div>
      ) : null}

      {step === 'idle' || step === 'evaluating' ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void evaluate(f)
              e.target.value = ''
            }}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={step === 'evaluating'}
            leftIcon={step === 'evaluating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          >
            {step === 'evaluating' ? 'Evaluando archivo…' : 'Elegir archivo y evaluar'}
          </Button>
          <p className="text-[11px] text-slate-400">
            Primero verás qué cambia; nada se guarda hasta que confirmes. Los datos del archivo reemplazan a los actuales
            en los destinos que elijas.
          </p>
        </>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Actualizar datos"
        description={`Se reemplazarán los datos de ${chosen.length} destino(s) con los del archivo. Esta acción no se puede deshacer.`}
        confirmLabel="Actualizar"
        loading={step === 'applying'}
        onConfirm={() => void apply()}
      />
    </div>
  )
}
