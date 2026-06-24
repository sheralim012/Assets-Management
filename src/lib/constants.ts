export const ASSET_TYPE_LABELS: Record<string, string> = {
  laptop: 'Laptop',
  mobile: 'Mobile',
  monitor: 'LED Monitor',
  mouse: 'Mouse',
  keyboard: 'Keyboard',
  webcam: 'Webcam',
  hub: 'USB Hub / Dock',
  bag: 'Laptop Bag',
  chair: 'Chair',
  desk: 'Desk / Table',
  projector: 'Projector',
  speaker: 'Conference Speaker',
  camera: 'Conference Camera',
  ups: 'UPS',
  whiteboard: 'Whiteboard',
  hdd: 'External HDD/SSD',
  other: 'Other',
}

export const ASSET_TAG_PREFIXES: Record<string, string> = {
  laptop: 'LT',
  mobile: 'MP',
  monitor: 'CLED',
  mouse: 'MSE',
  keyboard: 'KBD',
  webcam: 'WBC',
  hub: 'HUB',
  bag: 'BAG',
  chair: 'CHR',
  desk: 'DSK',
  projector: 'PRJ',
  speaker: 'JBR',
  camera: 'CAM',
  ups: 'UPS',
  whiteboard: 'WBD',
  hdd: 'EHD',
  other: 'OTH',
}

export const EMPLOYEE_ONLY_TYPES = [
  'laptop', 'mobile', 'monitor', 'mouse', 'keyboard', 'webcam', 'hub', 'bag', 'hdd',
]
export const COMPANY_ONLY_TYPES = [
  'chair', 'desk', 'projector', 'speaker', 'camera', 'ups', 'whiteboard',
]
export const MOBILE_ONLY_TYPES = ['mobile']

export const ALLOWED_EMAIL_DOMAIN =
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'cogentlabs.co'

export const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'allotted', label: 'Allotted' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'retired', label: 'Retired' },
]

export const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'dead', label: 'Dead' },
]

export const WARRANTY_TYPE_OPTIONS = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'none', label: 'None' },
]

export const PTA_STATUS_OPTIONS = [
  { value: 'pta_approved', label: 'PTA Approved' },
  { value: 'non_pta', label: 'Non-PTA' },
  { value: 'unknown', label: 'Unknown' },
]

export const DAMAGE_CAUSE_OPTIONS = [
  { value: 'normal_wear', label: 'Normal Wear' },
  { value: 'user_damage', label: 'User Damage' },
  { value: 'power_event', label: 'Power Event' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'unknown', label: 'Unknown' },
]

export const RETIREMENT_REASON_OPTIONS = [
  { value: 'end_of_life', label: 'End of Life' },
  { value: 'beyond_repair', label: 'Beyond Repair' },
  { value: 'replaced', label: 'Replaced' },
  { value: 'stolen', label: 'Stolen' },
  { value: 'lost', label: 'Lost' },
  { value: 'sold', label: 'Sold' },
]

export const ENGAGEMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]

export const EMPLOYEE_ASSET_TYPES = [
  'laptop', 'mobile', 'monitor', 'mouse', 'keyboard', 'webcam', 'hub', 'bag', 'hdd', 'other',
]

export const COMPANY_ASSET_TYPES = [
  'chair', 'desk', 'projector', 'speaker', 'camera', 'ups', 'whiteboard', 'other',
]
