import React, { useState } from "react";
import { AuditReport } from "../../types";
import { X, Download, FileText, CheckCircle2, Printer } from "lucide-react";

interface ExportModalProps {
  audit: AuditReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  audit,
  isOpen,
  onClose
}) => {
  const [reportType, setReportType] = useState<"full" | "exec" | "memo">("full");
  const [includeMethodology, setIncludeMethodology] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-[#E0DED5] rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B]">
              Intelligence Export
            </span>
            <h3 className="font-editorial text-2xl font-normal text-[#112233]">
              Export Strategic Briefing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777B88] hover:text-[#112233] hover:bg-[#F2F1EB] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#686C7A]">
            Report Format
          </label>

          <div className="space-y-2.5">
            <label
              onClick={() => setReportType("full")}
              className={`flex items-start space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                reportType === "full"
                  ? "bg-[#FAF9F5] border-[#112233] ring-1 ring-[#112233]/20"
                  : "border-[#E5E3D8] hover:bg-[#FBFBF9]"
              }`}
            >
              <FileText className="w-4 h-4 text-[#112233] mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#112233]">
                  Full Strategic Strength Audit (Multi-Page PDF)
                </div>
                <div className="text-[11px] text-[#696D7A] mt-0.5">
                  Complete report including candidates, voter penetration, funnel gap analysis, recommendations, and methodology provenance.
                </div>
              </div>
            </label>

            <label
              onClick={() => setReportType("exec")}
              className={`flex items-start space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                reportType === "exec"
                  ? "bg-[#FAF9F5] border-[#112233] ring-1 ring-[#112233]/20"
                  : "border-[#E5E3D8] hover:bg-[#FBFBF9]"
              }`}
            >
              <FileText className="w-4 h-4 text-[#112233] mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#112233]">
                  Executive 2-Page Briefing
                </div>
                <div className="text-[11px] text-[#696D7A] mt-0.5">
                  Streamlined executive summary, competitive standing, and top strategic recommendations.
                </div>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-[#ECEAE2]">
            <label className="flex items-center space-x-2 text-xs text-[#4E525F] cursor-pointer">
              <input
                type="checkbox"
                checked={includeMethodology}
                onChange={(e) => setIncludeMethodology(e.target.checked)}
                className="rounded border-[#D0CEBF] text-[#112233] focus:ring-[#112233]"
              />
              <span>Include Provenance and Confidence Appendix</span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-[#ECEAE2] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5B5F6C] hover:text-[#112233] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handlePrint}
            disabled={isExporting}
            className="inline-flex items-center px-5 py-2.5 bg-[#112233] text-[#FBFBF9] text-xs font-semibold rounded-lg hover:bg-[#07111D] transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>{isExporting ? "Preparing Print View..." : "Print / Save PDF Report"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
