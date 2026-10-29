import type {activityOptions, Municipality} from './options'

type Activity = typeof activityOptions[number]['value']

type ProjectLocation = {
  municipality: Municipality
  name: string
  day: string
  venue: string | null
  address: string | null
  courses: readonly {activity: Activity; title: string; time: string | null}[]
}

/** Shared by the public timetable and the registration course descriptions. */
export const projectSchedule: readonly ProjectLocation[] = [
  {
    municipality: 'tarnowo_podgorne',
    name: 'Tarnowo Podgórne',
    day: 'Środy',
    venue: 'CDIO — Centrum Demokracji i Integracji Obywatelskiej',
    address: 'ul. Poznańska 99, 62-080 Tarnowo Podgórne',
    courses: [
      {activity: 'teenpreneurs', title: 'Teenpreneurs', time: '16:30'},
      {activity: 'art_performance_9_13', title: 'Art & Creative Performance', time: '17:40'},
    ],
  },
  {
    municipality: 'kazmierz',
    name: 'Kaźmierz',
    day: 'Wtorki',
    venue: 'Biblioteka Publiczna i Centrum Kultury w Kaźmierzu',
    address: 'ul. Nowowiejska 15, 64-530 Kaźmierz',
    courses: [
      {activity: 'teenage_talk', title: 'Teenage Talk', time: '16:30'},
      {activity: 'podcasts_audio_video', title: 'Podcasts', time: '17:30'},
    ],
  },
  {
    municipality: 'rokietnica',
    name: 'Rokietnica',
    day: 'Czwartki',
    venue: 'Sala OSP',
    address: 'ul. Szkolna 18B, 62-090 Rokietnica',
    courses: [
      {activity: 'podcasts_audio_video', title: 'Podcasts', time: '16:30'},
      {activity: 'teenage_talk', title: 'Teenage Talk', time: '17:30'},
    ],
  },
  {
    municipality: 'szamotuly',
    name: 'Szamotuły',
    day: 'Poniedziałki po południu',
    venue: null,
    address: null,
    courses: [
      {activity: 'podcasts_audio_video', title: 'Podcasts', time: null},
      {activity: 'teenage_talk', title: 'Teenage Talk', time: null},
    ],
  },
]

export function courseScheduleDescription(municipality: string, activity: string) {
  const location = projectSchedule.find(item => item.municipality === municipality)
  const course = location?.courses.find(item => item.activity === activity)
  if (!location || !course) return null
  if (!course.time || !location.venue || !location.address) {
    return `${location.day}. Godziny i adres podamy po potwierdzeniu sali.`
  }
  return `${location.day}, godz. ${course.time}. ${location.venue}, ${location.address}.`
}
