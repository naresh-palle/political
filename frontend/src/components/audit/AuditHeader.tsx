import React, { useState } from "react";
import { AuditReport } from "../../types";
import { ConfidenceBadge } from "../common/Badge";
import { Presentation, Download, Share2, Check, RefreshCw } from "lucide-react";

interface AuditHeaderProps {
  audit: AuditReport;
  onEnterPresentationMode: () => void;
  onOpenExportModal: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({
  audit,
  onEnterPresentationMode,
  onOpenExportModal
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-b border-[#E3E1D7] bg-gradient-to-b from-[#FDF7E9] via-[#FBFBF9] to-[#FBFBF9] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E07A1F] via-[#D4A24C] to-[#0F766E]" aria-hidden />
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Left Title & Geo Hierarchy */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#797C88]">
            <span>Leader's Lens</span>
            <span>/</span>
            <span className="text-[#112233]">Constituency Strength Audit</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-normal text-[#0B1A2C] tracking-[-0.02em] leading-[0.98]">
            {audit.assembly.name} <span className="italic" style={{ color: "#B45309" }}>Assembly</span> Constituency
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#636775]">
            <span className="font-medium text-[#2E313A]">
              {audit.assembly.code}
            </span>
            <span>·</span>
            <span>{audit.parliament.name} Parliamentary Constituency</span>
            <span>·</span>
            <span>{audit.state.name}</span>
          </div>
        </div>

        {/* Right Metadata & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 border-t lg:border-t-0 border-[#E8E6DE] pt-4 lg:pt-0">
          <div className="flex items-center space-x-4 text-xs text-[#6A6E7C]">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[#8A8E9B]">
                Audit Generated
              </span>
              <span className="font-medium text-[#112233] font-mono-data">
                {audit.generatedAt}
              </span>
            </div>

            <div className="border-l border-[#E5E3D8] pl-4">
              <span className="block text-[10px] uppercase tracking-wider text-[#8A8E9B] mb-0.5">
                Data Provenance
              </span>
              <ConfidenceBadge level={audit.freshness} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={onEnterPresentationMode}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-[#D5D3C8] text-[#112233] hover:bg-[#F2F1EB] transition-colors shadow-2xs cursor-pointer"
              title="Open distraction-free executive presentation"
            >
              <Presentation className="w-3.5 h-3.5 mr-1.5 text-[#112233]" />
              Presentation Mode
            </button>

            <button
              onClick={onOpenExportModal}
              data-testid="export-report-btn"
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] hover:brightness-110 transition-all cursor-pointer shadow-[0_6px_20px_-6px_rgba(224,122,31,0.5)]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-[#5E626E] hover:text-[#112233] bg-white border border-[#D5D3C8] rounded-lg hover:bg-[#F2F1EB] transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
