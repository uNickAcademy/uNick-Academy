import { contractDocuments, type ContractSettings } from "./documents";
import { contractGroups } from "./groups";
import type { ContractInvitation, ParticipantData } from "./model";

/** Fictional, visibly marked preview. It never creates a live invitation or a submission. */
export function contractPreview(settings?: ContractSettings) {
  const documents = contractDocuments(settings);
  documents.grantNumber = "PODGLĄD — DANE FIKCYJNE — DO UZUPEŁNIENIA";
  documents.version += " · PODGLĄD";
  documents.lgdNotice ||=
    "https://dolinasamy.pl/nabor-nr-20906adsgrantyefs.html";
  documents.lgdPrivacy ||=
    "PODGLĄD: przed udostępnieniem rodzicom Fundacja uzupełnia pełną informację RODO LGD. Ta strona nie zastępuje właściwej klauzuli.";
  documents.privacy.push(
    "PODGLĄD: brakujące dane projektu, okres archiwizacji oraz informacje o dostawcach wymagają uzupełnienia przed przygotowaniem prawdziwych umów.",
  );
  const group = contractGroups.find((group) => group.id === "G5")!;
  const invitation: ContractInvitation = {
    id: "00000000-0000-4000-8000-000000000000",
    declaration_id: "00000000-0000-4000-8000-000000000001",
    participant_label: "Jan Przykładowy",
    groups: [group],
    first_support: group.firstSupport,
    last_support: "2027-04-30",
    documents,
    created_at: "2026-11-20T12:00:00Z",
    expires_at: "2027-01-01T12:00:00Z",
    revoked_at: null,
  };
  const participant: ParticipantData = {
    participantFirstName: "Jan",
    participantLastName: "Przykładowy",
    ageAtStart: 12,
    sex: "M",
    municipality: "rokietnica",
    town: "Rokietnica",
    signerType: "parent",
    signerFirstName: "Anna",
    signerLastName: "Przykładowa",
    email: "rodzic@example.com",
    phone: "+48 600 000 000",
    accessibilityContact: false,
    participationAccepted: true,
    residenceConfirmed: true,
    privacyAcknowledged: true,
    authorityConfirmed: true,
  };
  return { invitation, participant };
}
