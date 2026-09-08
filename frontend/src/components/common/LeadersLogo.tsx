import React from "react";

export const LEADERS_LENS_GOLD = "#D4A24C";
export const LEADERS_LENS_NAME = "Leaders Lens";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/** Geometric aperture mark and wordmark, both gold #D4A24C. */
export const LeadersLogo: React.FC<LogoProps> = ({ size = 36, className = "", showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Leaders Lens logo"
      >
        <rect width="100" height="100" rx="18" fill="#0B131E" />
        <path
          d="M 22 22 L 36 22 L 36 64 L 68 64 L 68 78 L 22 78 Z"
          fill={LEADERS_LENS_GOLD}
        />
        <path
          d="M 46 22 L 92 22 L 92 78 L 78 78 L 78 36 L 46 36 Z"
          fill={LEADERS_LENS_GOLD}
        />
      </svg>

      {showText && (
        <span
          className="font-display font-semibold tracking-[-0.01em] leading-none"
          style={{ color: LEADERS_LENS_GOLD, fontSize: Math.max(16, Math.round(size * 0.55)) }}
        >
          {LEADERS_LENS_NAME}
        </span>
      )}
    </div>
  );
};
