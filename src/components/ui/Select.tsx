import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  error?: string
  placeholder?: string
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function Select({
  label,
  error,
  placeholder = 'Select...',
  options,
  value,
  onValueChange,
  disabled,
  className,
}: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">{label}</label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            'input-field flex items-center justify-between',
            error && 'border-[var(--color-danger)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="bg-white rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-dropdown)] z-50 overflow-hidden"
            position="popper"
            sideOffset={4}
            style={{ maxHeight: '240px' }}
          >
            <RadixSelect.Viewport className="p-1 overflow-y-auto" style={{ maxHeight: '238px' }}>
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center justify-between px-3 py-2 text-sm text-[var(--color-text)] rounded cursor-pointer outline-none hover:bg-[var(--color-bg)] data-[highlighted]:bg-[var(--color-bg)]"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator>
                    <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
