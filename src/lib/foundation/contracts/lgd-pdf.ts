import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, type PDFFont, rgb } from "pdf-lib";
import { municipalityOptions } from "../options";
import type { ContractInvitation, ParticipantData } from "./model";

/** Original LGD annex 7, converted from the published DOCX, with values in its blank cells. */
export async function appendLgdForm(
  doc: PDFDocument,
  font: PDFFont,
  data: ParticipantData,
  invite: ContractInvitation,
) {
  const template = await PDFDocument.load(
    await readFile(
      path.join(process.cwd(), "assets/foundation-contract/formularz-lgd.pdf"),
    ),
  );
  const pages = await doc.copyPages(template, template.getPageIndices());
  const page = doc.addPage(pages[0]);
  doc.addPage(pages[1]);
  const height = page.getHeight();
  function cell(
    value: string,
    x: number,
    top: number,
    width: number,
    heightAvailable = 18,
  ) {
    let size = 10;
    // Keep long names legible; oversized data is wrapped rather than allowed to overflow a cell.
    const linesFor = (fontSize: number) => {
      const lines: string[] = [];
      let line = "";
      for (const character of value.replace(/[\r\n\t]/g, " ")) {
        if (font.widthOfTextAtSize(line + character, fontSize) > width) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
      if (line) lines.push(line);
      return lines;
    };
    while (size > 7 && linesFor(size).length * size * 1.3 > heightAvailable)
      size -= 0.5;
    const lines = linesFor(size);
    if (lines.length * size * 1.3 > heightAvailable)
      throw new Error("lgd_field_too_long");
    lines.forEach((line, index) =>
      page.drawText(line, {
        x,
        y: height - top - size - index * size * 1.3,
        size,
        font,
        color: rgb(0.1, 0.15, 0.13),
      }),
    );
  }
  cell(invite.documents.organizer, 77, 171, 438);
  cell(invite.documents.project, 77, 214, 438, 30);
  cell(invite.documents.grantNumber, 77, 268, 438);
  cell(invite.first_support.split("-").reverse().join("."), 431, 321, 87);
  cell(data.participantFirstName, 201, 382, 315);
  cell(data.participantLastName, 201, 410, 315);
  cell("X", data.sex === "M" ? 239 : 339, 443, 16);
  cell(String(data.ageAtStart), 501, 443, 19);
  if (data.signerType !== "adult") {
    cell(data.signerFirstName, 335, 508, 181, 14);
    cell(data.signerLastName, 335, 529, 181, 14);
  }
  cell("wielkopolskie", 211, 589, 305);
  cell(
    ["kazmierz", "szamotuly"].includes(data.municipality)
      ? "szamotulski"
      : "poznański",
    211,
    612,
    305,
  );
  cell(
    municipalityOptions.find((option) => option.value === data.municipality)!
      .label,
    211,
    634,
    305,
  );
  cell(data.town, 211, 655, 305);
  cell(data.phone, 211, 676, 305, 14);
  cell(data.email, 211, 697, 305, 16);
  // Do not infer health/accessibility declarations. The original options remain for handwriting.
}
