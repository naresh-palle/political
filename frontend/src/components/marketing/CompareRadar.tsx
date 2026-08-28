import React from "react";
import { AssemblyInfo } from "../../types";

interface CompareRadarProps {
  left: AssemblyInfo;
  right: AssemblyInfo;
  size?: number;
}

/** Normalise a value to 0-1 relative to a reference max */
const norm = (value: number, max: number) => Math.min(1, Math.max(0, value / (max || 1)));

/**
 * 5-axis radar overlay:
 *   1. Electorate size
 *   2. Digital audience
 *   3. Candidate field
 *   4. Digital-to-voter ratio
 *   5. Estimated coverage headroom
 */
export const CompareRadar: React.FC<CompareRadarProps> = ({ left, right, size = 320 }) => {
  const axes = [
    { key: "voters",       label: "Voters" },
    { key: "digital",      label: "Digital" },
    { key: "candidates",   label: "Candidates" },
    { key: "ratio",        label: "Digital / voter" },
    { key: "headroom",     label: "Headroom" },
  ];

  // reference maxima for normalisation (shared across both sides)
  const maxVoters = Math.max(left.totalVoters, right.totalVoters, 300000);
  const maxDigital = Math.max(left.estimatedDigitalAudience, right.estimatedDigitalAudience, 550000);
  const maxCandidates = Math.max(left.candidateCount, right.candidateCount, 6);
  const maxRatio = 2.5; // digital/voter reference ceiling
  const maxHeadroom = 1; // (1 - voters/digital) always 0-1

  const values = (ac: AssemblyInfo) => {
    const ratio = ac.estimatedDigitalAudience / Math.max(ac.totalVoters, 1);
    const headroom = 1 - ac.totalVoters / Math.max(ac.estimatedDigitalAudience, 1);
    return [
      norm(ac.totalVoters, maxVoters),
      norm(ac.estimatedDigitalAudience, maxDigital),
      norm(ac.candidateCount, maxCandidates),
      norm(ratio, maxRatio),
      Math.max(0, headroom),
    ];
  };

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44;
  const step = (Math.PI * 2) / axes.length;
  const startAngle = -Math.PI / 2;

  const point = (i: number, r: number) => {
    const a = startAngle + step * i;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };

  const buildPath = (vals: number[]) =>
    vals
      .map((v, i) => {
        const [x, y] = point(i, v * radius);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative" data-testid="compare-radar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <defs>
          <radialGradient id="radar-fill-a" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#E07A1F" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0.25" />
          </radialGradient>
          <radialGradient id="radar-fill-b" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#5B8BC0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3A5170" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Grid rings */}
        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={axes
              .map((_, i) => {
                const [x, y] = point(i, lvl * radius);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#22405E"
            strokeOpacity={0.55}
            strokeDasharray={lvl === 1 ? "0" : "2 3"}
          />
        ))}

        {/* Axis spokes */}
        {axes.map((_, i) => {
          const [x, y] = point(i, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#22405E"
              strokeOpacity={0.5}
            />
          );
        })}

        {/* B first (behind) */}
        <path d={buildPath(values(right))} fill="url(#radar-fill-b)" stroke="#8AA6C7" strokeWidth={1.5} strokeOpacity={0.9} />
        {/* A on top */}
        <path d={buildPath(values(left))} fill="url(#radar-fill-a)" stroke="#E07A1F" strokeWidth={1.8} strokeOpacity={0.95} />

        {/* Value dots */}
        {values(left).map((v, i) => {
          const [x, y] = point(i, v * radius);
          return <circle key={`a-${i}`} cx={x} cy={y} r={3.5} fill="#F0D08A" stroke="#0B1A2C" strokeWidth={1.5} />;
        })}
        {values(right).map((v, i) => {
          const [x, y] = point(i, v * radius);
          return <circle key={`b-${i}`} cx={x} cy={y} r={3} fill="#B7CEE8" stroke="#0B1A2C" strokeWidth={1.5} />;
        })}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const [x, y] = point(i, radius + 20);
          const anchor = Math.abs(x - cx) < 6 ? "middle" : x < cx ? "end" : "start";
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="IBM Plex Sans, sans-serif"
              fontWeight="600"
              letterSpacing="0.14em"
              fill="#B9AF95"
              className="uppercase"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-1">
        <span className="inline-flex items-center gap-2 text-[11px] text-[#D8CFB8]">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#E07A1F] to-[#D4A24C]" />
          {left.name}
        </span>
        <span className="inline-flex items-center gap-2 text-[11px] text-[#B9AF95]">
          <span className="w-3 h-3 rounded-sm bg-[#8AA6C7]/70 border border-[#8AA6C7]" />
          {right.name}
        </span>
      </div>
    </div>
  );
};
