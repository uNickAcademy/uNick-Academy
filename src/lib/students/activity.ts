// Kto jest aktywnym uczniem — jedna definicja dla całego systemu.
//
// Aktywny uczeń to uczeń z aktualnie przypisanymi zajęciami: ma zaplanowaną
// nieodwołaną lekcję albo należy do kursu, który jeszcze się nie skończył.
// Kolumna `students.status` jest tylko zapisem tej decyzji — bywa nieaktualna
// (ustawiona przy imporcie, po rezygnacji, przez windykację), więc nigdzie nie
// liczymy „aktywnych" z samego statusu. Właśnie takie liczenie kazało systemowi
// wystawić rachunki 93 osobom, które nie miały ani jednej lekcji.

type GroupTerm = { start_date?: string | null; end_date?: string | null; is_active?: boolean }

export type ActivityInput = {
  lessons: { student_id: string | null; starts_at: string; cancelled_at?: string | null }[]
  groupMembers: { student_id: string; group?: GroupTerm | GroupTerm[] | null }[]
}

/** Identyfikatory uczniów, którzy mają teraz przypisane zajęcia. */
export function activeStudentIds(input: ActivityInput, now: Date = new Date()): Set<string> {
  const active = new Set<string>()
  const nowIso = now.toISOString()
  const today = nowIso.slice(0, 10)

  for (const l of input.lessons) {
    if (!l.student_id || l.cancelled_at) continue
    if (l.starts_at >= nowIso) active.add(l.student_id)
  }

  for (const m of input.groupMembers) {
    const g = Array.isArray(m.group) ? m.group[0] : m.group
    if (!g) continue
    // Kurs trwający = już wystartował i jeszcze się nie skończył. Zapisany na
    // wrześniowy kurs w sierpniu ma miejsce zarezerwowane, ale zajęć jeszcze
    // nie ma — tak samo jak nie ma za nie rachunku (patrz lib/billing/engine).
    const started = !g.start_date || g.start_date <= today
    const notFinished = !g.end_date || g.end_date >= today
    if (g.is_active !== false && started && notFinished) active.add(m.student_id)
  }

  return active
}
