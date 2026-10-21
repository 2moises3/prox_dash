import { useState } from 'react'
import { CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImportWizard } from '@/components/import/ImportWizard'
import { importApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'

const EXPECTED_COLUMNS = [
  { name: 'destination_id', desc: 'Identificador del destino (obligatorio). Si no existe y hay nombre, se crea inactivo.' },
  { name: 'destination', desc: 'Nombre visible del destino' },
  { name: 'city, region', desc: 'Ciudad base y región' },
  { name: 'category', desc: 'Arqueología, Naturaleza, Museo o Recreación' },
  { name: 'description', desc: 'Descripción del destino' },
  { name: 'activities_summary', desc: 'Qué hacer' },
  { name: 'visitor_info_summary', desc: 'Antes de ir (consejos, horarios, entradas)' },
  { name: 'accessibility_summary', desc: 'Accesibilidad' },
  { name: 'recommended_duration', desc: 'Ej. «Medio día», «2 a 3 días»' },
  { name: 'how_to_get', desc: 'Cómo llegar' },
  { name: 'official_website', desc: 'Sitio oficial (https://…)' },
  { name: 'altitude_m, latitude, longitude', desc: 'Altitud y coordenadas (de Google Maps)' },
  { name: 'difficulty', desc: 'facil, moderada o exigente' },
  { name: 'cost_level', desc: 'bajo, medio o alto' },
]

export function ExcelImportPage() {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      await importApi.downloadCatalogTemplate()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo descargar la plantilla'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Importar Excel"
        description="Actualiza la ficha de los destinos (descripción, ubicación, cómo llegar, costo…) desde una hoja de cálculo."
        actions={
          <Button variant="outline" size="sm" onClick={() => void download()} loading={downloading} leftIcon={<Download className="h-4 w-4" />}>
            Descargar ficha actual (Excel)
          </Button>
        }
        backTo="/destinos"
        backLabel="Volver a destinos"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ImportWizard
            type="catalog"
            title="Ficha de los destinos"
            description="Una fila por destino. Las celdas vacías no borran lo que ya hay; las que traen valor lo reemplazan."
            columns="destination_id, destination, city, region, category, description, … (ver la lista de la derecha)"
          />
          <p className="text-xs text-slate-500">
            Consejo: descarga la ficha actual, edítala en Excel y vuelve a subirla. Así no se pierde ningún dato y solo
            cambian las celdas que modificaste.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Columnas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXPECTED_COLUMNS.map((col) => (
              <div key={col.name} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jungle-500" />
                <div>
                  <code className="text-sm font-semibold text-slate-800">{col.name}</code>
                  <p className="text-xs text-slate-500">{col.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
