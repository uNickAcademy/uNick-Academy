import type { UserRole } from "@/types/domain"

type Resource =
  | 'documents'
  | 'invoices'
  | 'payroll'
  | 'month_close'
  | 'ai_recommendations'
  | 'audit_log'
  | 'hr'
  | 'tax_items'
  | 'settings'
  | 'entities'
  | 'import'
  | 'lessons'
  | 'tasks'
  | 'advisor_questions'
  | 'reports'

type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'prepare' | 'respond'

const PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  owner_cfo: {
    documents:         ['view', 'create', 'edit', 'delete', 'approve'],
    invoices:          ['view', 'create', 'edit', 'delete', 'approve'],
    payroll:           ['view', 'prepare', 'approve'],
    month_close:       ['view', 'prepare', 'approve'],
    ai_recommendations:['view', 'approve'],
    audit_log:         ['view'],
    hr:                ['view', 'create', 'edit'],
    tax_items:         ['view'],
    settings:          ['view', 'edit'],
    entities:          ['view', 'edit'],
    import:            ['view', 'create', 'approve'],
    lessons:           ['view'],
    tasks:             ['view', 'create', 'edit', 'approve'],
    advisor_questions: ['view', 'create', 'respond'],
    reports:           ['view'],
  },
  accounting_ops: {
    documents:         ['view', 'create', 'edit', 'approve'],
    invoices:          ['view', 'create', 'edit'],
    payroll:           ['view', 'prepare'],
    month_close:       ['view', 'prepare'],
    ai_recommendations:['view'],
    hr:                ['view'],
    tax_items:         ['view'],
    import:            ['view', 'create'],
    lessons:           ['view'],
    tasks:             ['view', 'create', 'edit'],
    advisor_questions: ['view', 'create'],
    reports:           ['view'],
  },
  payroll_operator: {
    documents:         ['view', 'create'],
    payroll:           ['view', 'prepare'],
    hr:                ['view', 'create', 'edit'],
    tasks:             ['view', 'create'],
    reports:           ['view'],
  },
  external_accountant: {
    month_close:       ['view'],
    advisor_questions: ['view', 'respond'],
    reports:           ['view'],
  },
  tax_advisor: {
    tax_items:         ['view'],
    ai_recommendations:['view'],
    advisor_questions: ['view', 'respond'],
    reports:           ['view'],
  },
  read_only: {
    reports: ['view'],
  },
}

export function can(
  role: UserRole | null,
  resource: Resource,
  action: Action
): boolean {
  if (!role) return false
  const allowed = PERMISSIONS[role]?.[resource] ?? []
  return allowed.includes(action)
}
