// Editable roster of teachers. Add, remove or reorder freely.
// Translated fields (country, role, quote) live in
// app/lib/dictionaries/{en,pl}.js under teachers.<key>.

export const teachers = [
  { id: "nick", name: "Nick", tone: "blue", audiences: [] },
  { id: "milena", name: "Milena", tone: "red", audiences: [] },
  { id: "amara", name: "Amara", tone: "cream", audiences: ["teen", "adult"] },
  { id: "diego", name: "Diego", tone: "sand", audiences: ["adult", "company"] },
  { id: "hana", name: "Hana", tone: "blue", audiences: ["children"] },
  { id: "tomasz", name: "Tomasz", tone: "red", audiences: ["teen"] },
];

export function getTeachers(dict) {
  return teachers.map((teacher) => ({
    ...teacher,
    ...dict.teachers[teacher.id],
  }));
}
