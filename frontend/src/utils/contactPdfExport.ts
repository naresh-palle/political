import html2canvas from "html2canvas";
import { pdfFromCanvas, PDF_FONT_EN, PDF_FONT_TE } from "./pdfPageLayout";

export type ContactPdfLang = "en" | "te";

type ContactPdfRow = {
  name: string;
  phone: string;
  email?: string;
  category: string;
  designation: string;
  department?: string;
  subDepartment?: string;
  mandalName: string;
  villageName: string;
  occupation: string;
  gender: string;
  age?: number;
  voterId?: string;
  politicalAlignment?: string;
  notes?: string;
};

const COPY = {
  en: {
    brand: "Leaders Lens",
    title: "Constituency Contact Directory",
    subtitle: (n: number, place: string, date: string) =>
      `${n} contacts  ·  ${place}  ·  ${date}`,
    columns: {
      no: "#",
      name: "Name",
      phone: "Phone",
      email: "Email",
      role: "Role",
      designation: "Designation",
      department: "Department",
      subDepartment: "Sub-department",
      mandal: "Mandal",
      village: "Village / Ward",
      occupation: "Occupation",
      gender: "Gender",
      age: "Age",
      voterId: "Voter ID",
      alignment: "Alignment",
      notes: "Notes"
    }
  },
  te: {
    brand: "లీడర్స్ లెన్స్",
    title: "నియోజకవర్గ కాంటాక్ట్ డైరెక్టరీ",
    subtitle: (n: number, place: string, date: string) =>
      `${n} పరిచయాలు  ·  ${place}  ·  ${date}`,
    columns: {
      no: "#",
      name: "పేరు",
      phone: "ఫోన్",
      email: "ఇమెయిల్",
      role: "పాత్ర",
      designation: "హోదా",
      department: "శాఖ",
      subDepartment: "ఉప-శాఖ",
      mandal: "మండలం",
      village: "గ్రామం / వార్డు",
      occupation: "వృత్తి",
      gender: "లింగం",
      age: "వయసు",
      voterId: "ఓటరు ID",
      alignment: "అనుబంధం",
      notes: "గమనికలు"
    }
  }
} as const;

const ROLE_EN: Record<string, string> = {
  INFLUENCER: "Influencer",
  CADRE: "Party Cadre",
  CITIZEN: "Citizen",
  GOVT_OFFICIAL: "Govt Officer",
  DWCRA_LEAD: "DWCRA Lead",
  YOUTH_LEADER: "Youth Wing",
  OTHER: "Other"
};

const ROLE_TE: Record<string, string> = {
  INFLUENCER: "ప్రభావవంతుడు",
  CADRE: "పార్టీ క్యాడర్",
  CITIZEN: "పౌరుడు",
  GOVT_OFFICIAL: "ప్రభుత్వ అధికారి",
  DWCRA_LEAD: "DWCRA నాయకురాలు",
  YOUTH_LEADER: "యువజన నాయకుడు",
  OTHER: "ఇతరం"
};

const GENDER_TE: Record<string, string> = {
  Male: "పురుషుడు",
  Female: "స్త్రీ",
  Other: "ఇతరం"
};

const ALIGN_TE: Record<string, string> = {
  STRONG_SUPPORTER: "బలమైన మద్దతుదారు",
  NEUTRAL_LEANING: "తటస్థం",
  OFFICIAL: "అధికారి",
  CRITICAL_NEEDS_REACH: "సంప్రదింపు అవసరం"
};

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function roleLabel(category: string, lang: ContactPdfLang): string {
  if (lang === "te") return ROLE_TE[category] || category;
  return ROLE_EN[category] || category;
}

function genderLabel(gender: string, lang: ContactPdfLang): string {
  if (lang === "te") return GENDER_TE[gender] || gender || "—";
  return gender || "—";
}

function alignmentLabel(alignment: string, lang: ContactPdfLang): string {
  if (!alignment) return "—";
  if (lang === "te") return ALIGN_TE[alignment] || alignment.replace(/_/g, " ");
  return alignment.replace(/_/g, " ");
}

export async function downloadContactPdf(
  contacts: ContactPdfRow[],
  constituency: string,
  lang: ContactPdfLang,
  options?: { hidePhone?: boolean }
): Promise<void> {
  const copy = COPY[lang];
  const includePhone = !options?.hidePhone;
  const dateLabel = new Date().toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const fontFamily = lang === "te" ? PDF_FONT_TE : PDF_FONT_EN;

  const columns = [
    copy.columns.no,
    copy.columns.name,
    ...(includePhone ? [copy.columns.phone, copy.columns.email] : []),
    copy.columns.role,
    copy.columns.designation,
    copy.columns.department,
    copy.columns.subDepartment,
    copy.columns.mandal,
    copy.columns.village,
    copy.columns.occupation,
    copy.columns.gender,
    copy.columns.age,
    ...(includePhone ? [copy.columns.voterId] : []),
    copy.columns.alignment,
    copy.columns.notes
  ];

  const rowsHtml = contacts
    .map((c, index) => {
      const cells = [
        String(index + 1),
        c.name || "—",
        ...(includePhone ? [c.phone || "—", c.email || "—"] : []),
        roleLabel(c.category, lang),
        c.designation || "—",
        c.department || "—",
        c.subDepartment || "—",
        c.mandalName || "—",
        c.villageName || "—",
        c.occupation || "—",
        genderLabel(c.gender, lang),
        c.age != null ? String(c.age) : "—",
        ...(includePhone ? [c.voterId || "—"] : []),
        alignmentLabel(c.politicalAlignment || "", lang),
        c.notes || "—"
      ];
      return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`;
    })
    .join("");

  const host = document.createElement("div");
  host.setAttribute("data-contact-pdf", "1");
  host.style.cssText = [
    "position:fixed",
    "left:-14000px",
    "top:0",
    "width:1400px",
    "background:#ffffff",
    "color:#1A2433",
    `font-family:${fontFamily}`,
    "padding:0",
    "box-sizing:border-box"
  ].join(";");
  host.innerHTML = `
    <div style="background:#071322;color:#D4A24C;padding:6px 8px;border:1px solid #071322;">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;line-height:1.2;">${escapeHtml(copy.brand)}</div>
      <div style="font-size:13px;font-weight:700;color:#F5EFE0;margin-top:1px;line-height:1.25;">${escapeHtml(copy.title)}</div>
      <div style="font-size:9px;color:#F5EFE0;margin-top:1px;line-height:1.2;">${escapeHtml(copy.subtitle(contacts.length, constituency, dateLabel))}</div>
    </div>
    <table>
      <thead>
        <tr>
          ${columns
            .map((col) => `<th>${escapeHtml(col)}</th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rowsHtml ||
          `<tr><td colspan="${columns.length}">—</td></tr>`
        }
      </tbody>
    </table>
    <style>
      [data-contact-pdf] table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5px;
        line-height: 1.25;
        border: 1px solid #071322;
      }
      [data-contact-pdf] th, [data-contact-pdf] td {
        padding: 2px 4px;
        border: 1px solid #071322;
        vertical-align: top;
        word-break: break-word;
      }
      [data-contact-pdf] th {
        background: #D4A24C;
        color: #071322;
        text-align: left;
        font-weight: 700;
      }
      [data-contact-pdf] tbody tr:nth-child(even) td { background: #F8F1DE; }
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
    const pdf = pdfFromCanvas(canvas, "landscape");
    const stamp = new Date().toISOString().split("T")[0];
    const langTag = lang === "te" ? "Telugu" : "English";
    pdf.save(`LeaderLens_Contacts_${langTag}_${stamp}.pdf`);
  } finally {
    host.remove();
  }
}
