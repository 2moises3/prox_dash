import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
export function ImportDataPage() {
  return <div>
    <PageHeader title="Datos científicos V3" description="Snapshot validado del motor de recomendación." />
    <Card><CardHeader><CardTitle>La versión activa es de solo lectura</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-slate-600">
      <p>La matriz ABSA, intereses, clima, afluencia y pesos pertenecen a una versión conjunta. No se reemplazan por archivos sueltos desde el dashboard.</p>
      <p>Para actualizar el cálculo se prepara una nueva versión científica y se verifica antes de publicarla. Las reseñas recopiladas pueden exportarse para análisis; su recepción no modifica automáticamente este snapshot.</p>
      <Link className="font-semibold text-jungle-700" to="/motor">Consultar versión del motor</Link>
    </CardContent></Card>
  </div>
}
