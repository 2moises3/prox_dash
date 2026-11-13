import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, Compass, ImageOff, MapPin, MessageSquare, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartMetrics, useDashboardPriorities, useMetricsOverview, useSystemHealth } from '@/hooks/useMetrics'
import { useDestinations } from '@/hooks/useDestinations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingRows } from '@/components/feedback/LoadingRows'

const number = new Intl.NumberFormat('es-PE')
const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' })
const panel = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:p-6'

export function DashboardHomePage() {
  const metrics = useMetricsOverview()
  const charts = useChartMetrics()
  const priorities = useDashboardPriorities()
  const catalog = useDestinations()
  const health = useSystemHealth()
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily')
  const [imageFailed, setImageFailed] = useState<string>()
  const overview = metrics.data
  const records = priorities.data
  const destinations = catalog.data
  const cover = destinations?.find(item => item.is_active && item.cover_image_url)?.cover_image_url
  const missing = destinations?.filter(item => item.is_active && !item.cover_image_url)
  const days = charts.data?.user_growth_daily
  const daily = period === 'daily' && Boolean(days?.length)
  const growth = daily
    ? days?.map(item => ({ label: item.day, users: item.users }))
    : charts.data?.user_growth.map(item => ({ label: item.month, users: item.users }))
  const pending = records && missing
    ? records.reviews_pending + records.destinations_out_of_engine + records.announcements_expiring_7d + missing.length
    : undefined
  const destinationLink = (id: string) => '/destinos/' + encodeURIComponent(id)
  

  return (
    <div className="mx-auto grid max-w-screen-2xl gap-6 px-1 py-2 sm:px-2">
      <header className="relative isolate overflow-hidden rounded-3xl bg-navy-900 text-white">
        {cover && imageFailed !== cover && (
          <img src={cover} alt="" onError={() => setImageFailed(cover)} className="absolute inset-y-0 right-0 -z-20 h-full w-full object-cover object-center md:w-3/4" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-900 via-navy-900/95 to-navy-900/65" />
        <div className="grid gap-5 p-6 sm:p-9">
          <div className="flex items-center gap-2 text-sm text-gold-300"><Compass className="size-4" aria-hidden="true" /> Panel de administración</div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Resumen de PROXVEL</h1>
          <p className="max-w-lg text-sm text-slate-200 sm:text-base">Gestiona el catálogo y revisa la actividad de los viajeros.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><a href="#pendientes"><ClipboardList className="size-4" /> Revisar pendientes{pending ? ' (' + number.format(pending) + ')' : ''}</a></Button>
            <Button variant="secondary" asChild><Link to="/destinos">Ver catálogo <ArrowUpRight className="size-4" /></Link></Button>
          </div>
        </div>
      </header>

      <section id="pendientes" tabIndex={-1} aria-labelledby="pending-title" className={panel + ' scroll-mt-24'}>
        <h2 id="pending-title" className="text-2xl font-semibold text-navy-900">Pendientes de revisión</h2>
        {priorities.isError && <ErrorState compact title="No se pudieron consultar los pendientes" onRetry={() => void priorities.refetch()} />}
        {catalog.isError && <ErrorState compact title="No se pudieron comprobar las portadas" onRetry={() => void catalog.refetch()} />}
        {(priorities.isLoading || catalog.isLoading) && <LoadingRows label="Cargando pendientes" />}
        {pending === 0 && <p className="mt-3 text-sm text-slate-600">No hay pendientes en este momento.</p>}
        {pending !== 0 && (
          <div className="mt-4 grid gap-x-8 gap-y-4 lg:grid-cols-2">
            {missing?.length ? <TaskGroup title={'Destinos activos sin portada · ' + missing.length}>
              {missing.map(item => <Task key={item.destination_id} to={destinationLink(item.destination_id) + '?tab=multimedia'} name={item.destination} detail="Editar portada" />)}
            </TaskGroup> : null}
            {records?.reviews_pending ? <TaskGroup title={'Reseñas por procesar · ' + records.reviews_pending}>
              {records.review_destinations?.map(item => <Task key={item.destination_id} to={destinationLink(item.destination_id) + '?tab=comments'} name={item.name} detail={item.count + ' por procesar'} />)}
              {!records.review_destinations && <Task to="/motor" name="Consultar el motor" />}
            </TaskGroup> : null}
            {records?.destinations_out_of_engine ? <TaskGroup title={'Destinos activos fuera del motor · ' + records.destinations_out_of_engine}>
              {records.outside_engine?.map(item => <Task key={item.destination_id} to={destinationLink(item.destination_id)} name={item.name} detail="Revisar ficha" />)}
              {!records.outside_engine && <Task to="/motor" name="Ver destinos del motor" />}
            </TaskGroup> : null}
            {records?.announcements_expiring_7d ? <TaskGroup title={'Anuncios que vencen en 7 días · ' + records.announcements_expiring_7d}>
              {records.expiring_announcements?.map(item => <Task key={item.id} to={'/anuncios/' + item.id} name={item.title} detail={date.format(new Date(item.ends_at))} />)}
              {!records.expiring_announcements && <Task to="/anuncios" name="Ver anuncios" />}
            </TaskGroup> : null}
          </div>
        )}
      </section>

      <section aria-label="Indicadores operativos">
        {metrics.isError && <ErrorState compact title="No se pudieron consultar los indicadores" onRetry={() => void metrics.refetch()} />}
        {(metrics.isLoading || overview) && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={metrics.isLoading}>
          {[
            { label: 'Destinos en el catálogo', value: overview?.destinations.total, Icon: MapPin, note: overview ? overview.destinations.with_cover + ' con portada' : '' },
            { label: 'Destinos activos sin portada', value: missing?.length, Icon: ImageOff, note: 'Revisar en pendientes' },
            { label: 'Viajeros registrados', value: overview?.users.travelers, Icon: Users, note: 'Total de cuentas viajeras' },
            { label: 'Reseñas recibidas', value: overview?.reviews.total, Icon: MessageSquare, note: 'Total histórico' },
          ].map(({ label, value, Icon, note }) => <div key={label} className={panel}>
            <Icon className="mb-3 size-5 text-discovery" aria-hidden="true" />
            <div className="text-sm text-slate-600">{label}</div>
            {metrics.isLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <div className="mt-1 text-3xl font-semibold tabular-nums text-navy-900">{value === undefined ? '—' : number.format(value)}</div>}
            <p className="mt-2 text-xs text-slate-600">{note}</p>
          </div>)}
        </div>}
      </section>

      <section aria-label="Evolución de actividad" className="grid gap-5 xl:grid-cols-2">
        {charts.isError && <ErrorState compact className="xl:col-span-2" title="No se pudieron consultar las series" onRetry={() => void charts.refetch()} />}
        {(charts.isLoading || charts.data) && <>
          <div className={panel}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-semibold">Nuevos registros</h2><p className="text-sm text-slate-600">{daily ? 'Altas por día' : 'Altas por mes'}</p></div>
              <div className="flex gap-2">
                {days?.length ? <Button size="sm" variant={daily ? 'primary' : 'subtle'} aria-pressed={daily} onClick={() => setPeriod('daily')}>Días</Button> : null}
                <Button size="sm" variant={!daily ? 'primary' : 'subtle'} aria-pressed={!daily} onClick={() => setPeriod('monthly')}>Meses</Button>
              </div>
            </div>
            {charts.isLoading ? <Skeleton className="mt-4 h-56" /> : growth?.length ? (
              <div className="mt-4 h-56" role="group" aria-label="Serie de registros">
                <ResponsiveContainer><AreaChart data={growth} margin={{ left: -18, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 5" vertical={false} /><XAxis dataKey="label" minTickGap={22} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Area name="Registros" dataKey="users" stroke="#7756c5" strokeWidth={2} fill="#eee7fb" isAnimationActive={false} /></AreaChart></ResponsiveContainer>
              </div>
            ) : <p className="mt-6 text-sm text-slate-600">Todavía no hay registros para graficar.</p>}
          </div>
          <div className={panel}>
            <h2 className="text-xl font-semibold">Reseñas por mes</h2>
            <p className="text-sm text-slate-600">Volumen recibido en cada periodo</p>
            {charts.isLoading ? <Skeleton className="mt-4 h-56" /> : charts.data?.reviews_by_month.length ? (
              <div className="mt-4 h-56" role="group" aria-label="Serie mensual de reseñas">
                <ResponsiveContainer><BarChart data={charts.data.reviews_by_month} margin={{ left: -18, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" minTickGap={22} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Bar name="Reseñas" dataKey="reviews" fill="#d99f00" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
              </div>
            ) : <p className="mt-6 text-sm text-slate-600">Todavía no hay reseñas para graficar.</p>}
          </div>
        </>}
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>{overview ? 'Datos del ' + date.format(new Date(overview.generated_at)) : ''}</span>
        <span>{health.isError ? 'Sin respuesta del servidor' : health.data ? 'Servidor en línea' : 'Comprobando servidor…'} {health.isError && <Button size="sm" variant="subtle" onClick={() => void health.refetch()}>Reintentar</Button>}</span>
      </footer>
    </div>
  )
}

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 p-3"><h3 className="px-2 text-sm font-semibold text-navy-900">{title}</h3><ul className="mt-2 divide-y divide-slate-100">{children}</ul></div>
}

function Task({ to, name, detail }: { to: string; name: string; detail?: string }) {
  return <li><Link to={to} className="flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-gold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-discovery"><span className="min-w-0 flex-1 font-medium">{name}{detail && <span className="block text-xs font-normal text-slate-600">{detail}</span>}</span><ArrowUpRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" /></Link></li>
}
