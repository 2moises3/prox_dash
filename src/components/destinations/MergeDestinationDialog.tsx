import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitMerge, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/select'
import { useDestinations, useMergeDestination } from '@/hooks/useDestinations'
import type { DestinationSummary } from '@/types'

interface Props {
  /** El destino que se va a eliminar (el duplicado). */
  source: DestinationSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MergeDestinationDialog({ source, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const { data: allDests = [] } = useDestinations()
  const merge = useMergeDestination()
  const [targetId, setTargetId] = useState<string>('')

  const candidates = allDests.filter((d) => d.destination_id !== source.destination_id && !d.scientific_version)
  const target = candidates.find((d) => d.destination_id === targetId)
  const selectOptions = candidates.map((d) => ({
    value: d.destination_id,
    label: d.city ? `${d.destination} — ${d.city}` : d.destination,
  }))

  function handleMerge() {
    if (!targetId) return
    merge.mutate(
      { sourceId: source.destination_id, targetId },
      {
        onSuccess: () => {
          onOpenChange(false)
          navigate(`/destinos/${targetId}`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-amber-600" />
            Fusionar destino
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Origen */}
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
            <p className="font-medium text-rose-700">Destino a eliminar (origen):</p>
            <p className="mt-0.5 text-rose-600">{source.destination}</p>
            <code className="text-[10px] text-rose-400">{source.destination_id}</code>
          </div>

          {/* Selector del destino canónico */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Destino canónico a conservar:
            </p>
            <SelectField
              value={targetId}
              onValueChange={setTargetId}
              options={selectOptions}
              placeholder="Selecciona el destino que quieres conservar…"
            />
          </div>

          {/* Vista previa del target seleccionado */}
          {target && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-medium text-emerald-700">Se conservará:</p>
              <p className="mt-0.5 text-emerald-600">{target.destination}</p>
              <code className="text-[10px] text-emerald-400">{target.destination_id}</code>
            </div>
          )}

          {/* Advertencia */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Esta acción no se puede deshacer.</strong>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>El destino origen quedará eliminado permanentemente.</li>
                <li>Sus imágenes, reseñas y visitas se moverán al canónico.</li>
                <li>Sus puntajes ABSA, tags y datos de contexto se fusionarán.</li>
                <li>Los campos vacíos del canónico se rellenarán con datos del origen.</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleMerge}
            disabled={!targetId}
            loading={merge.isPending}
            leftIcon={<GitMerge className="h-4 w-4" />}
          >
            Fusionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
