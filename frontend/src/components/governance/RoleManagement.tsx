import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, PoliticalParty, ElectedRepresentative } from "../../types";
import { USER_PROFILES, MOCK_POLITICAL_PARTIES, MOCK_ELECTED_REPRESENTATIVES } from "../../services/mockData";
import { politicalApiService } from "../../services/api";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  Users,
  CheckCircle2,
  XCircle,
  KeyRound,
  FileCheck,
  SlidersHorizontal,
  History,
  Palette,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Eye,
  Layers,
  Award,
  Plus,
  ExternalLink,
  AlertCircle,
  Calendar,
  Building
} from "lucide-react";

interface RoleManagementProps {
  currentProfile: UserProfile;
  onSwitchProfile: (profile: UserProfile) => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  currentProfile,
  onSwitchProfile
}) => {
  const [activeTab, setActiveTab] = useState<"roles" | "branding" | "representatives" | "audit">("roles");
  const [profiles, setProfiles] = useState<UserProfile[]>(USER_PROFILES);
  const [parties, setParties] = useState<PoliticalParty[]>(MOCK_POLITICAL_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("TDP");
  
  // Customizer form state
  const [primaryColor, setPrimaryColor] = useState<string>("#FFD200");
  const [secondaryColor, setSecondaryColor] = useState<string>("#B45309");
  const [accentColor, setAccentColor] = useState<string>("#F59E0B");
  const [gradientStart, setGradientStart] = useState<string>("#FFD200");
  const [gradientEnd, setGradientEnd] = useState<string>("#EAB308");
  const [partyName, setPartyName] = useState<string>("Telugu Desam Party");
  const [partyAbbr, setPartyAbbr] = useState<string>("TDP");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [symbolEmoji, setSymbolEmoji] = useState<string>("🚲");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Representatives Ledger State
  const [ledgerAcId, setLedgerAcId] = useState<string>("KDP-AC");
  const [ledgerHistory, setLedgerHistory] = useState<ElectedRepresentative[]>([]);
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);
  const [repFormName, setRepFormName] = useState("");
  const [repFormPartyId, setRepFormPartyId] = useState("TDP");
  const [repFormDesignation, setRepFormDesignation] = useState("MLA");
  const [repFormElectionType, setRepFormElectionType] = useState("General Election 2024");
  const [repFormElectionDate, setRepFormElectionDate] = useState("2024-06-04");
  const [repFormStatus, setRepFormStatus] = useState<"CURRENT" | "FORMER" | "VACANT">("CURRENT");
  const [repFormTermStart, setRepFormTermStart] = useState("2024");
  const [repFormTermEnd, setRepFormTermEnd] = useState("");
  const [repFormReason, setRepFormReason] = useState("");
  const [repFormSource, setRepFormSource] = useState("Election Commission of India");
  const [repFormSourceUrl, setRepFormSourceUrl] = useState("");
  const [repFormPhotoUrl, setRepFormPhotoUrl] = useState("");
  const [isRepSaving, setIsRepSaving] = useState(false);
  const [repSaveSuccess, setRepSaveSuccess] = useState(false);
  // User Directory & RBAC State
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserRole>("field_strategist");
  const [userFormRoleTitle, setUserFormRoleTitle] = useState("");
  const [userFormDepartment, setUserFormDepartment] = useState("");
  const [userFormConstituency, setUserFormConstituency] = useState("");
  const [userFormClearance, setUserFormClearance] = useState<UserProfile["clearanceLevel"]>("Level 2 (Operations)");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormPermissions, setUserFormPermissions] = useState<UserProfile["permissions"]>({
    canExportReports: true,
    canEditStrategy: true,
    canManageVolunteers: true,
    canResolveGrievances: true,
    canPublishLandingPage: false,
    canViewConfidentialMetrics: true,
    canManageSystemUsers: false
  });
  const [userSaveSuccess, setUserSaveSuccess] = useState(false);
  const [selectedUserAudit, setSelectedUserAudit] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => {
      const users = await politicalApiService.getUsers();
      if (users && users.length > 0) {
        setProfiles(users);
      }
    })();
  }, []);

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormName("");
    setUserFormEmail("");
    setUserFormRole("field_strategist");
    setUserFormRoleTitle("Field Operations Strategist");
    setUserFormDepartment("Ground Operations");
    setUserFormConstituency("Kadapa AC (AC-132)");
    setUserFormClearance("Level 2 (Operations)");
    setUserFormPassword("Leader@2026");
    setUserFormPermissions({
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormRole(user.role);
    setUserFormRoleTitle(user.roleTitle);
    setUserFormDepartment(user.department || "");
    setUserFormConstituency(user.assignedConstituency);
    setUserFormClearance(user.clearanceLevel);
    setUserFormPassword(user.demoPassword || "Demo@2026");
    setUserFormPermissions({ ...user.permissions });
    setIsUserModalOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaveSuccess(true);

    if (editingUser) {
      // Update existing user
      const updated: UserProfile = {
        ...editingUser,
        name: userFormName,
        email: userFormEmail,
        role: userFormRole,
        roleTitle: userFormRoleTitle,
        department: userFormDepartment,
        assignedConstituency: userFormConstituency,
        clearanceLevel: userFormClearance,
        demoPassword: userFormPassword,
        permissions: { ...userFormPermissions }
      };
      setProfiles((prev) => prev.map((u) => u.id === editingUser.id ? updated : u));
    } else {
      // Create new user
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: userFormName,
        email: userFormEmail,
        role: userFormRole,
        roleTitle: userFormRoleTitle,
        department: userFormDepartment,
        assignedConstituency: userFormConstituency,
        clearanceLevel: userFormClearance,
        demoPassword: userFormPassword,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80",
        permissions: { ...userFormPermissions }
      };
      setProfiles((prev) => [...prev, newUser]);
    }

    setTimeout(() => {
      setUserSaveSuccess(false);
      setIsUserModalOpen(false);
    }, 1000);
  };

  const filteredUsers = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.assignedConstituency.toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === "ALL" || p.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    (async () => {
      const fetched = await politicalApiService.getPoliticalParties();
      if (fetched && fetched.length > 0) {
        setParties(fetched);
        const tdp = fetched.find((p) => p.id === "TDP") || fetched[0];
        setSelectedPartyId(tdp.id);
        loadPartyToForm(tdp);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const history = await politicalApiService.getRepresentativesHistory(ledgerAcId);
      setLedgerHistory(history);
    })();
  }, [ledgerAcId]);

  const handleSaveRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRepSaving(true);
    setRepSaveSuccess(false);

    const payload: Partial<ElectedRepresentative> = {
      id: `REP-${ledgerAcId}-${Date.now()}`,
      assemblyConstituencyId: ledgerAcId,
      name: repFormName,
      partyId: repFormPartyId,
      designation: repFormDesignation,
      electionType: repFormElectionType,
      electionDate: repFormElectionDate,
      status: repFormStatus,
      termStart: repFormTermStart,
      termEnd: repFormTermEnd || undefined,
      reasonForChange: repFormReason || undefined,
      source: repFormSource,
      sourceUrl: repFormSourceUrl || undefined,
      photoUrl: repFormPhotoUrl || undefined
    };

    try {
      await politicalApiService.createElectedRepresentative(ledgerAcId, payload);
      const updatedHistory = await politicalApiService.getRepresentativesHistory(ledgerAcId);
      setLedgerHistory(updatedHistory);
      setRepSaveSuccess(true);
      setTimeout(() => {
        setRepSaveSuccess(false);
        setIsRepModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to save representative", err);
    } finally {
      setIsRepSaving(false);
    }
  };

  const handleMarkVacant = async () => {
    if (!window.confirm("Are you sure you want to mark this constituency seat as officially VACANT?")) return;
    setIsRepSaving(true);
    try {
      await politicalApiService.createElectedRepresentative(ledgerAcId, {
        id: `REP-${ledgerAcId}-VACANT-${Date.now()}`,
        assemblyConstituencyId: ledgerAcId,
        name: "Seat Vacant",
        partyId: "IND",
        designation: "Vacant Seat",
        status: "VACANT",
        termStart: String(new Date().getFullYear()),
        source: "Official Legislative Assembly Gazette"
      });
      const updatedHistory = await politicalApiService.getRepresentativesHistory(ledgerAcId);
      setLedgerHistory(updatedHistory);
    } catch (err) {
      console.error("Failed to mark seat vacant", err);
    } finally {
      setIsRepSaving(false);
    }
  };

  const loadPartyToForm = (p: PoliticalParty) => {
    setPrimaryColor(p.primaryColor || "#FFD200");
    setSecondaryColor(p.secondaryColor || "#B45309");
    setAccentColor(p.accentColor || "#F59E0B");
    setGradientStart(p.gradientStart || p.primaryColor || "#FFD200");
    setGradientEnd(p.gradientEnd || p.secondaryColor || "#EAB308");
    setPartyName(p.name);
    setPartyAbbr(p.abbreviation || p.shortName);
    setLogoUrl(p.logoUrl || "");
    setSymbolEmoji(p.symbolEmoji || "🏛️");
  };

  const handleSelectParty = (partyId: string) => {
    setSelectedPartyId(partyId);
    const found = parties.find((p) => p.id === partyId);
    if (found) {
      loadPartyToForm(found);
    }
  };

  const applyLiveTheme = () => {
    document.documentElement.style.setProperty("--party-primary", primaryColor);
    document.documentElement.style.setProperty("--party-secondary", secondaryColor);
    document.documentElement.style.setProperty("--party-accent", accentColor);
    document.documentElement.style.setProperty("--party-gradient-start", gradientStart);
    document.documentElement.style.setProperty("--party-gradient-end", gradientEnd);
  };

  const handleSavePartyBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    applyLiveTheme();

    const updates: Partial<PoliticalParty> = {
      name: partyName,
      abbreviation: partyAbbr,
      primaryColor,
      secondaryColor,
      accentColor,
      gradientStart,
      gradientEnd,
      logoUrl,
      symbolEmoji
    };

    try {
      const updated = await politicalApiService.updatePoliticalParty(selectedPartyId, updates);
      setParties((prev) => prev.map((p) => p.id === selectedPartyId ? { ...p, ...updated } : p));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update party branding", err);
    } finally {
      setIsSaving(false);
    }
  };

  const mockAuditLogs = [
    {
      time: "28 Aug, 21:05",
      user: "Naresh Palle (Campaign Director)",
      action: "Generated Full Strength Audit for Kadapa AC",
      status: "Authorized"
    },
    {
      time: "28 Aug, 19:40",
      user: "Ananya Sharma (Media Analyst)",
      action: "Exported Platform Gap Intelligence Briefing (PDF)",
      status: "Authorized"
    },
    {
      time: "28 Aug, 18:15",
      user: "Venkatesh Rao (Field Strategist)",
      action: "Dispatched WhatsApp Directive #tsk-1 to Central Squad",
      status: "Authorized"
    },
    {
      time: "28 Aug, 16:30",
      user: "Ramesh Babu (Volunteer Lead)",
      action: "Resolved Grievance Ticket #KDP-GRV-2026-894 (Transformer Load)",
      status: "Authorized"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E3D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#787B88]">
            <span>Governance & Security</span>
            <span>/</span>
            <span className="text-[#112233]">Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal mt-1">
            Access Control & Persona Switchboard
          </h1>
          <p className="text-xs sm:text-sm text-[#626674]">
            Simulate role-specific dashboards, confidentiality clearance levels, and operational permission matrices.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-[#E0DED5] rounded-xl px-4 py-2 shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#8A8E9B] block">Active Persona</span>
            <span className="text-xs font-bold text-[#112233]">{currentProfile.name}</span>
          </div>
          <span className="px-2 py-0.5 bg-[#112233] text-white text-[10px] font-bold rounded">
            {currentProfile.roleTitle}
          </span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E3D8] pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "roles"
              ? "bg-[#0B1A2C] text-[#F5EFE0] shadow-sm"
              : "text-[#626674] hover:bg-[#EFECE6] hover:text-[#112233]"
          }`}
        >
          <Users className="w-4 h-4 text-[#D4A24C]" />
          <span>User Management & RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "branding"
              ? "bg-[#B45309] text-white shadow-sm"
              : "text-[#626674] hover:bg-[#EFECE6] hover:text-[#112233]"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Party Branding & Color Customizer</span>
        </button>

        <button
          onClick={() => setActiveTab("representatives")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "representatives"
              ? "bg-[#1E3A5A] text-white shadow-sm"
              : "text-[#626674] hover:bg-[#EFECE6] hover:text-[#112233]"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Elected Representatives Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#112233] text-[#F5EFE0] shadow-sm"
              : "text-[#626674] hover:bg-[#EFECE6] hover:text-[#112233]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY & RBAC MANAGEMENT */}
      {activeTab === "roles" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Administrator Overview Card */}
          <div className="bg-[#0B1A2C] text-[#F5EFE0] rounded-2xl p-6 border border-[#D4A24C]/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentProfile.avatar}
                  alt={currentProfile.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D4A24C]"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-[#F5EFE0]">{currentProfile.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4A24C]/20 border border-[#D4A24C]/60 text-[#D4A24C]">
                      {currentProfile.clearanceLevel}
                    </span>
                  </div>
                  <div className="text-xs text-[#D8CFB8] mt-0.5">{currentProfile.roleTitle} · {currentProfile.department}</div>
                  <div className="text-[11px] text-[#8A8E9B] mt-1 flex items-center gap-2">
                    <span>Email: <strong className="text-[#F5EFE0] font-mono-data">{currentProfile.email}</strong></span>
                    <span>·</span>
                    <span>Jurisdiction: <strong className="text-[#F5EFE0]">{currentProfile.assignedConstituency}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7E8C] block">Total System Users</span>
              <div className="text-2xl font-bold font-mono-data text-[#112233] mt-1">{profiles.length}</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">100% Active Directory</span>
            </div>
            <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7E8C] block">Master Administrators</span>
              <div className="text-2xl font-bold font-mono-data text-[#112233] mt-1">
                {profiles.filter((p) => p.role === "super_admin").length}
              </div>
              <span className="text-[10px] text-[#8A8E9B] font-semibold mt-0.5 block">Tier 0 Security Clearance</span>
            </div>
            <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7E8C] block">Field & Strategy Leads</span>
              <div className="text-2xl font-bold font-mono-data text-[#112233] mt-1">
                {profiles.filter((p) => p.role !== "super_admin").length}
              </div>
              <span className="text-[10px] text-[#8A8E9B] font-semibold mt-0.5 block">Level 1 - 3 Operations</span>
            </div>
            <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7E8C] block">Audit Integrity</span>
              <div className="text-2xl font-bold font-mono-data text-emerald-700 mt-1">100%</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">RBAC Policies Enforced</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search user by name, email, constituency..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:outline-none focus:border-[#D4A24C] font-semibold text-[#112233]"
              >
                <option value="ALL">All Roles</option>
                <option value="super_admin">Master Administrator</option>
                <option value="campaign_director">Campaign Director</option>
                <option value="field_strategist">Field Strategist</option>
                <option value="media_analyst">Media Analyst</option>
                <option value="volunteer_lead">Volunteer Lead</option>
                <option value="booth_coordinator">Booth Coordinator</option>
              </select>

              <button
                type="button"
                onClick={handleOpenAddUser}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B1A2C] text-[#F5EFE0] hover:bg-[#142B45] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="bg-white border border-[#E0DED5] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#ECEAE2] text-[10.5px] font-bold uppercase tracking-wider text-[#646875]">
                    <th className="py-3 px-4">User / Operator</th>
                    <th className="py-3 px-4">Role & Department</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">Clearance</th>
                    <th className="py-3 px-4">Permission Matrix</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE2] text-xs">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentProfile.id;
                    return (
                      <tr key={user.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#D5D3C8]"
                            />
                            <div>
                              <div className="font-bold text-[#112233] flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#7A7E8C] font-mono-data">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0F766E]">{user.roleTitle}</div>
                          <div className="text-[11px] text-[#7A7E8C]">{user.department}</div>
                        </td>

                        <td className="py-3.5 px-4 text-[#112233] font-medium">
                          {user.assignedConstituency}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FAF9F5] border border-[#E0DED5] text-[#555866]">
                            {user.clearanceLevel.split("(")[0]}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {user.permissions.canExportReports && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                Export PDF
                              </span>
                            )}
                            {user.permissions.canEditStrategy && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                Strategy
                              </span>
                            )}
                            {user.permissions.canManageVolunteers && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                Volunteers
                              </span>
                            )}
                            {user.permissions.canResolveGrievances && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                                Grievances
                              </span>
                            )}
                            {user.permissions.canManageSystemUsers && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                                Master Admin
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-[#112233] bg-[#FAF9F5] hover:bg-[#EFECE6] border border-[#D5D3C8] rounded-md transition-colors cursor-pointer"
                            >
                              Edit Role
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedUserAudit(user)}
                              className="p-1.5 text-[#646875] hover:text-[#112233] hover:bg-[#EFECE6] rounded-md transition-colors cursor-pointer"
                              title="View User Activity & Audit Trail"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit User Modal */}
          {isUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#D5D3C8] shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#112233]">
                      {editingUser ? `Edit User: ${editingUser.name}` : "Create New System User"}
                    </h3>
                    <p className="text-xs text-[#7A7E8C]">Configure RBAC clearance and jurisdiction permissions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="text-[#8A8E9B] hover:text-[#112233] text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveUserForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={userFormName}
                        onChange={(e) => setUserFormName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={userFormEmail}
                        onChange={(e) => setUserFormEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">System Role</label>
                      <select
                        value={userFormRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setUserFormRole(r);
                          if (r === "super_admin") {
                            setUserFormRoleTitle("Master System Administrator");
                            setUserFormClearance("Tier 0 (Master Admin Clearance)");
                          } else if (r === "campaign_director") {
                            setUserFormRoleTitle("Principal Campaign Director");
                            setUserFormClearance("Level 1 (Full Access)");
                          } else if (r === "field_strategist") {
                            setUserFormRoleTitle("Senior Field Operations Strategist");
                            setUserFormClearance("Level 2 (Operations)");
                          } else if (r === "media_analyst") {
                            setUserFormRoleTitle("Digital Media & NLP Lead");
                            setUserFormClearance("Level 2 (Operations)");
                          } else if (r === "volunteer_lead") {
                            setUserFormRoleTitle("Constituency Volunteer Network Lead");
                            setUserFormClearance("Level 3 (Field Only)");
                          } else {
                            setUserFormRoleTitle("Polling Station & Booth In-Charge");
                            setUserFormClearance("Level 3 (Field Only)");
                          }
                        }}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:outline-none focus:border-[#D4A24C]"
                      >
                        <option value="super_admin">Master Administrator (super_admin)</option>
                        <option value="campaign_director">Campaign Director</option>
                        <option value="field_strategist">Field Strategist</option>
                        <option value="media_analyst">Media Analyst</option>
                        <option value="volunteer_lead">Volunteer Lead</option>
                        <option value="booth_coordinator">Booth Coordinator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">Role Title</label>
                      <input
                        type="text"
                        required
                        value={userFormRoleTitle}
                        onChange={(e) => setUserFormRoleTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">Assigned Constituency / Jurisdiction</label>
                      <input
                        type="text"
                        required
                        value={userFormConstituency}
                        onChange={(e) => setUserFormConstituency(e.target.value)}
                        placeholder="e.g. Kadapa AC (AC-132)"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#112233] mb-1">Clearance Level</label>
                      <input
                        type="text"
                        required
                        value={userFormClearance}
                        onChange={(e) => setUserFormClearance(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D3C8] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  {/* Granular Permission Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#ECEAE2]">
                    <span className="text-xs font-bold text-[#112233] block">Granular Capabilities & Permissions</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canExportReports}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canExportReports: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Export Executive PDF Reports</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canEditStrategy}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canEditStrategy: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Edit Campaign Strategy</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canManageVolunteers}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canManageVolunteers: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Manage Volunteer Squads</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canResolveGrievances}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canResolveGrievances: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Resolve Citizen Grievances</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canPublishLandingPage}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canPublishLandingPage: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Publish Landing Pages</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canViewConfidentialMetrics}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canViewConfidentialMetrics: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>View Confidential Electorate Data</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E3D8] cursor-pointer sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canManageSystemUsers}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canManageSystemUsers: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span className="font-semibold text-rose-700">Master Administrator: Manage System Users & RBAC</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE2]">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#646875] hover:text-[#112233] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1A2C] text-[#F5EFE0] hover:bg-[#142B45] text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      {userSaveSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Saved to Directory!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-[#D4A24C]" />
                          <span>{editingUser ? "Update User" : "Create User"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Activity & Audit Modal */}
          {selectedUserAudit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#D5D3C8] shadow-2xl max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#112233]">User Activity & Audit Ledger</h3>
                    <p className="text-xs text-[#7A7E8C]">{selectedUserAudit.name} ({selectedUserAudit.email})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserAudit(null)}
                    className="text-[#8A8E9B] hover:text-[#112233] text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto">
                  <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#ECEAE2]">
                    <div className="font-semibold text-[#112233] flex items-center justify-between">
                      <span>Executive Dossier Export</span>
                      <span className="text-[10px] text-[#8A8E9B]">Today, 00:14 IST</span>
                    </div>
                    <p className="text-[#646875] text-[11px] mt-0.5">Exported Pitch & Audit dossier for Kadapa AC (PDF/JSON).</p>
                  </div>
                  <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#ECEAE2]">
                    <div className="font-semibold text-[#112233] flex items-center justify-between">
                      <span>Grievance Triage & Resolution</span>
                      <span className="text-[10px] text-[#8A8E9B]">Yesterday, 18:30 IST</span>
                    </div>
                    <p className="text-[#646875] text-[11px] mt-0.5">Resolved 14 citizen grievance tickets in Kamalapuram sector.</p>
                  </div>
                  <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#ECEAE2]">
                    <div className="font-semibold text-[#112233] flex items-center justify-between">
                      <span>Secure Session Authenticated</span>
                      <span className="text-[10px] text-[#8A8E9B]">28 Aug 2026, 09:00 IST</span>
                    </div>
                    <p className="text-[#646875] text-[11px] mt-0.5">Logged in from authorized network IP (103.24.88.12).</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ECEAE2] text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedUserAudit(null)}
                    className="px-4 py-2 bg-[#0B1A2C] text-[#F5EFE0] text-xs font-semibold rounded-lg hover:bg-[#142B45] cursor-pointer"
                  >
                    Close Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POLITICAL PARTY BRANDING & COLOR CUSTOMIZER */}
      {activeTab === "branding" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Party Selector Carousel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#112233]">
                  Select Political Party to Customize
                </h3>
                <p className="text-xs text-[#626674]">
                  Update brand colors, logos, and accent tokens in the master database
                </p>
              </div>
              <span className="text-[11px] font-mono-data bg-[#F0EFEA] border border-[#E0DED5] px-2.5 py-1 rounded-full text-[#626674]">
                {parties.length} Master Parties Registered
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {parties.map((p) => {
                const isSelected = selectedPartyId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectParty(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? "bg-white border-2 shadow-md ring-2"
                        : "bg-white/80 border-[#E0DED5] hover:bg-white hover:border-[#CDC9BC]"
                    }`}
                    style={{
                      borderColor: isSelected ? p.primaryColor : undefined,
                      boxShadow: isSelected ? `0 0 0 2px ${p.primaryColor}55` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{p.symbolEmoji || "🏛️"}</span>
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: p.primaryColor }}
                        title={`Primary: ${p.primaryColor}`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#112233]">{p.abbreviation || p.shortName}</div>
                      <div className="text-[10px] text-[#7A7E8C] line-clamp-1">{p.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customizer Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Color & Token Controls */}
            <div className="lg:col-span-7 bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#B45309]" />
                  <h3 className="text-sm font-semibold text-[#112233]">
                    Party Color Tokens & Symbol Assets
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E5E3D8] text-[#112233]">
                  Editing: {partyAbbr}
                </span>
              </div>

              <form onSubmit={handleSavePartyBranding} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Party Full Name
                    </label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      required
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Abbreviation / Short Code
                    </label>
                    <input
                      type="text"
                      value={partyAbbr}
                      onChange={(e) => setPartyAbbr(e.target.value)}
                      required
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Primary Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] block">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg p-1.5">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          document.documentElement.style.setProperty("--party-primary", e.target.value);
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono-data text-[#112233] focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] block">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg p-1.5">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          document.documentElement.style.setProperty("--party-secondary", e.target.value);
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono-data text-[#112233] focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Accent Highlight */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] block">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg p-1.5">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          document.documentElement.style.setProperty("--party-accent", e.target.value);
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono-data text-[#112233] focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Start & End */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] block">
                      Gradient Start
                    </label>
                    <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg p-1.5">
                      <input
                        type="color"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono-data text-[#112233] focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] block">
                      Gradient End
                    </label>
                    <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg p-1.5">
                      <input
                        type="color"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono-data text-[#112233] focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Symbol Emoji & Logo URL */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Symbol Emoji
                    </label>
                    <input
                      type="text"
                      value={symbolEmoji}
                      onChange={(e) => setSymbolEmoji(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-base text-center font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Logo / SVG Icon URL
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://.../party_logo.svg"
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#ECEAE2]">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#112233] hover:bg-[#1E3A5A] text-[#F5EFE0] text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved to Database!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Apply Party Colors</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={applyLiveTheme}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F4F3ED] hover:bg-[#EAE8DF] text-[#112233] border border-[#DDDCD4] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Live Test In Browser</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live Interactive Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4A24C]" />
                    <h3 className="text-sm font-semibold text-[#112233]">
                      Live Design Token Preview
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#8A8E9B]">
                    80% Neutral / 20% Accent
                  </span>
                </div>

                {/* Banner Swatch */}
                <div
                  className="rounded-xl p-5 text-white shadow-sm space-y-3 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{symbolEmoji}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-white">
                      Official Identity
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight drop-shadow-xs">{partyName}</h4>
                    <p className="text-xs text-white/90 font-medium">{partyAbbr} Executive Campaign Unit</p>
                  </div>
                </div>

                {/* Sample UI Component Highlights */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                    Sample Platform Metric Cards
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#797D8B] block font-bold">
                        Voter Reach Score
                      </span>
                      <span className="text-2xl font-bold font-editorial text-[#112233]">
                        78.4 / 100
                      </span>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-bold shadow-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      #1 in Constituency
                    </div>
                  </div>
                  <div className="p-4 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#112233]">Platform Coverage</span>
                      <span style={{ color: secondaryColor }}>64.2%</span>
                    </div>
                    <div className="w-full bg-[#E5E3D8] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: "64.2%",
                          background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
                        }}
                      />
                    </div>
                  </div>

                  {/* Sample Action Button */}
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-lg font-bold text-xs shadow-sm transition-all"
                    style={{
                      backgroundColor: primaryColor,
                      color: "#112233"
                    }}
                  >
                    Generate Executive Briefing ({partyAbbr})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ELECTED REPRESENTATIVES LEDGER */}
      {activeTab === "representatives" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Controls: Constituency Selector & Actions */}
          <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECEAE2] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#B45309]" />
                  <h3 className="text-sm font-semibold text-[#112233]">
                    Official Elected Representatives Ledger (ECI & Legislative Assembly)
                  </h3>
                </div>
                <p className="text-xs text-[#626674] mt-0.5">
                  Authoritative tracking of current and historical MLAs. Prevents guessing or hardcoding names.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRepFormName("");
                    setRepFormPartyId("TDP");
                    setRepFormDesignation("MLA");
                    setRepFormElectionType("General Election 2024");
                    setRepFormElectionDate("2024-06-04");
                    setRepFormStatus("CURRENT");
                    setRepFormTermStart("2024");
                    setRepFormTermEnd("");
                    setRepFormReason("");
                    setRepFormSource("Election Commission of India");
                    setRepFormSourceUrl("");
                    setRepFormPhotoUrl("");
                    setIsRepModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#112233] hover:bg-[#1E3A5A] text-[#F5EFE0] text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register / Change Representative</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkVacant}
                  disabled={isRepSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mark Seat Vacant</span>
                </button>
              </div>
            </div>

            {/* Quick Constituency Switcher */}
            <div className="flex items-center gap-3 pt-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A] shrink-0">
                Inspect Constituency Ledger:
              </label>
              <select
                value={ledgerAcId}
                onChange={(e) => setLedgerAcId(e.target.value)}
                className="bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-1.5 text-xs font-bold text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
              >
                <option value="KDP-AC">Kadapa (AC-132) · Kadapa PC</option>
                <option value="KML-AC">Kamalapuram (AC-133) · Kadapa PC</option>
                <option value="PLV-AC">Pulivendla (AC-130) · Kadapa PC</option>
                <option value="TPT-AC">Tirupati (AC-167) · Tirupati PC</option>
                <option value="KUP-AC">Kuppam (AC-175) · Chittoor PC</option>
                <option value="PTH-AC">Pithapuram (AC-041) · Kakinada PC</option>
                <option value="MGL-AC">Mangalagiri (AC-087) · Guntur PC</option>
                <option value="GNTW-AC">Guntur West (AC-094) · Guntur PC</option>
                <option value="VSKE-AC">Visakhapatnam East (AC-021) · Visakhapatnam PC</option>
              </select>
            </div>
          </div>

          {/* Current Representative Banner */}
          {(() => {
            const current = ledgerHistory.find((r) => r.status === "CURRENT");
            const isVacant = ledgerHistory.some((r) => r.status === "VACANT");
            if (current) {
              return (
                <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider">
                        Active Incumbent MLA
                      </span>
                      <span className="text-xs text-[#7A7E8C]">
                        {current.assemblyConstituencyId} · Term: {current.termStart}–Present
                      </span>
                    </div>
                    <span className="text-xs font-mono-data text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Status: CURRENT
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={current.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                        alt={current.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#B45309]"
                      />
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-[#112233]">{current.name}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          {current.party && (
                            <span
                              className="px-2.5 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs"
                              style={{ backgroundColor: current.party.primaryColor || "#B45309" }}
                            >
                              {current.party.symbolEmoji} {current.party.abbreviation || current.party.shortName} · {current.party.name}
                            </span>
                          )}
                          <span className="text-[#64748B] font-medium">({current.designation})</span>
                        </div>
                        <div className="text-[11px] text-[#71717A]">
                          Election: {current.electionType} ({current.electionDate})
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl p-4 text-xs space-y-1 sm:max-w-xs">
                      <div className="text-[10px] uppercase font-bold text-[#8A8E9B]">
                        Verification Provenance
                      </div>
                      <div className="font-semibold text-[#112233] flex items-center gap-1.5">
                        <span>{current.source}</span>
                        {current.sourceUrl && (
                          <a
                            href={current.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#B45309] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[#71717A] font-mono-data">
                        Verified At: {new Date(current.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else if (isVacant) {
              return (
                <div className="p-6 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-4 text-amber-900">
                  <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-base font-bold">Seat Officially Recorded as VACANT</h4>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      This constituency currently has no serving MLA due to resignation, disqualification, or term transition.
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="p-6 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl flex items-center gap-4 text-[#64748B]">
                  <AlertCircle className="w-8 h-8 text-[#94A3B8] shrink-0" />
                  <div>
                    <h4 className="text-base font-bold text-[#112233]">No Current Representative Record on File</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Current representative data is unavailable. Click "Register / Change Representative" above to add the official gazetted record.
                    </p>
                  </div>
                </div>
              );
            }
          })()}

          {/* Historical Succession Timeline */}
          <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#112233]" />
                <h3 className="text-sm font-semibold text-[#112233]">
                  Representative Succession Ledger & History ({ledgerHistory.length} Records)
                </h3>
              </div>
              <span className="text-xs text-[#8A8E9B]">Chronological Gazette Trail</span>
            </div>

            {ledgerHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8A8E9B]">
                No historical records registered yet for {ledgerAcId}.
              </div>
            ) : (
              <div className="space-y-3">
                {ledgerHistory.map((rep, idx) => (
                  <div
                    key={rep.id || idx}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all ${
                      rep.status === "CURRENT"
                        ? "bg-emerald-50/50 border-emerald-200 shadow-2xs"
                        : rep.status === "VACANT"
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-[#FAF9F5] border-[#E5E3D8]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={rep.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"}
                        alt={rep.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#D5D3C8]"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#112233] text-sm">{rep.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              rep.status === "CURRENT"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : rep.status === "VACANT"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-zinc-200 text-zinc-700"
                            }`}
                          >
                            {rep.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#626674]">
                          {rep.party && (
                            <span className="font-semibold text-[#112233]">
                              {rep.party.abbreviation || rep.party.shortName} · {rep.party.name}
                            </span>
                          )}
                          <span>·</span>
                          <span>{rep.designation}</span>
                        </div>
                        {rep.reasonForChange && (
                          <div className="text-[10px] text-amber-800 italic">
                            Reason for transition: {rep.reasonForChange}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col sm:items-end justify-between text-[11px] text-[#71717A] space-y-1">
                      <div className="font-mono-data font-semibold text-[#112233]">
                        Term: {rep.termStart}–{rep.termEnd || "Present"}
                      </div>
                      <div className="text-[10px] text-[#8A8E9B]">
                        Source: {rep.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Form for Registering/Updating Representative */}
          {isRepModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#E0DED5] shadow-2xl max-w-xl w-full p-6 space-y-5 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#112233]">
                      Register / Update Representative ({ledgerAcId})
                    </h3>
                    <p className="text-xs text-[#626674]">
                      Saves verified record to database; demotes existing CURRENT representative to FORMER.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRepModalOpen(false)}
                    className="text-[#8A8E9B] hover:text-[#112233] text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveRepresentative} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Leader Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={repFormName}
                        onChange={(e) => setRepFormName(e.target.value)}
                        placeholder="e.g. R. Madhavi Reddy"
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Political Party *
                      </label>
                      <select
                        value={repFormPartyId}
                        onChange={(e) => setRepFormPartyId(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      >
                        {parties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.abbreviation || p.shortName} · {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={repFormDesignation}
                        onChange={(e) => setRepFormDesignation(e.target.value)}
                        placeholder="MLA / Minister"
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Record Status
                      </label>
                      <select
                        value={repFormStatus}
                        onChange={(e) => setRepFormStatus(e.target.value as any)}
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      >
                        <option value="CURRENT">CURRENT (Active MLA)</option>
                        <option value="FORMER">FORMER (Past Term)</option>
                        <option value="VACANT">VACANT (Seat Vacant)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Election Date
                      </label>
                      <input
                        type="date"
                        value={repFormElectionDate}
                        onChange={(e) => setRepFormElectionDate(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Term Start (Year)
                      </label>
                      <input
                        type="text"
                        value={repFormTermStart}
                        onChange={(e) => setRepFormTermStart(e.target.value)}
                        placeholder="2024"
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Term End (Optional)
                      </label>
                      <input
                        type="text"
                        value={repFormTermEnd}
                        onChange={(e) => setRepFormTermEnd(e.target.value)}
                        placeholder="Leave blank if Current"
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Reason For Transition (If Former or By-Election)
                    </label>
                    <input
                      type="text"
                      value={repFormReason}
                      onChange={(e) => setRepFormReason(e.target.value)}
                      placeholder="e.g. By-election 2026, Resignation, Term Completed"
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Authoritative Source *
                      </label>
                      <select
                        value={repFormSource}
                        onChange={(e) => setRepFormSource(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      >
                        <option value="Election Commission of India">Election Commission of India</option>
                        <option value="Official State Legislative Assembly">Official State Legislative Assembly</option>
                        <option value="State Chief Electoral Officer">State Chief Electoral Officer</option>
                        <option value="Other verified official government source">Other verified official government source</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                        Official Gazette / Source URL
                      </label>
                      <input
                        type="url"
                        value={repFormSourceUrl}
                        onChange={(e) => setRepFormSourceUrl(e.target.value)}
                        placeholder="https://results.eci.gov.in/..."
                        className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#686C7A]">
                      Photo / Portrait URL
                    </label>
                    <input
                      type="url"
                      value={repFormPhotoUrl}
                      onChange={(e) => setRepFormPhotoUrl(e.target.value)}
                      placeholder="https://.../photo.jpg"
                      className="w-full bg-[#FAF9F5] border border-[#DDDCD4] rounded-lg px-3 py-2 text-xs font-medium text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE2]">
                    <button
                      type="button"
                      onClick={() => setIsRepModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#626674] hover:bg-[#EFECE6] rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isRepSaving}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-[#112233] hover:bg-[#1E3A5A] text-[#F5EFE0] text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isRepSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Master Database...</span>
                        </>
                      ) : repSaveSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified & Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save & Commit Record</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#112233]" />
              <h3 className="text-sm font-semibold text-[#112233]">
                Security & Activity Audit Trail
              </h3>
            </div>
            <span className="text-xs text-[#888C98]">Immutable Activity Ledger</span>
          </div>

          <div className="space-y-2">
            {mockAuditLogs.map((log, idx) => (
              <div key={idx} className="p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#112233]">{log.action}</span>
                  <div className="text-[11px] text-[#696D7A]">{log.user}</div>
                </div>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="font-mono-data text-[#888C99]">{log.time}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold text-[10px]">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
