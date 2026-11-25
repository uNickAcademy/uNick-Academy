import { officialLogoData } from './assets/logo-data.js';
import { voucherArtworkData } from './assets/voucher-art-data.js';

const escapeXml = value => String(value).replace(/[<>&"']/g, character => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[character]));

/** Render-only demonstration artwork. DEMO codes have no monetary value. */
export function createVoucherSvg({value, code, validUntil = '27.11.2027'}) {
  const amount = new Intl.NumberFormat('pl-PL').format(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <title>Przykładowy voucher uNick Academy ${amount} zł, kod nieaktywny</title>
  <image href="${voucherArtworkData}" x="0" y="0" width="1600" height="1000" preserveAspectRatio="xMidYMid slice"/>
  <image href="${officialLogoData}" x="36" y="10" width="255" height="112" style="mix-blend-mode:multiply"/>
  <text x="1040" y="186" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="91" letter-spacing="1" fill="#fff7e7">BLACK FRIDAY</text>
  <text x="1033" y="252" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="29" letter-spacing="5" fill="#fff7e7">VOUCHER NA ZAJĘCIA</text>
  <text x="1034" y="397" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="91" fill="#ffffff">${amount} zł</text>
  <text x="626" y="526" font-family="Arial,sans-serif" font-weight="700" font-size="35" fill="#082547">Z native speakerami</text>
  <text x="628" y="572" font-family="Arial,sans-serif" font-size="22" fill="#35445a">Indywidualnie lub w grupie · online lub stacjonarnie</text>
  <text x="628" y="665" font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="#082547">DLA</text>
  <path d="M707 676H1517" stroke="#C0392B" stroke-width="2" stroke-dasharray="4 8"/>
  <text x="628" y="751" font-family="Arial,sans-serif" font-size="18" letter-spacing="2" fill="#35445a">TWÓJ KOD</text>
  <text x="626" y="801" font-family="monospace" font-size="35" font-weight="600" fill="#082547">${escapeXml(code)}</text>
  <text x="628" y="867" font-family="Arial,sans-serif" font-size="23" fill="#35445a">Ważny do ${escapeXml(validUntil)}</text>
  <text x="78" y="960" font-family="Arial,sans-serif" font-weight="700" font-size="23" fill="#ffffff">unick-academy.pl</text>
  <text x="1519" y="960" text-anchor="end" font-family="Arial,sans-serif" font-size="20" letter-spacing="1" fill="#fff7e7">WZÓR · KOD NIEAKTYWNY</text>
  </svg>`;
}

export const svgDataUrl = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export async function voucherPng(svg) {
  const image = new Image();
  image.src = svgDataUrl(svg);
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

export function downloadAsset(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
