type ContactExportRow = {
  name: string;
  phone: string;
  category: string;
  designation: string;
  department?: string;
  subDepartment?: string;
  mandalName: string;
  villageName: string;
  occupation: string;
  gender: string;
  age?: number;
  notes?: string;
};

const NAVY = "#071322";
const NAVY_MID = "#0B1A2C";
const GOLD = "#D4A24C";
const CREAM = "#F5EFE0";
const ROW_ALT = "#F3E6C8";
const TEXT = "#1A2433";

const ROLE_LABEL: Record<string, string> = {
  INFLUENCER: "Influencer",
  CADRE: "Party Cadre",
  CITIZEN: "Citizen",
  GOVT_OFFICIAL: "Govt Officer",
  DWCRA_LEAD: "DWCRA Lead",
  YOUTH_LEADER: "Youth Wing",
  OTHER: "Other"
};

function xmlEscape(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(style: string, value: string | number, type: "String" | "Number" = "String"): string {
  const typed = type === "Number" && value !== "" && Number.isFinite(Number(value));
  if (typed) {
    return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

export function buildContactWorkbookXml(
  contacts: ContactExportRow[],
  options?: { generatedOn?: Date; constituency?: string; hidePhone?: boolean }
): string {
  const generatedOn = options?.generatedOn ?? new Date();
  const constituency = options?.constituency || "Banaganapalle";
  const dateLabel = generatedOn.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const includePhone = !options?.hidePhone;
  const columns = [
    { key: "no", title: "#", width: 36 },
    { key: "name", title: "Name", width: 180 },
    ...(includePhone ? [{ key: "phone", title: "Phone", width: 120 }] : []),
    { key: "role", title: "Role", width: 100 },
    { key: "designation", title: "Designation", width: 200 },
    { key: "department", title: "Department", width: 180 },
    { key: "subDepartment", title: "Sub-department", width: 180 },
    { key: "mandal", title: "Mandal", width: 140 },
    { key: "village", title: "Village / Ward", width: 160 },
    { key: "occupation", title: "Occupation", width: 150 },
    { key: "gender", title: "Gender", width: 70 },
    { key: "age", title: "Age", width: 48 },
    { key: "notes", title: "Notes", width: 260 }
  ];

  const colXml = columns.map((c) => `<Column ss:AutoFitWidth="0" ss:Width="${c.width}"/>`).join("");

  const titleRow = `<Row ss:Height="28">
      <Cell ss:StyleID="sTitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">LeaderLens  ·  ${xmlEscape(constituency)} Contact Directory</Data></Cell>
    </Row>`;
  const subRow = `<Row ss:Height="18">
      <Cell ss:StyleID="sSub" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${contacts.length} contacts  ·  ${xmlEscape(dateLabel)}  ·  Field operations directory</Data></Cell>
    </Row>`;
  const headerRow = `<Row ss:Height="20">${columns
    .map((c) => `<Cell ss:StyleID="sHead"><Data ss:Type="String">${c.title}</Data></Cell>`)
    .join("")}</Row>`;

  const dataRows = contacts
    .map((c, index) => {
      const style = index % 2 === 0 ? "sOdd" : "sEven";
      const role = ROLE_LABEL[c.category] || c.category;
      const phoneCell = includePhone ? cell(style, c.phone) : "";
      return `<Row ss:Height="18">
        ${cell(style, index + 1, "Number")}
        ${cell(style, c.name)}
        ${phoneCell}
        ${cell(style, role)}
        ${cell(style, c.designation)}
        ${cell(style, c.department || "")}
        ${cell(style, c.subDepartment || "")}
        ${cell(style, c.mandalName)}
        ${cell(style, c.villageName)}
        ${cell(style, c.occupation)}
        ${cell(style, c.gender)}
        ${cell(style, c.age ?? "", "Number")}
        ${cell(style, c.notes || "")}
      </Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>LeaderLens Contact Directory</Title>
    <Author>LeaderLens</Author>
    <Company>LeaderLens</Company>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
    </Style>
    <Style ss:ID="sTitle">
      <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
      <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="${GOLD}"/>
      <Interior ss:Color="${NAVY}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sSub">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${CREAM}"/>
      <Interior ss:Color="${NAVY_MID}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sHead">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="${NAVY}"/>
      <Interior ss:Color="${GOLD}" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${NAVY}"/>
      </Borders>
    </Style>
    <Style ss:ID="sOdd">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
      <Interior ss:Color="${CREAM}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sEven">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
      <Interior ss:Color="${ROW_ALT}" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Contacts">
    <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${contacts.length + 3}" x:FullColumns="1" x:FullRows="1">
      ${colXml}
      ${titleRow}
      ${subRow}
      ${headerRow}
      ${dataRows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>3</SplitHorizontal>
      <TopRowBottomPane>3</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
    <AutoFilter x:Range="R3C1:R${contacts.length + 3}C${columns.length}" xmlns="urn:schemas-microsoft-com:office:excel"/>
  </Worksheet>
</Workbook>`;
}

export function downloadContactWorkbook(
  contacts: ContactExportRow[],
  constituency?: string,
  options?: { hidePhone?: boolean }
): void {
  const xml = buildContactWorkbookXml(contacts, { constituency, hidePhone: options?.hidePhone });
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `LeaderLens_Contacts_${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
