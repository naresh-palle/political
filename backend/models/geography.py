from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone

class SourceMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    sourceName: str = "Election Commission of India"
    sourceDate: str = "2024"
    lastVerifiedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CountryModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str = "India"
    code: str = "IND"
    sourceMetadata: SourceMetadata = Field(default_factory=SourceMetadata)

class StateModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    countryId: str = "IND"
    name: str
    code: str
    type: Literal["STATE", "UNION_TERRITORY"] = "STATE"
    totalParliamentaryConstituencies: int
    totalAssemblyConstituencies: int
    isActive: bool = True
    sourceMetadata: SourceMetadata = Field(default_factory=SourceMetadata)

class ParliamentaryConstituencyModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    stateId: str
    number: int
    name: str
    code: str
    reservedCategory: Literal["GEN", "SC", "ST"] = "GEN"
    totalElectors: int = 1500000
    isActive: bool = True
    sourceMetadata: SourceMetadata = Field(default_factory=SourceMetadata)

class AssemblyConstituencyModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    stateId: str
    parliamentConstituencyId: str
    number: int
    name: str
    code: str
    reservedCategory: Literal["GEN", "SC", "ST"] = "GEN"
    totalVoters: int = 220000
    candidateCount: int = 4
    estimatedDigitalAudience: int = 95000
    isActive: bool = True
    sourceMetadata: SourceMetadata = Field(default_factory=SourceMetadata)

class CandidateModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assemblyId: str
    name: str
    party: str
    partySymbol: str
    candidateType: Literal["CLIENT", "PRIMARY_OPPOSITION", "SECONDARY_OPPOSITION", "OTHER"] = "OTHER"
    isClient: bool = False
    sentimentScore: float = 65.0
    digitalReach: int = 45000
    voterCoveragePercent: float = 24.5
    topIssues: List[str] = Field(default_factory=list)
