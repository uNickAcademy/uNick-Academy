// Typy biznesowe uFOS

export type EntityType = 'sp_zoo' | 'fundacja'

export type UserRole =
  | 'owner_cfo'
  | 'accounting_ops'
  | 'payroll_operator'
  | 'external_accountant'
  | 'tax_advisor'
  | 'read_only'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner_cfo:            'CFO / Właściciel',
  accounting_ops:       'Obsługa Księgowa',
  payroll_operator:     'Kadry i Płace',
  external_accountant:  'Zewnętrzna Księgowa',
  tax_advisor:          'Doradca Podatkowy',
  read_only:            'Tylko Odczyt',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner_cfo:            ['*'],
  accounting_ops:       ['documents:*', 'invoices:*', 'lessons:view', 'tasks:*', 'month_close:prepare'],
  payroll_operator:     ['hr:*', 'payroll:prepare', 'documents:view'],
  external_accountant:  ['reports:view', 'month_close:view', 'advisor_questions:respond'],
  tax_advisor:          ['tax_items:view', 'advisor_questions:respond', 'ai_recommendations:view'],
  read_only:            ['reports:view'],
}

export interface Entity {
  id: string
  name: string
  short_name: string
  type: EntityType
  nip: string | null
  krs: string | null
  regon: string | null
  address: {
    street?: string
    city?: string
    postal_code?: string
    country?: string
  } | null
  color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface UfosUser {
  id: string
  email: string
  full_name: string
  role_label: string | null
  active: boolean
  created_at: string
}

export interface UserEntityRole {
  id: string
  user_id: string
  entity_id: string | null
  role: UserRole
  granted_by: string | null
  granted_at: string
}

export interface AuditLogEntry {
  id: string
  entity_id: string | null
  user_id: string
  table_name: string
  record_id: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_fields: string[] | null
  reason: string | null
  created_at: string
}

// Statusy dokumentów
export type DocumentStatus =
  | 'new'
  | 'ai_extracted'
  | 'needs_review'
  | 'missing_data'
  | 'ready_for_posting'
  | 'posted'
  | 'paid'
  | 'problem'
  | 'archived'

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  new:               'Nowy',
  ai_extracted:      'Wyodrębniony AI',
  needs_review:      'Do sprawdzenia',
  missing_data:      'Brakujące dane',
  ready_for_posting: 'Gotowy do księgowania',
  posted:            'Zaksięgowany',
  paid:              'Opłacony',
  problem:           'Problem',
  archived:          'Zarchiwizowany',
}

// Statusy importu
export type ImportBatchStatus =
  | 'pending'
  | 'validating'
  | 'staged'
  | 'approved'
  | 'imported'
  | 'failed'
  | 'rejected'

export const IMPORT_STATUS_LABELS: Record<ImportBatchStatus, string> = {
  pending:    'Oczekuje',
  validating: 'Walidacja',
  staged:     'Gotowy do przeglądu',
  approved:   'Zatwierdzony',
  imported:   'Zaimportowany',
  failed:     'Błąd',
  rejected:   'Odrzucony',
}

// Statusy lekcji
export type LessonStatus = 'completed' | 'cancelled' | 'makeup' | 'pending'

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  completed: 'Zrealizowana',
  cancelled: 'Odwołana',
  makeup:    'Odrobiona',
  pending:   'Zaplanowana',
}

// Statusy płatności
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue'

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid:    'Opłacone',
  unpaid:  'Nieopłacone',
  partial: 'Częściowo',
  overdue: 'Zaległe',
}

// Kolory statusów
export const STATUS_COLORS: Record<string, string> = {
  // Płatności
  paid:    'green',
  unpaid:  'amber',
  partial: 'amber',
  overdue: 'red',
  // Lekcje
  completed: 'green',
  cancelled: 'red',
  makeup:    'amber',
  pending:   'subtle',
  // Import
  imported:   'green',
  approved:   'green',
  staged:     'amber',
  validating: 'amber',
  failed:     'red',
  rejected:   'red',
}
