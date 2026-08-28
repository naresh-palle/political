import React from "react";
import { ShieldCheck, Database, FileText } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E8E7E0] bg-[#F7F6F1] py-8 text-xs text-[#7A7D8A] mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-editorial text-sm font-semibold text-[#112233]">
            Leader's Lens
          </span>
          <span>—</span>
          <span>Constituency Political Strength Intelligence Platform</span>
        </div>

        <div className="flex items-center space-x-6">
          <span className="inline-flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-[#8A8E9C]" />
            ECI Rolls & Meta Graph API
          </span>
          <span className="inline-flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Confidential Client Briefing
          </span>
        </div>
      </div>
    </footer>
  );
};
