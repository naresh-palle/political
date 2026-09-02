import React, { useState, useEffect, Suspense, lazy } from "react";
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
import { FieldOpsManager } from "./components/fieldops/FieldOpsManager";
import { AuditReport, UserProfile } from "./types";
import { buildCompleteAudit, USER_PROFILES } from "./services/mockData";
import { PartyThemeProvider, usePartyTheme } from "./context/PartyThemeContext";

// Lazy-loaded heavy route chunks for instant initial render
const GrievanceManagement = lazy(() => import("./components/grievances/GrievanceManagement").then(m => ({ default: m.GrievanceManagement })));
const VolunteerMonitoring = lazy(() => import("./components/volunteers/VolunteerMonitoring").then(m => ({ default: m.VolunteerMonitoring })));
const CampaignWebsiteGenerator = lazy(() => import("./components/webbuilder/CampaignWebsiteGenerator").then(m => ({ default: m.CampaignWebsiteGenerator })));
const RoleManagement = lazy(() => import("./components/governance/RoleManagement").then(m => ({ default: m.RoleManagement })));
const ContactDatabase = lazy(() => import("./components/contacts/ContactDatabase").then(m => ({ default: m.ContactDatabase })));
const ExportModal = lazy(() => import("./components/audit/ExportModal").then(m => ({ default: m.ExportModal })));

const AUTH_STORAGE_KEY = "leaders_lens_auth_user";
const ROUTE_STORAGE_KEY = "leaders_lens_route";
const PRODUCT_STORAGE_KEY = "leaders_lens_active_product";

type ActiveProductType = "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance" | "contacts" | "assigntickets";

const PRODUCT_TO_HASH_MAP: Record<ActiveProductType, string> = {
  fieldops: "#/field-ops",
  assigntickets: "#/assign-tickets",
  grievances: "#/grievances",
  volunteers: "#/volunteers",
  webbuilder: "#/web-builder",
  governance: "#/user-management",
  contacts: "#/contacts",
  pitch: "#/audit-pitch"
};

const HASH_TO_PRODUCT_MAP: Record<string, ActiveProductType> = {
  "#/field-ops": "fieldops",
  "#/fieldops": "fieldops",
  "#/assign-tickets": "assigntickets",
  "#/assigntickets": "assigntickets",
  "#/grievances": "grievances",
  "#/volunteers": "volunteers",
  "#/web-builder": "webbuilder",
  "#/webbuilder": "webbuilder",
  "#/governance": "governance",
  "#/user-management": "governance",
  "#/contacts": "contacts",
  "#/audit-pitch": "pitch",
  "#/pitch": "pitch"
};

export function App() {
  return <AppInner />;
}

function AppInner() {
  const [route, setRoute] = useState<"auth" | "app">(() => {
    const currentHash = window.location.hash.toLowerCase();
    if (currentHash === "#/login" || currentHash === "#/auth") {
      return "auth";
    }
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
  
  const [activeProduct, setActiveProduct] = useState<ActiveProductType>(() => {
    const currentHash = window.location.hash.toLowerCase();
    if (HASH_TO_PRODUCT_MAP[currentHash]) {
      return HASH_TO_PRODUCT_MAP[currentHash];
    }
    try {
      const savedProduct = localStorage.getItem(PRODUCT_STORAGE_KEY);
      if (
        savedProduct &&
        ["fieldops", "pitch", "grievances", "volunteers", "webbuilder", "governance", "contacts"].includes(savedProduct)
      ) {
        return savedProduct as ActiveProductType;
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

  // URL Hash Synchronization & Browser Title Sync
  useEffect(() => {
    let targetHash = "#/field-ops";
    if (route === "auth") {
      targetHash = "#/login";
      document.title = "Login & Security | Leader's Lens";
    } else {
      targetHash = PRODUCT_TO_HASH_MAP[activeProduct] || "#/field-ops";
      const titles: Record<ActiveProductType, string> = {
        fieldops: "Field Operations Command | Leader's Lens",
        assigntickets: "Assign Tickets & Complaints | Leader's Lens",
        grievances: "Grievance Management | Leader's Lens",
        volunteers: "Volunteer Field Force | Leader's Lens",
        webbuilder: "Campaign Web Builder | Leader's Lens",
        governance: "User & Role Governance | Leader's Lens",
        contacts: "Contact Database | Leader's Lens",
        pitch: "Audit & Strategy Command | Leader's Lens"
      };
      document.title = titles[activeProduct] || "Leader's Lens";
    }

    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, "", targetHash);
    }
  }, [route, activeProduct]);

  // Listen to browser Back/Forward navigation (`hashchange` event)
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash.toLowerCase();
      if (currentHash === "#/login" || currentHash === "#/auth") {
        setRoute("auth");
      } else if (HASH_TO_PRODUCT_MAP[currentHash]) {
        const prod = HASH_TO_PRODUCT_MAP[currentHash];
        setActiveProduct(prod);
        try {
          const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedUser) setRoute("app");
        } catch {}
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Role routing enforcement:
  // - Platform Super Admin (admin@leaderslens.ai): All tabs (pitch, fieldops, grievances, volunteers, webbuilder, governance, contacts)
  // - Political Admin & Director: Field Operations, Grievances, User Management (governance), Contact Database (contacts)
  // - Volunteer: Field Operations, Grievances, Contact Database (contacts)
  useEffect(() => {
    if (isVolunteer && !["fieldops", "assigntickets", "grievances", "contacts"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    } else if ((isPoliticalAdmin || isDirector) && !["fieldops", "assigntickets", "grievances", "governance", "contacts"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    }
  }, [isVolunteer, isPoliticalAdmin, isDirector, isPlatformAdmin, activeProduct]);

  const handleProductChange = (product: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance" | "contacts" | "assigntickets") => {
    let targetProduct = product;
    if (isVolunteer) {
      targetProduct = !["fieldops", "assigntickets", "grievances", "contacts"].includes(product) ? "fieldops" : product;
    } else if (isPoliticalAdmin || isDirector) {
      targetProduct = !["fieldops", "assigntickets", "grievances", "governance", "contacts"].includes(product) ? "fieldops" : product;
    } else if (!isPlatformAdmin) {
      targetProduct = ["contacts", "fieldops", "assigntickets", "grievances"].includes(product) ? product : "fieldops";
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

    if (userRole === "VOLUNTEER" && !["fieldops", "grievances", "contacts"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    } else if ((userRole === "POLITICAL_ADMIN" || userRole === "DIRECTOR") && !["fieldops", "grievances", "governance", "contacts"].includes(activeProduct)) {
      setActiveProduct("fieldops");
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, "fieldops");
      } catch {}
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentProfile(updated);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    // Update USER_PROFILES in memory
    const idx = USER_PROFILES.findIndex((u) => u.id === updated.id);
    if (idx !== -1) {
      USER_PROFILES[idx] = { ...USER_PROFILES[idx], ...updated };
    }
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
              onUpdateProfile={handleUpdateProfile}
              onSignOut={handleSignOut}
            />

            <main className="flex-1 w-full overflow-x-hidden">
              {/* Module 1: FIELD OPERATIONS & GROUND INTAKE */}
              {activeProduct === "fieldops" && (
                <FieldOpsManager currentUser={currentProfile} onUpdateProfile={handleUpdateProfile} />
              )}

              {/* Module 1b: ASSIGN TICKETS / UNASSIGNED COMPLAINTS */}
              {activeProduct === "assigntickets" && (
                <FieldOpsManager currentUser={currentProfile} initialFilter="NEW" onUpdateProfile={handleUpdateProfile} />
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

              {/* Lazy Loaded Auxiliary Modules wrapped in Suspense */}
              <Suspense fallback={<div className="p-12 text-center text-[#D4A24C] font-mono text-xs animate-pulse">Loading module component...</div>}>
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

                {/* Module 7: CONSTITUENCY CONTACT DATABASE & CITIZEN DIRECTORY */}
                {activeProduct === "contacts" && (
                  <ContactDatabase currentUser={currentProfile} />
                )}

                {/* PDF Export Modal */}
                {isExportModalOpen && auditData && (
                  <ExportModal
                    audit={auditData}
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                  />
                )}
              </Suspense>
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
  const { partyBackground } = usePartyTheme();
  const bgImg = partyBackground || "./images/india_parliament_bg.jpg";

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-all duration-500 relative overflow-x-hidden bg-[#071322] text-[#F8FAFC] selection:bg-[#D4A24C] selection:text-[#071322]"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "#071322",
        color: "#F8FAFC"
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[#060D17]/92 backdrop-blur-md"
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default App;
