import { projectSchedule } from "../schedule";
import type { ContractGroup } from "./model";

/** Post-recruitment groups are separate from the original declaration choices. */
const locations = Object.fromEntries(
  projectSchedule.map((location) => [location.municipality, location]),
);
function group(
  id: string,
  title: string,
  municipality: string,
  schedule: string,
  minAge: number,
  maxAge: number,
  firstSupport: string,
): ContractGroup & { firstSupport: string; label: string } {
  const place = locations[municipality];
  const address = [place.venue, place.address].filter(Boolean).join(", ");
  return {
    id,
    title,
    location: place.name,
    schedule: `${schedule} · ${address}`,
    minAge,
    maxAge,
    firstSupport,
    label: `${id} · ${title} — ${place.name}, ${schedule}`,
  };
}
export const contractGroups = [
  group(
    "G1",
    "Teenpreneurs",
    "tarnowo_podgorne",
    "Środa 16:30–17:30",
    13,
    18,
    "2026-12-02",
  ),
  group(
    "G2",
    "Art & Creative — młodsi",
    "tarnowo_podgorne",
    "Środa 17:40–19:40",
    10,
    16,
    "2026-12-02",
  ),
  group(
    "G9",
    "Art & Creative — starsi",
    "tarnowo_podgorne",
    "Środa 17:40–19:40",
    10,
    16,
    "2026-12-02",
  ),
  group(
    "G3",
    "Teenage Talk",
    "kazmierz",
    "Wtorek 16:30–17:30",
    13,
    18,
    "2026-12-01",
  ),
  group(
    "G4",
    "Podcasts",
    "kazmierz",
    "Wtorek 17:30–19:30",
    10,
    16,
    "2026-12-01",
  ),
  group(
    "G5",
    "Podcasts",
    "rokietnica",
    "Czwartek 16:30–17:30",
    10,
    16,
    "2026-12-03",
  ),
  group(
    "G6",
    "Teenage Talk",
    "rokietnica",
    "Czwartek 17:30–18:30",
    13,
    18,
    "2026-12-03",
  ),
  group(
    "G7",
    "Teenpreneurs",
    "tarnowo_podgorne",
    "Czwartek 17:30–18:30",
    13,
    18,
    "2026-12-03",
  ),
  group(
    "G8",
    "Podcasts",
    "tarnowo_podgorne",
    "Czwartek 16:30–17:30",
    10,
    16,
    "2026-12-03",
  ),
];
