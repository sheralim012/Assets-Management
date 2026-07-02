import { useState, useEffect } from 'react'
import { ImageIcon, Download, ZoomIn } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useQueryAttachments, getQueryAttachmentUrl } from '@/hooks/useQueryAttachments'

interface QueryAttachmentViewProps {
  queryId: string | null
}

export function QueryAttachmentView({ queryId }: QueryAttachmentViewProps) {
  const { data: attachments } = useQueryAttachments(queryId)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<{ name: string; url: string } | null>(null)

  const images = (attachments ?? []).filter((a) => a.file_type.startsWith('image/'))

  useEffect(() => {
    images.forEach(async (att) => {
      if (signedUrls[att.id]) return
      const url = await getQueryAttachmentUrl(att.storage_path)
      if (url) setSignedUrls((prev) => ({ ...prev, [att.id]: url }))
    })
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  if (images.length === 0) return null

  return (
    <>
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Attachment
        </p>
        <div className="flex flex-wrap gap-2">
          {images.map((att) => {
            const url = signedUrls[att.id]
            return (
              <div
                key={att.id}
                className="relative group rounded-lg border border-[var(--color-border)] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                onClick={() => url && setLightbox({ name: att.file_name, url })}
              >
                {url ? (
                  <img
                    src={url}
                    alt={att.file_name}
                    className="h-32 max-w-[200px] object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300 animate-pulse" />
                  </div>
                )}
                {url && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-[11px] text-gray-600 truncate max-w-[180px]">{att.file_name}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Modal open onClose={() => setLightbox(null)} title={lightbox.name} size="xl">
          <div className="flex flex-col items-center gap-4">
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-w-full max-h-[65vh] object-contain rounded-lg"
            />
            <a
              href={lightbox.url}
              download={lightbox.name}
              className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </Modal>
      )}
    </>
  )
}
