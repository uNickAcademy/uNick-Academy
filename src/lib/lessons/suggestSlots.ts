import { createClient } from '@/lib/supabase/client'

export type SuggestedSlot = { start: Date; end: Date }

// nasz day_of_week: 0 = poniedziałek ... 6 = niedziela
function jsToDow(d: Date) {
  return (d.getDay() + 6) % 7
}

/** Wolne terminy nauczyciela w najbliższych dniach, na podstawie jego
 * dostępności (`availability`) i już zajętych godzin (`teacher_busy_slots`). */
export async function suggestTeacherSlots(teacherId: string, durationMin = 60, daysAhead = 14, max = 6): Promise<SuggestedSlot[]> {
  const supabase = createClient()
  const from = new Date()
  const to = new Date(Date.now() + daysAhead * 86400000)

  const [availRes, busyRes] = await Promise.all([
    supabase.from('availability').select('day_of_week, start_time, end_time').eq('teacher_id', teacherId),
    supabase.rpc('teacher_busy_slots', { p_teacher: teacherId, p_from: from.toISOString(), p_to: to.toISOString() }),
  ])

  const availability = availRes.data ?? []
  const busy: { start: number; end: number }[] = (busyRes.data ?? []).map((b: { starts_at: string; ends_at: string }) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }))

  const found: SuggestedSlot[] = []
  for (let dayOffset = 0; dayOffset < daysAhead && found.length < max; dayOffset++) {
    const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + dayOffset)
    const dow = jsToDow(day)
    const windows = availability.filter((a) => a.day_of_week === dow)
    for (const w of windows) {
      const startHour = parseInt(w.start_time.split(':')[0], 10)
      const endHour = parseInt(w.end_time.split(':')[0], 10)
      for (let h = startHour; h < endHour && found.length < max; h++) {
        const s = new Date(day); s.setHours(h, 0, 0, 0)
        const e = new Date(s.getTime() + durationMin * 60000)
        if (s.getTime() < Date.now()) continue
        const clashes = busy.some((b) => s.getTime() < b.end && e.getTime() > b.start)
        if (clashes) continue
        if (found.some((f) => f.start.getTime() === s.getTime())) continue
        found.push({ start: s, end: e })
      }
    }
  }
  return found
}
