import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, UserRole, PrimaryRole, PoliticalParty, ElectedRepresentative } from "../../types";
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
  Building,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  MapPin,
  CheckCircle
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
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormPrimaryRole, setUserFormPrimaryRole] = useState<PrimaryRole>("DIRECTOR");
  const [userFormRole, setUserFormRole] = useState<UserRole>("campaign_manager");
  const [userFormRoleTitle, setUserFormRoleTitle] = useState("");
  const [userFormDepartment, setUserFormDepartment] = useState("");
  const [userFormConstituency, setUserFormConstituency] = useState("");
  const [userFormClearance, setUserFormClearance] = useState<string>("LEVEL 3 — STRATEGY & DIRECTORS");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormPartyId, setUserFormPartyId] = useState<string | null>("TDP");
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

  // Determine Current User Clearance Level
  const isSuperAdmin =
    currentProfile.primaryRole === "SUPER_ADMIN" ||
    currentProfile.isPlatformAdmin ||
    currentProfile.roleId === "SUPER_ADMIN" ||
    currentProfile.role === "super_admin";

  const isPoliticalAdmin =
    currentProfile.primaryRole === "POLITICAL_ADMIN" ||
    currentProfile.isPoliticalAdmin ||
    currentProfile.roleId === "ADMIN";

  const isDirector =
    currentProfile.primaryRole === "DIRECTOR" ||
    currentProfile.roleId === "CAMPAIGN_MANAGER";

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await politicalApiService.getUsers();
      if (users && users.length > 0) {
        setProfiles(users);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  // Check if current user can create users
  const canCreateUsers = isSuperAdmin || isPoliticalAdmin || isDirector;

  // Check if current user can edit a specific target user
  const canEditUser = (target: UserProfile): boolean => {
    if (isSuperAdmin) return true;
    if (isPoliticalAdmin) {
      // Political admin can edit Directors and Volunteers under their constituency
      return (
        target.primaryRole === "DIRECTOR" ||
        target.primaryRole === "VOLUNTEER" ||
        target.roleId === "CAMPAIGN_MANAGER" ||
        target.roleId === "VOLUNTEER"
      );
    }
    if (isDirector) {
      // Director can only edit Volunteers
      return target.primaryRole === "VOLUNTEER" || target.roleId === "VOLUNTEER";
    }
    return false;
  };

  // Check if current user can delete a specific target user
  const canDeleteUser = (target: UserProfile): boolean => {
    // SUPER ADMIN accounts can NEVER be deleted
    if (
      target.primaryRole === "SUPER_ADMIN" ||
      target.isPlatformAdmin ||
      target.roleId === "SUPER_ADMIN" ||
      target.role === "super_admin" ||
      target.id === "usr-superadmin" ||
      target.id === "usr-admin"
    ) {
      return false;
    }

    if (isSuperAdmin) return true;

    if (isPoliticalAdmin) {
      // Political admin can delete Directors in their constituency
      return target.primaryRole === "DIRECTOR" || target.roleId === "CAMPAIGN_MANAGER";
    }

    if (isDirector) {
      // Director can delete Volunteers under their team
      return target.primaryRole === "VOLUNTEER" || target.roleId === "VOLUNTEER";
    }

    return false;
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormName("");
    setUserFormEmail("");
    setUserFormPhone("+91 ");

    // Default primary role based on who is creating
    if (isSuperAdmin) {
      setUserFormPrimaryRole("POLITICAL_ADMIN");
      setUserFormRole("admin");
      setUserFormRoleTitle("Constituency Political Admin (MLA)");
      setUserFormDepartment("Constituency Political Command");
      setUserFormConstituency("Kadapa AC (AC-132)");
      setUserFormClearance("LEVEL 4 — CONSTITUENCY COMMAND");
      setUserFormPartyId("TDP");
    } else if (isPoliticalAdmin) {
      setUserFormPrimaryRole("DIRECTOR");
      setUserFormRole("campaign_manager");
      setUserFormRoleTitle("Volunteer Manager (Urban Mandals)");
      setUserFormDepartment("Ground Operations");
      setUserFormConstituency(currentProfile.assignedConstituency || "Kadapa Urban Mandals");
      setUserFormClearance("LEVEL 3 — STRATEGY & DIRECTORS");
      setUserFormPartyId(currentProfile.partyId || "TDP");
    } else {
      setUserFormPrimaryRole("VOLUNTEER");
      setUserFormRole("volunteer");
      setUserFormRoleTitle("Booth & Village Field Volunteer");
      setUserFormDepartment("Grassroots Field Force");
      setUserFormConstituency(currentProfile.assignedConstituency || "Kadapa AC · Chinna Chowk");
      setUserFormClearance("LEVEL 1 — FIELD ONLY");
      setUserFormPartyId(currentProfile.partyId || "TDP");
    }

    setUserFormPassword("Leader@2026");
    setUserFormPermissions({
      canExportReports: isSuperAdmin || isPoliticalAdmin,
      canEditStrategy: isSuperAdmin || isPoliticalAdmin,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: isSuperAdmin,
      canViewConfidentialMetrics: isSuperAdmin || isPoliticalAdmin,
      canManageSystemUsers: false
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPhone(user.phone || "");
    setUserFormPrimaryRole(user.primaryRole || "DIRECTOR");
    setUserFormRole(user.role);
    setUserFormRoleTitle(user.roleTitle);
    setUserFormDepartment(user.department || "");
    setUserFormConstituency(user.assignedConstituency);
    setUserFormClearance(user.clearanceLevel);
    setUserFormPassword(user.demoPassword || "Demo@2026");
    setUserFormPartyId(user.partyId || null);
    setUserFormPermissions({ ...user.permissions });
    setIsUserModalOpen(true);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaveSuccess(true);

    if (editingUser) {
      // Update existing user
      const updated: UserProfile = {
        ...editingUser,
        name: userFormName,
        email: userFormEmail,
        phone: userFormPhone,
        primaryRole: userFormPrimaryRole,
        isPlatformAdmin: userFormPrimaryRole === "SUPER_ADMIN",
        isPoliticalAdmin: userFormPrimaryRole === "POLITICAL_ADMIN",
        role: userFormRole,
        roleTitle: userFormRoleTitle,
        department: userFormDepartment,
        assignedConstituency: userFormConstituency,
        clearanceLevel: userFormClearance,
        demoPassword: userFormPassword,
        partyId: userFormPartyId,
        permissions: { ...userFormPermissions }
      };

      try {
        await politicalApiService.updateAdminUser(editingUser.id, updated);
      } catch (err) {
        console.warn("Backend update fallback", err);
      }

      setProfiles((prev) => prev.map((u) => u.id === editingUser.id ? updated : u));
    } else {
      // Create new user
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: userFormName,
        email: userFormEmail,
        phone: userFormPhone,
        primaryRole: userFormPrimaryRole,
        isPlatformAdmin: userFormPrimaryRole === "SUPER_ADMIN",
        isPoliticalAdmin: userFormPrimaryRole === "POLITICAL_ADMIN",
        role: userFormRole,
        roleId: userFormPrimaryRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : userFormPrimaryRole === "POLITICAL_ADMIN" ? "ADMIN" : userFormPrimaryRole === "DIRECTOR" ? "CAMPAIGN_MANAGER" : "VOLUNTEER",
        roleTitle: userFormRoleTitle,
        department: userFormDepartment,
        assignedConstituency: userFormConstituency,
        clearanceLevel: userFormClearance,
        demoPassword: userFormPassword,
        partyId: userFormPartyId,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80",
        permissions: { ...userFormPermissions }
      };

      try {
        await politicalApiService.createAdminUser(newUser as any);
      } catch (err) {
        console.warn("Backend create fallback", err);
      }

      setProfiles((prev) => [newUser, ...prev]);
    }

    setTimeout(() => {
      setUserSaveSuccess(false);
      setIsUserModalOpen(false);
    }, 600);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      await politicalApiService.deleteAdminUser(deletingUser.id);
      setProfiles((prev) => prev.filter((u) => u.id !== deletingUser.id));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  // Scoped users list based on active role hierarchy:
  // - Super Admin: sees ALL users across all 4 tiers
  // - Political Admin: sees ONLY Directors belonging to his/her party & constituency
  // - Director: sees ONLY Volunteers belonging to his/her squad & mandals
  const scopedProfiles = useMemo(() => {
    if (isSuperAdmin) {
      return profiles;
    }
    if (isPoliticalAdmin) {
      return profiles.filter((p) => {
        const isDirectorUser =
          p.primaryRole === "DIRECTOR" ||
          p.roleId === "CAMPAIGN_MANAGER" ||
          p.role === "campaign_manager";
        const matchesParty =
          !p.partyId ||
          !currentProfile.partyId ||
          p.partyId === currentProfile.partyId;
        const matchesConstituency =
          !p.assemblyConstituencyId ||
          !currentProfile.assemblyConstituencyId ||
          p.assemblyConstituencyId === currentProfile.assemblyConstituencyId ||
          (p.assignedConstituency &&
            currentProfile.assignedConstituency &&
            (p.assignedConstituency
              .toLowerCase()
              .includes(currentProfile.assignedConstituency.toLowerCase().split(" ")[0]) ||
              currentProfile.assignedConstituency
                .toLowerCase()
                .includes(p.assignedConstituency.toLowerCase().split(" ")[0])));
        return isDirectorUser && (matchesParty || matchesConstituency);
      });
    }
    if (isDirector) {
      return profiles.filter((p) => {
        const isVolunteerUser =
          p.primaryRole === "VOLUNTEER" ||
          p.roleId === "VOLUNTEER" ||
          p.role === "volunteer";
        const matchesDirector =
          p.directorId === currentProfile.id ||
          p.directorName?.toLowerCase() === currentProfile.name.toLowerCase() ||
          (p.assignedMandalId &&
            currentProfile.assignedMandalIds?.includes(p.assignedMandalId)) ||
          p.partyId === currentProfile.partyId;
        return isVolunteerUser && matchesDirector;
      });
    }
    return [];
  }, [profiles, isSuperAdmin, isPoliticalAdmin, isDirector, currentProfile]);

  const filteredUsers = scopedProfiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.assignedConstituency.toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(userSearch.toLowerCase()));
    
    if (userRoleFilter === "ALL") return matchesSearch;
    if (userRoleFilter === "SUPER_ADMIN") return matchesSearch && (p.primaryRole === "SUPER_ADMIN" || p.isPlatformAdmin);
    if (userRoleFilter === "POLITICAL_ADMIN") return matchesSearch && (p.primaryRole === "POLITICAL_ADMIN" || p.isPoliticalAdmin);
    if (userRoleFilter === "DIRECTOR") return matchesSearch && p.primaryRole === "DIRECTOR";
    if (userRoleFilter === "VOLUNTEER") return matchesSearch && p.primaryRole === "VOLUNTEER";

    return matchesSearch && (p.role === userRoleFilter || p.primaryRole === userRoleFilter);
  });

  // Calculate Tier Counts
  const countL1 = profiles.filter((p) => p.primaryRole === "SUPER_ADMIN" || p.isPlatformAdmin).length;
  const countL2 = profiles.filter((p) => p.primaryRole === "POLITICAL_ADMIN" || p.isPoliticalAdmin).length;
  const countL3 = profiles.filter((p) => p.primaryRole === "DIRECTOR").length;
  const countL4 = profiles.filter((p) => p.primaryRole === "VOLUNTEER").length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn text-[#F5EFE0]">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1A2C] via-[#122A44] to-[#0F2338] border border-[#D4A24C]/40 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentProfile.avatar}
            alt={currentProfile.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40">
                {isSuperAdmin
                  ? "Level 1: Platform Super Admin"
                  : isPoliticalAdmin
                  ? "Level 2: Political Admin (MLA)"
                  : "Level 3: Director"}
              </span>
              <span className="text-xs text-[#D8CFB8]">{currentProfile.assignedConstituency}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
              {isSuperAdmin
                ? "Access Control & Master User Governance"
                : isPoliticalAdmin
                ? "Constituency Directors Governance"
                : "Squad Volunteer Directory & Assignments"}
            </h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              {isSuperAdmin
                ? "Full Platform User Management · Multi-Tenant Provisioning & Audit Trails"
                : isPoliticalAdmin
                ? "Manage and deploy Volunteer Managers (Directors) across your Assembly Constituency"
                : "Manage and verify field volunteers assigned to your mandal squad"}
            </p>
          </div>
        </div>

        {canCreateUsers && (
          <button
            type="button"
            onClick={handleOpenAddUser}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isSuperAdmin
                ? "Add System User"
                : isPoliticalAdmin
                ? "Add Director"
                : "Add Volunteer"}
            </span>
          </button>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#22405E] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "roles"
              ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
              : "bg-[#071322] text-[#B9AF95] hover:text-[#F5EFE0] border border-[#22405E]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>
            {isSuperAdmin
              ? `User Directory & RBAC (${scopedProfiles.length})`
              : isPoliticalAdmin
              ? `Constituency Directors (${scopedProfiles.length})`
              : `Squad Volunteers (${scopedProfiles.length})`}
          </span>
        </button>

        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "branding"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
                  : "bg-[#071322] text-[#B9AF95] hover:text-[#F5EFE0] border border-[#22405E]"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Party Branding & Colors</span>
            </button>

            <button
              onClick={() => setActiveTab("representatives")}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "representatives"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
                  : "bg-[#071322] text-[#B9AF95] hover:text-[#F5EFE0] border border-[#22405E]"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>ECI Representatives Ledger</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
              : "bg-[#071322] text-[#B9AF95] hover:text-[#F5EFE0] border border-[#22405E]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY & RBAC MANAGEMENT */}
      {activeTab === "roles" && (
        <div className="space-y-6 animate-fadeIn">
          {/* User Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isSuperAdmin ? (
              <>
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9CAE] block">
                    Total Active Users
                  </span>
                  <div className="text-2xl font-bold font-display text-[#F5EFE0] mt-1">
                    {profiles.length}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 100% RBAC Active
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                    Platform Super Admins (L1)
                  </span>
                  <div className="text-2xl font-bold font-display text-[#D4A24C] mt-1">
                    {countL1}
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    Protected Multi-Tenant Clearance
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    Political Admins & Directors (L2/L3)
                  </span>
                  <div className="text-2xl font-bold font-display text-blue-400 mt-1">
                    {countL2 + countL3}
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    {countL2} MLAs · {countL3} Directors
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Field Volunteers (L4)
                  </span>
                  <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
                    {countL4}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">
                    Grassroots Ground Force
                  </span>
                </div>
              </>
            ) : isPoliticalAdmin ? (
              <>
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Constituency Directors
                  </span>
                  <div className="text-2xl font-bold font-display text-amber-400 mt-1">
                    {scopedProfiles.length}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 100% Active Squads
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                    Assigned Mandals
                  </span>
                  <div className="text-2xl font-bold font-display text-[#F5EFE0] mt-1">
                    6 Mandals
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    Urban & Rural Covered
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Supervised Cadre
                  </span>
                  <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
                    {profiles.filter((p) => p.primaryRole === "VOLUNTEER" && (!p.partyId || p.partyId === currentProfile.partyId)).length}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">
                    Field Volunteers in AC
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    Governance Clearance
                  </span>
                  <div className="text-2xl font-bold font-display text-blue-400 mt-1">
                    Level 4
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    Constituency Command
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Squad Volunteers
                  </span>
                  <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
                    {scopedProfiles.length}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Field Force Active
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                    Assigned Villages
                  </span>
                  <div className="text-2xl font-bold font-display text-[#F5EFE0] mt-1">
                    4 Villages
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    Ground Reach 100%
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Director Supervision
                  </span>
                  <div className="text-2xl font-bold font-display text-amber-400 mt-1">
                    Level 3
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">
                    Squad Manager Clearance
                  </span>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    Audit Status
                  </span>
                  <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
                    Verified
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">
                    Task Integrity Enforced
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#0F2338] border border-[#22405E] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
              <input
                type="text"
                placeholder={
                  isSuperAdmin
                    ? "Search user by name, email, jurisdiction..."
                    : isPoliticalAdmin
                    ? "Search constituency directors by name, mandal..."
                    : "Search squad volunteers by name, village..."
                }
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#071322] border border-[#22405E] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {isSuperAdmin && (
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] focus:outline-none focus:border-[#D4A24C] font-semibold text-[#F5EFE0]"
                >
                  <option value="ALL">All Platform Roles</option>
                  <option value="SUPER_ADMIN">Level 1: Platform Super Admin</option>
                  <option value="POLITICAL_ADMIN">Level 2: Political Admin (MLA)</option>
                  <option value="DIRECTOR">Level 3: Director</option>
                  <option value="VOLUNTEER">Level 4: Field Volunteer</option>
                </select>
              )}

              {isPoliticalAdmin && (
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] focus:outline-none focus:border-[#D4A24C] font-semibold text-[#F5EFE0]"
                >
                  <option value="ALL">All Constituency Directors</option>
                  <option value="DIRECTOR">Active Directors Only</option>
                </select>
              )}

              {isDirector && (
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] focus:outline-none focus:border-[#D4A24C] font-semibold text-[#F5EFE0]"
                >
                  <option value="ALL">All Squad Volunteers</option>
                  <option value="VOLUNTEER">Active Volunteers Only</option>
                </select>
              )}

              {canCreateUsers && (
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D4A24C] text-[#071322] hover:brightness-110 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isSuperAdmin
                      ? "Add System User"
                      : isPoliticalAdmin
                      ? "Add Director"
                      : "Add Volunteer"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* User Directory Table */}
          <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#071322] border-b border-[#22405E] text-[10.5px] font-bold uppercase tracking-wider text-[#8E9CAE]">
                    <th className="py-3.5 px-4">User / Operator</th>
                    <th className="py-3.5 px-4">Tier & Role</th>
                    <th className="py-3.5 px-4">Jurisdiction</th>
                    <th className="py-3.5 px-4">Clearance</th>
                    <th className="py-3.5 px-4">Permission Matrix</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22405E]/60 text-xs">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentProfile.id;
                    const isUserSuperAdmin =
                      user.primaryRole === "SUPER_ADMIN" ||
                      user.isPlatformAdmin ||
                      user.roleId === "SUPER_ADMIN" ||
                      user.role === "super_admin";
                    const isUserPoliticalAdmin =
                      user.primaryRole === "POLITICAL_ADMIN" ||
                      user.isPoliticalAdmin;
                    const isUserDirector = user.primaryRole === "DIRECTOR";
                    const isUserVolunteer = user.primaryRole === "VOLUNTEER";

                    const canEdit = canEditUser(user);
                    const canDelete = canDeleteUser(user);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-[#122A44]/60 transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#D4A24C]/40"
                            />
                            <div>
                              <div className="font-bold text-[#F5EFE0] flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8E9CAE] font-mono">
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-[10px] text-[#A69B80]">
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {/* Role Tier Badge */}
                          <div className="flex items-center gap-1.5">
                            {isUserSuperAdmin ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4A24C]/20 border border-[#D4A24C]/60 text-[#D4A24C]">
                                Level 1: Platform Super Admin
                              </span>
                            ) : isUserPoliticalAdmin ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/60 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                                <span>{user.partyEmoji || "🏛️"}</span>
                                <span>Level 2: Political (MLA)</span>
                              </span>
                            ) : isUserDirector ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                Level 3: Director
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                Level 4: Volunteer
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-xs text-[#E2DCBE] mt-1">
                            {user.roleTitle}
                          </div>
                          <div className="text-[10px] text-[#8E9CAE]">
                            {user.department}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-[#D8CFB8] font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                            {user.assignedConstituency}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#071322] border border-[#22405E] text-[#D8CFB8]">
                            {user.clearanceLevel?.split("(")[0] || "LEVEL 2"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {user.permissions?.canExportReports && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-500/30 rounded">
                                Export PDF
                              </span>
                            )}
                            {user.permissions?.canEditStrategy && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/30 rounded">
                                Strategy
                              </span>
                            )}
                            {user.permissions?.canManageVolunteers && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 rounded">
                                Volunteers
                              </span>
                            )}
                            {user.permissions?.canResolveGrievances && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded">
                                Grievances
                              </span>
                            )}
                            {user.permissions?.canManageSystemUsers && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded">
                                Platform Admin
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(user)}
                                className="px-2.5 py-1 text-xs font-semibold text-[#F5EFE0] bg-[#071322] hover:bg-[#142B45] border border-[#22405E] hover:border-[#D4A24C] rounded-lg transition-colors cursor-pointer"
                              >
                                Edit Role
                              </button>
                            )}

                            {/* Audit Log Inspection Button */}
                            {(isSuperAdmin || isPoliticalAdmin) && (
                              <button
                                type="button"
                                onClick={() => setSelectedUserAudit(user)}
                                className="p-1.5 text-[#8E9CAE] hover:text-[#D4A24C] hover:bg-[#071322] border border-transparent hover:border-[#22405E] rounded-lg transition-colors cursor-pointer"
                                title="View User Activity & Audit Trail"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button (Protected: Super Admin cannot be deleted) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeletingUser(user)}
                                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 border border-transparent hover:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
              <div className="bg-[#0B1A2C] text-[#F5EFE0] rounded-2xl border border-[#D4A24C]/40 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#F5EFE0]">
                      {editingUser ? `Edit User: ${editingUser.name}` : "Create New System User"}
                    </h3>
                    <p className="text-xs text-[#8E9CAE]">
                      Configure 4-tier RBAC clearance and jurisdiction permissions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="text-[#8E9CAE] hover:text-white text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveUserForm} className="space-y-4">
                  {/* Select Role Tier */}
                  <div>
                    <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">
                      Hierarchy Role Tier
                    </label>
                    <select
                      value={userFormPrimaryRole}
                      onChange={(e) => {
                        const pr = e.target.value as PrimaryRole;
                        setUserFormPrimaryRole(pr);
                        if (pr === "SUPER_ADMIN") {
                          setUserFormRole("super_admin");
                          setUserFormRoleTitle("LeaderLens Platform Super Admin");
                          setUserFormClearance("LEVEL 5 — FULL PLATFORM OWNER");
                          setUserFormDepartment("Platform Governance & Security");
                          setUserFormPartyId(null);
                        } else if (pr === "POLITICAL_ADMIN") {
                          setUserFormRole("admin");
                          setUserFormRoleTitle("Constituency Political Admin (MLA)");
                          setUserFormClearance("LEVEL 4 — CONSTITUENCY COMMAND");
                          setUserFormDepartment("Constituency Political Office");
                          setUserFormPartyId("TDP");
                        } else if (pr === "DIRECTOR") {
                          setUserFormRole("campaign_manager");
                          setUserFormRoleTitle("Volunteer Manager (Urban Mandals)");
                          setUserFormClearance("LEVEL 3 — STRATEGY & DIRECTORS");
                          setUserFormDepartment("Ground Field Operations");
                          setUserFormPartyId("TDP");
                        } else {
                          setUserFormRole("volunteer");
                          setUserFormRoleTitle("Booth & Village Field Volunteer");
                          setUserFormClearance("LEVEL 1 — FIELD ONLY");
                          setUserFormDepartment("Grassroots Field Force");
                          setUserFormPartyId("TDP");
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                    >
                      {isSuperAdmin && (
                        <>
                          <option value="SUPER_ADMIN">Level 1: Platform Super Admin</option>
                          <option value="POLITICAL_ADMIN">Level 2: Political Admin (MLA / PA)</option>
                          <option value="DIRECTOR">Level 3: Director (Volunteer Manager)</option>
                          <option value="VOLUNTEER">Level 4: Field Volunteer</option>
                        </>
                      )}
                      {isPoliticalAdmin && (
                        <>
                          <option value="DIRECTOR">Level 3: Director (Volunteer Manager)</option>
                          <option value="VOLUNTEER">Level 4: Field Volunteer</option>
                        </>
                      )}
                      {isDirector && (
                        <option value="VOLUNTEER">Level 4: Field Volunteer</option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={userFormName}
                        onChange={(e) => setUserFormName(e.target.value)}
                        placeholder="e.g. Ramesh Babu"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={userFormEmail}
                        onChange={(e) => setUserFormEmail(e.target.value)}
                        placeholder="e.g. ramesh.vol@leaderslens.ai"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={userFormPhone}
                        onChange={(e) => setUserFormPhone(e.target.value)}
                        placeholder="+91 98850 00000"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Demo Password</label>
                      <input
                        type="text"
                        required
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Role Title</label>
                      <input
                        type="text"
                        required
                        value={userFormRoleTitle}
                        onChange={(e) => setUserFormRoleTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#D8CFB8] mb-1">Assigned Jurisdiction</label>
                      <input
                        type="text"
                        required
                        value={userFormConstituency}
                        onChange={(e) => setUserFormConstituency(e.target.value)}
                        placeholder="e.g. Kadapa AC (AC-132)"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  {/* Granular Permissions Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#22405E]">
                    <span className="text-xs font-bold text-[#D4A24C] block">
                      Granular Capabilities & Permissions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-[#22405E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canExportReports}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canExportReports: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Export Reports & Audit Data</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-[#22405E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canEditStrategy}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canEditStrategy: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Edit Campaign Strategy</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-[#22405E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canManageVolunteers}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canManageVolunteers: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Manage Volunteer Squads</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-[#22405E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canResolveGrievances}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canResolveGrievances: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Resolve Citizen Grievances</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-[#22405E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormPermissions.canPublishLandingPage}
                          onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canPublishLandingPage: e.target.checked })}
                          className="rounded text-[#D4A24C] focus:ring-[#D4A24C]"
                        />
                        <span>Publish Candidate Web Pages</span>
                      </label>
                      {isSuperAdmin && (
                        <label className="flex items-center gap-2 p-2 rounded-xl bg-[#071322] border border-rose-500/30 cursor-pointer sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={userFormPermissions.canManageSystemUsers}
                            onChange={(e) => setUserFormPermissions({ ...userFormPermissions, canManageSystemUsers: e.target.checked })}
                            className="rounded text-rose-400 focus:ring-rose-400"
                          />
                          <span className="font-semibold text-rose-300">
                            Super Admin: Manage System Users & Multi-Tenant Provisioning
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22405E]">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#8E9CAE] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                    >
                      {userSaveSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#0B1A2C]" />
                          <span>Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{editingUser ? "Update User" : "Create User"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete User Confirmation Modal */}
          {deletingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-[#0B1A2C] text-[#F5EFE0] rounded-2xl border border-rose-500/50 shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-3 text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-display text-lg font-bold text-[#F5EFE0]">
                    Confirm User Deletion
                  </h3>
                </div>

                <p className="text-xs text-[#D8CFB8] leading-relaxed">
                  Are you sure you want to remove <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email}) from the platform directory?
                </p>

                <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E] text-[11px] space-y-1 text-[#8E9CAE]">
                  <div>Role: <strong className="text-[#F5EFE0]">{deletingUser.roleTitle}</strong></div>
                  <div>Jurisdiction: <strong className="text-[#D4A24C]">{deletingUser.assignedConstituency}</strong></div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22405E]">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeletingUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#8E9CAE] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isDeleting ? "Deleting..." : "Confirm & Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Activity & Audit Ledger Modal (Super Admin & Political Admin) */}
          {selectedUserAudit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-[#0B1A2C] text-[#F5EFE0] rounded-2xl border border-[#D4A24C]/40 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F5EFE0] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#D4A24C]" />
                      User Security & Activity Audit Trail
                    </h3>
                    <p className="text-xs text-[#8E9CAE]">
                      {selectedUserAudit.name} · {selectedUserAudit.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserAudit(null)}
                    className="text-[#8E9CAE] hover:text-white text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#8E9CAE] block text-[10px] uppercase">Account Status</span>
                      <strong className="text-emerald-400 font-semibold">Active & Certified</strong>
                    </div>
                    <div>
                      <span className="text-[#8E9CAE] block text-[10px] uppercase">Clearance Check</span>
                      <strong className="text-[#D4A24C] font-mono">{selectedUserAudit.clearanceLevel}</strong>
                    </div>
                    <div>
                      <span className="text-[#8E9CAE] block text-[10px] uppercase">Assigned Scope</span>
                      <strong className="text-[#F5EFE0]">{selectedUserAudit.assignedConstituency}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                      Chronological Immutable Activity Log:
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#8E9CAE]">
                          <span className="font-mono">30 Aug 2026, 23:15 IST</span>
                          <span className="text-emerald-400 font-bold uppercase">Authorized</span>
                        </div>
                        <p className="text-[#F5EFE0]">
                          RBAC Session Authenticated · Ground Field Ops Access Granted
                        </p>
                        <span className="text-[10px] text-[#8E9CAE] block">IP: 182.73.194.21 · Kadapa Secure Node</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#8E9CAE]">
                          <span className="font-mono">30 Aug 2026, 21:40 IST</span>
                          <span className="text-emerald-400 font-bold uppercase">Authorized</span>
                        </div>
                        <p className="text-[#F5EFE0]">
                          Updated Issue Status #ISS-001 with site photo proofs & ground remarks
                        </p>
                        <span className="text-[10px] text-[#8E9CAE] block">Verified by Director Naresh Palle</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#8E9CAE]">
                          <span className="font-mono">29 Aug 2026, 14:00 IST</span>
                          <span className="text-emerald-400 font-bold uppercase">Authorized</span>
                        </div>
                        <p className="text-[#F5EFE0]">
                          Profile Provisioned into LeaderLens Master Active Directory
                        </p>
                        <span className="text-[10px] text-[#8E9CAE] block">Actor: Platform Admin Srikar Varma</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#22405E] text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedUserAudit(null)}
                    className="px-4 py-2 bg-[#071322] hover:bg-[#142B45] border border-[#22405E] text-xs font-semibold rounded-xl text-[#F5EFE0] transition-colors cursor-pointer"
                  >
                    Close Audit View
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARTY BRANDING & CUSTOMIZER (SUPER ADMIN ONLY) */}
      {activeTab === "branding" && isSuperAdmin && (
        <div className="p-6 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-6">
          <div>
            <h3 className="font-display text-xl text-[#F5EFE0]">Political Party Branding Engine</h3>
            <p className="text-xs text-[#8E9CAE]">Configure party color palettes, symbols, and wallpapers across India.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {parties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPartyId(p.id);
                  setPartyName(p.name);
                  setPartyAbbr(p.abbreviation || p.shortName);
                  setPrimaryColor(p.primaryColor);
                  setSecondaryColor(p.secondaryColor);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPartyId === p.id
                    ? "border-[#D4A24C] bg-[#122A44] shadow-md"
                    : "border-[#22405E] bg-[#071322] hover:border-[#D4A24C]/50"
                }`}
              >
                <div className="text-xl mb-1">{p.symbolEmoji || "🏛️"}</div>
                <strong className="text-xs text-[#F5EFE0] block">{p.name}</strong>
                <span className="text-[10px] text-[#8E9CAE] font-mono">{p.abbreviation}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ELECTED REPRESENTATIVES LEDGER (SUPER ADMIN ONLY) */}
      {activeTab === "representatives" && isSuperAdmin && (
        <div className="p-6 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl text-[#F5EFE0]">ECI Gazette Representatives Ledger</h3>
              <p className="text-xs text-[#8E9CAE]">Official Election Commission incumbent ledger by Assembly Constituency.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] text-xs text-[#D8CFB8]">
            Constituency: <strong className="text-[#D4A24C]">Kadapa AC (AC-132)</strong> · Incumbent MLA: <strong className="text-[#F5EFE0]">R. Madhavi Reddy (TDP)</strong>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="p-6 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl text-[#F5EFE0]">Platform Security & Access Audit Trail</h3>
              <p className="text-xs text-[#8E9CAE]">Immutable log of RBAC permission checks, policy alterations, and operations.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              100% Policy Integrity Verified
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#8E9CAE]">30 Aug 2026, 23:40 IST</span>
                <p className="text-[#F5EFE0] font-semibold mt-0.5">
                  Super Admin created Level 2 Political Admin (MLA Kadapa AC)
                </p>
                <span className="text-[11px] text-[#D4A24C]">Actor: Srikar Varma (Platform Super Admin)</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                Authorized
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#8E9CAE]">30 Aug 2026, 22:15 IST</span>
                <p className="text-[#F5EFE0] font-semibold mt-0.5">
                  Political Admin assigned Volunteer Manager (Director Naresh Palle)
                </p>
                <span className="text-[11px] text-[#D4A24C]">Actor: R. Madhavi Reddy MLA Office</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                Authorized
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#8E9CAE]">30 Aug 2026, 20:00 IST</span>
                <p className="text-[#F5EFE0] font-semibold mt-0.5">
                  Director onboarded Field Volunteer Ramesh Babu (Chinna Chowk)
                </p>
                <span className="text-[11px] text-[#D4A24C]">Actor: Director Naresh Palle</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                Authorized
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Attribution */}
      <div className="text-center py-4 border-t border-[#22405E]/40 text-xs text-[#8E9CAE]">
        Developed and Maintained by{" "}
        <a
          href="https://palramai.in"
          target="_blank"
          rel="noreferrer"
          className="text-[#D4A24C] font-semibold hover:underline"
        >
          palramai.in
        </a>
      </div>
    </div>
  );
};
