import type { QueryStatus, QueryPriority, QueryType } from '@/types/queries'

export const STATUS_LABELS: Record<QueryStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export const STATUS_OPTIONS: { value: QueryStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
]

export const PRIORITY_LABELS: Record<QueryPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_OPTIONS: { value: QueryPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export const QUERY_TYPE_LABELS: Record<QueryType, string> = {
  issue_fault: 'Issue/Support',
  new_asset_request: 'New Asset Request',
  support_other: 'Support / Other',
}

export const QUERY_TYPE_OPTIONS: { value: QueryType; label: string }[] = [
  { value: 'issue_fault', label: 'Issue/Support' },
  { value: 'new_asset_request', label: 'New Asset Request' },
]
