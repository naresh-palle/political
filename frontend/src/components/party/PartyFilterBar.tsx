import React from "react";
import type { PartyFilters, PartyOverview } from "../../services/partyApi";
import { GAP_LABELS, PLATFORM_LABELS, PLATFORMS, inputCls, labelCls } from "./partyUi";

interface Props {
  filters: PartyFilters;
  options: PartyOverview["filters"] | null;
  onChange: (filters: PartyFilters) => void;
  showSearch?: boolean;
  showPlatform?: boolean;
  showGap?: boolean;
}

export const PartyFilterBar: React.FC<Props> = ({ filters, options, onChange, showSearch, showPlatform = true, showGap }) => {
  const set = (patch: PartyFilters) => onChange({ ...filters, ...patch });
  const assemblies = (options?.assemblies || []).filter((a) => !filters.districtId || a.districtId === filters.districtId);
  const active = Object.values(filters).some(Boolean);
  return (
    <div data-testid="party-filters" className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-4 items-end">
      {showSearch && (
        <div className="col-span-2">
          <label className={labelCls} htmlFor="party-search">Search</label>
          <input
            id="party-search"
            className={inputCls}
            placeholder="Name, email, phone, constituency"
            value={filters.q || ""}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
      )}
      <div>
        <label className={labelCls} htmlFor="party-district">District</label>
        <select
          id="party-district"
          className={inputCls}
          value={filters.districtId || ""}
          onChange={(e) => set({ districtId: e.target.value || undefined, assemblyConstituencyId: undefined })}
        >
          <option value="">All districts</option>
          {(options?.districts || []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor="party-assembly">Constituency</label>
        <select
          id="party-assembly"
          className={inputCls}
          value={filters.assemblyConstituencyId || ""}
          onChange={(e) => set({ assemblyConstituencyId: e.target.value || undefined })}
        >
          <option value="">All constituencies</option>
          {assemblies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor="party-role">Role</label>
        <select id="party-role" className={inputCls} value={filters.role || ""} onChange={(e) => set({ role: e.target.value || undefined })}>
          <option value="">All roles</option>
          {(options?.roles || []).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      {showPlatform && (
        <div>
          <label className={labelCls} htmlFor="party-platform">Platform</label>
          <select
            id="party-platform"
            className={inputCls}
            value={filters.platform || ""}
            onChange={(e) => set({ platform: e.target.value || undefined })}
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </select>
        </div>
      )}
      {showGap && (
        <div>
          <label className={labelCls} htmlFor="party-gap">Gap</label>
          <select id="party-gap" className={inputCls} value={filters.gap || ""} onChange={(e) => set({ gap: e.target.value || undefined })}>
            <option value="">Any</option>
            {Object.entries(GAP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}
      {active && (
        <div>
          <button
            type="button"
            onClick={() => onChange({})}
            className="w-full rounded-lg border border-[#C99436]/40 px-3 py-2 text-xs font-semibold text-[#F5EFE0] hover:bg-[#0C1524]"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
