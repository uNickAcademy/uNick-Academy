import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { appendLgdForm } from "./lgd-pdf";
import { municipalityOptions } from "../options";
import type { ContractInvitation, ParticipantData } from "./model";

export function contractNumber(invite: Pick<ContractInvitation, "id">) {
  return `KP/${invite.id}`;
}
let assets: Promise<Buffer[]> | undefined;
function loadAssets() {
  return (assets ??= Promise.all(
    ["NotoSans-Regular.ttf", "belka.png", "lgd.png"].map((file) =>
      readFile(path.join(process.cwd(), "assets/foundation-contract", file)),
    ),
  ));
}
export async function generateContractPdf(
  data: ParticipantData,
  invite: ContractInvitation,
  generatedAt: string,
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [fontBytes, fundingBytes, lgdBytes] = await loadAssets();
  const font = await doc.embedFont(fontBytes, { subset: true });
  const funding = await doc.embedPng(fundingBytes),
    lgd = await doc.embedPng(lgdBytes);
  let page: PDFPage,
    y = 0;
  const left = 44,
    right = 551,
    width = right - left;
  const ink = rgb(0.15, 0.23, 0.2);
  const newPage = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 723;
    page.drawImage(funding, {
      x: 44,
      y: 775,
      width: 507,
      height: (507 * funding.height) / funding.width,
    });
    page.drawImage(lgd, {
      x: 492,
      y: 742,
      width: 59,
      height: (59 * lgd.height) / lgd.width,
    });
    page.drawText(`Kreatorzy Przyszłości | ${invite.documents.version}`, {
      x: left,
      y: 25,
      size: 7,
      font,
      color: ink,
    });
    page.drawText(`Strona ${doc.getPageCount()}`, {
      x: 505,
      y: 25,
      size: 7,
      font,
      color: ink,
    });
  };
  newPage();
  function wrap(value: string, size: number, face: PDFFont) {
    const lines: string[] = [];
    let line = "";
    for (const word of value.replace(/[\r\n\t\x00-\x1f]/g, " ").split(/\s+/)) {
      if (face.widthOfTextAtSize(word, size) > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let fragment = "";
        for (const char of word) {
          if (face.widthOfTextAtSize(fragment + char, size) > width) {
            lines.push(fragment);
            fragment = "";
          }
          fragment += char;
        }
        line = fragment;
      } else if (
        face.widthOfTextAtSize(line ? line + " " + word : word, size) > width
      ) {
        lines.push(line);
        line = word;
      } else line = line ? line + " " + word : word;
    }
    if (line) lines.push(line);
    return lines;
  }
  function text(value: string, size = 10, after = 9) {
    const lines = wrap(value, size, font);
    const paragraphHeight = lines.length * size * 1.48 + after;
    if (y - paragraphHeight < 64 && paragraphHeight < 650) newPage();
    for (const line of lines) {
      if (y < 64) newPage();
      page.drawText(line, { x: left, y, size, font, color: ink });
      y -= size * 1.48;
    }
    y -= after;
  }
  function heading(value: string) {
    if (y < 125) newPage();
    text(value, 15, 11);
  }
  function signatures() {
    if (y < 150) newPage();
    y -= 38;
    page.drawText("................................................", {
      x: left,
      y,
      font,
      size: 10,
    });
    page.drawText("................................................", {
      x: 315,
      y,
      font,
      size: 10,
    });
    y -= 18;
    text("Data i podpis uczestnika pełnoletniego / rodzica / opiekuna", 8, 2);
    page.drawText("Data i podpis przedstawiciela Fundacji", {
      x: 315,
      y: y + 14,
      font,
      size: 8,
    });
    y -= 12;
  }
  heading(
    invite.documents.draft
      ? "Umowa uczestnictwa — do uzupełnienia"
      : "Umowa uczestnictwa",
  );
  text(`Numer: ${contractNumber(invite)}`, 9);
  text(
    `${invite.documents.project} | nr grantu: ${invite.documents.grantNumber}`,
  );
  text(`Projekt LGD: ${invite.documents.projectNumber}`, 9);
  text(
    `Organizator: ${invite.documents.organizer}, ${invite.documents.address}, reprezentowana przez: ${invite.documents.representative}. Kontakt: ${invite.documents.contact}.`,
  );
  text(
    `Uczestnik wstępnie zakwalifikowany: ${data.participantFirstName} ${data.participantLastName}, ${data.ageAtStart} lat w dniu rozpoczęcia udziału. Gmina: ${municipalityOptions.find((m) => m.value === data.municipality)?.label}; miejscowość: ${data.town}.`,
  );
  text(
    `Osoba podpisująca: ${data.signerFirstName} ${data.signerLastName} (${data.signerType === "adult" ? "pełnoletni uczestnik" : data.signerType === "parent" ? "rodzic" : "opiekun prawny"}). Telefon: ${data.phone}; e-mail: ${data.email}.`,
  );
  text(
    `Okres udziału: ${invite.first_support} – ${invite.last_support}. Pierwsze wsparcie: ${invite.first_support}.`,
  );
  invite.groups.forEach((g) =>
    text(`${g.title} — ${g.location}. ${g.schedule}.`),
  );
  heading("Warunki udziału");
  invite.documents.terms.forEach((paragraph, i) =>
    text(`${i + 1}. ${paragraph}`),
  );
  heading("Potwierdzenia osoby podpisującej");
  text(
    "Potwierdzam prawdziwość danych, zamieszkanie uczestnika we wskazanej gminie i uprawnienie do podpisania umowy. Akceptuję opisane warunki bezpłatnego udziału i potwierdzam zapoznanie się z informacjami o przetwarzaniu danych. Dokument nie zawiera zgód promocyjnych.",
  );
  if (data.accessibilityContact)
    text(
      "Proszę Fundację o indywidualny kontakt w sprawie dostępności zajęć; nie przekazuję diagnozy w tym formularzu.",
    );
  text(
    `Podpisany skan całego pakietu prześlij na ${invite.documents.returnEmail || invite.documents.contact}. Oryginał dostarcz na pierwsze zajęcia. W załączniku LGD zaznacz potrzeby dostępności albo „Nie dotyczy”.`,
    9,
  );
  signatures();
  newPage();
  heading("Informacja o przetwarzaniu danych");
  invite.documents.privacy.forEach((textValue) => text(textValue, 9));
  text(`Informacja LGD: ${invite.documents.lgdNotice}`, 8);
  text(
    `Informacja Województwa Wielkopolskiego: ${invite.documents.regionalNotice}`,
    8,
  );
  text(
    "Pełne informacje wymienionych administratorów Fundacja doręcza wraz z umową. Uczestnik / rodzic otrzymuje egzemplarz umowy z załącznikami.",
    9,
  );
  text(
    `Dane zapisano: ${new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "long", timeStyle: "short" }).format(new Date(generatedAt))}. Potwierdzenia zaznaczone w formularzu nie zastępują podpisów własnoręcznych.`,
    8,
  );
  if (invite.documents.lgdPrivacy) {
    newPage();
    heading("Informacja LGD Dolina Samy");
    text(invite.documents.lgdPrivacy, 9);
  }
  await appendLgdForm(doc, font, data, invite);
  const regional = await PDFDocument.load(
    await readFile(
      path.join(
        process.cwd(),
        "public/foundation/contracts/informacja-wojewodztwa.pdf",
      ),
    ),
  );
  for (const page of await doc.copyPages(regional, regional.getPageIndices()))
    doc.addPage(page);
  if (invite.documents.draft)
    for (const page of doc.getPages())
      page.drawText(
        "WERSJA DO UZUPEŁNIENIA — OSTATECZNY PAKIET PRZEKAŻE FUNDACJA",
        { x: 44, y: 10, size: 7, font, color: rgb(0.65, 0.15, 0.1) },
      );
  if (invite.documents.version.includes("PODGLĄD"))
    for (const page of doc.getPages())
      page.drawText("PODGLĄD — DANE FIKCYJNE — NIE PODPISYWAĆ", {
        x: 44,
        y: page.getHeight()-16,
        size: 6,
        font,
        color: rgb(0.65, 0.15, 0.1),
      });
  doc.setTitle("Umowa uczestnictwa — Kreatorzy Przyszłości");
  doc.setAuthor(invite.documents.organizer);
  return Buffer.from(await doc.save());
}
