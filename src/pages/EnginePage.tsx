import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useEngineStatus, useSetDestinationInEngine } from '@/hooks/useEngine'

const names: Record<string, string> = { alpha_absa: 'Peso de valoraciones', beta_contexto: 'Ajuste por contexto', w_clima: 'Clima dentro del contexto', w_aforo: 'Afluencia dentro del contexto' }
const types: Record<string, string> = {cultural:'Cultural',naturalista:'Naturalista',familiar:'Familiar',economico_mochilero:'Económico / mochilero',gastronomico:'Gastronómico',aventurero:'Aventurero',urbano_recreativo:'Urbano / recreativo'}
export function EnginePage() {
  const { data, isLoading, isError, refetch } = useEngineStatus()
  const membership = useSetDestinationInEngine()
  return <div>
    <PageHeader title="Motor de recomendación V3" description="Versión científica y visibilidad de destinos. Los datos del cálculo son de solo lectura." />
    {isError ? <Button onClick={() => refetch()}>Reintentar carga</Button> : null}
    {isLoading ? <p>Cargando versión del motor…</p> : null}
    {data ? <div className="space-y-6">
      <Card><CardHeader><CardTitle>{data.version}</CardTitle></CardHeader><CardContent>
        <p className="text-sm text-slate-600">El motor conserva su snapshot validado. Ocultar destinos no cambia la normalización sobre los 14 de referencia. Añadir una ficha turística no la incorpora automáticamente al ranking.</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(data.config).map(([key,value]) => <div key={key}><dt className="text-sm text-slate-500">{names[key] ?? key}</dt><dd className="text-xl font-semibold">{value}</dd></div>)}</dl>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Pesos por estilo de viajero</CardTitle></CardHeader><CardContent>
        <p className="mb-4 text-sm text-slate-600">Costos representa valoración de precios en reseñas; no es una tarifa ni se compara con el presupuesto personal.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Estilo</th><th className="p-2">Precios</th><th className="p-2">Atención</th><th className="p-2">Atractivos</th></tr></thead><tbody>
          {Object.entries(data.profile_weights).map(([key,w]) => <tr key={key} className="border-t"><td className="p-2">{types[key] ?? key}</td><td className="p-2">{w.costos}</td><td className="p-2">{w.atencion_servicio}</td><td className="p-2">{w.atractivos}</td></tr>)}
        </tbody></table></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Destinos disponibles ({data.counts.recommendable})</CardTitle></CardHeader><CardContent>
        {data.destinations.map(d => <div key={d.destination_id} className="flex items-center justify-between gap-4 border-b py-4 last:border-0">
          <div><Link className="font-semibold" to={`/destinos/${d.destination_id}`}>{d.destination}</Link><p className="mt-1 text-xs text-slate-500">{d.eligible ? d.is_active ? 'En el snapshot científico' : 'Oculto en la app' : 'Solo catálogo turístico · fuera del snapshot'}</p></div>
          <Switch checked={d.in_engine} disabled={membership.isPending || !d.eligible} aria-label={`Mostrar ${d.destination} en recomendaciones`} onCheckedChange={value => membership.mutate({id:d.destination_id,inEngine:value})} />
        </div>)}
      </CardContent></Card>
    </div> : null}
  </div>
}
