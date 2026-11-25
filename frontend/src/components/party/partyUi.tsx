import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { PartyPlatform, PlatformState } from "../../services/partyApi";

export const PLATFORM_LABELS: Record<PartyPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube"
};

export const PLATFORM_SHORT: Record<PartyPlatform, string> = {
  facebook: "FB",
  instagram: "IG",
  x: "X",
  youtube: "YT"
};

export const PLATFORMS: PartyPlatform[] = ["facebook", "instagram", "x", "youtube"];

export const GAP_LABELS: Record<string, string> = {
  MISSING_ACCOUNT: "Missing account",
  UNVERIFIED_ACCOUNT: "Unverified account",
  INACTIVE: "Inactive",
  LOW_POSTING: "Low posting",
  MISSED_CAMPAIGN_POST: "Missed campaign post",
  INCOMPLETE_PROFILE: "Incomplete profile",
  STALE_DATA: "Stale data",
  NO_RESEARCH: "No research"
};

export function roleText(roles?: string[] | null): string {
  return (roles || []).map((r) => String(r).replace(/_/g, " ")).join(", ");
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  });
}

export function timeAgo(value?: string | null): string {
  if (!value) return "Never";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "Never";
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function toLocalInput(value?: string | null): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export const inputCls =
  "w-full min-w-0 rounded-lg bg-[#050B12] border border-[#C99436]/30 px-3 py-2 text-sm text-[#F5EFE0] placeholder:text-[#6B6F7B] focus:outline-none focus:border-[#C99436]";

export const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-[#B9AF95] mb-1";

export const Card: React.FC<{ className?: string; children: React.ReactNode; testId?: string }> = ({ className = "", children, testId }) => (
  <div data-testid={testId} className={`rounded-2xl border border-[#C99436]/25 bg-[#080E18]/90 p-3 sm:p-4 ${className}`}>{children}</div>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
    <div className="min-w-0">
      <h2 className="font-display text-lg sm:text-xl text-[#F9E29C] leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-[#B9AF95] mt-0.5">{subtitle}</p>}
    </div>
    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </div>
);

type BtnVariant = "gold" | "ghost" | "danger";

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; busy?: boolean }> = ({
  variant = "ghost",
  busy,
  className = "",
  children,
  disabled,
  ...rest
}) => {
  const styles: Record<BtnVariant, string> = {
    gold: "bg-gradient-to-r from-[#C99436] to-[#E5B869] text-[#050B12] font-bold hover:brightness-110",
    ghost: "border border-[#C99436]/40 text-[#F5EFE0] hover:bg-[#0C1524]",
    danger: "border border-rose-400/40 text-rose-200 hover:bg-rose-950/40"
  };
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export const Avatar: React.FC<{ name?: string; url?: string; size?: number }> = ({ name = "", url, size = 40 }) => {
  const [failed, setFailed] = React.useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="rounded-xl object-cover border border-[#C99436]/40 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-xl bg-[#0C1524] border border-[#C99436]/40 text-[#F9E29C] font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(11, size / 3) }}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
};

export function platformTone(status: string): string {
  if (status === "VERIFIED") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/40";
  if (status === "MISSING") return "bg-rose-500/10 text-rose-300 border-rose-400/40";
  if (status === "NO_ACCOUNT") return "bg-slate-500/15 text-slate-300 border-slate-400/30";
  if (status === "REJECTED") return "bg-rose-500/15 text-rose-200 border-rose-400/40";
  return "bg-amber-500/15 text-amber-200 border-amber-400/40";
}

export function platformStatusLabel(status: string): string {
  if (status === "VERIFIED") return "Verified";
  if (status === "MISSING") return "Missing";
  if (status === "NO_ACCOUNT") return "No account";
  if (status === "NEEDS_RECHECK") return "Recheck";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

export const PlatformChips: React.FC<{ platforms: Record<string, PlatformState>; withFollowers?: boolean }> = ({ platforms, withFollowers }) => (
  <div className="grid grid-cols-4 gap-1">
    {PLATFORMS.map((p) => {
      const state = platforms?.[p] || { status: "MISSING", followers: null };
      return (
        <div
          key={p}
          title={`${PLATFORM_LABELS[p]}: ${platformStatusLabel(state.status)}`}
          className={`rounded-md border px-1 py-1 text-center leading-tight ${platformTone(state.status)}`}
        >
          <div className="text-[10px] font-bold">{PLATFORM_SHORT[p]}</div>
          <div className="text-[9px]">{platformStatusLabel(state.status)}</div>
          {withFollowers && <div className="text-[9px] text-[#F5EFE0]/80">{formatNumber(state.followers)}</div>}
        </div>
      );
    })}
  </div>
);

export const GapChip: React.FC<{ type: string }> = ({ type }) => (
  <span className="inline-flex items-center rounded-full border border-rose-400/35 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-200 whitespace-nowrap">
    {GAP_LABELS[type] || type}
  </span>
);

export const CompletenessBar: React.FC<{ value: number }> = ({ value }) => {
  const tone = value >= 80 ? "from-emerald-400 to-emerald-300" : value >= 50 ? "from-[#C99436] to-[#F9E29C]" : "from-rose-500 to-rose-300";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[#0C1524] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="text-[10px] font-bold text-[#F5EFE0] w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
};

export const Kpi: React.FC<{ label: string; value: React.ReactNode; tone?: "gold" | "green" | "amber" | "rose"; onClick?: () => void; testId?: string }> = ({
  label,
  value,
  tone = "gold",
  onClick,
  testId
}) => {
  const tones = {
    gold: "text-[#F9E29C]",
    green: "text-emerald-300",
    amber: "text-amber-200",
    rose: "text-rose-300"
  };
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={!onClick}
      className="text-left rounded-2xl border border-[#C99436]/25 bg-[#080E18]/90 p-3 hover:border-[#C99436]/60 transition-colors disabled:cursor-default min-w-0"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B9AF95] leading-tight">{label}</div>
      <div className={`mt-1 font-display text-2xl sm:text-3xl ${tones[tone]}`}>{value}</div>
    </button>
  );
};

export const ErrorBanner: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) =>
  message ? (
    <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-0">{message}</span>
      {onRetry && (
        <Btn variant="danger" onClick={onRetry}>
          Retry
        </Btn>
      )}
    </div>
  ) : null;

export const Notice: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div role="status" className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-100">
      {message}
    </div>
  ) : null;

export const Loading: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#D4A24C]">
    <Loader2 className="w-4 h-4 animate-spin" />
    {label}
  </div>
);

export const Empty: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-xl border border-dashed border-[#C99436]/30 px-3 py-8 text-center text-xs text-[#B9AF95]">{message}</div>
);

export const Segmented: React.FC<{
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  testId?: string;
}> = ({ options, value, onChange, testId }) => (
  <div data-testid={testId} className="flex flex-wrap gap-1 rounded-xl border border-[#C99436]/25 bg-[#050B12] p-1">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
          value === o.id ? "bg-gradient-to-r from-[#C99436] to-[#E5B869] text-[#050B12]" : "text-[#CBD5E1] hover:bg-[#0C1524]"
        }`}
      >
        {o.label}
        {o.count !== undefined && <span className="ml-1 opacity-80">({o.count})</span>}
      </button>
    ))}
  </div>
);
