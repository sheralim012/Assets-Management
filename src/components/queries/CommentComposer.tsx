import { useState, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'

interface CommentComposerProps {
  onSubmit: (body: string) => Promise<void>
  loading?: boolean
  placeholder?: string
}

export function CommentComposer({ onSubmit, loading = false, placeholder = 'Write a reply...' }: CommentComposerProps) {
  const [body, setBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(async () => {
    const trimmed = body.trim()
    if (!trimmed || loading) return
    await onSubmit(trimmed)
    setBody('')
    textareaRef.current?.focus()
  }, [body, loading, onSubmit])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          maxLength={2000}
          disabled={loading}
          className="
            flex-1 resize-none
            px-3 py-2
            text-sm text-gray-900
            bg-gray-50 border border-gray-200
            rounded-lg
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
            disabled:opacity-50
            transition-shadow duration-200
          "
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || loading}
          title="Send (Ctrl+Enter)"
          className="
            inline-flex items-center justify-center
            w-10 h-10
            rounded-lg
            bg-slate-900 text-white
            hover:bg-slate-800
            disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            transition-colors duration-200
            flex-shrink-0
          "
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Press Ctrl+Enter to send · {body.length}/2000
      </p>
    </div>
  )
}
