export type UserRole = 'student' | 'teacher' | 'admin' | 'hr'

export type LessonType = 'online' | 'offline'
export type LessonFormat = 'individual' | 'group'
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type StudentStatus = 'active' | 'trial' | 'overdue' | 'paused'
export type TransactionType = 'charge' | 'payment' | 'credit'
export type AttendanceStatus = 'scheduled' | 'present' | 'absent' | 'excused'
export type PaymentStatus = 'paid' | 'overdue' | 'trial' | 'paused'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  avatar_url?: string
  company_id?: string
  created_at: string
}

export interface Company {
  id: string
  name: string
  nip?: string
  address?: string
  is_active: boolean
  deleted_at?: string | null
}

export type B2bStage = 'find' | 'approach' | 'convert' | 'retain' | 'expand'

export interface B2bLead {
  id: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  employees_count?: number
  goal?: string
  stage: B2bStage
  value?: number
  notes?: string
  source?: string
  created_at: string
}

export interface Invoice {
  id: string
  company_id?: string
  student_id?: string
  number: string
  net_amount: number
  vat_amount: number
  gross_amount: number
  period?: string
  status: string
  pdf_url?: string
  issued_at: string
}

export interface Teacher {
  id: string
  profile_id: string
  bio: string
  contact_email?: string
  levels: LanguageLevel[]
  rating: number
  review_count: number
  video_url?: string
  photo_url?: string
  sort_order?: number
  color: string
  is_active: boolean
  hourly_rate?: number
  rate_group?: number
  location?: string
  profile?: Profile
}

export interface Availability {
  id: string
  teacher_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface Student {
  id: string
  profile_id: string
  full_name?: string
  guardian_name?: string
  age?: number
  teacher_id?: string
  level: LanguageLevel
  status: StudentStatus
  referral_code: string
  referred_by?: string
  credit_balance: number
  joined_at: string
  billing_type?: BillingType
  custom_monthly_price?: number
  vat_rate?: number
  nip?: string
  company_name?: string
  company_id?: string
  deleted_at?: string | null
  custom_fields?: Record<string, string>
  age_group?: string
  profile?: Profile
  teacher?: Teacher
}

export interface Lesson {
  id: string
  student_id?: string
  teacher_id: string
  group_id?: string
  group?: Group
  type: LessonType
  format: LessonFormat
  level: LanguageLevel
  topic?: string
  starts_at: string
  ends_at: string
  is_confirmed: boolean
  notes?: string
  attendance?: AttendanceStatus
  homework?: string
  meeting_url?: string
  student?: Student
  teacher?: Teacher
  materials?: LessonMaterial[]
}

export interface LessonMaterial {
  id: string
  lesson_id: string
  title: string
  url: string
  created_at: string
}

export interface Holiday {
  id: string
  name: string
  start_date: string
  end_date: string
}

export type BillingType = 'individual' | 'b2b'

export interface PricingPlan {
  id: string
  name: string
  lessons_per_week: number
  price_per_lesson: number
  is_active: boolean
}

export interface DiscountCode {
  id: string
  code: string
  percent_off?: number
  amount_off?: number
  description?: string
  valid_until?: string
  max_uses?: number
  times_used: number
  is_active: boolean
}

export interface Group {
  id: string
  name: string
  teacher_id?: string
  level: LanguageLevel
  color: string
  is_active: boolean
  capacity?: number
  schedule_text?: string
  description?: string
  age_range?: string
  teacher?: Teacher
  members?: Student[]
}

export interface Transaction {
  id: string
  student_id: string
  type: TransactionType
  amount: number
  description: string
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  code: string
  referrer_credit: number
  referred_discount: number
  created_at: string
  referrer?: Student
  referred?: Student
}

export interface BookingStep {
  step: number
  lessonType?: LessonType
  lessonFormat?: LessonFormat
  teacherId?: string
  slot?: string
  fullName?: string
  email?: string
  phone?: string
  referralCode?: string
}
