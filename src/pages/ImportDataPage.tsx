import { Info } from 'lucide-react'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { ImportWizard } from '@/components/import/ImportWizard'
import type { ImportType } from '@/api/endpoints'

const SECTIONS: { type: ImportType; title: string; description: string; columns: string }[] = [
  {
    type: 'absa',
    title: 'Matriz ABSA',
    description: 'Puntajes de percepción por destino y aspecto turístico (0.0–1.0). Una fila por destino y aspecto.',
    columns: 'destination_id, aspecto, score_normalizado_0_1 (0-1), evidence_status — formato de matriz_destino_aspecto_sentimiento.csv',
  },
  {
    type: 'tags',
    title: 'Tags de interés',
    description: 'Intereses de cada destino (cultura, gastronomía, aventura…). Reemplazan los tags del destino.',
    columns: 'destination_id, destination, intereses (separados por coma) — formato de registro_maestro_centros_turisticos.csv',
  },
  {
    type: 'clima',
    title: 'Scores de clima',
    description: 'Clima por destino, mes y preferencia climática (5 filas por destino y mes). Alimenta el contexto del motor.',
    columns: 'destination_id, mes_num, preferencia_climatica (frio, templado, calido, seco, indiferente), score_clima (0-1), nivel_clima, tmax_c, tmin_c, pp_mm — formato de clima_scores.csv',
  },
  {
    type: 'aforo',
    title: 'Scores de aforo',
    description: 'Aforo por destino, mes y tolerancia a multitudes (3 filas por destino y mes). Alimenta el contexto del motor.',
    columns: 'destination_id, mes_num, tolerancia_multitudes (baja, media, alta), score_aforo_personalizado (0-1), score_aforo, nivel_aforo, visitantes_medios — formato de aforo_scores.csv',
  },
]

export function ImportDataPage() {
  return (
    <div>
      <PageHeader
        title="Importar datos científicos"
        description="Actualiza los datos del modelo de la tesis desde CSV o Excel. Cada archivo se evalúa antes de guardar."
      />

      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Al subir un archivo verás qué destinos son <strong>nuevos</strong>, cuáles <strong>se actualizan</strong> y cuáles
          quedan <strong>sin cambios</strong>. Elige a cuáles aplicarlo (o a todos): los datos del archivo reemplazan a los
          actuales. Los destinos nuevos se crean inactivos y fuera del motor.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <ImportWizard key={s.type} {...s} />
        ))}
      </div>
    </div>
  )
}
