import { useState } from 'react'
import { Smartphone, Plus, UploadCloud, Link2, Copy, Trash2, Rocket, Undo2, Info } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SelectField, type SelectOption } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/auth/useAuth'
import { useReleases, useCreateRelease, usePublishRelease, useDeleteRelease } from '@/hooks/useReleases'
import type { AppRelease } from '@/types'

const PLATFORM_OPTIONS: SelectOption[] = [
  { value: 'android', label: 'Android (.apk)' },
  { value: 'ios', label: 'iOS' },
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ReleasesPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const { data, isLoading, isError, refetch } = useReleases()
  const createRelease = useCreateRelease()
  const publishRelease = usePublishRelease()
  const deleteRelease = useDeleteRelease()

  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AppRelease | null>(null)

  // Form state
  const [vName, setVName] = useState('')
  const [vCode, setVCode] = useState('')
  const [platform, setPlatform] = useState('android')
  const [changelog, setChangelog] = useState('')
  const [apkUrl, setApkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)

  const resetForm = () => {
    setVName(''); setVCode(''); setPlatform('android'); setChangelog(''); setApkUrl(''); setFile(null); setUploadPct(null)
  }

  const canSubmit = vName.trim() !== '' && vCode.trim() !== '' && (file !== null || apkUrl.trim() !== '')

  const handleCreate = () => {
    const code = Number(vCode)
    if (!Number.isInteger(code) || code < 1) {
      toast.error('El código de versión debe ser un entero ≥ 1')
      return
    }
    createRelease.mutate(
      {
        payload: {
          version_name: vName.trim(),
          version_code: code,
          platform,
          changelog: changelog.trim() || undefined,
          apk_url: apkUrl.trim() || undefined,
          file: file ?? undefined,
        },
        onProgress: (p) => setUploadPct(p),
      },
      {
        onSuccess: () => { setOpen(false); resetForm() },
        onError: () => setUploadPct(null),
      },
    )
  }

  const copyUrl = (url: string | null) => {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => toast.success('URL copiada'))
  }

  return (
    <div>
      <PageHeader
        title="Versiones de la app"
        description="Gestiona las APKs publicadas. La landing consumirá la última versión publicada."
        actions={
          isSuperAdmin ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva versión
            </Button>
          ) : undefined
        }
      />

      {!isSuperAdmin && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Vista de solo lectura. Solo un <strong>super administrador</strong> puede subir, publicar o eliminar versiones.</p>
        </div>
      )}

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Smartphone}
          title="Sin versiones todavía"
          description="Registra la primera versión de la app para que la futura landing pueda ofrecerla."
          action={isSuperAdmin ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nueva versión</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">v{r.version_name}</span>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-500">code {r.version_code}</code>
                    <Badge variant="neutral">{r.platform}</Badge>
                    {r.is_published ? (
                      <Badge variant="success">Publicada</Badge>
                    ) : (
                      <Badge variant="warning">Borrador</Badge>
                    )}
                  </div>
                  {r.changelog ? (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-slate-600">{r.changelog}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400">Sin changelog</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{formatDate(r.created_at)}</span>
                    <span>{formatBytes(r.file_size)}</span>
                    {r.published_at && <span>Publicada: {formatDate(r.published_at)}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.apk_url && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => copyUrl(r.apk_url)}>
                        <Copy className="h-4 w-4" /> Copiar URL
                      </Button>
                      <Button asChild variant="secondary" size="sm">
                        <a href={r.apk_url} target="_blank" rel="noreferrer">
                          <Link2 className="h-4 w-4" /> Abrir
                        </a>
                      </Button>
                    </>
                  )}
                  {isSuperAdmin && (
                    <>
                      <Button
                        variant={r.is_published ? 'ghost' : 'primary'}
                        size="sm"
                        loading={publishRelease.isPending}
                        leftIcon={r.is_published ? <Undo2 className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
                        onClick={() => publishRelease.mutate({ id: r.id, isPublished: !r.is_published })}
                      >
                        {r.is_published ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)} title="Eliminar versión">
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog crear versión */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva versión de la app</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="v-name">Nombre de versión *</Label>
                <Input id="v-name" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="1.0.0" />
              </div>
              <div>
                <Label htmlFor="v-code">Código de versión *</Label>
                <Input id="v-code" value={vCode} onChange={(e) => setVCode(e.target.value)} placeholder="1" inputMode="numeric" />
              </div>
            </div>

            <div>
              <Label>Plataforma</Label>
              <SelectField value={platform} onValueChange={setPlatform} options={PLATFORM_OPTIONS} ariaLabel="Plataforma" />
            </div>

            <div>
              <Label htmlFor="v-changelog">Changelog</Label>
              <Textarea id="v-changelog" rows={3} value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Novedades de esta versión…" />
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <Label className="flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Archivo APK</Label>
              <input
                type="file"
                accept=".apk"
                className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-[11px] text-slate-400">
                Cloudinary puede rechazar APKs grandes. Para PROXVEL, sube el APK como asset de un GitHub Release y pega su URL pública abajo.
              </p>
            </div>

            <div>
              <Label htmlFor="v-url">…o URL pública del APK</Label>
              <Input id="v-url" value={apkUrl} onChange={(e) => setApkUrl(e.target.value)} placeholder="https://github.com/…/releases/download/v1.0.0/PROXVEL.apk" disabled={file !== null} />
              <p className="mt-1 text-[11px] text-slate-400">Usa la URL de esta versión, no /releases/latest/download/.</p>
            </div>

            {uploadPct !== null && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => { setOpen(false); resetForm() }}>Cancelar</Button>
            <Button onClick={handleCreate} loading={createRelease.isPending} disabled={!canSubmit}>
              Registrar versión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Eliminar versión"
        description={`Se eliminará la versión v${deleteTarget?.version_name} y su archivo en Cloudinary (si aplica). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteRelease.isPending}
        onConfirm={() => deleteTarget && deleteRelease.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </div>
  )
}
