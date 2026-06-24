import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Archive } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useChangeAssetStatus } from '@/hooks/useAssets'
import { RETIREMENT_REASON_OPTIONS } from '@/lib/constants'
import type { Asset } from '@/types'

interface RetireAssetModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
}

interface FormValues {
  retirement_reason: string
  sale_price?: number | null
}

export function RetireAssetModal({ open, onClose, asset }: RetireAssetModalProps) {
  const changeStatus = useChangeAssetStatus()
  const { control, register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>()
  const reason = watch('retirement_reason')

  async function onSubmit(values: FormValues) {
    if (values.retirement_reason === 'sold') {
      const price = Number(values.sale_price)
      if (!price || price <= 0) {
        toast.error('Sale price is required and must be greater than 0')
        return
      }
    }
    const salePrice =
      values.retirement_reason === 'sold' ? parseFloat(String(values.sale_price)) || null : null
    const extra = {
      retirement_reason: values.retirement_reason as Asset['retirement_reason'],
      sale_price: salePrice,
    }
    console.log('[RetireAsset] PATCH payload', { id: asset.id, status: 'retired', ...extra })
    try {
      await changeStatus.mutateAsync({
        id: asset.id,
        newStatus: 'retired',
        before: asset,
        extra,
      })
      toast.success('Asset retired')
      reset()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to retire asset')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Retire Asset"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <button
            type="button"
            disabled={changeStatus.isPending}
            onClick={handleSubmit(onSubmit)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            {changeStatus.isPending ? 'Retiring…' : 'Retire Asset'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Retiring <span className="font-mono">{asset.asset_tag}</span>
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Retired assets are kept in the system for audit history but are removed from
              active inventory and cannot be reassigned. To remove the asset entirely, use
              <span className="font-semibold"> Delete</span> instead.
            </p>
          </div>
        </div>

        <Controller
          name="retirement_reason"
          control={control}
          rules={{ required: 'Please select a reason' }}
          render={({ field }) => (
            <Select
              label="Reason for retirement *"
              options={RETIREMENT_REASON_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.retirement_reason?.message}
              placeholder="Select a reason..."
            />
          )}
        />

        {reason === 'sold' && (
          <Input
            label="Sale Price (PKR) *"
            type="number"
            min={1}
            step="0.01"
            {...register('sale_price', {
              required: 'Sale price is required',
              valueAsNumber: true,
              min: { value: 1, message: 'Sale price must be greater than 0' },
            })}
            error={errors.sale_price?.message}
          />
        )}
      </div>
    </Modal>
  )
}
