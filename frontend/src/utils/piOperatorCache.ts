const PREFIX = "ll_pi_operator_cache_v1_";

export type PiOperatorCache = {
  stateId: string;
  districtId: string;
  pcId: string;
  acId: string;
  entryGroup?: string;
  tab?: string;
  dashboard: any | null;
  constRows: any[];
  leaders: any[];
  accounts: any[];
  queue?: any[];
  savedAt: string;
};

function keyFor(userId: string) {
  return `${PREFIX}${userId || "anon"}`;
}

export function readPiOperatorCache(userId: string): PiOperatorCache | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as PiOperatorCache;
  } catch {
    return null;
  }
}

export function writePiOperatorCache(userId: string, patch: Partial<PiOperatorCache>) {
  try {
    const prev = readPiOperatorCache(userId) || {
      stateId: "AP",
      districtId: "",
      pcId: "",
      acId: "",
      dashboard: null,
      constRows: [],
      leaders: [],
      accounts: [],
      queue: [],
      savedAt: ""
    };
    const next: PiOperatorCache = {
      ...prev,
      ...patch,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch {
    // Private mode / quota — ignore; server persist is the source of truth.
  }
}

export function cacheHasPiData(cache: PiOperatorCache | null): boolean {
  if (!cache) return false;
  return Boolean(
    (cache.constRows && cache.constRows.length) ||
    (cache.leaders && cache.leaders.length) ||
    (cache.accounts && cache.accounts.length) ||
    (cache.dashboard && ((cache.dashboard.constituenciesEntered || 0) > 0 || (cache.dashboard.totalLeaders || 0) > 0 || (cache.dashboard.totalSocialAccounts || 0) > 0))
  );
}
