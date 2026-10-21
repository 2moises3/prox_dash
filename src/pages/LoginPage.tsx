import { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/useAuth'
import { authService, isAdminRole } from '@/auth/authService'
import { getApiErrorMessage } from '@/api/apiClient'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginForm = z.infer<typeof loginSchema>

const WORDS = ['PROXVEL', 'tu Próximo Viaje']

export function LoginPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const [text, setText] = useState('PROXVEL')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const currentWord = WORDS[loopNum % WORDS.length]

    if (isDeleting) {
      if (text === '') {
        timer = setTimeout(() => {
          setIsDeleting(false)
          setLoopNum((prev) => prev + 1)
        }, 150)
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1))
        }, 50)
      }
    } else {
      if (text === currentWord) {
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, 3000)
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1))
        }, 80)
      }
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, loopNum])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated && isAdmin) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }

  const onSubmit = async (values: LoginForm) => {
    try {
      const user = await authService.login(values.email, values.password)
      if (!isAdminRole(user)) {
        toast.error('Esta cuenta no tiene acceso administrativo.')
        navigate('/403', { replace: true })
        return
      }
      toast.success(`Bienvenido, ${user.name || user.email}`)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo iniciar sesión'))
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="min-h-[5.5rem] font-serif text-[2.4rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#0E1730]">
          Bienvenido a <span className="text-[#D89B1F]">{text}</span>
          <span className="animate-pulse font-light text-[#D89B1F]">|</span>
        </h1>
        <p className="mt-3 text-[15px] text-[#64748B]">
          Accede a tu panel administrativo para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-[#0E1730]">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@proxvel.com"
              className="h-[52px] rounded-xl border-[#D8DEE8] bg-white/85 pl-12 text-base text-[#0E1730] transition-colors focus:border-[#D89B1F] focus:bg-white focus:ring-2 focus:ring-[#D89B1F]/20"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </div>
          {errors.email ? (
            <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-[#0E1730]">
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-[52px] rounded-xl border-[#D8DEE8] bg-white/85 pl-12 pr-12 text-base text-[#0E1730] transition-colors focus:border-[#D89B1F] focus:bg-white focus:ring-2 focus:ring-[#D89B1F]/20"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>
          ) : null}
        </div>

        <Button 
          type="submit" 
          className="mt-2 h-[56px] w-full rounded-xl bg-gradient-to-br from-[#D89B1F] to-[#E8B23A] text-base font-bold text-[#0E1730] shadow-[0_14px_30px_rgba(216,155,31,0.25)] hover:from-[#c28b1b] hover:to-[#d4a233] active:scale-[0.98] transition-all" 
          loading={isSubmitting}
        >
          {isSubmitting ? (
            'Verificando…'
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <div className="pt-2 text-center">
          <a href="#" className="text-sm font-medium text-[#64748B] hover:text-[#0E1730] transition-colors" onClick={(e) => { e.preventDefault(); toast.info('Contacta al super administrador para restablecer tu contraseña.'); }}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>

      <div className="mt-12">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#D8DEE8]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#FDFBF7] px-4 text-[#64748B]">
              <Lock className="h-4 w-4" />
            </span>
          </div>
        </div>
        
        <p className="mt-6 text-center text-[13px] leading-relaxed text-[#64748B]">
          Acceso exclusivo para el equipo administrativo.<br className="hidden sm:block" /> El registro público está deshabilitado.
        </p>
        <p className="mt-3 text-center text-xs text-[#64748B]">
          Datos personales: <a className="underline" href="mailto:soporte@m3biznovatech.com">soporte@m3biznovatech.com</a>
        </p>
      </div>
    </div>
  )
}
