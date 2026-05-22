export type Classification = 'company_allocated' | 'employee_allocated'
export type AssetStatus = 'available' | 'allotted' | 'in_repair' | 'retired'
export type AssetCondition = 'good' | 'fair' | 'poor' | 'dead'
export type WarrantyType = 'manufacturer' | 'vendor' | 'none'
export type RetirementReason = 'end_of_life' | 'beyond_repair' | 'replaced' | 'stolen' | 'lost'
export type PTAStatus = 'pta_approved' | 'non_pta' | 'unknown'
export type RepairStatus = 'open' | 'completed' | 'vendor_unresponsive'
export type DamageCause = 'normal_wear' | 'user_damage' | 'power_event' | 'environmental' | 'unknown'
export type UserRole = 'admin' | 'manager' | 'finance' | 'employee'
export type EngagementType = 'permanent' | 'contract' | 'intern'
export type AuditAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'returned'
  | 'repair_opened'
  | 'repair_closed'
  | 'retired'

export type AssetType =
  | 'laptop'
  | 'mobile'
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'webcam'
  | 'hub'
  | 'bag'
  | 'chair'
  | 'desk'
  | 'projector'
  | 'speaker'
  | 'camera'
  | 'ups'
  | 'whiteboard'
  | 'hdd'
  | 'other'

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: UserRole
  designation: string | null
  department: string | null
  engagement_type: EngagementType
  engagement_end_date: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at?: string | null
  manually_created?: boolean
}

export interface Asset {
  id: string
  asset_tag: string
  classification: Classification
  asset_type: AssetType
  manufacturer: string
  price_pkr: number
  vendor_name: string
  vendor_phone: string
  invoice_number: string
  purchase_date: string | null
  warranty_expiry?: string | null
  warranty_type?: WarrantyType
  specs: string
  serial_number: string | null
  pta_status: PTAStatus | null
  allotted_user_id: string | null
  allotted_user_name?: string | null
  location: string | null
  status: AssetStatus
  retirement_reason: RetirementReason | null
  condition?: AssetCondition
  notes?: string | null
  created_by: string
  created_at: string
  updated_at: string
  allotted_user?: Pick<Profile, 'id' | 'name' | 'email' | 'avatar_url'>
}

export interface RepairRecord {
  id: string
  asset_id: string
  fault_description: string
  repair_vendor_name: string
  repair_vendor_phone: string
  date_sent: string
  expected_return_date: string
  actual_return_date: string | null
  estimated_cost_pkr: number | null
  final_cost_pkr: number | null
  damage_cause: DamageCause
  warranty_claim: boolean
  warranty_claim_ref: string | null
  insurance_claim: boolean
  status: RepairStatus
  resolved_status: 'available' | 'allotted' | 'retired' | null
  original_user_id?: string | null
  created_by: string
  created_at: string
  completed_at: string | null
  asset?: Pick<Asset, 'id' | 'asset_tag' | 'asset_type' | 'specs' | 'allotted_user_id' | 'classification'>
}

export interface AuditLog {
  id: string
  asset_id: string
  action: AuditAction
  actor_id: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  created_at: string
  actor?: Pick<Profile, 'name' | 'email'>
}

export interface AssetFile {
  id: string
  asset_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface ConsumableItem {
  id: string
  sku: string
  name: string
  compatible_model: string | null
  current_stock: number
  min_stock: number
  unit_cost_pkr: number
  storage_location: string
  vendor_name: string
  vendor_phone: string
  last_restocked_at: string | null
  last_restocked_by: string | null
}
