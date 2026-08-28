import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

// Editorial "LL" mark — inset serif L with a warm gold arc representing "lens"
export const LeadersLogo: React.FC<LogoProps> = ({ size = 36, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Leader's Lens"
    >
      <defs>
        <linearGradient id="ll-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F2338" />
          <stop offset="100%" stopColor="#0B1A2C" />
        </linearGradient>
        <linearGradient id="ll-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0D08A" />
          <stop offset="60%" stopColor="#D4A24C" />
          <stop offset="100%" stopColor="#E07A1F" />
        </linearGradient>
      </defs>
      {/* Rounded plate */}
      <rect x="0.5" y="0.5" width="39" height="39" rx="8" fill="url(#ll-bg)" stroke="#D4A24C" strokeOpacity="0.35" />
      {/* Serif L */}
      <path
        d="M11.8 8.5 h4.1 v18.6 h9.3 v3.9 h-13.4 z"
        fill="#F5EFE0"
      />
      {/* Editorial arc (lens) */}
      <path
        d="M28 20 a8 8 0 0 1 -8 8"
        fill="none"
        stroke="url(#ll-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Emerald live pulse */}
      <circle cx="31.5" cy="8.5" r="2.4" fill="#10B981" />
      <circle cx="31.5" cy="8.5" r="4.2" fill="#10B981" fillOpacity="0.25" />
    </svg>
  );
};
