import { jsPDF } from "jspdf";

const GOLD: [number, number, number] = [212, 162, 76];
const NAVY: [number, number, number] = [7, 19, 34];

/** Draw a compact gold/navy frame on every page and fit the capture inside it. */
export function addFramedPdfImage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  marginMm = 5
): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const innerW = pageW - marginMm * 2;
  const innerH = pageH - marginMm * 2;
  const imgW = innerW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.93);
  let offset = 0;
  let page = 0;

  while (offset < imgH - 0.25) {
    if (page > 0) pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, pageH, "F");
    pdf.addImage(img, "JPEG", marginMm, marginMm - offset, imgW, imgH);

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, marginMm, "F");
    pdf.rect(0, pageH - marginMm, pageW, marginMm, "F");
    pdf.rect(0, 0, marginMm, pageH, "F");
    pdf.rect(pageW - marginMm, 0, marginMm, pageH, "F");

    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.35);
    pdf.rect(marginMm, marginMm, innerW, innerH, "S");
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.9);
    pdf.rect(marginMm + 1.1, marginMm + 1.1, innerW - 2.2, innerH - 2.2, "S");
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.25);
    pdf.rect(marginMm + 2, marginMm + 2, innerW - 4, innerH - 4, "S");

    offset += innerH;
    page += 1;
  }
}

export const PDF_FONT_EN = "'IBM Plex Sans', sans-serif";
export const PDF_FONT_TE = "'Noto Sans Telugu', 'IBM Plex Sans', sans-serif";
