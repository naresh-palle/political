import React from "react";
import { Lightbulb, ArrowUpRight } from "lucide-react";

interface InsightCardProps {
  title?: string;
  insight: string;
  metricHighlight?: string;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = "WHAT THIS MEANS",
  insight,
  metricHighlight,
  className = ""
}) => {
  return (
    <div
      className={`border-l-2 border-[#C99436]/40 bg-[#F4F3ED] p-4 rounded-r-lg my-4 text-xs ${className}`}
    >
      <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5EFE0] mb-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-[#F5EFE0]" />
        <span>{title}</span>
      </div>
      <p className="text-xs text-[#333742] leading-relaxed font-sans">
        {insight}
      </p>
      {metricHighlight && (
        <div className="mt-2 text-[11px] font-mono-data font-semibold text-[#F5EFE0] flex items-center">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {metricHighlight}
        </div>
      )}
    </div>
  );
};
