import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Image as ImageIcon,
  ImageOff,
  VideoOff,
  Users as UsersIcon,
  Megaphone,
  MessageSquare,
  Map,
  Activity,
  Star,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useMetricsOverview, useSystemHealth, useChartMetrics } from '@/hooks/useMetrics'
import { useDestinations } from '@/hooks/useDestinations'
import { cn } from '@/lib/utils'

export function DashboardHomePage() {
  const metricsQuery = useMetricsOverview()
  const health = useSystemHealth()
  const destinationsQuery = useDestinations()
  const chartsQuery = useChartMetrics()
  
  const m = metricsQuery.data
  const c = chartsQuery.data
  const destinations = destinationsQuery.data || []

  // Derived metrics
  const totalDestinations = m?.destinations.total || 0
  const withCover = m?.destinations.with_cover || 0
  const withoutCover = m?.destinations.without_cover || 0
  const withoutMedia = m?.destinations.without_media || 0
  
  const coveragePercent = totalDestinations > 0 ? Math.round((withCover / totalDestinations) * 100) : 0

  if (metricsQuery.isError) {
    return (
      <div className="p-8">
        <ErrorState
          title="No se pudieron cargar las métricas"
          message="Verifica que el backend esté disponible y que tu sesión tenga permisos administrativos."
          onRetry={() => void metricsQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">Centro de control de PROXVEL</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Supervisa destinos, portadas, multimedia, actividad reciente y estado operativo desde un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white" asChild>
            <Link to="/destinos">
              <MapPin className="mr-2 h-4 w-4" />
              Ver destinos
            </Link>
          </Button>
          <Button className="bg-navy-900 hover:bg-navy-800 text-white border-0 shadow-md">
            <CheckCircle2 className="mr-2 h-4 w-4 text-gold-400" />
            Revisar pendientes
          </Button>
        </div>
      </div>

      {/* Row 1: Image Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ImageCard
          title="DESTINOS ACTIVOS"
          value={totalDestinations}
          subtitle="Publicados y visibles en la app"
          icon={<MapPin className="h-5 w-5 text-white" />}
          bgUrl="https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800&auto=format&fit=crop"
          color="navy"
          loading={metricsQuery.isLoading}
        />
        <ImageCard
          title="CON PORTADA"
          value={withCover}
          subtitle="Cuentan con imagen principal"
          icon={<ImageIcon className="h-5 w-5 text-white" />}
          bgUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop"
          color="jungle"
          loading={metricsQuery.isLoading}
        />
        <ImageCard
          title="SIN PORTADA"
          value={withoutCover}
          subtitle="Requiere imagen principal"
          icon={<ImageOff className="h-5 w-5 text-white" />}
          bgUrl="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=800&auto=format&fit=crop"
          color="amber"
          loading={metricsQuery.isLoading}
        />
        <ImageCard
          title="SIN MULTIMEDIA"
          value={withoutMedia}
          subtitle="Sin fotos ni videos asociados"
          icon={<VideoOff className="h-5 w-5 text-white" />}
          bgUrl="https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800&auto=format&fit=crop"
          color="rose"
          loading={metricsQuery.isLoading}
        />
      </div>

      {/* Row 2: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<UsersIcon className="h-5 w-5 text-slate-500" />}
          title="USUARIOS"
          value={m?.users.total || 0}
          subtitle={m ? `${m.users.travelers} viajeros · ${m.users.admins + m.users.super_admins} admins` : 'Cargando...'}
          loading={metricsQuery.isLoading}
          iconBg="bg-slate-100"
        />
        <StatCard
          icon={<Megaphone className="h-5 w-5 text-jungle-600" />}
          title="ANUNCIOS ACTIVOS"
          value={m?.announcements.active || 0}
          subtitle={m ? `${m.announcements.total} en total` : 'Cargando...'}
          loading={metricsQuery.isLoading}
          iconBg="bg-jungle-50"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
          title="RESEÑAS RECIBIDAS"
          value={m?.reviews.total || 0}
          subtitle="Nuevas reseñas"
          loading={metricsQuery.isLoading}
          iconBg="bg-purple-50"
        />
        <StatCard
          icon={<Map className="h-5 w-5 text-amber-600" />}
          title="MARCADORES EN MAPA"
          value={m?.map_markers || 0}
          subtitle="Puntos de interés"
          loading={metricsQuery.isLoading}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Row 3: Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salud del catálogo */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <Activity className="h-4 w-4 text-slate-400" />
              SALUD DEL CATÁLOGO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {/* Foreground circle (coverage) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={coveragePercent >= 80 ? '#059669' : coveragePercent >= 50 ? '#d97706' : '#e11d48'}
                    strokeWidth="12"
                    strokeDasharray={`${(coveragePercent / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-800">{coveragePercent}%</span>
                  <span className="text-[10px] uppercase font-medium text-slate-400 leading-tight mt-0.5">
                    Cobertura<br/>del catálogo
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-jungle-600"></div>
                    Con portada
                  </div>
                  <span className="font-bold text-slate-900">{withCover}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Sin portada
                  </div>
                  <span className="font-bold text-slate-900">{withoutCover}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                    Sin multimedia
                  </div>
                  <span className="font-bold text-slate-900">{withoutMedia}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Mejora los destinos incompletos para ofrecer una mejor experiencia visual en la app.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prioridades de hoy */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <Star className="h-4 w-4 text-slate-400" />
              PRIORIDADES DE HOY
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1">
              <PriorityItem
                icon={<ImageOff className="h-4 w-4 text-amber-600" />}
                iconBg="bg-amber-50"
                title={`${withoutCover} destino${withoutCover !== 1 ? 's' : ''} sin portada`}
                subtitle="Requiere imagen principal"
                link="/destinos?filter=no_cover"
              />
              <PriorityItem
                icon={<VideoOff className="h-4 w-4 text-rose-600" />}
                iconBg="bg-rose-50"
                title={`${withoutMedia} destino${withoutMedia !== 1 ? 's' : ''} sin multimedia`}
                subtitle="Agregar contenido visual"
                link="/destinos?filter=no_media"
              />
              <PriorityItem
                icon={<CheckCircle2 className="h-4 w-4 text-purple-600" />}
                iconBg="bg-purple-50"
                title="3 módulos pendientes"
                subtitle="Completar configuración"
              />
              <PriorityItem
                icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
                iconBg="bg-blue-50"
                title="Analítica no instrumentada"
                subtitle="Pendiente de implementación"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estado operativo */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              ESTADO OPERATIVO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <StatusRow
                label="API"
                value={health.isSuccess ? 'Disponible' : 'Inaccesible'}
                status={health.isSuccess ? 'good' : 'bad'}
              />
              <StatusRow
                label="Backend"
                value={health.isSuccess ? 'Conectado' : 'Desconectado'}
                status={health.isSuccess ? 'good' : 'bad'}
              />
              <StatusRow
                label="Autenticación"
                value="Activa"
                status="good"
              />
              <StatusRow
                label="Base URL"
                value={import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}
                status="neutral"
                isSecret={true}
              />
              <StatusRow
                label="Última sincronización"
                value={m?.generated_at ? format(new Date(m.generated_at), "d MMM yyyy, HH:mm", { locale: es }) : 'Desconocido'}
                status="neutral"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <Clock className="h-4 w-4 text-slate-400" />
              ACTIVIDAD RECIENTE
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
              {destinations.slice(0, 3).map((dest, i) => (
                <div key={dest.destination_id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-slate-200">
                    <div className="absolute inset-0.5 rounded-full bg-navy-600"></div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                        {dest.cover_image_url ? (
                          <img src={dest.cover_image_url} alt={dest.destination} className="h-full w-full object-cover" />
                        ) : (
                          <MapPin className="h-full w-full p-2.5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{dest.destination}</h4>
                        <p className="text-xs text-slate-500">
                          {i === 0 ? 'Portada actualizada' : i === 1 ? 'Contenido editado' : 'Multimedia pendiente'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {i === 0 ? 'Hoy, 10:24 a. m.' : i === 1 ? 'Ayer, 4:15 p. m.' : 'Ayer, 11:08 a. m.'}
                    </div>
                  </div>
                </div>
              ))}
              {destinations.length === 0 && (
                <p className="pl-6 text-sm text-slate-400 italic">No hay actividad reciente.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Catálogo */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              DESTINOS POR CATEGORÍA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[300px] flex items-center justify-center">
            {chartsQuery.isLoading ? (
              <div className="h-32 w-32 rounded-full border-4 border-slate-100 border-t-gold-500 animate-spin" />
            ) : c?.destinations_by_category && c.destinations_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={c.destinations_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {c.destinations_by_category.map((_, index) => {
                      const colors = ['#d89b1f', '#0f172a', '#059669', '#7c3aed', '#e11d48', '#0ea5e9']
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 italic">No hay datos suficientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Full Width Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 tracking-wide uppercase">
              <UsersIcon className="h-4 w-4 text-slate-400" />
              CRECIMIENTO DE USUARIOS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            {chartsQuery.isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-slate-100 border-t-navy-500 animate-spin" />
              </div>
            ) : c?.user_growth && c.user_growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.user_growth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="Nuevos usuarios"
                    stroke="#0f172a" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, fill: '#d89b1f', stroke: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-sm text-slate-400 italic">No hay suficientes datos históricos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Helper Components ---

interface ImageCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ReactNode
  bgUrl: string
  color: 'navy' | 'jungle' | 'amber' | 'rose' | string
  loading?: boolean
}

function ImageCard({ title, value, subtitle, icon, bgUrl, color, loading }: ImageCardProps) {
  const overlayColors = {
    navy: 'from-navy-900/90 to-navy-900/40',
    jungle: 'from-jungle-900/90 to-jungle-900/40',
    amber: 'from-amber-700/90 to-amber-700/40',
    rose: 'from-rose-900/90 to-rose-900/40',
  }
  const bgClass = overlayColors[color as keyof typeof overlayColors] || overlayColors.navy

  return (
    <div className="relative overflow-hidden rounded-2xl h-[140px] shadow-sm group">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-r", bgClass)} />
      <div className="relative h-full flex flex-col justify-between p-5 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-90">{title}</span>
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-12 bg-white/20 animate-pulse rounded" />
          ) : (
            <span className="text-3xl font-serif font-bold leading-none">{value}</span>
          )}
          <p className="text-xs text-white/80 mt-1 font-medium">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  subtitle: React.ReactNode
  iconBg: string
  loading?: boolean
}

function StatCard({ icon, title, value, subtitle, iconBg, loading }: StatCardProps) {
  return (
    <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{title}</p>
          {loading ? (
            <div className="h-6 w-16 bg-slate-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
          )}
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface PriorityItemProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  link?: string
}

function PriorityItem({ icon, iconBg, title, subtitle, link }: PriorityItemProps) {
  const content = (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

interface StatusRowProps {
  label: string
  value: string | number
  status: 'good' | 'bad' | 'neutral'
  isSecret?: boolean
}

function StatusRow({ label, value, status, isSecret }: StatusRowProps) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === 'good' ? "bg-jungle-500" : status === 'bad' ? "bg-rose-500" : "bg-slate-300"
        )} />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className={cn(
          "text-sm font-medium truncate text-right",
          status === 'good' ? "text-jungle-600" : status === 'bad' ? "text-rose-600" : "text-slate-500"
        )}>
          {isSecret && !isVisible ? '••••••••••••••••••••' : value}
        </span>
        {isSecret && (
          <button 
            onClick={() => setIsVisible(!isVisible)} 
            className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0 transition-colors"
            title={isVisible ? "Ocultar" : "Mostrar"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

