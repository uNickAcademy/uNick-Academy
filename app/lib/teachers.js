// Real teacher roster — order matters (Nick first, Toni second).
// photo: filename at unickacademy.pl/wp-content/uploads/2024/08/
// Translated fields (role) live in dictionaries/{en,pl}.js under teachers.<id>.

const PHOTO_BASE = "https://unickacademy.pl/wp-content/uploads/2024/08";

export const teachers = [
  { id: "nick", name: "Nick", tone: "blue", photo: `${PHOTO_BASE}/Nick.png`, audiences: [] },
  { id: "toni", name: "Toni", tone: "red", photo: "/team/toni.png", audiences: [] },
  { id: "adriana", name: "Adriana", tone: "cream", photo: `${PHOTO_BASE}/Adriana.png`, audiences: [] },
  { id: "elliot", name: "Elliot", tone: "sand", photo: `${PHOTO_BASE}/Elliott.png`, audiences: [] },
  { id: "gio", name: "Gio", tone: "blue", photo: `${PHOTO_BASE}/Gio.png`, audiences: [] },
  { id: "jack", name: "Jack", tone: "red", photo: `${PHOTO_BASE}/Jack.png`, audiences: [] },
  { id: "mada", name: "Mada", tone: "cream", photo: `${PHOTO_BASE}/Mada.png`, audiences: [] },
  { id: "tim", name: "Tim", tone: "sand", photo: `${PHOTO_BASE}/Tim.png`, audiences: [] },
  { id: "michelle", name: "Michelle", tone: "blue", photo: null, audiences: [] },
  { id: "stefania", name: "Stefania", tone: "red", photo: null, audiences: [] },
  { id: "yan", name: "Yan", tone: "cream", photo: null, audiences: [] },
  { id: "shakina", name: "Shakina", tone: "sand", photo: null, audiences: [] },
  { id: "bertie", name: "Bertie", tone: "blue", photo: null, audiences: [] },
];

export function getTeachers(dict) {
  return teachers.map((teacher) => ({
    ...teacher,
    ...dict.teachers[teacher.id],
  }));
}
