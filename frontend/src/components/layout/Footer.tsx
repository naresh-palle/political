import React from "react";
import { ShieldCheck, Database, Server, Lock } from "lucide-react";
import { LeadersLogo } from "../common/LeadersLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#C99436]/20 bg-[#050B12] py-8 text-xs text-[#B9AF95] mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-[5px] overflow-hidden">
              <LeadersLogo size={28} />
            </div>
            <div className="flex flex-col">
              <span className="font-mark text-base tracking-[0.14em] text-[#C99436] leading-none uppercase">
                Leaders Lens
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#C99436] font-semibold mt-0.5">
                Political Intelligence System
              </span>
            </div>
          </div>

          {/* Copyright & Attribution */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-[11.5px] text-[#8E9CAE]">
            <div>
              © {new Date().getFullYear()} Leaders Lens. All rights reserved.
            </div>
            <div className="flex items-center space-x-1.5 text-[#D8CFB8]">
              <span>Developed and Maintained by</span>
              <a
                href="https://palramai.in"
                target="_blank"
                rel="noreferrer"
                className="text-[#C99436] hover:underline font-semibold"
              >
                palramai.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
