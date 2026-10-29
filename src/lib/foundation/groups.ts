import {activityOptions} from './options'
import {projectSchedule} from './schedule'

export type FoundationGroupSelection = {
  id: string
  activity: string
  municipality: string
  label: string
}

export const foundationGroupOptions = projectSchedule.flatMap(location =>
  location.courses.map(course => {
    const activity = activityOptions.find(item => item.value === course.activity)!
    const id = `${location.municipality}:${course.activity}`
    const label = `${course.title} — ${location.name}, ${location.day.toLocaleLowerCase('pl-PL')}${course.time ? `, ${course.time}` : ', godzina do potwierdzenia'}`
    return {
      id,
      activity: course.activity,
      municipality: location.municipality,
      title: course.title,
      age: `${activity.minAge}–${activity.maxAge} lat`,
      minAge: activity.minAge,
      maxAge: activity.maxAge,
      time: course.time,
      label,
      selection: {
        id,
        activity: course.activity,
        municipality: location.municipality,
        // Preserve the offered day, time and address even if the timetable changes.
        label: [label, `${activity.minAge}–${activity.maxAge} lat`, location.venue, location.address].filter(Boolean).join(' · '),
      } satisfies FoundationGroupSelection,
    }
  }),
)

export function groupsForParticipant(age: number) {
  return foundationGroupOptions.filter(group => age >= group.minAge && age <= group.maxAge)
}
