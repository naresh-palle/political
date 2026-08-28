import React, { useState } from "react";
import { UserProfile, UserRole } from "../../types";
import { USER_PROFILES } from "../../services/mockData";
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
  History
} from "lucide-react";

interface RoleManagementProps {
  currentProfile: UserProfile;
  onSwitchProfile: (profile: UserProfile) => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  currentProfile,
  onSwitchProfile
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(USER_PROFILES);

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

      {/* Persona Switcher Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#112233]">
            Select Persona to Experience Tailored View
          </h3>
          <span className="text-xs text-[#7A7E8C]">Click any profile to instantly switch context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {profiles.map((p) => {
            const isActive = currentProfile.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSwitchProfile(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isActive
                    ? "bg-white border-2 border-[#112233] shadow-md ring-2 ring-[#D4A24C]/40"
                    : "bg-white/85 border-[#E0DED5] hover:border-[#CDC9BC] hover:bg-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#D5D3C8]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#112233] line-clamp-1">
                        {p.name}
                      </h4>
                      <div className="text-[10.5px] font-semibold text-[#0F766E]">
                        {p.roleTitle}
                      </div>
                      <div className="text-[9.5px] text-[#787B88] line-clamp-1">
                        {p.department}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF9F5] border border-[#E5E3D8] text-[#555866] rounded">
                      {p.clearanceLevel}
                    </span>
                    <div className="text-[10px] font-mono-data text-[#646875] bg-[#F5F4EE] p-1.5 rounded border border-[#ECEAE2]">
                      <div><span className="font-semibold">Login:</span> {p.email}</div>
                      <div><span className="font-semibold">Pass:</span> {p.demoPassword || "Demo@2026"}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ECEAE2] flex justify-between items-center text-[10px]">
                  <span className="text-[#7A7E8C] line-clamp-1">{p.assignedConstituency}</span>
                  {isActive && (
                    <span className="font-bold text-emerald-700 flex items-center shrink-0 ml-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix for Active Role */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#112233]">
              Active Permission Capabilities: {currentProfile.roleTitle}
            </h3>
            <span className="text-xs text-[#7B7F8C]">
              Operational boundaries enforced by role level
            </span>
          </div>
          <span className="text-xs font-mono-data text-[#888C98]">
            Clearance: {currentProfile.clearanceLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">Export Executive PDF Reports</span>
              <span className="text-[10px] text-[#696D7A]">Generate offline consulting dossiers</span>
            </div>
            {currentProfile.permissions.canExportReports ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>

          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">Edit Campaign Strategy</span>
              <span className="text-[10px] text-[#696D7A]">Modify issue priorities & targets</span>
            </div>
            {currentProfile.permissions.canEditStrategy ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>

          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">Dispatch Volunteer Directives</span>
              <span className="text-[10px] text-[#696D7A]">Broadcast tasks to WhatsApp squads</span>
            </div>
            {currentProfile.permissions.canManageVolunteers ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>

          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">Resolve Citizen Grievances</span>
              <span className="text-[10px] text-[#696D7A]">Update SLA tickets and field logs</span>
            </div>
            {currentProfile.permissions.canResolveGrievances ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>

          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">Publish Campaign Landing Page</span>
              <span className="text-[10px] text-[#696D7A]">Deploy candidate web presence</span>
            </div>
            {currentProfile.permissions.canPublishLandingPage ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>

          <div className="p-4 rounded-lg border border-[#E5E3D8] bg-[#FAF9F5] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#112233] block">View Confidential Electorate Data</span>
              <span className="text-[10px] text-[#696D7A]">Access raw voter turnout & polling models</span>
            </div>
            {currentProfile.permissions.canViewConfidentialMetrics ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#9DA1B0] flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4">
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
    </div>
  );
};
