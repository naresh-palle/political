import { jsPDF } from "jspdf";

const GOLD: [number, number, number] = [212, 162, 76];
const NAVY: [number, number, number] = [7, 19, 34];

function drawFrame(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  pdf.setDrawColor(...NAVY);
  pdf.setLineWidth(0.35);
  pdf.rect(x, y, w, h, "S");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.85);
  pdf.rect(x + 1.05, y + 1.05, w - 2.1, h - 2.1, "S");
  pdf.setDrawColor(...NAVY);
  pdf.setLineWidth(0.28);
  pdf.rect(x + 1.9, y + 1.9, w - 3.8, h - 3.8, "S");
}

/** Build a PDF whose pages hug the capture: gold/navy frame on all four sides, no leftover empty page. */
export function pdfFromCanvas(
  canvas: HTMLCanvasElement,
  orientation: "portrait" | "landscape"
): jsPDF {
  const maxW = orientation === "landscape" ? 297 : 210;
  const maxH = orientation === "landscape" ? 210 : 297;
  const margin = 4.2;
  const innerW = maxW - margin * 2;
  const imgW = innerW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.93);
  const maxInner = maxH - margin * 2;

  const slices: number[] = [];
  let remaining = imgH;
  while (remaining > 0.2) {
    const slice = Math.min(remaining, maxInner);
    slices.push(slice);
    remaining -= slice;
  }

  const firstH = Math.min(maxH, slices[0] + margin * 2);
  const pdf = new jsPDF({
    unit: "mm",
    format: [maxW, firstH],
    orientation: orientation === "landscape" ? "l" : "p"
  });

  let offset = 0;
  slices.forEach((slice, index) => {
    const pageH = Math.min(maxH, slice + margin * 2);
    if (index > 0) {
      pdf.addPage([maxW, pageH], orientation === "landscape" ? "l" : "p");
    }
    const innerH = pageH - margin * 2;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, maxW, pageH, "F");
    pdf.addImage(img, "JPEG", margin, margin - offset, imgW, imgH);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, maxW, margin, "F");
    pdf.rect(0, pageH - margin, maxW, margin, "F");
    pdf.rect(0, 0, margin, pageH, "F");
    pdf.rect(maxW - margin, 0, margin, pageH, "F");
    drawFrame(pdf, margin, margin, innerW, innerH);
    offset += slice;
  });

  return pdf;
}

export const PDF_FONT_EN = "'IBM Plex Sans', sans-serif";
export const PDF_FONT_TE = "'Noto Sans Telugu', 'IBM Plex Sans', sans-serif";
