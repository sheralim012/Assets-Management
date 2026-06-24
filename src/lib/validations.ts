import { z } from 'zod'

export const assetSchema = z
  .object({
    asset_tag: z.string().min(1, 'Asset tag is required'),
    classification: z.enum(['company_allocated', 'employee_allocated']),
    asset_type: z.string().min(1, 'Asset type is required'),
    manufacturer: z.string().optional(),
    price_pkr: z.number().min(0, 'Price must be ≥ 0'),
    vendor_name: z.string(),
    vendor_phone: z.string(),
    invoice_number: z.string(),
    purchase_date: z.string().nullable().optional(),
    specs: z.string().optional(),
    serial_number: z.string().nullable().optional(),
    pta_status: z.enum(['pta_approved', 'non_pta', 'unknown']).nullable().optional(),
    allotted_user_id: z.string().uuid().nullable().optional(),
    location: z.string().nullable().optional(),
    status: z.enum(['available', 'allotted', 'in_repair', 'retired']),
    retirement_reason: z.enum(['end_of_life', 'beyond_repair', 'replaced', 'stolen', 'lost', 'sold']).nullable().optional(),
    sale_price: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.retirement_reason === 'sold' && (data.sale_price == null || data.sale_price <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sale price is required and must be greater than 0', path: ['sale_price'] })
    }
    if (data.classification === 'employee_allocated' && !data.manufacturer) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Manufacturer is required', path: ['manufacturer'] })
    }
    if (data.classification === 'employee_allocated' && !data.specs) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Specs/description is required', path: ['specs'] })
    }
    if (data.asset_type === 'mobile' && !data.pta_status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PTA Status is required for mobile assets', path: ['pta_status'] })
    }
    if (data.classification === 'employee_allocated' && data.status === 'allotted' && !data.allotted_user_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Allotted user is required when status is allotted', path: ['allotted_user_id'] })
    }
    if (data.status === 'retired' && !data.retirement_reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Retirement reason is required when retiring an asset', path: ['retirement_reason'] })
    }
    if (data.classification === 'company_allocated' && data.status === 'allotted' && !data.location) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Location is required when status is allotted', path: ['location'] })
    }
  })

export type AssetFormValues = z.infer<typeof assetSchema>

export const repairSchema = z
  .object({
    fault_description: z.string().min(1, 'Fault description is required'),
    repair_vendor_name: z.string().min(1, 'Vendor name is required'),
    repair_vendor_phone: z.string().min(1, 'Vendor phone is required'),
    date_sent: z.string().min(1, 'Date sent is required'),
    expected_return_date: z.string().min(1, 'Expected return date is required'),
    estimated_cost_pkr: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.expected_return_date) < new Date(data.date_sent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expected return date must be on or after date sent',
        path: ['expected_return_date'],
      })
    }
  })

export type RepairFormValues = z.infer<typeof repairSchema>

export const completeRepairSchema = z
  .object({
    final_cost_pkr: z.number().nullable().optional(),
    resolved_status: z.enum(['available', 'allotted', 'retired']),
    allotted_user_id: z.string().uuid().nullable().optional(),
    retirement_notes: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.resolved_status === 'allotted' && !data.allotted_user_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'User is required when allotting', path: ['allotted_user_id'] })
    }
    if (data.resolved_status === 'retired' && (!data.retirement_notes || data.retirement_notes.trim().length < 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reason must be at least 10 characters', path: ['retirement_notes'] })
    }
  })

export type CompleteRepairFormValues = z.infer<typeof completeRepairSchema>
