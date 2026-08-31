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
import { FieldOpsManager } from "./components/fieldops/FieldOpsManager";
import { GrievanceManagement } from "./components/grievances/GrievanceManagement";
import { VolunteerMonitoring } from "./components/volunteers/VolunteerMonitoring";
import { CampaignWebsiteGenerator } from "./components/webbuilder/CampaignWebsiteGenerator";
import { RoleManagement } from "./components/governance/RoleManagement";
import { AuditReport, UserProfile } from "./types";
import { buildCompleteAudit, USER_PROFILES } from "./services/mockData";
import { PartyThemeProvider, usePartyTheme } from "./context/PartyThemeContext";

const AUTH_STORAGE_KEY = "leaders_lens_auth_user";
const ROUTE_STORAGE_KEY = "leaders_lens_route";
const PRODUCT_STORAGE_KEY = "leaders_lens_active_product";

export function App() {
  return <AppInner />;
}

function AppInner() {
  const [route, setRoute] = useState<"auth" | "app">(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        return "app";
      }
      return "auth";
    } catch {
      return "auth";
    }
  });

  const [viewState, setViewState] = useState<"select" | "loading" | "audit">("select");
  
  const [activeProduct, setActiveProduct] = useState<
    "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance"
  >(() => {
    try {
      const savedProduct = localStorage.getItem(PRODUCT_STORAGE_KEY);
      if (
        savedProduct &&
        ["fieldops", "pitch", "grievances", "volunteers", "webbuilder", "governance"].includes(savedProduct)
      ) {
        return savedProduct as any;
      }
    } catch {}
    return "fieldops";
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
    assemblyName?: string;
  }>({
    stateId: "AP",
    parliamentId: "KDP-PC",
    assemblyId: "KDP-AC",
    assemblyName: "Kadapa"
  });

  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const primaryRole = currentProfile?.primaryRole || (
    currentProfile?.email === "admin@leaderslens.ai" || currentProfile?.roleId === "SUPER_ADMIN" || currentProfile?.role === "super_admin" || currentProfile?.isPlatformAdmin
      ? "SUPER_ADMIN"
      : currentProfile?.roleId === "ADMIN" || currentProfile?.role === "admin" || currentProfile?.isPoliticalAdmin
      ? "POLITICAL_ADMIN"
      : currentProfile?.roleId === "VOLUNTEER" || currentProfile?.role === "volunteer"
      ? "VOLUNTEER"
      : "DIRECTOR"
  );

  const isPlatformAdmin = currentProfile?.email === "admin@leaderslens.ai" || (primaryRole === "SUPER_ADMIN" && currentProfile?.isPlatformAdmin);
  const isPoliticalAdmin = !isPlatformAdmin && (primaryRole === "POLITICAL_ADMIN" || currentProfile?.isPoliticalAdmin);
  const isDirector = !isPlatformAdmin && !isPoliticalAdmin && (primaryRole === "DIRECTOR" || currentProfile?.roleId === "CAMPAIGN_MANAGER" || currentProfile?.role === "campaign_manager" || currentProfile?.roleId === "PARTY_ADMIN");
  const isVolunteer = !isPlatformAdmin && !isPoliticalAdmin && !isDirector && (primaryRole === "VOLUNTEER" || currentProfile?.roleId === "VOLUNTEER");
  const isAdmin = isPlatformAdmin || isPoliticalAdmin || isDirector;

  // Role routing enforcement:
  // - Platform Super Admin (admin@leaderslens.ai): All tabs (pitch, fieldops, grievances, volunteers, webbuilder, governance)
  // - Political Admin & Director: Field Operations, Grievances, User Management (governance) ONLY
  // - Volunteer: Field Operations, Grievances ONLY
  useEffect(() => {
    if (isVolunteer && !["fieldops", "grievances"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    } else if ((isPoliticalAdmin || isDirector) && !["fieldops", "grievances", "governance"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    }
  }, [isVolunteer, isPoliticalAdmin, isDirector, isPlatformAdmin, activeProduct]);

  const handleProductChange = (product: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance") => {
    let targetProduct = product;
    if (isVolunteer) {
      targetProduct = !["fieldops", "grievances"].includes(product) ? "fieldops" : product;
    } else if (isPoliticalAdmin || isDirector) {
      targetProduct = !["fieldops", "grievances", "governance"].includes(product) ? "fieldops" : product;
    } else if (!isPlatformAdmin) {
      targetProduct = "fieldops";
    }
    setActiveProduct(targetProduct);
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, targetProduct);
    } catch {}
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentProfile(user);
    const defaultProd = "fieldops";
    setActiveProduct(defaultProd);
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, defaultProd);
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
    setRoute("auth");
    setViewState("select");
  };

  const handleSwitchProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    const userRole = profile.primaryRole || (
      profile.email === "admin@leaderslens.ai" || profile.roleId === "SUPER_ADMIN" || profile.role === "super_admin" || profile.isPlatformAdmin
        ? "SUPER_ADMIN"
        : profile.roleId === "ADMIN" || profile.role === "admin" || profile.isPoliticalAdmin
        ? "POLITICAL_ADMIN"
        : profile.roleId === "VOLUNTEER" || profile.role === "volunteer"
        ? "VOLUNTEER"
        : "DIRECTOR"
    );

    if (userRole === "VOLUNTEER" && !["fieldops", "grievances"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    } else if ((userRole === "POLITICAL_ADMIN" || userRole === "DIRECTOR") && !["fieldops", "grievances", "governance"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  };

  const handleStartAuditGeneration = (
    stateId: string,
    parliamentId: string,
    assemblyId: string,
    _stateObj?: any,
    _parliamentObj?: any,
    assemblyObj?: any
  ) => {
    setSelectedGeo({
      stateId,
      parliamentId,
      assemblyId,
      assemblyName: assemblyObj?.name || assemblyId
    });

    setViewState("loading");
  };

  const handleLoadingComplete = () => {
    const freshAudit = buildCompleteAudit(
      selectedGeo.stateId,
      selectedGeo.parliamentId,
      selectedGeo.assemblyId
    );
    setAuditData(freshAudit);
    setViewState("audit");
  };

  const handleResetToSelect = () => {
    setViewState("select");
    setAuditData(null);
  };

  return (
    <PartyThemeProvider authenticatedUser={currentProfile}>
      <AppCanvas>
        {route === "auth" && (
          <AuthScreen
            onAuthenticated={handleAuthenticated}
          />
        )}

        {route === "app" && (
          <>
            <Navbar
              activeProduct={activeProduct}
              onProductChange={handleProductChange}
              isAuditView={viewState === "audit"}
              onResetToSelect={handleResetToSelect}
              currentProfile={currentProfile}
              onSwitchProfile={handleSwitchProfile}
              onSignOut={handleSignOut}
            />

            <main className="flex-1 w-full overflow-x-hidden">
              {/* Module 1: FIELD OPERATIONS & RBAC (ADMIN -> DIRECTOR -> VOLUNTEER) */}
              {activeProduct === "fieldops" && (
                <FieldOpsManager currentUser={currentProfile} />
              )}

              {/* Module 2: PITCH / CONSTITUENCY AUDIT (ADMIN ONLY) */}
              {activeProduct === "pitch" && isAdmin && (
                <>
                  {viewState === "select" && (
                    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <LocationSelector onGenerateAudit={handleStartAuditGeneration} />
                    </div>
                  )}

                  {viewState === "loading" && (
                    <div className="w-full px-3 sm:px-4">
                      <AuditLoadingExperience
                        assemblyName={selectedGeo.assemblyName || "Constituency"}
                        onComplete={handleLoadingComplete}
                      />
                    </div>
                  )}

                  {viewState === "audit" && auditData && (
                    <div className="animate-fadeIn w-full">
                      <AuditHeader
                        audit={auditData}
                        onEnterPresentationMode={() => setIsPresentationMode(true)}
                        onOpenExportModal={() => setIsExportModalOpen(true)}
                      />

                      <AuditNav />

                      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 space-y-2 py-4">
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

              {/* Module 3: GRIEVANCE MANAGEMENT CRM */}
              {activeProduct === "grievances" && (
                <GrievanceManagement currentProfile={currentProfile} />
              )}

              {/* Module 4: SOCIAL MEDIA VOLUNTEER MONITORING (ADMIN ONLY) */}
              {activeProduct === "volunteers" && isAdmin && <VolunteerMonitoring />}

              {/* Module 5: CAMPAIGN WEBSITE GENERATOR (ADMIN ONLY) */}
              {activeProduct === "webbuilder" && isAdmin && <CampaignWebsiteGenerator />}

              {/* Module 6: ROLE-BASED ACCESS & GOVERNANCE (ADMIN ONLY) */}
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
  children
}: {
  children: React.ReactNode;
}) {
  const { currentParty, isPartyThemeActive, partyBackground } = usePartyTheme();
  const bgImg = isPartyThemeActive
    ? (partyBackground || "./images/party-backgrounds/tdp-bg.jpg")
    : "./images/party-backgrounds/admin-bg.jpg";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative overflow-x-hidden ${
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
