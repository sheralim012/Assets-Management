const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: 'In Repair', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  vendor_unresponsive: { label: 'Unresponsive', className: 'bg-red-100 text-red-700' },
}

export function RepairStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
