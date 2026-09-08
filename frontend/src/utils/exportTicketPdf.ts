import html2canvas from "html2canvas";
import { FieldIssue, WorkUpdateRecord } from "../types";
import { formatIssueStatus } from "./statusLabels";
import { formatTicketDisplay } from "./ticketNumberDisplay";
import { pdfFromCanvas, PDF_FONT_EN, PDF_FONT_TE } from "./pdfPageLayout";

export type TicketPdfLang = "en" | "te";

const STATUS_TE: Record<string, string> = {
  NEW: "కొత్తది",
  OPEN: "తెరిచినది",
  ACKNOWLEDGED: "స్వీకరించబడింది",
  ASSIGNED: "కేటాయించబడింది",
  ASSIGNED_TO_DEPARTMENT: "శాఖకు కేటాయించబడింది",
  IN_PROGRESS: "పురోగతిలో ఉంది",
  ON_HOLD: "నిలిపివేయబడింది",
  RESOLVED: "పరిష్కరించబడింది",
  COMPLETED: "పూర్తయింది",
  REJECTED: "తిరస్కరించబడింది",
  OVERDUE: "గడువు దాటింది",
  CLOSED: "మూసివేయబడింది"
};

const PRIORITY_TE: Record<string, string> = {
  LOW: "తక్కువ",
  MEDIUM: "మధ్యస్థం",
  HIGH: "అధికం",
  URGENT: "అత్యవసరం"
};

const GENDER_TE: Record<string, string> = {
  Male: "పురుషుడు",
  Female: "స్త్రీ",
  Other: "ఇతరం"
};

const COPY = {
  en: {
    brand: "Leaders Lens",
    heading: "Ticket Export",
    typeGrievance: "Grievance Petition",
    typeField: "Field Issue",
    unassigned: "Unassigned",
    waitingComment: "Waiting for the department officer to add a status comment.",
    labels: {
      status: "Status",
      priority: "Priority",
      type: "Type",
      category: "Category",
      department: "Department",
      scheme: "Scheme / Work",
      mandal: "Mandal",
      village: "Village / Ward",
      place: "Place",
      constituency: "Constituency",
      complainant: "Complainant",
      reporterType: "Reporter type",
      designation: "Designation",
      phone: "Phone",
      age: "Age",
      gender: "Gender",
      secondaryName: "Secondary name",
      secondaryPhone: "Secondary phone",
      volunteer: "Field volunteer",
      volunteerPhone: "Volunteer phone",
      officer: "Assigned official",
      officerPhone: "Official phone",
      registered: "Registered",
      updated: "Updated",
      due: "Due date",
      completed: "Completed",
      description: "Issue scope & ground description",
      notes: "Ground intake notes",
      officerComment: "Officer status comment",
      timeline: "Audit & activity timeline"
    }
  },
  te: {
    brand: "లీడర్స్ లెన్స్",
    heading: "టికెట్ ఎగుమతి",
    typeGrievance: "ఫిర్యాదు పిటిషన్",
    typeField: "క్షేత్ర సమస్య",
    unassigned: "కేటాయించలేదు",
    waitingComment: "శాఖా అధికారి స్థితి వ్యాఖ్యను జోడించాల్సి ఉంది.",
    labels: {
      status: "స్థితి",
      priority: "ప్రాధాన్యత",
      type: "రకం",
      category: "వర్గం",
      department: "శాఖ",
      scheme: "పథకం / పని",
      mandal: "మండలం",
      village: "గ్రామం / వార్డు",
      place: "స్థలం",
      constituency: "నియోజకవర్గం",
      complainant: "ఫిర్యాదుదారు",
      reporterType: "నివేదిక రకం",
      designation: "హోదా",
      phone: "ఫోన్",
      age: "వయసు",
      gender: "లింగం",
      secondaryName: "రెండవ పేరు",
      secondaryPhone: "రెండవ ఫోన్",
      volunteer: "క్షేత్ర వాలంటీర్",
      volunteerPhone: "వాలంటీర్ ఫోన్",
      officer: "కేటాయించిన అధికారి",
      officerPhone: "అధికారి ఫోన్",
      registered: "నమోదు",
      updated: "నవీకరణ",
      due: "గడువు",
      completed: "పూర్తయింది",
      description: "సమస్య వివరణ",
      notes: "క్షేత్ర నమోదు గమనికలు",
      officerComment: "అధికారి స్థితి వ్యాఖ్య",
      timeline: "ఆడిట్ మరియు కార్యకలాపాల టైమ్‌లైన్"
    }
  }
} as const;

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function line(value: string | number | undefined | null): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

function statusLabel(status: string | undefined, lang: TicketPdfLang): string {
  const key = String(status || "").trim().toUpperCase();
  if (lang === "te") return STATUS_TE[key] || formatIssueStatus(status);
  return formatIssueStatus(status);
}

function priorityLabel(priority: string | undefined, lang: TicketPdfLang): string {
  const key = String(priority || "").trim().toUpperCase();
  if (lang === "te") return PRIORITY_TE[key] || line(priority);
  return line(priority);
}

function genderLabel(gender: string | undefined, lang: TicketPdfLang): string {
  if (!gender) return "—";
  if (lang === "te") return GENDER_TE[gender] || gender;
  return gender;
}

function reporterTypeLabel(type: string | undefined, lang: TicketPdfLang): string {
  const key = String(type || "").toUpperCase();
  if (lang === "te") {
    if (key === "LEADER") return "నాయకుడు";
    if (key === "CADRE") return "పార్టీ క్యాడర్";
    return "పౌరుడు";
  }
  if (key === "LEADER") return "Leader";
  if (key === "CADRE") return "Cadre";
  return "Citizen";
}

function row(label: string, value: string): string {
  const text = String(value ?? "").trim();
  if (!text || text === "—") return "";
  return `<tr>
    <th>${escapeHtml(label)}</th>
    <td>${escapeHtml(text)}</td>
  </tr>`;
}

export async function exportTicketPdf(
  issue: FieldIssue,
  history: WorkUpdateRecord[] = [],
  lang: TicketPdfLang = "en"
): Promise<void> {
  const copy = COPY[lang];
  const fontFamily = lang === "te" ? PDF_FONT_TE : PDF_FONT_EN;
  const ticketId = formatTicketDisplay(issue);
  const officer = issue.assignedOfficialName || issue.completedByPerson || copy.unassigned;
  const comment =
    issue.lastStatusRemarks?.trim() ||
    String((issue as { rejectionReason?: string }).rejectionReason || "").trim() ||
    copy.waitingComment;

  const fieldRows = [
    row(copy.labels.status, statusLabel(issue.status, lang)),
    row(copy.labels.priority, priorityLabel(issue.priority, lang)),
    row(copy.labels.type, issue.issueType === "GRIEVANCE" ? copy.typeGrievance : copy.typeField),
    row(copy.labels.category, line(issue.category)),
    row(copy.labels.department, line(issue.completedDepartment || issue.department || issue.assignedDepartment)),
    row(copy.labels.scheme, line(issue.schemeSubDetail)),
    row(copy.labels.mandal, line(issue.mandalName)),
    row(copy.labels.village, line(issue.villageName)),
    row(copy.labels.place, line(issue.placeName)),
    row(copy.labels.constituency, line(issue.assemblyConstituencyName || issue.parliamentConstituencyName)),
    row(copy.labels.complainant, line(issue.reportedBy)),
    row(copy.labels.reporterType, reporterTypeLabel(issue.reporterType, lang)),
    row(copy.labels.designation, line(issue.reporterDesignation)),
    row(copy.labels.phone, line(issue.reporterPhone)),
    row(copy.labels.age, issue.citizenAge != null ? String(issue.citizenAge) : "—"),
    row(copy.labels.gender, genderLabel(issue.citizenGender, lang)),
    row(copy.labels.secondaryName, line(issue.secondaryContactName)),
    row(copy.labels.secondaryPhone, line(issue.secondaryContactPhone)),
    row(copy.labels.volunteer, line(issue.assignedVolunteerName)),
    row(copy.labels.volunteerPhone, line(issue.assignedVolunteerPhone)),
    row(copy.labels.officer, line(officer)),
    row(copy.labels.officerPhone, line(issue.assignedOfficialPhone)),
    row(copy.labels.registered, line(issue.createdAt || issue.reportedDate)),
    row(copy.labels.updated, line(issue.updatedAt || issue.lastStatusUpdateAt)),
    row(copy.labels.due, line(issue.dueDate)),
    row(copy.labels.completed, line(issue.completedDate))
  ].join("");

  const timelineHtml =
    history.length === 0
      ? ""
      : `<h3>${escapeHtml(copy.labels.timeline)}</h3>
        <table>
          ${history
            .map((entry) => {
              const stamp = line(entry.updateDate || entry.createdAt);
              const status = statusLabel(String(entry.newStatus), lang);
              const body = [line(entry.volunteerName), line(entry.remarks)].filter((part) => part !== "—").join(" · ");
              return row(`${status} · ${stamp}`, body || " ");
            })
            .join("")}
        </table>`;

  const host = document.createElement("div");
  host.setAttribute("data-ticket-pdf", "1");
  host.style.cssText = [
    "position:fixed",
    "left:-14000px",
    "top:0",
    "width:794px",
    "background:#ffffff",
    "color:#1A2433",
    `font-family:${fontFamily}`,
    "padding:0",
    "box-sizing:border-box"
  ].join(";");
  host.innerHTML = `
    <div style="background:#071322;color:#D4A24C;padding:6px 8px;border:1px solid #071322;">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;line-height:1.2;">${escapeHtml(copy.brand)}</div>
      <div style="font-size:13px;font-weight:700;color:#F5EFE0;margin-top:1px;line-height:1.25;">${escapeHtml(ticketId)}</div>
      <div style="font-size:9px;color:#F5EFE0;margin-top:1px;line-height:1.2;">${escapeHtml(copy.heading)}</div>
    </div>
    <div style="padding:5px 6px 4px;border-left:1px solid #C9A24C;border-right:1px solid #C9A24C;font-size:12px;font-weight:700;color:#071322;line-height:1.3;">${escapeHtml(line(issue.title))}</div>
    <table>${fieldRows}</table>
    <h3>${escapeHtml(copy.labels.description)}</h3>
    <p>${escapeHtml(line(issue.description))}</p>
    ${issue.initialRemarks ? `<p><strong>${escapeHtml(copy.labels.notes)}:</strong> ${escapeHtml(issue.initialRemarks)}</p>` : ""}
    <h3>${escapeHtml(copy.labels.officerComment)}</h3>
    <p>${escapeHtml(comment)}</p>
    ${timelineHtml}
    <style>
      [data-ticket-pdf] table { width:100%; border-collapse:collapse; font-size:9.5px; line-height:1.25; border:1px solid #071322; }
      [data-ticket-pdf] th, [data-ticket-pdf] td {
        padding: 2px 5px;
        border: 1px solid #071322;
        vertical-align: top;
        word-break: break-word;
      }
      [data-ticket-pdf] th { width:30%; text-align:left; color:#071322; background:#F8F1DE; font-weight:700; }
      [data-ticket-pdf] h3 { color:#8A6A28; font-size:9.5px; font-weight:700; margin:6px 0 2px; text-transform:uppercase; letter-spacing:0.04em; }
      [data-ticket-pdf] p { font-size:9.5px; line-height:1.3; margin:0; padding:3px 5px; border:1px solid #C9A24C; }
    </style>
  `;
  document.body.appendChild(host);
  try {
    await document.fonts.ready;
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    });
    const pdf = pdfFromCanvas(canvas, "portrait");
    const stamp = new Date().toISOString().split("T")[0];
    const langTag = lang === "te" ? "Telugu" : "English";
    const safeId = String(ticketId || issue.id).replace(/[^\w.-]+/g, "_");
    pdf.save(`LeaderLens_Ticket_${safeId}_${langTag}_${stamp}.pdf`);
  } finally {
    host.remove();
  }
}
