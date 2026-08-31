import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

// Official LEADERSLENS geometric aperture mark (Interlocking dual golden L-brackets)
export const LeadersLogo: React.FC<LogoProps> = ({ size = 36, className = "", showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Leader's Lens Logo"
      >
        <defs>
          <linearGradient id="ll-official-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E29C" />
            <stop offset="30%" stopColor="#E5B95C" />
            <stop offset="70%" stopColor="#C99436" />
            <stop offset="100%" stopColor="#9C6B1C" />
          </linearGradient>
          <linearGradient id="ll-bg-plate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B131E" />
            <stop offset="100%" stopColor="#050B12" />
          </linearGradient>
        </defs>

        {/* Deep Black/Navy Rounded Plate */}
        <rect width="100" height="100" rx="18" fill="url(#ll-bg-plate)" />

        {/* Upright Bottom-Left L */}
        <path
          d="M 22 22 L 36 22 L 36 64 L 68 64 L 68 78 L 22 78 Z"
          fill="url(#ll-official-gold)"
        />

        {/* Inverted Top-Right L */}
        <path
          d="M 46 22 L 92 22 L 92 78 L 78 78 L 78 36 L 46 36 Z"
          fill="url(#ll-official-gold)"
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-display font-bold tracking-[0.14em] text-base text-[#F5EFE0] leading-none uppercase">
            LEADERS<span className="gold-text">LENS</span>
          </span>
          <span className="text-[8.5px] uppercase tracking-[0.25em] text-[#D4A24C] font-semibold mt-1">
            CONSULTING
          </span>
        </div>
      )}
    </div>
  );
};
