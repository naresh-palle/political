import React from "react";
import { ShieldCheck, Database, Server, Lock } from "lucide-react";
import { LeadersLogo } from "../common/LeadersLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#D4A24C]/20 bg-[#071322] py-10 text-xs text-[#B9AF95] mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#1A3350]">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-[5px] overflow-hidden">
              <LeadersLogo size={28} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base tracking-[-0.01em] text-[#F5EFE0] leading-none">
                Leader's<span className="italic gold-text"> Lens</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#D4A24C] font-semibold mt-0.5">
                Political Intelligence System
              </span>
            </div>
          </div>

          {/* Verification & Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-[11px]">
            <span className="inline-flex items-center text-[#B9AF95]">
              <Database className="w-3.5 h-3.5 mr-1.5 text-[#D4A24C]" />
              Official ECI Master Geography
            </span>
            <span className="inline-flex items-center text-[#B9AF95]">
              <Server className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              MongoDB Atlas Enterprise Cluster
            </span>
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Role-Based Access Clearance Active
            </span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7E8B9B]">
          <div>
            © {new Date().getFullYear()} Leader's Lens. All national constituency data sourced from official Election Commission of India Gazette.
          </div>
          <div className="flex items-center space-x-2 text-[#D8CFB8]">
            <span>Developed and Maintained by</span>
            <a
              href="https://palramai.in"
              target="_blank"
              rel="noreferrer"
              className="text-[#D4A24C] hover:underline font-semibold"
            >
              palramai.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
