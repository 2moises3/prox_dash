import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SUPPORT_EMAIL = 'soporte@m3biznovatech.com'

const sections: { title: string; items: string[] }[] = [
  {
    title: 'Quién es responsable',
    items: [
      'Biznovatech S.A.C. (nombre comercial M3Biznovatech), Ñaña, Lurigancho-Chosica, Lima, Perú.',
      `Contacto para cualquier tema de datos personales: ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: 'Qué datos tuyos tratamos como administrador',
    items: [
      'Nombre, correo y rol, para crear y gestionar tu acceso.',
      'Registros de seguridad (inicios de sesión, cambios de contraseña, acciones administrativas con su fecha e IP). Se conservan 90 días y luego se eliminan.',
      'Tu contraseña se guarda cifrada; nadie, ni el equipo, puede verla.',
    ],
  },
  {
    title: 'Tus responsabilidades con los datos de los viajeros',
    items: [
      'Usa los datos de viajeros (correos, reseñas, reportes) solo para operar y mejorar PROXVEL.',
      'No los copies, compartas ni publiques fuera de la plataforma.',
      'Las reseñas se muestran con nombre e inicial; al ocultar una reseña reportada, hazlo solo por ofensiva, falsa o spam.',
      'Si un viajero pide acceder, corregir o eliminar sus datos, deriva la solicitud a ' + SUPPORT_EMAIL + '.',
      'Cierra sesión en equipos compartidos y no compartas tu contraseña.',
    ],
  },
  {
    title: 'Tus derechos',
    items: [
      `Puedes pedir acceso, rectificación o eliminación de tus datos escribiendo a ${SUPPORT_EMAIL}.`,
      'Al ser un acceso interno, algunos registros de seguridad pueden conservarse el plazo indicado por obligación de seguridad.',
    ],
  },
]

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacidad y legal"
        description="Cómo tratamos tus datos como administrador y qué se espera de ti con los datos de los viajeros."
      />
      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader>
            <CardTitle className="text-base">{s.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              {s.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-slate-500">
        Los Términos y la Política de Privacidad para viajeros están en la app y en la página web de PROXVEL.
      </p>
    </div>
  )
}
