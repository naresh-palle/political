import React, { useState } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./components/marketing/HomePage";
import { AuthScreen } from "./components/auth/AuthScreen";
import { LocationSelector } from "./components/pitch/LocationSelector";
import { AuditLoadingExperience } from "./components/pitch/AuditLoadingExperience";
import { AuditHeader } from "./components/audit/AuditHeader";
import { AuditNav } from "./components/audit/AuditNav";
import { OverviewSection } from "./components/audit/OverviewSection";
import { CandidateSection } from "./components/audit/CandidateSection";
import { SocialFootprintSection } from "./components/audit/SocialFootprintSection";
import { IssueIntelligenceSection } from "./components/audit/IssueIntelligenceSection";
import { OppositionSection } from "./components/audit/OppositionSection";
import { VoterReachSection } from "./components/audit/VoterReachSection";
import { DigitalAudienceSection } from "./components/audit/DigitalAudienceSection";
import { ReachGapSection } from "./components/audit/ReachGapSection";
import { RecommendationsSection } from "./components/audit/RecommendationsSection";
import { ScorecardSection } from "./components/audit/ScorecardSection";
import { DataConfidenceSection } from "./components/audit/DataConfidenceSection";
import { PresentationMode } from "./components/audit/PresentationMode";
import { ExportModal } from "./components/audit/ExportModal";
import { GrievanceManagement } from "./components/grievances/GrievanceManagement";
import { VolunteerMonitoring } from "./components/volunteers/VolunteerMonitoring";
import { CampaignWebsiteGenerator } from "./components/webbuilder/CampaignWebsiteGenerator";
import { RoleManagement } from "./components/governance/RoleManagement";
import { AuditReport, UserProfile } from "./types";
import { buildCompleteAudit, USER_PROFILES } from "./services/mockData";

export function App() {
  const [route, setRoute] = useState<"home" | "auth" | "app">("home");
  const [viewState, setViewState] = useState<"select" | "loading" | "audit">("select");
  const [activeProduct, setActiveProduct] = useState<
    "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance"
  >("pitch");

  const [currentProfile, setCurrentProfile] = useState<UserProfile>(USER_PROFILES[0]);
  const [auditData, setAuditData] = useState<AuditReport | null>(null);

  const [selectedGeo, setSelectedGeo] = useState({
    stateId: "AP",
    parliamentId: "KDP-PC",
    assemblyId: "KDP-AC"
  });

  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleStartAuditGeneration = (stateId: string, parliamentId: string, assemblyId: string) => {
    setSelectedGeo({ stateId, parliamentId, assemblyId });
    setViewState("loading");
  };

  const handleLoadingComplete = () => {
    const report = buildCompleteAudit(
      selectedGeo.stateId,
      selectedGeo.parliamentId,
      selectedGeo.assemblyId
    );
    setAuditData(report);
    setViewState("audit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetToSelect = () => {
    setViewState("select");
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#121316] flex flex-col font-sans selection:bg-[#0B1A2C] selection:text-white">
      {route === "home" ? (
        <HomePage onEnter={() => setRoute("auth")} />
      ) : route === "auth" ? (
        <AuthScreen onAuthenticated={(p) => { setCurrentProfile(p); setRoute("app"); }} />
      ) : (
        <>
      {/* Top Global App Shell */}
      {!isPresentationMode && (
        <Navbar
          activeProduct={activeProduct}
          onProductChange={(p) => setActiveProduct(p)}
          isAuditView={viewState === "audit"}
          onResetToSelect={handleResetToSelect}
          currentProfile={currentProfile}
        />
      )}

      {/* Main Platform Body */}
      <main className="flex-1">
        {/* Module 1: STRENGTH AUDIT */}
        {activeProduct === "pitch" && (
          <>
            {viewState === "select" && (
              <LocationSelector onGenerateAudit={handleStartAuditGeneration} />
            )}

            {viewState === "loading" && (
              <AuditLoadingExperience
                assemblyName="Kadapa"
                onComplete={handleLoadingComplete}
              />
            )}

            {viewState === "audit" && auditData && (
              <div className="animate-fadeIn">
                <AuditHeader
                  audit={auditData}
                  onEnterPresentationMode={() => setIsPresentationMode(true)}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                />

                <AuditNav />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
                  <OverviewSection audit={auditData} />
                  <CandidateSection candidates={auditData.candidates} />
                  <SocialFootprintSection client={auditData.client} />
                  <IssueIntelligenceSection issues={auditData.issues} />
                  <OppositionSection candidates={auditData.candidates} />
                  <VoterReachSection audit={auditData} />
                  <DigitalAudienceSection audit={auditData} />
                  <ReachGapSection audit={auditData} />
                  <RecommendationsSection recommendations={auditData.recommendations} />
                  <ScorecardSection
                    scorecard={auditData.scorecard}
                    overallScore={auditData.overallStrengthScore}
                  />
                  <DataConfidenceSection records={auditData.dataConfidence} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Module 2: GRIEVANCE MANAGEMENT CRM */}
        {activeProduct === "grievances" && <GrievanceManagement />}

        {/* Module 3: SOCIAL MEDIA VOLUNTEER MONITORING */}
        {activeProduct === "volunteers" && <VolunteerMonitoring />}

        {/* Module 4: CAMPAIGN WEBSITE GENERATOR */}
        {activeProduct === "webbuilder" && <CampaignWebsiteGenerator />}

        {/* Module 5: ROLE-BASED ACCESS & GOVERNANCE */}
        {activeProduct === "governance" && (
          <RoleManagement
            currentProfile={currentProfile}
            onSwitchProfile={(profile) => setCurrentProfile(profile)}
          />
        )}
      </main>

      {/* Global Footer */}
      {!isPresentationMode && <Footer />}

      {/* Presentation Mode Fullscreen Overlay */}
      {isPresentationMode && auditData && (
        <PresentationMode
          audit={auditData}
          onExit={() => setIsPresentationMode(false)}
        />
      )}

      {/* PDF Export Modal */}
      {isExportModalOpen && auditData && (
        <ExportModal
          audit={auditData}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
        </>
      )}
    </div>
  );
}

export default App;
