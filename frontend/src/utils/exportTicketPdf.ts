import { jsPDF } from "jspdf";
import { FieldIssue, WorkUpdateRecord } from "../types";
import { formatIssueStatus } from "./statusLabels";

function line(value: string | number | undefined | null): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

function ensureSpace(doc: jsPDF, y: number, needed = 12): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 16) {
    doc.addPage();
    return 20;
  }
  return y;
}

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number {
  const wrapped = doc.splitTextToSize(text, maxWidth) as string[];
  for (const row of wrapped) {
    y = ensureSpace(doc, y, lineHeight + 2);
    doc.text(row, x, y);
    y += lineHeight;
  }
  return y;
}

export function exportTicketPdf(issue: FieldIssue, history: WorkUpdateRecord[] = []): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const valueX = margin + 42;
  const valueWidth = pageWidth - valueX - margin;
  let y = 18;

  doc.setFillColor(11, 26, 44);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(212, 162, 76);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Leader's Lens", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(245, 239, 224);
  doc.text("Ticket Export", margin, 20);

  y = 40;
  doc.setTextColor(11, 19, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Ticket #${line(issue.id)}`, margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(40, 50, 65);
  y = writeWrapped(doc, line(issue.title), margin, y, pageWidth - margin * 2, 6);
  y += 4;

  const rows: Array<[string, string]> = [
    ["Status", formatIssueStatus(issue.status) || line(issue.status)],
    ["Priority", line(issue.priority)],
    ["Type", line(issue.issueType)],
    ["Category", line(issue.category)],
    ["Department", line(issue.department || issue.assignedDepartment)],
    ["Scheme / Work", line(issue.schemeSubDetail)],
    ["Mandal", line(issue.mandalName)],
    ["Village / Ward", line(issue.villageName)],
    ["Place", line(issue.placeName)],
    ["Complainant", line(issue.reportedBy)],
    ["Phone", line(issue.reporterPhone)],
    ["Volunteer", line(issue.assignedVolunteerName)],
    ["Officer", line(issue.assignedOfficialName || issue.completedByPerson)],
    ["Registered", line(issue.createdAt || issue.reportedDate)],
    ["Updated", line(issue.updatedAt || issue.lastStatusUpdateAt)],
    ["Due date", line(issue.dueDate)],
    ["Completed", line(issue.completedDate)]
  ];

  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    y = ensureSpace(doc, y, 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 162, 76);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 36, 51);
    const nextY = writeWrapped(doc, value, valueX, y, valueWidth, 5);
    y = Math.max(y + 7, nextY + 2);
  });

  y += 2;
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 162, 76);
  doc.text("Description", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(26, 36, 51);
  y = writeWrapped(doc, line(issue.description), margin, y, pageWidth - margin * 2, 5);
  y += 6;

  if (issue.lastStatusRemarks) {
    y = ensureSpace(doc, y, 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 162, 76);
    doc.text("Officer comment", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 36, 51);
    y = writeWrapped(doc, issue.lastStatusRemarks, margin, y, pageWidth - margin * 2, 5);
    y += 6;
  }

  if (history.length > 0) {
    y = ensureSpace(doc, y, 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 162, 76);
    doc.text("Work updates", margin, y);
    y += 7;
    history.forEach((entry, index) => {
      y = ensureSpace(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 19, 30);
      doc.text(
        `${index + 1}. ${formatIssueStatus(String(entry.newStatus)) || line(entry.newStatus)} · ${line(entry.updateDate || entry.createdAt)}`,
        margin,
        y
      );
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text(line(entry.volunteerName), margin, y);
      y += 5;
      doc.setTextColor(26, 36, 51);
      y = writeWrapped(doc, line(entry.remarks), margin, y, pageWidth - margin * 2, 5);
      y += 4;
    });
  }

  doc.save(`ticket-${issue.id}.pdf`);
}
