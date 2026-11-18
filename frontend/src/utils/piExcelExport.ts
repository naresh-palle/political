import { accountBriefing, leaderBriefing, overviewBriefing } from "./piBriefing";

const NAVY = "#071322";
const NAVY_MID = "#0B1A2C";
const GOLD = "#D4A24C";
const CREAM = "#F5EFE0";
const ROW_ALT = "#F3E6C8";
const TEXT = "#1A2433";

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X / Twitter",
  youtube: "YouTube"
};

export type PiExportBundle = {
  stateName?: string;
  districtName?: string;
  constituencyName?: string;
  generatedOn?: Date;
  dashboard?: {
    totalConstituencies?: number;
    constituenciesEntered?: number;
    totalLeaders?: number;
    totalSocialAccounts?: number;
    verifiedAccounts?: number;
    pendingVerification?: number;
  };
  leaders: any[];
  accounts: any[];
  constituencies: any[];
  partyName?: (partyId?: string) => string;
  assemblyName?: (assemblyId?: string) => string;
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

function rowHeightFor(text: string, widthChars = 48) {
  const lines = Math.max(1, Math.ceil(String(text || "").length / widthChars) + (String(text || "").split("\n").length - 1));
  return Math.min(96, 18 + lines * 14);
}

function accountFor(leaderId: string, accounts: any[], platform: string) {
  return accounts.find(
    (row) => row?.personId === leaderId && String(row?.platform || "").toLowerCase() === platform
  );
}

function accountCell(account: any) {
  if (!account) return "—";
  if (account.noAccount || String(account.verificationStatus || "").toUpperCase() === "NO_ACCOUNT") {
    return "No account";
  }
  const handle = String(account.accountIdentifier || account.accountUsername || "").replace(/^@/, "");
  const url = String(account.profileUrl || "").replace(/^https?:\/\//i, "");
  const followers = account.followers != null ? `${Number(account.followers).toLocaleString("en-IN")} followers` : "";
  return [handle, url, followers].filter(Boolean).join("\n");
}

export const PI_CSV_COLUMNS: { key: string; title: string; width: number }[] = [
  { key: "recordType", title: "recordType", width: 80 },
  { key: "stateId", title: "stateId", width: 50 },
  { key: "districtId", title: "districtId", width: 110 },
  { key: "parliamentConstituencyId", title: "parliamentConstituencyId", width: 120 },
  { key: "assemblyConstituencyId", title: "assemblyConstituencyId", width: 120 },
  { key: "totalVoters", title: "totalVoters", width: 80 },
  { key: "ruralPercent", title: "ruralPercent", width: 70 },
  { key: "estimatedFacebookUsers", title: "estimatedFacebookUsers", width: 110 },
  { key: "estimatedInstagramUsers", title: "estimatedInstagramUsers", width: 110 },
  { key: "estimatedXUsers", title: "estimatedXUsers", width: 100 },
  { key: "estimatedYouTubeUsers", title: "estimatedYouTubeUsers", width: 110 },
  { key: "dataCollectionDate", title: "dataCollectionDate", width: 90 },
  { key: "dataSource", title: "dataSource", width: 90 },
  { key: "remarks", title: "remarks", width: 140 },
  { key: "leaderName", title: "leaderName", width: 140 },
  { key: "partyId", title: "partyId", width: 70 },
  { key: "politicalRole", title: "politicalRole", width: 90 },
  { key: "currentFormerStatus", title: "currentFormerStatus", width: 90 },
  { key: "platform", title: "platform", width: 80 },
  { key: "profileUrl", title: "profileUrl", width: 220 },
  { key: "accountIdentifier", title: "accountIdentifier", width: 120 },
  { key: "followers", title: "followers", width: 80 },
  { key: "postsLast30Days", title: "postsLast30Days", width: 90 },
  { key: "avgLikesLast10", title: "avgLikesLast10", width: 90 },
  { key: "avgCommentsLast10", title: "avgCommentsLast10", width: 100 },
  { key: "avgViewsLast10", title: "avgViewsLast10", width: 90 },
  { key: "verificationStatus", title: "verificationStatus", width: 90 },
  { key: "aiBriefing", title: "aiBriefing", width: 280 }
];

function csvEscape(value: string | number | undefined | null): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function cellText(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value);
}

function dateOnly(value?: string): string {
  return String(value || "").slice(0, 10);
}

function profileUrlForCsv(account: any): string {
  const url = String(account?.profileUrl || "");
  if (!url || url.includes("none.invalid")) return "";
  return url;
}

function leaderForAccount(bundle: PiExportBundle, account: any) {
  return bundle.leaders.find((row) => row.id === account?.personId) || {};
}

function constituencyBriefing(bundle: PiExportBundle, row: any): string {
  const name = row.assemblyName || bundle.assemblyName?.(row.assemblyConstituencyId) || row.assemblyConstituencyId || "";
  const district = row.districtName || bundle.districtName || row.districtId || "";
  return [
    `${name}${district ? ` in ${district}` : ""}.`,
    row.totalVoters != null ? `${Number(row.totalVoters).toLocaleString("en-IN")} voters.` : "",
    row.ruralPercent != null ? `About ${row.ruralPercent}% rural.` : "",
    row.estimatedFacebookUsers != null ? `Estimated Facebook users: ${Number(row.estimatedFacebookUsers).toLocaleString("en-IN")}.` : "",
    row.estimatedInstagramUsers != null ? `Estimated Instagram users: ${Number(row.estimatedInstagramUsers).toLocaleString("en-IN")}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function emptyCsvRow(): Record<string, string> {
  return Object.fromEntries(PI_CSV_COLUMNS.map((col) => [col.key, ""]));
}

export function buildPiCsvDetailRows(bundle: PiExportBundle): Record<string, string>[] {
  const rows: Record<string, string>[] = [];

  for (const row of bundle.constituencies || []) {
    rows.push({
      ...emptyCsvRow(),
      recordType: "constituency",
      stateId: cellText(row.stateId),
      districtId: cellText(row.districtId),
      parliamentConstituencyId: cellText(row.parliamentConstituencyId),
      assemblyConstituencyId: cellText(row.assemblyConstituencyId),
      totalVoters: cellText(row.totalVoters),
      ruralPercent: cellText(row.ruralPercent),
      estimatedFacebookUsers: cellText(row.estimatedFacebookUsers),
      estimatedInstagramUsers: cellText(row.estimatedInstagramUsers),
      estimatedXUsers: cellText(row.estimatedXUsers),
      estimatedYouTubeUsers: cellText(row.estimatedYouTubeUsers),
      dataCollectionDate: dateOnly(row.dataCollectionDate || row.updatedAt || row.createdAt),
      dataSource: cellText(row.dataSource),
      remarks: cellText(row.remarks),
      verificationStatus: cellText(row.verificationStatus),
      aiBriefing: constituencyBriefing(bundle, row)
    });
  }

  for (const leader of bundle.leaders || []) {
    const related = (bundle.accounts || []).filter((row) => row?.personId === leader?.id);
    rows.push({
      ...emptyCsvRow(),
      recordType: "leader",
      stateId: cellText(leader.stateId),
      districtId: cellText(leader.districtId),
      parliamentConstituencyId: cellText(leader.parliamentConstituencyId),
      assemblyConstituencyId: cellText(leader.assemblyConstituencyId),
      dataCollectionDate: dateOnly(leader.dataCollectionDate || leader.updatedAt || leader.createdAt),
      dataSource: cellText(leader.dataSource),
      remarks: cellText(leader.remarks),
      leaderName: cellText(leader.name),
      partyId: cellText(leader.partyId),
      politicalRole: cellText(leader.politicalRole),
      currentFormerStatus: cellText(leader.currentFormerStatus),
      verificationStatus: cellText(leader.verificationStatus),
      aiBriefing: leaderBriefing(
        {
          ...leader,
          assemblyName: leader.assemblyName || bundle.assemblyName?.(leader.assemblyConstituencyId)
        },
        related
      )
    });
  }

  for (const account of bundle.accounts || []) {
    const leader = leaderForAccount(bundle, account);
    rows.push({
      ...emptyCsvRow(),
      recordType: "social",
      stateId: cellText(account.stateId || leader.stateId),
      districtId: cellText(account.districtId || leader.districtId),
      parliamentConstituencyId: cellText(account.parliamentConstituencyId || leader.parliamentConstituencyId),
      assemblyConstituencyId: cellText(account.assemblyConstituencyId || leader.assemblyConstituencyId),
      dataCollectionDate: dateOnly(account.dataCollectionDate || account.updatedAt || account.createdAt),
      dataSource: cellText(account.dataSource),
      remarks: cellText(account.remarks),
      leaderName: cellText(leader.name || account.leaderName),
      partyId: cellText(leader.partyId || account.partyId),
      politicalRole: cellText(leader.politicalRole),
      currentFormerStatus: cellText(leader.currentFormerStatus),
      platform: cellText(account.platform).toLowerCase(),
      profileUrl: profileUrlForCsv(account),
      accountIdentifier: String(account.accountIdentifier || "").replace(/^@/, ""),
      followers: cellText(account.followers),
      postsLast30Days: cellText(account.postsLast30Days),
      avgLikesLast10: cellText(account.avgLikesLast10),
      avgCommentsLast10: cellText(account.avgCommentsLast10),
      avgViewsLast10: cellText(account.avgViewsLast10),
      verificationStatus: cellText(account.verificationStatus),
      aiBriefing: accountBriefing(account, leader.name || account.leaderName)
    });
  }

  return rows;
}

export function buildPiDetailCsv(bundle: PiExportBundle): string {
  const rows = buildPiCsvDetailRows(bundle);
  const headers = PI_CSV_COLUMNS.map((col) => col.key);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(","))
  ];
  return `\uFEFF${lines.join("\n")}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportStamp(bundle: PiExportBundle) {
  const stamp = (bundle.generatedOn ?? new Date()).toISOString().split("T")[0];
  const place = (bundle.districtName || bundle.stateName || "PI").replace(/\s+/g, "_");
  return { stamp, place };
}

export function buildPiBriefingWorkbookXml(bundle: PiExportBundle): string {
  const generatedOn = bundle.generatedOn ?? new Date();
  const dateLabel = generatedOn.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const place = [bundle.constituencyName, bundle.districtName, bundle.stateName].filter(Boolean).join(" · ") || "Andhra Pradesh";
  const overview = overviewBriefing({
    stateName: bundle.stateName,
    districtName: bundle.districtName,
    constituencyName: bundle.constituencyName,
    totalConstituencies: bundle.dashboard?.totalConstituencies,
    constituenciesEntered: bundle.dashboard?.constituenciesEntered,
    totalLeaders: bundle.dashboard?.totalLeaders,
    totalSocialAccounts: bundle.dashboard?.totalSocialAccounts,
    verifiedAccounts: bundle.dashboard?.verifiedAccounts,
    pendingVerification: bundle.dashboard?.pendingVerification
  });

  const leaderCols = [
    { title: "#", width: 36 },
    { title: "Leader", width: 160 },
    { title: "Party", width: 70 },
    { title: "Role", width: 110 },
    { title: "Constituency", width: 140 },
    { title: "Facebook", width: 160 },
    { title: "Instagram", width: 160 },
    { title: "X / Twitter", width: 160 },
    { title: "YouTube", width: 160 },
    { title: "AI briefing", width: 280 }
  ];
  const socialCols = [
    { title: "#", width: 36 },
    { title: "Leader", width: 160 },
    { title: "Platform", width: 90 },
    { title: "Profile link", width: 220 },
    { title: "Username", width: 120 },
    { title: "Followers", width: 90 },
    { title: "Status", width: 110 },
    { title: "AI briefing", width: 280 }
  ];
  const constCols = [
    { title: "#", width: 36 },
    { title: "Constituency", width: 160 },
    { title: "District", width: 140 },
    { title: "Voters", width: 90 },
    { title: "Rural %", width: 70 },
    { title: "Facebook users (est.)", width: 120 },
    { title: "Instagram users (est.)", width: 120 },
    { title: "X users (est.)", width: 100 },
    { title: "YouTube users (est.)", width: 120 },
    { title: "AI briefing", width: 280 }
  ];

  const headerXml = (cols: { title: string }[]) =>
    `<Row ss:Height="22">${cols.map((c) => `<Cell ss:StyleID="sHead"><Data ss:Type="String">${xmlEscape(c.title)}</Data></Cell>`).join("")}</Row>`;
  const colXml = (cols: { width: number }[]) => cols.map((c) => `<Column ss:AutoFitWidth="0" ss:Width="${c.width}"/>`).join("");

  const leaderRowsXml = bundle.leaders
    .map((leader, index) => {
      const style = index % 2 === 0 ? "sOdd" : "sEven";
      const related = bundle.accounts.filter((row) => row?.personId === leader?.id);
      const briefing = leaderBriefing(
        {
          ...leader,
          assemblyName: leader.assemblyName || bundle.assemblyName?.(leader.assemblyConstituencyId)
        },
        related
      );
      const height = rowHeightFor(briefing, 42);
      const party = bundle.partyName?.(leader.partyId) || leader.partyId || "";
      const role = String(leader.politicalRole || "").replace(/_/g, " ");
      const ac = leader.assemblyName || bundle.assemblyName?.(leader.assemblyConstituencyId) || leader.assemblyConstituencyId || "";
      return `<Row ss:AutoFitHeight="1" ss:Height="${height}">
        ${cell(style, index + 1, "Number")}
        ${cell(style, leader.name || "")}
        ${cell(style, party)}
        ${cell(style, role)}
        ${cell(style, ac)}
        ${cell(style, accountCell(accountFor(leader.id, bundle.accounts, "facebook")))}
        ${cell(style, accountCell(accountFor(leader.id, bundle.accounts, "instagram")))}
        ${cell(style, accountCell(accountFor(leader.id, bundle.accounts, "x")))}
        ${cell(style, accountCell(accountFor(leader.id, bundle.accounts, "youtube")))}
        ${cell(style, briefing)}
      </Row>`;
    })
    .join("");

  const socialRowsXml = bundle.accounts
    .map((account, index) => {
      const style = index % 2 === 0 ? "sOdd" : "sEven";
      const leader = bundle.leaders.find((row) => row.id === account.personId);
      const briefing = accountBriefing(account, leader?.name);
      const height = rowHeightFor(briefing, 42);
      const platform = PLATFORM_LABEL[String(account.platform || "").toLowerCase()] || account.platform || "";
      const url = String(account.profileUrl || "").includes("none.invalid") ? "" : account.profileUrl || "";
      return `<Row ss:AutoFitHeight="1" ss:Height="${height}">
        ${cell(style, index + 1, "Number")}
        ${cell(style, leader?.name || account.leaderName || "")}
        ${cell(style, platform)}
        ${cell(style, url)}
        ${cell(style, String(account.accountIdentifier || "").replace(/^@/, ""))}
        ${cell(style, account.followers ?? "", account.followers != null ? "Number" : "String")}
        ${cell(style, String(account.verificationStatus || "").replace(/_/g, " "))}
        ${cell(style, briefing)}
      </Row>`;
    })
    .join("");

  const constRowsXml = bundle.constituencies
    .map((row, index) => {
      const style = index % 2 === 0 ? "sOdd" : "sEven";
      const name = row.assemblyName || bundle.assemblyName?.(row.assemblyConstituencyId) || row.assemblyConstituencyId || "";
      const district = row.districtName || bundle.districtName || row.districtId || "";
      const briefing = [
        `${name}${district ? ` in ${district}` : ""}.`,
        row.totalVoters != null ? `${Number(row.totalVoters).toLocaleString("en-IN")} voters.` : "",
        row.ruralPercent != null ? `About ${row.ruralPercent}% rural.` : "",
        row.estimatedFacebookUsers != null ? `Estimated Facebook users: ${Number(row.estimatedFacebookUsers).toLocaleString("en-IN")}.` : "",
        row.estimatedInstagramUsers != null ? `Estimated Instagram users: ${Number(row.estimatedInstagramUsers).toLocaleString("en-IN")}.` : ""
      ]
        .filter(Boolean)
        .join(" ");
      const height = rowHeightFor(briefing, 42);
      return `<Row ss:AutoFitHeight="1" ss:Height="${height}">
        ${cell(style, index + 1, "Number")}
        ${cell(style, name)}
        ${cell(style, district)}
        ${cell(style, row.totalVoters ?? "", row.totalVoters != null ? "Number" : "String")}
        ${cell(style, row.ruralPercent ?? "", row.ruralPercent != null ? "Number" : "String")}
        ${cell(style, row.estimatedFacebookUsers ?? "", row.estimatedFacebookUsers != null ? "Number" : "String")}
        ${cell(style, row.estimatedInstagramUsers ?? "", row.estimatedInstagramUsers != null ? "Number" : "String")}
        ${cell(style, row.estimatedXUsers ?? "", row.estimatedXUsers != null ? "Number" : "String")}
        ${cell(style, row.estimatedYouTubeUsers ?? "", row.estimatedYouTubeUsers != null ? "Number" : "String")}
        ${cell(style, briefing)}
      </Row>`;
    })
    .join("");

  const csvDetailRows = buildPiCsvDetailRows(bundle);
  const csvDetailRowsXml = csvDetailRows
    .map((row, index) => {
      const style = index % 2 === 0 ? "sOdd" : "sEven";
      const height = rowHeightFor(row.aiBriefing || row.remarks || row.leaderName, 42);
      return `<Row ss:AutoFitHeight="1" ss:Height="${height}">
        ${PI_CSV_COLUMNS.map((col) => cell(style, row[col.key] || "")).join("")}
      </Row>`;
    })
    .join("");

  const briefingHeight = rowHeightFor(overview, 90);
  const titleRow = (cols: number, title: string) => `<Row ss:Height="28">
      <Cell ss:StyleID="sTitle" ss:MergeAcross="${Math.max(cols - 1, 0)}"><Data ss:Type="String">${xmlEscape(title)}</Data></Cell>
    </Row>`;
  const subRow = (cols: number, text: string) => `<Row ss:Height="18">
      <Cell ss:StyleID="sSub" ss:MergeAcross="${Math.max(cols - 1, 0)}"><Data ss:Type="String">${xmlEscape(text)}</Data></Cell>
    </Row>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>LeaderLens Political Intelligence</Title>
    <Author>LeaderLens</Author>
    <Company>LeaderLens</Company>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
    </Style>
    <Style ss:ID="sTitle">
      <Alignment ss:Vertical="Center" ss:Horizontal="Left" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="${GOLD}"/>
      <Interior ss:Color="${NAVY}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sSub">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${CREAM}"/>
      <Interior ss:Color="${NAVY_MID}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sHead">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="${NAVY}"/>
      <Interior ss:Color="${GOLD}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sOdd">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
      <Interior ss:Color="${CREAM}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sEven">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${TEXT}"/>
      <Interior ss:Color="${ROW_ALT}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sBrief">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${TEXT}"/>
      <Interior ss:Color="${CREAM}" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="AI briefing">
    <Table ss:ExpandedColumnCount="1" ss:ExpandedRowCount="4" x:FullColumns="1" x:FullRows="1">
      <Column ss:AutoFitWidth="0" ss:Width="640"/>
      ${titleRow(1, `LeaderLens  ·  ${place} political intelligence`)}
      ${subRow(1, `AI-generated briefing  ·  ${bundle.leaders.length} leaders  ·  ${bundle.accounts.length} accounts  ·  ${dateLabel}`)}
      <Row ss:Height="22"><Cell ss:StyleID="sHead"><Data ss:Type="String">Readable summary</Data></Cell></Row>
      <Row ss:AutoFitHeight="1" ss:Height="${briefingHeight}"><Cell ss:StyleID="sBrief"><Data ss:Type="String">${xmlEscape(overview)}</Data></Cell></Row>
    </Table>
  </Worksheet>
  <Worksheet ss:Name="CSV details">
    <Table ss:ExpandedColumnCount="${PI_CSV_COLUMNS.length}" ss:ExpandedRowCount="${csvDetailRows.length + 3}" x:FullColumns="1" x:FullRows="1">
      ${colXml(PI_CSV_COLUMNS)}
      ${titleRow(PI_CSV_COLUMNS.length, "CSV details")}
      ${subRow(PI_CSV_COLUMNS.length, "Every collected field. Same columns as Import CSV — not a blank template. Cells wrap.")}
      ${headerXml(PI_CSV_COLUMNS)}
      ${csvDetailRowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="Leaders">
    <Table ss:ExpandedColumnCount="${leaderCols.length}" ss:ExpandedRowCount="${bundle.leaders.length + 3}" x:FullColumns="1" x:FullRows="1">
      ${colXml(leaderCols)}
      ${titleRow(leaderCols.length, "Leaders")}
      ${subRow(leaderCols.length, "Each cell wraps. The AI briefing column explains the leader in plain language.")}
      ${headerXml(leaderCols)}
      ${leaderRowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="Social accounts">
    <Table ss:ExpandedColumnCount="${socialCols.length}" ss:ExpandedRowCount="${bundle.accounts.length + 3}" x:FullColumns="1" x:FullRows="1">
      ${colXml(socialCols)}
      ${titleRow(socialCols.length, "Social accounts")}
      ${subRow(socialCols.length, "Facebook, Instagram, X / Twitter and YouTube. Profile links and briefings wrap in the cell.")}
      ${headerXml(socialCols)}
      ${socialRowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="Constituencies">
    <Table ss:ExpandedColumnCount="${constCols.length}" ss:ExpandedRowCount="${bundle.constituencies.length + 3}" x:FullColumns="1" x:FullRows="1">
      ${colXml(constCols)}
      ${titleRow(constCols.length, "Constituencies")}
      ${subRow(constCols.length, "Human-readable constituency estimates with wrapped AI briefings.")}
      ${headerXml(constCols)}
      ${constRowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;
}

export function downloadPiBriefingWorkbook(bundle: PiExportBundle): void {
  const { stamp, place } = exportStamp(bundle);
  triggerDownload(
    new Blob([buildPiBriefingWorkbookXml(bundle)], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    `LeaderLens_PI_export_${place}_${stamp}.xls`
  );
}

export function downloadPiCsvExport(bundle: PiExportBundle): void {
  const { stamp, place } = exportStamp(bundle);
  triggerDownload(
    new Blob([buildPiDetailCsv(bundle)], { type: "text/csv;charset=utf-8;" }),
    `LeaderLens_PI_export_${place}_${stamp}.csv`
  );
  window.setTimeout(() => downloadPiBriefingWorkbook(bundle), 300);
}
