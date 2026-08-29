import React, { useState, useEffect } from "react";
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
import { AuditReport, UserProfile, StateInfo, ParliamentInfo, AssemblyInfo, ElectedRepresentative, CandidateType } from "./types";
import { buildCompleteAudit, USER_PROFILES } from "./services/mockData";
import { PartyThemeProvider, usePartyTheme } from "./context/PartyThemeContext";

const AUTH_STORAGE_KEY = "leaders_lens_auth_user";
const ROUTE_STORAGE_KEY = "leaders_lens_route";
const PRODUCT_STORAGE_KEY = "leaders_lens_active_product";

export function App() {
  return <AppInner />;
}

function AppInner() {
  const [route, setRoute] = useState<"home" | "auth" | "app">(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY) as "home" | "auth" | "app" | null;
      if (savedUser && (savedRoute === "app" || !savedRoute)) {
        return "app";
      }
      return savedRoute || "home";
    } catch {
      return "home";
    }
  });

  const [viewState, setViewState] = useState<"select" | "loading" | "audit">("select");
  
  const [activeProduct, setActiveProduct] = useState<
    "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance"
  >(() => {
    try {
      const savedProduct = localStorage.getItem(PRODUCT_STORAGE_KEY);
      if (
        savedProduct &&
        ["pitch", "grievances", "volunteers", "webbuilder", "governance"].includes(savedProduct)
      ) {
        return savedProduct as any;
      }
    } catch {}
    return "pitch";
  });

  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {}
    return USER_PROFILES[0];
  });

  const [auditData, setAuditData] = useState<AuditReport | null>(null);

  const [selectedGeo, setSelectedGeo] = useState<{
    stateId: string;
    parliamentId: string;
    assemblyId: string;
    stateName?: string;
    parliamentName?: string;
    assemblyName?: string;
    assemblyObj?: AssemblyInfo | null;
    representative?: ElectedRepresentative | null;
    clientType?: CandidateType;
  }>({
    stateId: "AP",
    parliamentId: "KDP-PC",
    assemblyId: "KDP-AC",
    stateName: "Andhra Pradesh",
    parliamentName: "Kadapa",
    assemblyName: "Kadapa",
    assemblyObj: null,
    representative: null,
    clientType: "CURRENT_MLA"
  });

  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const isAdmin =
    currentProfile?.roleId === "SUPER_ADMIN" ||
    currentProfile?.roleId === "ADMIN" ||
    currentProfile?.role === "super_admin" ||
    currentProfile?.permissions?.canManageSystemUsers === true;

  const handleProductChange = (product: "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance") => {
    const targetProduct = product === "governance" && !isAdmin ? "pitch" : product;
    setActiveProduct(targetProduct);
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, targetProduct);
    } catch {}
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentProfile(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {}
    setRoute("app");
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROUTE_STORAGE_KEY);
      localStorage.removeItem(PRODUCT_STORAGE_KEY);
    } catch {}
    setRoute("home");
    setViewState("select");
  };

  const handleSwitchProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  };

  const handleStartAuditGeneration = (
    stateId: string,
    parliamentId: string,
    assemblyId: string,
    stateObj?: StateInfo,
    parliamentObj?: ParliamentInfo,
    assemblyObj?: AssemblyInfo | null,
    representative?: ElectedRepresentative | null,
    clientType?: CandidateType
  ) => {
    setSelectedGeo({
      stateId,
      parliamentId,
      assemblyId,
      stateName: stateObj?.name || stateId,
      parliamentName: parliamentObj?.name || parliamentId,
      assemblyName: assemblyObj?.name || assemblyId,
      assemblyObj: assemblyObj || null,
      representative: representative || null,
      clientType: clientType || "CURRENT_MLA"
    });
    setViewState("loading");
  };

  const handleLoadingComplete = () => {
    const report = buildCompleteAudit(
      selectedGeo.stateId,
      selectedGeo.parliamentId,
      selectedGeo.assemblyId,
      selectedGeo.assemblyObj,
      selectedGeo.stateName,
      selectedGeo.parliamentName,
      selectedGeo.representative,
      selectedGeo.clientType
    );
    setAuditData(report);
    setViewState("audit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetToSelect = () => {
    setViewState("select");
  };

  const isPartyUser = Boolean(currentProfile?.partyId);

  return (
    <PartyThemeProvider authenticatedUser={currentProfile}>
      <AppCanvas isPartyUser={isPartyUser}>
        {route === "home" ? (
          <HomePage onEnter={() => setRoute("auth")} />
        ) : route === "auth" ? (
          <AuthScreen
            onAuthenticated={handleAuthenticated}
            onBack={() => setRoute("home")}
          />
        ) : (
          <>
            {/* Top Global App Shell */}
            {!isPresentationMode && (
              <Navbar
                activeProduct={activeProduct}
                onProductChange={handleProductChange}
                isAuditView={viewState === "audit"}
                onResetToSelect={handleResetToSelect}
                currentProfile={currentProfile}
                onSwitchProfile={handleSwitchProfile}
                onGoHome={() => setRoute("home")}
                onSignOut={handleSignOut}
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
                      assemblyName={selectedGeo.assemblyName || "Constituency"}
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

              {/* Module 5: ROLE-BASED ACCESS & GOVERNANCE (ADMIN ONLY) */}
              {activeProduct === "governance" && isAdmin && (
                <RoleManagement
                  currentProfile={currentProfile}
                  onSwitchProfile={handleSwitchProfile}
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
      </AppCanvas>
    </PartyThemeProvider>
  );
}

function AppCanvas({
  isPartyUser,
  children
}: {
  isPartyUser: boolean;
  children: React.ReactNode;
}) {
  const { currentParty, isPartyThemeActive, partyBackground } = usePartyTheme();
  const bgImg = isPartyThemeActive
    ? (partyBackground || "./images/party-backgrounds/tdp-bg.jpg")
    : "./images/party-backgrounds/admin-bg.jpg";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative ${
        isPartyThemeActive
          ? "text-slate-900 selection:bg-black selection:text-white"
          : "bg-[#0B1A2C] text-[#F5EFE0] selection:bg-[#D4A24C] selection:text-black"
      }`}
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: isPartyThemeActive ? (currentParty?.lightBackground || "#FFFBEB") : "#0B1A2C",
        color: isPartyThemeActive ? (currentParty?.textColor || "#0F172A") : "#F5EFE0"
      }}
    >
      {/* Subtle translucent tint layer for party users or admin users to ensure high contrast */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${
          isPartyThemeActive ? "bg-white/30 backdrop-blur-[0.5px]" : "bg-[#0B1A2C]/65 backdrop-blur-[0.5px]"
        }`}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default App;
