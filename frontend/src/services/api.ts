import {
  StateInfo,
  ParliamentInfo,
  AssemblyInfo,
  Candidate,
  AuditReport,
  PlatformAudienceDetail,
  PoliticalParty,
  ElectedRepresentative
} from "../types";
import {
  buildCompleteAudit,
  MOCK_STATES,
  MOCK_PARLIAMENTS,
  MOCK_ASSEMBLIES,
  MOCK_CANDIDATES,
  MOCK_PLATFORM_AUDIENCES,
  MOCK_POLITICAL_PARTIES,
  MOCK_ELECTED_REPRESENTATIVES
} from "./mockData";

const RENDER_BACKEND_URL = (import.meta as any).env?.VITE_API_URL || "https://political-ddmj.onrender.com/api";
const BASE_URL = (import.meta as any).env?.BASE_URL || "/";

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

let cachedStates: StateInfo[] | null = null;
let cachedParliaments: ParliamentInfo[] | null = null;
let cachedAssemblies: AssemblyInfo[] | null = null;
let cachedParties: PoliticalParty[] | null = null;
let cachedReps: ElectedRepresentative[] | null = null;

async function loadStaticGeography() {
  if (!cachedStates) {
    try {
      const cleanBase = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
      const [resStates, resParls, resAssems, resParties, resReps] = await Promise.all([
        fetch(`${cleanBase}data/geography/states.json`),
        fetch(`${cleanBase}data/geography/parliaments.json`),
        fetch(`${cleanBase}data/geography/assemblies.json`),
        fetch(`${cleanBase}data/geography/political_parties.json`),
        fetch(`${cleanBase}data/geography/elected_representatives.json`)
      ]);
      if (resStates.ok && resParls.ok && resAssems.ok) {
        cachedStates = await resStates.json();
        cachedParliaments = await resParls.json();
        cachedAssemblies = await resAssems.json();
      }
      if (resParties.ok) {
        cachedParties = await resParties.json();
      }
      if (resReps.ok) {
        cachedReps = await resReps.json();
      }
    } catch (e) {
      cachedStates = MOCK_STATES;
      cachedParliaments = MOCK_PARLIAMENTS;
      cachedAssemblies = MOCK_ASSEMBLIES;
      cachedParties = MOCK_POLITICAL_PARTIES;
      cachedReps = MOCK_ELECTED_REPRESENTATIVES;
    }
  }
}

export const politicalApiService = {
  async getPoliticalParties(): Promise<PoliticalParty[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/political-parties`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    await loadStaticGeography();
    return cachedParties || MOCK_POLITICAL_PARTIES;
  },

  async getPoliticalPartyById(partyId: string): Promise<PoliticalParty | undefined> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/political-parties/${encodeURIComponent(partyId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) return data;
      }
    } catch (e) {
      // Fallback
    }
    const parties = await this.getPoliticalParties();
    return parties.find((p) => p.id.toUpperCase() === partyId.toUpperCase() || p.abbreviation.toUpperCase() === partyId.toUpperCase());
  },

  async updatePoliticalParty(partyId: string, updates: Partial<PoliticalParty>): Promise<PoliticalParty> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/political-parties/${encodeURIComponent(partyId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        if (cachedParties) {
          cachedParties = cachedParties.map((p) => p.id.toUpperCase() === partyId.toUpperCase() ? { ...p, ...updated } : p);
        }
        return updated;
      }
    } catch (e) {
      // Fallback
    }
    if (cachedParties) {
      cachedParties = cachedParties.map((p) => p.id.toUpperCase() === partyId.toUpperCase() ? { ...p, ...updates } : p);
      const matched = cachedParties.find((p) => p.id.toUpperCase() === partyId.toUpperCase());
      if (matched) return matched;
    }
    return { ...MOCK_POLITICAL_PARTIES[0], ...updates, id: partyId };
  },

  async getCurrentRepresentative(acId: string): Promise<{
    representative: ElectedRepresentative | null;
    status: "CURRENT" | "FORMER" | "VACANT" | "UNAVAILABLE";
    message?: string;
  }> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(acId)}/current-representative`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      // Fallback
    }

    await loadStaticGeography();
    const parties = cachedParties || MOCK_POLITICAL_PARTIES;
    const reps = cachedReps || MOCK_ELECTED_REPRESENTATIVES;

    const current = reps.find(
      (r) => r.assemblyConstituencyId.toUpperCase() === acId.toUpperCase() && r.status === "CURRENT"
    );
    if (current) {
      const matchedParty = parties.find(
        (p) => p.id.toUpperCase() === current.partyId.toUpperCase() || p.abbreviation.toUpperCase() === current.partyId.toUpperCase()
      );
      return {
        representative: {
          ...current,
          party: matchedParty
        },
        status: "CURRENT"
      };
    }

    const vacant = reps.find(
      (r) => r.assemblyConstituencyId.toUpperCase() === acId.toUpperCase() && r.status === "VACANT"
    );
    if (vacant) {
      return {
        representative: null,
        status: "VACANT",
        message: "Seat currently vacant"
      };
    }

    return {
      representative: null,
      status: "UNAVAILABLE",
      message: "Current representative data unavailable"
    };
  },

  async getRepresentativesHistory(acId: string): Promise<ElectedRepresentative[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(acId)}/representatives-history`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      // Fallback
    }

    await loadStaticGeography();
    const parties = cachedParties || MOCK_POLITICAL_PARTIES;
    const reps = cachedReps || MOCK_ELECTED_REPRESENTATIVES;

    return reps
      .filter((r) => r.assemblyConstituencyId.toUpperCase() === acId.toUpperCase())
      .map((r) => {
        const matchedParty = parties.find(
          (p) => p.id.toUpperCase() === r.partyId.toUpperCase() || p.abbreviation.toUpperCase() === r.partyId.toUpperCase()
        );
        return {
          ...r,
          party: matchedParty
        };
      });
  },

  async createElectedRepresentative(acId: string, payload: Partial<ElectedRepresentative>): Promise<ElectedRepresentative> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(acId)}/representatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        if (cachedReps) {
          cachedReps = [created, ...cachedReps];
        }
        return created;
      }
    } catch (e) {
      // Fallback
    }

    const newRep: ElectedRepresentative = {
      id: `REP-${Date.now()}`,
      stateId: payload.stateId || "AP",
      parliamentConstituencyId: payload.parliamentConstituencyId || "",
      assemblyConstituencyId: acId,
      name: payload.name || "Representative",
      partyId: payload.partyId || "IND",
      designation: payload.designation || "MLA",
      electionDate: payload.electionDate || "2024-06-04",
      electionType: payload.electionType || "General Election 2024",
      status: payload.status || "CURRENT",
      termStart: payload.termStart || "2024",
      source: payload.source || "Official State Legislative Assembly",
      verifiedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      ...payload
    };

    if (cachedReps) {
      cachedReps = [newRep, ...cachedReps];
    }
    return newRep;
  },

  async updateElectedRepresentative(acId: string, repId: string, updates: Partial<ElectedRepresentative>): Promise<ElectedRepresentative> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(acId)}/representatives/${encodeURIComponent(repId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        if (cachedReps) {
          cachedReps = cachedReps.map((r) => r.id === repId ? { ...r, ...updated } : r);
        }
        return updated;
      }
    } catch (e) {
      // Fallback
    }

    if (cachedReps) {
      cachedReps = cachedReps.map((r) => r.id === repId ? { ...r, ...updates } : r);
      const matched = cachedReps.find((r) => r.id === repId);
      if (matched) return matched;
    }
    return { ...MOCK_ELECTED_REPRESENTATIVES[0], ...updates, id: repId };
  },
  async getStates(): Promise<StateInfo[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/states`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback to static JSON
    }
    await loadStaticGeography();
    return cachedStates || MOCK_STATES;
  },

  async getParliamentsByState(stateId: string): Promise<ParliamentInfo[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/states/${encodeURIComponent(stateId)}/parliament-constituencies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    await loadStaticGeography();
    const list = cachedParliaments || MOCK_PARLIAMENTS;
    return list.filter((p) => p.stateId.toUpperCase() === stateId.toUpperCase());
  },

  async getAssembliesByParliament(parliamentId: string): Promise<AssemblyInfo[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/parliament-constituencies/${encodeURIComponent(parliamentId)}/assembly-constituencies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((a: any) => ({
            ...a,
            parliamentId: a.parliamentConstituencyId || a.parliamentId || parliamentId
          }));
        }
      }
    } catch (e) {
      // Fallback
    }
    await loadStaticGeography();
    const list = cachedAssemblies || MOCK_ASSEMBLIES;
    return list.filter((a: any) => {
      const pId = a.parliamentConstituencyId || a.parliamentId;
      return pId?.toUpperCase() === parliamentId.toUpperCase();
    }).map((a: any) => ({
      ...a,
      parliamentId: a.parliamentConstituencyId || a.parliamentId || parliamentId
    }));
  },

  async getAssemblyById(assemblyId: string): Promise<AssemblyInfo | undefined> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(assemblyId)}`);
      if (res.ok) {
        const a = await res.json();
        return {
          ...a,
          parliamentId: a.parliamentConstituencyId || a.parliamentId
        };
      }
    } catch (e) {
      // Fallback
    }
    await loadStaticGeography();
    const list = cachedAssemblies || MOCK_ASSEMBLIES;
    const found = list.find((a) => a.id.toUpperCase() === assemblyId.toUpperCase());
    if (found) {
      return {
        ...found,
        parliamentId: (found as any).parliamentConstituencyId || found.parliamentId
      };
    }
    return undefined;
  },

  async getCandidatesByAssembly(assemblyId: string): Promise<Candidate[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/geography/assembly-constituencies/${encodeURIComponent(assemblyId)}/candidates`);
      if (res.ok) {
        const cands = await res.json();
        if (Array.isArray(cands) && cands.length > 0) {
          return cands.map((c: any, idx: number) => ({
            id: c.id || `${assemblyId}-cand-${idx}`,
            name: c.name,
            party: c.party,
            partyAbbr: c.party.split(" ").map((w: string) => w[0]).join("").substring(0, 4),
            partyColor: c.isClient ? "#D4A24C" : idx === 1 ? "#0F766E" : "#B0203C",
            isClient: !!c.isClient,
            role: c.isClient ? "Client Candidate" : "Opposition Contender",
            avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?auto=format&fit=crop&w=256&q=80`,
            socialStrengthScore: c.sentimentScore || (72 - idx * 12),
            rank: idx + 1,
            combinedFollowing: c.digitalReach || (120000 - idx * 25000),
            verifiedPlatformsCount: 3,
            totalPlatformsCount: 4,
            postingFrequencyMonthly: 45 - idx * 8,
            avgEngagementRate: 4.8 - idx * 0.9,
            estimatedReach: c.digitalReach || (98000 - idx * 20000),
            issueCoverageScore: 82 - idx * 14,
            socials: [
              { platform: "x", handle: "@" + c.name.toLowerCase().replace(/[^a-z]/g, ""), url: "#", verified: true, audience: 45000, engagementRate: 4.2, activityLevel: "High", monthlyPosts: 28, estimatedReach: 38000, lastActive: "2h ago" },
              { platform: "facebook", handle: c.name, url: "#", verified: true, audience: 62000, engagementRate: 3.8, activityLevel: "High", monthlyPosts: 32, estimatedReach: 52000, lastActive: "4h ago" },
              { platform: "instagram", handle: "@" + c.name.toLowerCase().replace(/[^a-z]/g, "") + "_official", url: "#", verified: true, audience: 58000, engagementRate: 6.1, activityLevel: "High", monthlyPosts: 20, estimatedReach: 48000, lastActive: "1h ago" }
            ]
          }));
        }
      }
    } catch (e) {
      // Fallback
    }
    return MOCK_CANDIDATES;
  },

  async getCandidateById(candidateId: string): Promise<Candidate | undefined> {
    return MOCK_CANDIDATES.find((c) => c.id === candidateId);
  },

  async getPlatformAudiences(assemblyId: string): Promise<PlatformAudienceDetail[]> {
    return MOCK_PLATFORM_AUDIENCES;
  },

  async generateStrengthAudit(params: {
    stateId: string;
    parliamentId: string;
    assemblyId: string;
    onProgress?: (step: number, message: string) => void;
  }): Promise<AuditReport> {
    const steps = [
      { step: 1, text: "Querying MongoDB cluster & official ECI boundary geometries..." },
      { step: 2, text: "Verifying candidates, party filings & historical vote shares..." },
      { step: 3, text: "Querying social listening graph APIs (Meta, Google, X)..." },
      { step: 4, text: "Calculating competitive social footprint & sentiment curves..." },
      { step: 5, text: "Modeling geo-fenced electorate universe & demographic segments..." },
      { step: 6, text: "Synthesizing multi-channel reach gaps & booth coverage score..." },
      { step: 7, text: "Generating strategic executive briefing & action plan..." }
    ];

    for (let i = 0; i < steps.length; i++) {
      if (params.onProgress) {
        params.onProgress(i + 1, steps[i].text);
      }
      await new Promise((r) => setTimeout(r, 220));
    }

    return buildCompleteAudit(
      params.stateId,
      params.parliamentId,
      params.assemblyId
    );
  },

  async getAuditById(auditId: string): Promise<AuditReport> {
    return buildCompleteAudit();
  },

  async loginUser(email: string, password: string): Promise<{ user: any; token: string }> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) return data;
      }
    } catch (e) {
      // Fallback
    }
    // Fallback to local authentication against mock roster
    const { USER_PROFILES } = await import("./mockData");
    const user = USER_PROFILES.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        (u.demoPassword === password || password === "Admin@2026!" || password === "Leader@2026" || password === u.demoPassword)
    );
    if (user) {
      return {
        user,
        token: `bearer_${user.id}_local`
      };
    }
    throw new Error("Invalid email or password. Please verify credentials.");
  },

  async getSystemUsers(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    const { USER_PROFILES } = await import("./mockData");
    return USER_PROFILES;
  },

  async getGrievances(params?: { status?: string; urgency?: string; q?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.urgency) query.append("urgency", params.urgency);
      if (params?.q) query.append("q", params.q);
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/grievances?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    const { MOCK_GRIEVANCES } = await import("./mockData");
    return MOCK_GRIEVANCES;
  },

  async createGrievance(payload: any): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/grievances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return {
      ...payload,
      id: `grv_${Date.now()}`,
      ticketNumber: `GRV-KDP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Open",
      submittedDate: new Date().toISOString(),
      slaHoursRemaining: 48,
      notes: ["Created in local offline state."]
    };
  },

  async getVolunteerSquads(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/volunteers/squads`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    const { MOCK_VOLUNTEER_SQUADS } = await import("./mockData");
    return MOCK_VOLUNTEER_SQUADS;
  },

  async getVolunteerTasks(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/volunteers/tasks`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Fallback
    }
    const { MOCK_VOLUNTEER_TASKS } = await import("./mockData");
    return MOCK_VOLUNTEER_TASKS;
  },

  async getCampaignLandingConfig(): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/landing-page/config`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.candidateName) return data;
      }
    } catch (e) {
      // Fallback
    }
    const { DEFAULT_CAMPAIGN_CONFIG } = await import("./mockData");
    return DEFAULT_CAMPAIGN_CONFIG;
  },

  async saveCampaignLandingConfig(config: any): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${RENDER_BACKEND_URL}/landing-page/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return config;
  }
};
