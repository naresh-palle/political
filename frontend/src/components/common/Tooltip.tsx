import React, { useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <span
      className={`relative inline-flex items-center group cursor-help ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children || <Info className="w-3.5 h-3.5 text-[#888A93] hover:text-[#121316] transition-colors ml-1" />}
      
      {isVisible && (
        <span
          role="tooltip"
          className={`absolute z-50 w-64 p-2.5 text-xs font-normal text-white bg-[#1A1C20] rounded shadow-xl border border-[#30333A] leading-relaxed tracking-normal pointer-events-none transition-opacity ${positionClasses[position]}`}
        >
          {content}
          <span className="absolute w-2 h-2 bg-[#1A1C20] transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-[#30333A]" />
        </span>
      )}
    </span>
  );
};
