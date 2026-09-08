import React from "react";
import { FileDown } from "lucide-react";
import { TicketPdfLang } from "../../utils/exportTicketPdf";

interface ExportPdfLangButtonsProps {
  onExport: (lang: TicketPdfLang) => void;
  exporting?: TicketPdfLang | null;
}

export const ExportPdfLangButtons: React.FC<ExportPdfLangButtonsProps> = ({
  onExport,
  exporting = null
}) => (
  <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-[#223348] bg-[#0B131E] p-1">
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#CBD5E1]">
      <FileDown className="w-3.5 h-3.5 text-[#D4A24C]" />
      Export PDF
    </span>
    <button
      type="button"
      onClick={() => onExport("en")}
      disabled={exporting !== null}
      className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-bold cursor-pointer disabled:opacity-60"
    >
      {exporting === "en" ? "Exporting…" : "English"}
    </button>
    <button
      type="button"
      onClick={() => onExport("te")}
      disabled={exporting !== null}
      className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-bold cursor-pointer disabled:opacity-60"
    >
      {exporting === "te" ? "Exporting…" : "Telugu"}
    </button>
  </div>
);
