import React from "react";
import { ShieldCheck } from "lucide-react";

export type TrustLevel = "Verified" | "Estimated" | "Derived" | "Manual" | "Live";

interface TrustBadgeProps {
  level: TrustLevel;
  className?: string;
  size?: "xs" | "sm";
  showIcon?: boolean;
}

const tone: Record<TrustLevel, { bg: string; text: string; border: string; dot: string }> = {
  Verified:  { bg: "bg-emerald-50",   text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  Live:      { bg: "bg-emerald-50",   text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  Estimated: { bg: "bg-[#FDF5E6]",    text: "text-[#8A5A00]",   border: "border-[#F0D08A]",  dot: "bg-[#D4A24C]" },
  Derived:   { bg: "bg-[#F5EFE6]",    text: "text-[#7A5A2E]",   border: "border-[#E1D3B4]",  dot: "bg-[#B45309]" },
  Manual:    { bg: "bg-[#F2F1EA]",    text: "text-[#4A4E5A]",   border: "border-[#DEDDD5]",  dot: "bg-[#6C707D]" },
};

// Sits on dark backgrounds too — the badge is self-contained.
export const TrustBadge: React.FC<TrustBadgeProps> = ({ level, className = "", size = "xs", showIcon = false }) => {
  const t = tone[level];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10.5px]";
  return (
    <span
      data-testid={`trust-badge-${level.toLowerCase()}`}
      className={`inline-flex items-center gap-1 rounded-full border ${pad} font-semibold uppercase tracking-[0.14em] ${t.bg} ${t.text} ${t.border} ${className}`}
      title={`Data confidence: ${level}`}
    >
      {showIcon ? (
        <ShieldCheck className="w-3 h-3" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} aria-hidden />
      )}
      {level}
    </span>
  );
};

// Small circular verified seal for corner-of-card usage
export const VerifiedSeal: React.FC<{ level: TrustLevel; className?: string }> = ({ level, className = "" }) => {
  const t = tone[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${t.border} ${t.bg} ${t.text} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${className}`}
      title={`Data confidence: ${level}`}
    >
      <ShieldCheck className="w-2.5 h-2.5" />
      {level}
    </span>
  );
};
