import { Children, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, ClipboardList, ImageOff, MapPin, MessageSquare, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartMetrics, useDashboardPriorities, useMetricsOverview, useSystemHealth } from '@/hooks/useMetrics'
import { useDestinations } from '@/hooks/useDestinations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingRows } from '@/components/feedback/LoadingRows'

const number = new Intl.NumberFormat('es-PE')
const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' })
const panel = 'min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6'

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
      <header className="relative isolate overflow-hidden rounded-2xl border border-zinc-200 bg-white text-navy-900">
        {cover && imageFailed !== cover && (
          <img src={cover} alt="" onError={() => setImageFailed(cover)} className="absolute inset-y-0 right-0 -z-20 hidden h-full w-1/3 object-cover object-center opacity-90 lg:block" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white to-white/85" />
        <div className="grid gap-3 p-5 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><span className="size-2 rounded-full bg-gold-500" /> Panel de administración</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resumen de PROXVEL</h1>
          <p className="max-w-lg text-sm text-zinc-600">Gestiona el catálogo y revisa la actividad de los viajeros.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><a href="#pendientes"><ClipboardList className="size-4" /> Revisar pendientes{pending ? ' (' + number.format(pending) + ')' : ''}</a></Button>
            <Button variant="secondary" asChild><Link to="/destinos">Ver catálogo <ArrowUpRight className="size-4" /></Link></Button>
          </div>
        </div>
      </header>

      <section id="pendientes" tabIndex={-1} aria-labelledby="pending-title" className={panel + ' scroll-mt-24'}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="pending-title" className="text-xl font-semibold text-navy-900">Tareas del equipo</h2>{pending !== undefined && <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800">{number.format(pending)} elementos</span>}</div>
        <p className="mt-1 text-sm text-zinc-600">Las reseñas pendientes esperan su procesamiento para el motor; siguen visibles en la app.</p>
        {priorities.isError && <ErrorState compact title="No se pudieron consultar los pendientes" onRetry={() => void priorities.refetch()} />}
        {catalog.isError && <ErrorState compact title="No se pudieron comprobar las portadas" onRetry={() => void catalog.refetch()} />}
        {(priorities.isLoading || catalog.isLoading) && <LoadingRows label="Cargando pendientes" />}
        {pending === 0 && <p className="mt-3 text-sm text-slate-600">No hay pendientes en este momento.</p>}
        {pending !== 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {missing?.length ? <TaskGroup title={'Destinos activos sin portada · ' + missing.length}>
              {missing.map(item => <Task key={item.destination_id} to={destinationLink(item.destination_id) + '?tab=multimedia'} name={item.destination} detail="Editar portada" />)}
            </TaskGroup> : null}
            {records?.reviews_pending ? <TaskGroup title={'Reseñas para el motor · ' + records.reviews_pending}>
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
                <ResponsiveContainer><AreaChart data={growth} margin={{ left: -18, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 5" vertical={false} /><XAxis dataKey="label" minTickGap={22} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Area name="Registros" dataKey="users" stroke="#d99f00" strokeWidth={2} fill="#fff4ce" isAnimationActive={false} /></AreaChart></ResponsiveContainer>
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
  const [expanded, setExpanded] = useState(false)
  const items = Children.toArray(children)
  const visible = expanded ? items : items.slice(0, 2)
  return <div className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"><h3 className="truncate px-1 text-sm font-semibold text-navy-900" title={title}>{title}</h3><ul className="mt-1 divide-y divide-zinc-200">{visible}</ul>{items.length > 2 && <button type="button" className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? 'Mostrar menos' : `Ver ${items.length - 2} más`}<ChevronDown className={'size-3.5 transition-transform ' + (expanded ? 'rotate-180' : '')} /></button>}</div>
}

function Task({ to, name, detail }: { to: string; name: string; detail?: string }) {
  return <li><Link to={to} className="flex min-h-10 items-center gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-gold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"><span className="min-w-0 flex-1 truncate font-medium" title={name}>{name}{detail && <span className="block truncate text-[11px] font-normal text-zinc-500">{detail}</span>}</span><ArrowUpRight className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" /></Link></li>
}
