// Kadra uNick Academy. Kolejność jest celowa i ma regułę:
//
//   1. Nick i Toni — założyciele, zawsze na początku.
//   2. Ci, którzy mają film. Nagranie jest najmocniejszym dowodem, jaki mamy:
//      widać człowieka i słychać, jak mówi, więc idą zaraz po założycielach.
//   3. Ci ze zdjęciem, bez filmu.
//   4. Na końcu ci, którym brakuje i zdjęcia, i filmu.
//
// W obrębie każdej grupy alfabetycznie. Gdy komuś dojdzie zdjęcie albo film,
// przesuwa się w górę — ta sama reguła siedzi w kolumnie `sort_order` w bazie
// (migracja 20260916120000), żeby panel admina i strona pokazywały to samo.
//
// Zdjęcia w trakcie przeprowadzki: część leży już na naszym Supabase (wgrana
// przez panel, z usuniętym tłem), część wciąż wisi na starej stronie
// WordPress. Te drugie znikną razem z nią, więc docelowo wszystkie mają być
// nasze. Tłumaczone pola (role) żyją w dictionaries/{en,pl}.js pod teachers.<id>.

const WP = "https://unickacademy.pl/wp-content/uploads/2024/08";
const STORAGE = "https://xkydfgunafxfuzsggmca.supabase.co/storage/v1/object/public/teacher-photos";

export const teachers = [
  // Założyciele
  { id: "nick", name: "Nick", tone: "blue", photo: `${WP}/Nick.png`, audiences: [] },
  { id: "toni", name: "Toni", tone: "red", photo: "/team/toni.png", audiences: [] },

  // Z filmem
  { id: "bertie", name: "Bertie", tone: "cream", photo: "/team/bertie.png", audiences: [] },
  { id: "gio", name: "Gio", tone: "sand", photo: "https://unickacademy.pl/wp-content/uploads/2024/09/Gio.png", audiences: [] },
  { id: "jack", name: "Jack", tone: "blue", photo: `${WP}/Jack.png`, audiences: [] },
  { id: "shakina", name: "Shakina", tone: "red", photo: `${STORAGE}/09c96b8e-e714-46bc-9a76-6ab46789b66f/photo.png`, audiences: [] },
  { id: "tim", name: "Tim", tone: "cream", photo: `${STORAGE}/e6ac28dd-0fcf-4b24-bedd-a7d0c2403db5/photo.png`, audiences: [] },
  { id: "yan", name: "Yan", tone: "sand", photo: `${STORAGE}/ad4ca664-90b5-4a2c-9de9-0fabd79da03e/photo.png`, audiences: [] },

  // Ze zdjęciem, bez filmu
  { id: "adriana", name: "Adriana", tone: "blue", photo: `${WP}/Adriana.png`, audiences: [] },
  { id: "elliot", name: "Elliott", tone: "red", photo: `${WP}/Elliott.png`, audiences: [] },
  { id: "mada", name: "Mada", tone: "cream", photo: `${WP}/Mada.png`, audiences: [] },

  // Bez zdjęcia i filmu
  { id: "michelle", name: "Michelle", tone: "sand", photo: null, audiences: [] },
  { id: "stefania", name: "Stefania", tone: "blue", photo: null, audiences: [] },
];

export function getTeachers(dict) {
  return teachers.map((teacher) => ({
    ...teacher,
    ...dict.teachers[teacher.id],
  }));
}
