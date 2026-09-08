import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FieldIssue, WorkUpdateRecord } from "../types";
import { formatIssueStatus } from "./statusLabels";
import { formatTicketDisplay } from "./ticketNumberDisplay";

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
  return `<tr>
    <th>${escapeHtml(label)}</th>
    <td>${escapeHtml(value)}</td>
  </tr>`;
}

export async function exportTicketPdf(
  issue: FieldIssue,
  history: WorkUpdateRecord[] = [],
  lang: TicketPdfLang = "en"
): Promise<void> {
  const copy = COPY[lang];
  const fontFamily =
    lang === "te"
      ? "'Noto Sans Telugu', 'IBM Plex Sans', sans-serif"
      : "'IBM Plex Sans', sans-serif";
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
        <ol>
          ${history
            .map((entry) => {
              const stamp = line(entry.updateDate || entry.createdAt);
              const status = statusLabel(String(entry.newStatus), lang);
              return `<li><strong>${escapeHtml(status)}</strong> · ${escapeHtml(stamp)}<br/>${escapeHtml(line(entry.volunteerName))}<br/>${escapeHtml(line(entry.remarks))}</li>`;
            })
            .join("")}
        </ol>`;

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
    "padding:28px 24px",
    "box-sizing:border-box"
  ].join(";");
  host.innerHTML = `
    <div style="background:#071322;color:#D4A24C;padding:16px 18px;border-radius:10px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(copy.brand)}</div>
      <div style="font-size:22px;font-weight:700;color:#F5EFE0;margin-top:4px;">${escapeHtml(ticketId)}</div>
      <div style="font-size:12px;color:#F5EFE0;margin-top:4px;">${escapeHtml(copy.heading)}</div>
    </div>
    <h2 style="font-size:16px;margin:16px 0 10px;color:#071322;">${escapeHtml(line(issue.title))}</h2>
    <table>${fieldRows}</table>
    <h3>${escapeHtml(copy.labels.description)}</h3>
    <p>${escapeHtml(line(issue.description))}</p>
    ${issue.initialRemarks ? `<p><strong>${escapeHtml(copy.labels.notes)}:</strong> ${escapeHtml(issue.initialRemarks)}</p>` : ""}
    <h3>${escapeHtml(copy.labels.officerComment)}</h3>
    <p>${escapeHtml(comment)}</p>
    ${timelineHtml}
    <style>
      [data-ticket-pdf] table { width:100%; border-collapse:collapse; font-size:12px; }
      [data-ticket-pdf] th { width:34%; text-align:left; color:#8A6A28; padding:6px 8px; vertical-align:top; background:#F8F1DE; border-bottom:1px solid #E6D7B3; }
      [data-ticket-pdf] td { padding:6px 8px; border-bottom:1px solid #E6D7B3; word-break:break-word; }
      [data-ticket-pdf] h3 { color:#D4A24C; font-size:13px; margin:16px 0 6px; }
      [data-ticket-pdf] p, [data-ticket-pdf] li { font-size:12px; line-height:1.45; margin:0 0 8px; }
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
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const img = canvas.toDataURL("image/jpeg", 0.92);
    let offset = 0;
    while (offset < imgH - 0.5) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, -offset, imgW, imgH);
      offset += pageH;
    }
    const stamp = new Date().toISOString().split("T")[0];
    const langTag = lang === "te" ? "Telugu" : "English";
    const safeId = String(ticketId || issue.id).replace(/[^\w.-]+/g, "_");
    pdf.save(`LeaderLens_Ticket_${safeId}_${langTag}_${stamp}.pdf`);
  } finally {
    host.remove();
  }
}
