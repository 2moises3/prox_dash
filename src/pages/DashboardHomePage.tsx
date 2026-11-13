import { Children, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, ImageOff, MapPin, MessageSquare, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartMetrics, useDashboardPriorities, useMetricsOverview, useRecentActivity, useSystemHealth } from '@/hooks/useMetrics'
import { useDestinations } from '@/hooks/useDestinations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingRows } from '@/components/feedback/LoadingRows'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const number = new Intl.NumberFormat('es-PE')
const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' })
const panel = 'min-w-0 rounded-xl border border-zinc-200 bg-white p-4 md:p-5'
const chartColors = ['#fdbA00', '#171717', '#a1a1aa', '#e4e4e7', '#d99f00']

export function DashboardHomePage() {
  const metrics = useMetricsOverview()
  const charts = useChartMetrics()
  const priorities = useDashboardPriorities()
  const catalog = useDestinations()
  const health = useSystemHealth()
  const activity = useRecentActivity()
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily')
  const overview = metrics.data
  const records = priorities.data
  const destinations = catalog.data
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
  const categories = charts.data?.destinations_by_category.filter(item => item.value > 0) ?? []
  const categoryTop = categories.slice(0, 4)
  const categoryOther = categories.slice(4).reduce((sum, item) => sum + item.value, 0)
  const categorySlices = categoryOther ? [...categoryTop, { name: 'Otras', value: categoryOther }] : categoryTop
  const coverage = overview?.destinations.total ? Math.round(overview.destinations.with_cover / overview.destinations.total * 100) : 0
  

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4 text-navy-900 xl:col-span-5">
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Panel de administración / Resumen</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resumen de PROXVEL</h1>
          <p className="mt-1 text-sm text-zinc-600">Actividad y tareas del catálogo en un solo lugar.</p>
        </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href="#pendientes"><ClipboardList className="size-4" /> Revisar pendientes{pending ? ' (' + number.format(pending) + ')' : ''}</a></Button>
            <Button variant="secondary" asChild><Link to="/destinos">Ver catálogo <ArrowUpRight className="size-4" /></Link></Button>
          </div>
      </header>

      <section id="pendientes" tabIndex={-1} aria-labelledby="pending-title" className={panel + ' order-2 flex h-full flex-col scroll-mt-4 xl:col-span-2'}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="pending-title" className="text-xl font-semibold text-navy-900">Tareas del equipo</h2>{pending !== undefined && <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800">{number.format(pending)} elementos</span>}</div>
        <p className="mt-1 text-sm text-zinc-600">Las reseñas pendientes esperan su procesamiento para el motor; siguen visibles en la app.</p>
        {priorities.isError && <ErrorState compact title="No se pudieron consultar los pendientes" onRetry={() => void priorities.refetch()} />}
        {catalog.isError && <ErrorState compact title="No se pudieron comprobar las portadas" onRetry={() => void catalog.refetch()} />}
        {(priorities.isLoading || catalog.isLoading) && <LoadingRows label="Cargando pendientes" />}
        {pending === 0 && <p className="mt-3 text-sm text-slate-600">No hay pendientes en este momento.</p>}
        {pending !== 0 && (
          <div className="mt-4 grid flex-1 gap-3">
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

      <section aria-label="Indicadores operativos" className="order-1 xl:col-span-5">
        {metrics.isError && <ErrorState compact title="No se pudieron consultar los indicadores" onRetry={() => void metrics.refetch()} />}
        {(metrics.isLoading || overview) && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={metrics.isLoading}>
          {[
            { label: 'Destinos en el catálogo', value: overview?.destinations.total, Icon: MapPin, note: overview ? overview.destinations.with_cover + ' con portada' : '' },
            { label: 'Destinos activos sin portada', value: missing?.length, Icon: ImageOff, note: 'Revisar en pendientes' },
            { label: 'Viajeros registrados', value: overview?.users.travelers, Icon: Users, note: 'Total de cuentas viajeras' },
            { label: 'Reseñas recibidas', value: overview?.reviews.total, Icon: MessageSquare, note: 'Total histórico' },
          ].map(({ label, value, Icon, note }) => <div key={label} className={panel}>
            <Icon className="mb-3 size-5 text-gold-600" aria-hidden="true" />
            <div className="text-sm text-slate-600">{label}</div>
            {metrics.isLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <div className="mt-1 text-3xl font-semibold tabular-nums text-navy-900">{value === undefined ? '—' : number.format(value)}</div>}
            <p className="mt-2 text-xs text-slate-600">{note}</p>
          </div>)}
        </div>}
      </section>

      <section aria-label="Evolución de actividad" className="order-3 grid min-w-0 gap-4 xl:col-span-3 2xl:grid-cols-2">
        {charts.isError && <ErrorState compact className="2xl:col-span-2" title="No se pudieron consultar las series" onRetry={() => void charts.refetch()} />}
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
      <section aria-label="Composición y actividad" className="order-4 grid min-w-0 gap-4 md:grid-cols-2 xl:col-span-5 xl:grid-cols-3">
        <div className={panel}>
          <h2 className="text-lg font-semibold">Destinos por categoría</h2>
          <p className="text-sm text-zinc-600">Distribución del catálogo</p>
          {charts.isLoading ? <Skeleton className="mt-4 h-40" /> : categorySlices.length ? <div className="mt-2 flex items-center gap-3">
            <div className="h-40 min-w-0 flex-1" role="img" aria-label="Distribución de destinos por categoría">
              <ResponsiveContainer><PieChart><Pie data={categorySlices} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="78%" paddingAngle={2} stroke="none" isAnimationActive={false}>{categorySlices.map((item, index) => <Cell key={item.name} fill={chartColors[index]} />)}</Pie><Tooltip formatter={(value) => number.format(Number(value))} /></PieChart></ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">{categorySlices.map((item, index) => <li key={item.name} className="flex min-w-0 items-center gap-2 text-xs"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index] }} /><span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span><strong className="tabular-nums">{item.value}</strong></li>)}</ul>
          </div> : <p className="mt-5 text-sm text-zinc-500">Sin categorías registradas.</p>}
        </div>
        <div className={panel}>
          <h2 className="text-lg font-semibold">Cobertura del catálogo</h2>
          <p className="text-sm text-zinc-600">Preparación de las fichas para los viajeros</p>
          {metrics.isLoading ? <Skeleton className="mt-5 h-40" /> : overview ? <div className="mt-5 space-y-5">
            <div><div className="mb-2 flex justify-between text-sm"><span>Destinos con portada</span><strong>{coverage}%</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-gold-500" style={{ width: `${coverage}%` }} /></div><p className="mt-1 text-xs text-zinc-500">{overview.destinations.with_cover} de {overview.destinations.total} destinos</p></div>
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4"><div><strong className="block text-2xl">{number.format(overview.map_markers)}</strong><span className="text-xs text-zinc-600">En el mapa</span></div><div><strong className="block text-2xl">{number.format(overview.announcements.active)}</strong><span className="text-xs text-zinc-600">Anuncios activos</span></div></div>
          </div> : <p className="mt-5 text-sm text-zinc-500">Datos no disponibles.</p>}
        </div>
        <div className={panel + ' md:col-span-2 xl:col-span-1'}>
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Actividad reciente</h2><span className="text-xs text-zinc-500">Últimos movimientos</span></div>
          {activity.isError && <ErrorState compact title="No se pudo cargar la actividad" onRetry={() => void activity.refetch()} />}
          {activity.isLoading ? <LoadingRows label="Cargando actividad" /> : activity.data?.length ? <ul className="mt-3 divide-y divide-zinc-100">{activity.data.slice(0, 4).map((item, index) => <li key={`${item.at}-${index}`}><Link to={item.link} className="flex items-start justify-between gap-3 rounded-md py-2 text-sm hover:bg-zinc-50"><span className="min-w-0"><strong className="block truncate font-medium" title={item.title}>{item.title}</strong><span className="block truncate text-xs text-zinc-500">{item.subtitle}</span></span><ArrowUpRight className="mt-1 size-4 shrink-0 text-zinc-400" /></Link></li>)}</ul> : !activity.isError && <p className="mt-5 text-sm text-zinc-500">Todavía no hay actividad reciente.</p>}
        </div>
      </section>
      <footer className="order-5 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 xl:col-span-5">
        <span>{overview ? 'Datos del ' + date.format(new Date(overview.generated_at)) : ''}</span>
        <span>{health.isError ? 'Sin respuesta del servidor' : health.data ? 'Servidor en línea' : 'Comprobando servidor…'} {health.isError && <Button size="sm" variant="subtle" onClick={() => void health.refetch()}>Reintentar</Button>}</span>
      </footer>
    </div>
  )
}

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const items = Children.toArray(children)
  return <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"><h3 className="text-sm font-semibold text-navy-900">{title}</h3><ul className="mt-2 flex-1 divide-y divide-zinc-200">{items.slice(0, 2)}</ul>{items.length > 2 && <><button type="button" className="mt-3 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-gold-400 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500" onClick={() => setOpen(true)}>Ver lista completa <span className="rounded-full bg-gold-50 px-2 py-0.5 text-gold-800">{items.length} destinos</span></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex max-h-[85dvh] w-[min(92vw,800px)] max-w-none flex-col"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Selecciona un destino para abrir su ficha y gestionar esta tarea.</DialogDescription></DialogHeader><ul className="grid min-h-0 gap-x-5 overflow-y-auto sm:grid-cols-2">{items}</ul></DialogContent></Dialog></>}</div>
}

function Task({ to, name, detail }: { to: string; name: string; detail?: string }) {
  return <li><Link to={to} className="flex min-h-11 items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"><span className="min-w-0 flex-1 font-medium">{name}{detail && <span className="block text-xs font-normal text-zinc-500">{detail}</span>}</span><ArrowUpRight className="size-4 shrink-0 text-zinc-500" aria-hidden="true" /></Link></li>
}
