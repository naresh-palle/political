import {
  StateInfo,
  ParliamentInfo,
  AssemblyInfo,
  Candidate,
  AuditReport,
  PlatformAudienceDetail
} from "../types";
import {
  MOCK_STATES,
  MOCK_PARLIAMENTS,
  MOCK_ASSEMBLIES,
  MOCK_CANDIDATES,
  MOCK_PLATFORM_AUDIENCES,
  buildCompleteAudit
} from "./mockData";

// Simulate network delay for realistic experience
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const politicalApiService = {
  async getStates(): Promise<StateInfo[]> {
    await delay(120);
    return MOCK_STATES;
  },

  async getParliamentsByState(stateId: string): Promise<ParliamentInfo[]> {
    await delay(150);
    return MOCK_PARLIAMENTS.filter((p) => p.stateId === stateId);
  },

  async getAssembliesByParliament(
    parliamentId: string
  ): Promise<AssemblyInfo[]> {
    await delay(150);
    return MOCK_ASSEMBLIES.filter((a) => a.parliamentId === parliamentId);
  },

  async getAssemblyById(assemblyId: string): Promise<AssemblyInfo | undefined> {
    await delay(100);
    return MOCK_ASSEMBLIES.find((a) => a.id === assemblyId);
  },

  async getCandidatesByAssembly(assemblyId: string): Promise<Candidate[]> {
    await delay(180);
    return MOCK_CANDIDATES;
  },

  async getCandidateById(candidateId: string): Promise<Candidate | undefined> {
    await delay(120);
    return MOCK_CANDIDATES.find((c) => c.id === candidateId);
  },

  async getPlatformAudiences(
    assemblyId: string
  ): Promise<PlatformAudienceDetail[]> {
    await delay(160);
    return MOCK_PLATFORM_AUDIENCES;
  },

  async generateStrengthAudit(params: {
    stateId: string;
    parliamentId: string;
    assemblyId: string;
    onProgress?: (step: number, message: string) => void;
  }): Promise<AuditReport> {
    const steps = [
      { step: 1, text: "Loading constituency boundaries & electoral roll data..." },
      { step: 2, text: "Identifying nominated candidates and filings..." },
      { step: 3, text: "Querying social graph APIs (Meta, Google, X)..." },
      { step: 4, text: "Calculating competitive social strength metrics..." },
      { step: 5, text: "Modeling geo-fenced digital audience universe..." },
      { step: 6, text: "Calculating multi-channel reach gaps & voter coverage..." },
      { step: 7, text: "Synthesizing strategic recommendations & scorecard..." }
    ];

    for (let i = 0; i < steps.length; i++) {
      if (params.onProgress) {
        params.onProgress(i + 1, steps[i].text);
      }
      await delay(280);
    }

    return buildCompleteAudit(
      params.stateId,
      params.parliamentId,
      params.assemblyId
    );
  },

  async getAuditById(auditId: string): Promise<AuditReport> {
    await delay(200);
    return buildCompleteAudit();
  }
};
