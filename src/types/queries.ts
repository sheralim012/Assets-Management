export type QueryType = 'issue_fault' | 'new_asset_request' | 'support_other'
export type QueryStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected'
export type QueryPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotificationType = 'new_query' | 'new_comment' | 'status_changed'

export interface AssetQuery {
  id: string
  employee_id: string
  employee?: { id: string; name: string; email: string; avatar_url: string | null }
  query_type: QueryType
  asset_id: string | null
  asset?: { id: string; asset_tag: string; manufacturer: string; specs: string } | null
  requested_category_slug: string | null
  title: string
  description: string
  priority: QueryPriority
  status: QueryStatus
  created_at: string
  updated_at: string
  query_comments?: { author_id: string; is_system_message: boolean }[]
}

export interface QueryComment {
  id: string
  query_id: string
  author_id: string
  author?: { id: string; name: string; email: string; role: string; avatar_url: string | null }
  body: string
  is_system_message: boolean
  created_at: string
}

export interface QueryNotification {
  id: string
  recipient_id: string
  query_id: string
  notification_type: NotificationType
  payload: Record<string, string> | null
  read_at: string | null
  created_at: string
  query?: { title: string; employee?: { name: string } } | null
}

export interface QueryActivityLog {
  id: string
  query_id: string
  actor_id: string | null
  action: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  created_at: string
}

export interface QueryFilters {
  status?: QueryStatus
  priority?: QueryPriority
  query_type?: QueryType
  search?: string
  employee_id?: string
  date?: string
}
