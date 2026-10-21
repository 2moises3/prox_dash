import { Routes, Route } from 'react-router-dom'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { RoleGuard } from '@/auth/RoleGuard'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'

import { LoginPage } from '@/pages/LoginPage'
import { DashboardHomePage } from '@/pages/DashboardHomePage'
import { DestinationsPage } from '@/pages/DestinationsPage'
import { DestinationDetailPage } from '@/pages/DestinationDetailPage'
import { AnnouncementsPage } from '@/pages/AnnouncementsPage'
import { AnnouncementEditorPage } from '@/pages/AnnouncementEditorPage'
import { ExcelImportPage } from '@/pages/ExcelImportPage'
import { ImportDataPage } from '@/pages/ImportDataPage'
import { UsersPage } from '@/pages/UsersPage'
import { EnginePage } from '@/pages/EnginePage'
import { ReleasesPage } from '@/pages/ReleasesPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* /403 accesible para cualquier sesión autenticada (incluido traveler) */}
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="destinos" element={<DestinationsPage />} />
            <Route path="destinos/importar" element={<ExcelImportPage />} />
            <Route path="destinos/:id" element={<DestinationDetailPage />} />
            <Route path="anuncios" element={<AnnouncementsPage />} />
            <Route path="anuncios/nuevo" element={<AnnouncementEditorPage />} />
            <Route path="anuncios/:id" element={<AnnouncementEditorPage />} />
            <Route path="motor" element={<EnginePage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="importar-datos" element={<ImportDataPage />} />
            <Route path="versiones" element={<ReleasesPage />} />
            <Route path="privacidad" element={<PrivacyPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
