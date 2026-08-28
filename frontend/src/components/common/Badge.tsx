import React from "react";
import { ConfidenceLevel } from "../../types";

interface BadgeProps {
  type?: ConfidenceLevel | "default" | "party" | "status";
  label?: string;
  variant?: "solid" | "outline" | "subtle";
  className?: string;
  children?: React.ReactNode;
}

export const ConfidenceBadge: React.FC<{ level: ConfidenceLevel | "Live" | "Mixed"; className?: string }> = ({
  level,
  className = ""
}) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    Verified: {
      bg: "bg-[#ECFDF5]",
      text: "text-[#065F46]",
      border: "border-[#A7F3D0]"
    },
    Live: {
      bg: "bg-[#ECFDF5]",
      text: "text-[#065F46]",
      border: "border-[#A7F3D0]"
    },
    Estimated: {
      bg: "bg-[#EFF6FF]",
      text: "text-[#1E40AF]",
      border: "border-[#BFDBFE]"
    },
    Derived: {
      bg: "bg-[#F5F3FF]",
      text: "text-[#5B21B6]",
      border: "border-[#DDD6FE]"
    },
    Mixed: {
      bg: "bg-[#F5F3FF]",
      text: "text-[#5B21B6]",
      border: "border-[#DDD6FE]"
    },
    Manual: {
      bg: "bg-[#FFFBEB]",
      text: "text-[#92400E]",
      border: "border-[#FDE68A]"
    }
  };

  const style = styles[level] || styles.Estimated;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {level}
    </span>
  );
};

export const ActivityBadge: React.FC<{ level: "High" | "Medium" | "Moderate" | "Low" | "Inactive" }> = ({
  level
}) => {
  const map = {
    High: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-50 text-amber-800 border-amber-200",
    Moderate: "bg-blue-50 text-blue-800 border-blue-200",
    Low: "bg-slate-100 text-slate-700 border-slate-200",
    Inactive: "bg-rose-50 text-rose-800 border-rose-200"
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${map[level] || map.Low}`}
    >
      {level}
    </span>
  );
};
