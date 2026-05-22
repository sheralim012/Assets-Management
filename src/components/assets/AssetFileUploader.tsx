import { useState, useRef, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Upload,
  Eye,
  Trash2,
  File,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  X,
  Download,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import { useAssetFiles } from '@/hooks/useAssetFiles'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { AssetFile } from '@/types'

const MAX_FILES = 5
const MAX_SIZE_BYTES = 20 * 1024 * 1024

type UploadEntry = {
  localId: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  previewObjectUrl?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileStyle(fileType: string): {
  color: string
  bgColor: string
  icon: typeof File
  ext: string
} {
  if (fileType.startsWith('image/')) {
    return { color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: ImageIcon, ext: fileType.split('/')[1]?.toUpperCase() ?? 'IMG' }
  }
  if (fileType === 'application/pdf') {
    return { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: FileText, ext: 'PDF' }
  }
  if (fileType.includes('word') || fileType.includes('doc')) {
    return { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: FileText, ext: 'DOC' }
  }
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('spreadsheet') || fileType.includes('csv')) {
    return { color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: FileSpreadsheet, ext: 'XLS' }
  }
  return { color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', icon: File, ext: 'FILE' }
}

function getExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE'
}

interface FileCardProps {
  file: AssetFile
  signedUrl: string | undefined
  onView: (file: AssetFile) => void
  onDelete: (file: AssetFile) => void
  isDeleting: boolean
}

function FileCard({ file, signedUrl, onView, onDelete, isDeleting }: FileCardProps) {
  const isImage = file.file_type.startsWith('image/')
  const style = getFileStyle(file.file_type)
  const Icon = style.icon
  const ext = isImage ? getExtension(file.file_name) : style.ext

  return (
    <div className="group relative rounded-xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Preview area */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
        {isImage && signedUrl ? (
          <img
            src={signedUrl}
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full flex flex-col items-center justify-center gap-2', style.bgColor)}>
            <Icon className={cn('w-10 h-10', style.color)} />
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', style.color, style.bgColor)}>
              {ext}
            </span>
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity">
          <button
            onClick={() => onView(file)}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(file)}
            disabled={isDeleting}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Always-visible actions on mobile (touch targets) */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 sm:hidden">
          <button
            onClick={() => onView(file)}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(file)}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="px-3 py-2">
        <p className="text-xs font-medium text-[var(--color-text)] truncate" title={file.file_name}>
          {file.file_name}
        </p>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
          {formatSize(file.file_size)}
        </p>
      </div>
    </div>
  )
}

interface UploadCardProps {
  entry: UploadEntry
  onDismiss: (localId: string) => void
}

function UploadCard({ entry, onDismiss }: UploadCardProps) {
  const isImage = entry.file.type.startsWith('image/')
  const style = getFileStyle(entry.file.type)
  const Icon = style.icon

  return (
    <div className="relative rounded-xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
        {isImage && entry.previewObjectUrl ? (
          <img
            src={entry.previewObjectUrl}
            alt={entry.file.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className={cn('w-full h-full flex flex-col items-center justify-center gap-2', style.bgColor)}>
            <Icon className={cn('w-10 h-10 opacity-50', style.color)} />
          </div>
        )}

        {/* Upload progress overlay */}
        {entry.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 px-4">
            <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
            <span className="text-white text-xs font-medium">{entry.progress}%</span>
          </div>
        )}

        {/* Error state */}
        {entry.status === 'error' && (
          <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center gap-1 px-3">
            <AlertCircle className="w-6 h-6 text-white" />
            <p className="text-white text-[11px] text-center leading-tight">{entry.error}</p>
          </div>
        )}

        {/* Done check */}
        {entry.status === 'done' && (
          <div className="absolute inset-0 bg-emerald-500/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Dismiss error */}
        {entry.status === 'error' && (
          <button
            onClick={() => onDismiss(entry.localId)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}
      </div>

      <div className="px-3 py-2">
        <p className="text-xs font-medium text-[var(--color-text)] truncate" title={entry.file.name}>
          {entry.file.name}
        </p>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
          {entry.status === 'uploading' ? 'Uploading…' : entry.status === 'error' ? 'Failed' : 'Uploaded'}
        </p>
      </div>
    </div>
  )
}

interface AssetFileUploaderProps {
  assetId: string | null
}

export function AssetFileUploader({ assetId }: AssetFileUploaderProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AssetFile | null>(null)
  const [viewData, setViewData] = useState<{ file: AssetFile; url: string } | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuth()
  const qc = useQueryClient()
  const { files: dbFiles, isLoading, getSignedUrl, deleteFile } = useAssetFiles(assetId)

  // Fetch signed URLs for image DB files
  useEffect(() => {
    const imageFiles = dbFiles.filter((f) => f.file_type.startsWith('image/') && !signedUrls[f.id])
    imageFiles.forEach(async (f) => {
      const url = await getSignedUrl(f.storage_path)
      if (url) setSignedUrls((prev) => ({ ...prev, [f.id]: url }))
    })
  }, [dbFiles]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeUploadCount = uploads.filter((u) => u.status !== 'error').length
  const totalFileCount = dbFiles.length + activeUploadCount
  const canUpload = !!assetId && totalFileCount < MAX_FILES

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!assetId || !profile) return
      const fileArray = Array.from(fileList)
      const slots = MAX_FILES - totalFileCount
      const toUpload = fileArray.slice(0, slots)

      for (const file of toUpload) {
        const localId = crypto.randomUUID()

        if (file.size > MAX_SIZE_BYTES) {
          setUploads((prev) => [
            ...prev,
            { localId, file, progress: 0, status: 'error', error: 'File exceeds 20 MB limit' },
          ])
          continue
        }

        const previewObjectUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        setUploads((prev) => [
          ...prev,
          { localId, file, progress: 0, status: 'uploading', previewObjectUrl },
        ])

        doUpload(file, localId, assetId, profile.id)
      }
    },
    [assetId, profile, totalFileCount], // eslint-disable-line react-hooks/exhaustive-deps
  )

  async function doUpload(file: File, localId: string, aid: string, uploadedBy: string) {
    let fakeProgress = 0
    const interval = setInterval(() => {
      fakeProgress = Math.min(90, fakeProgress + (90 - fakeProgress) * 0.15)
      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId && u.status === 'uploading'
            ? { ...u, progress: Math.round(fakeProgress) }
            : u,
        ),
      )
    }, 150)

    try {
      const sanitized = file.name.replace(/[^\w.\-]/g, '_')
      const path = `${aid}/${Date.now()}-${sanitized}`

      const { error: uploadError } = await supabase.storage
        .from('asset-files')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('asset_files').insert({
        asset_id: aid,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        storage_path: path,
        uploaded_by: uploadedBy,
      })
      if (dbError) throw dbError

      clearInterval(interval)
      setUploads((prev) =>
        prev.map((u) => (u.localId === localId ? { ...u, progress: 100, status: 'done' } : u)),
      )

      setTimeout(() => {
        setUploads((prev) => {
          const entry = prev.find((u) => u.localId === localId)
          if (entry?.previewObjectUrl) URL.revokeObjectURL(entry.previewObjectUrl)
          return prev.filter((u) => u.localId !== localId)
        })
        qc.invalidateQueries({ queryKey: ['asset-files', aid] })
        qc.invalidateQueries({ queryKey: ['asset-file-counts'] })
      }, 800)
    } catch (err) {
      clearInterval(interval)
      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId
            ? { ...u, progress: 0, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
            : u,
        ),
      )
    }
  }

  async function handleView(file: AssetFile) {
    const url = await getSignedUrl(file.storage_path)
    if (!url) { toast.error('Could not get file URL'); return }

    if (file.file_type === 'application/pdf') {
      window.open(url, '_blank')
      return
    }
    if (file.file_type.startsWith('image/')) {
      setViewData({ file, url })
      return
    }
    // Everything else: download
    const a = document.createElement('a')
    a.href = url
    a.download = file.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsConfirmingDelete(true)
    try {
      await deleteFile({ fileId: deleteTarget.id, storagePath: deleteTarget.storage_path })
      toast.success('File deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete file')
    } finally {
      setIsConfirmingDelete(false)
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (canUpload) setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (canUpload) handleFiles(e.dataTransfer.files)
  }

  if (!assetId) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] px-6 py-8 text-center">
        <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-secondary)] opacity-40" />
        <p className="text-sm text-[var(--color-text-secondary)]">Save the asset first to attach files</p>
      </div>
    )
  }

  const allCards = [
    ...uploads.map((u) => ({ type: 'upload' as const, data: u })),
    ...dbFiles.map((f) => ({ type: 'db' as const, data: f })),
  ]

  return (
    <div>
      {/* Drop zone */}
      {canUpload && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-gray-50',
          )}
        >
          <Upload
            className={cn(
              'w-7 h-7 mx-auto mb-2 transition-colors',
              isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]',
            )}
          />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Drag files here or{' '}
            <span className="text-[var(--color-primary)] font-medium">browse files</span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Any file type · Max 20 MB ·{' '}
            {MAX_FILES - totalFileCount} slot{MAX_FILES - totalFileCount !== 1 ? 's' : ''} remaining
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* File limit reached */}
      {!canUpload && totalFileCount >= MAX_FILES && (
        <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">
          Maximum of {MAX_FILES} files reached. Delete a file to upload more.
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-4 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--color-border)] overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="px-3 py-2 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File grid */}
      {!isLoading && allCards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3">
          {allCards.map((card) =>
            card.type === 'upload' ? (
              <UploadCard
                key={card.data.localId}
                entry={card.data}
                onDismiss={(id) => setUploads((prev) => prev.filter((u) => u.localId !== id))}
              />
            ) : (
              <FileCard
                key={card.data.id}
                file={card.data}
                signedUrl={signedUrls[card.data.id]}
                onView={handleView}
                onDelete={setDeleteTarget}
                isDeleting={isConfirmingDelete && deleteTarget?.id === card.data.id}
              />
            ),
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this file?"
        description={
          deleteTarget
            ? `"${deleteTarget.file_name}" will be permanently removed from storage. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete file"
        variant="danger"
        loading={isConfirmingDelete}
      />

      {/* Image lightbox */}
      {viewData && (
        <Modal open onClose={() => setViewData(null)} title={viewData.file.file_name} size="xl">
          <div className="flex flex-col items-center gap-4">
            <img
              src={viewData.url}
              alt={viewData.file.file_name}
              className="max-w-full max-h-[65vh] object-contain rounded-lg"
            />
            <a
              href={viewData.url}
              download={viewData.file.file_name}
              className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </Modal>
      )}
    </div>
  )
}
