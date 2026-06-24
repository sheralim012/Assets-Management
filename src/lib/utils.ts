import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatPKR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  // Pakistani number format: 1,23,456
  const str = Math.round(amount).toString()
  if (str.length <= 3) return `PKR ${str}`
  const last3 = str.slice(-3)
  const rest = str.slice(0, -3)
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `PKR ${formatted},${last3}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), "dd MMM yyyy 'at' h:mm a")
  } catch {
    return dateStr
  }
}

export function daysAgo(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatAssetTag(value: string): string {
  return value.toUpperCase().replace(/\s+/g, '-')
}
