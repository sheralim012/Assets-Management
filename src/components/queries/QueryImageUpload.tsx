import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface QueryImageUploadProps {
  file: File | null
  onChange: (file: File | null) => void
  existingUrl?: string | null
  existingName?: string | null
  onRemoveExisting?: () => void
  error?: string
}

export function QueryImageUpload({ file, onChange, existingUrl, existingName, onRemoveExisting, error }: QueryImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = file ? URL.createObjectURL(file) : null

  function validate(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Only JPEG, PNG, WebP, and GIF images are allowed'
    if (f.size > MAX_SIZE_BYTES) return `File exceeds 10 MB limit (${formatSize(f.size)})`
    return null
  }

  function handleFile(f: File) {
    const err = validate(f)
    if (err) {
      setValidationError(err)
      onChange(null)
      return
    }
    setValidationError(null)
    onChange(f)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function remove() {
    onChange(null)
    setValidationError(null)
  }

  const displayError = error || validationError

  if (!file && existingUrl && onRemoveExisting) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative inline-block rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          <img
            src={existingUrl}
            alt={existingName ?? 'Attachment'}
            className="max-h-48 max-w-full object-contain bg-gray-50"
          />
          <button
            type="button"
            onClick={onRemoveExisting}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="px-3 py-2 bg-white border-t border-[var(--color-border)]">
            <p className="text-xs font-medium text-[var(--color-text)] truncate">{existingName ?? 'Existing attachment'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (file && previewUrl) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative inline-block rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-48 max-w-full object-contain bg-gray-50"
            onLoad={() => {
              // Revoke previous URLs on re-render is handled by React lifecycle
            }}
          />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="px-3 py-2 bg-white border-t border-[var(--color-border)]">
            <p className="text-xs font-medium text-[var(--color-text)] truncate">{file.name}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">{formatSize(file.size)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Attachment <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
            : displayError
              ? 'border-red-300 hover:border-red-400 bg-red-50/30'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-gray-50',
        )}
      >
        {isDragging ? (
          <Upload className="w-6 h-6 mx-auto mb-1.5 text-[var(--color-primary)]" />
        ) : (
          <ImageIcon className="w-6 h-6 mx-auto mb-1.5 text-[var(--color-text-secondary)]" />
        )}
        <p className="text-sm text-[var(--color-text-secondary)]">
          Drag an image here or{' '}
          <span className="text-[var(--color-primary)] font-medium">browse</span>
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          JPEG, PNG, WebP, GIF · Max 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {displayError && (
        <p className="text-xs text-red-600 mt-1">{displayError}</p>
      )}
    </div>
  )
}
