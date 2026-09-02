import React from "react";
import { UserProfile } from "../../types";
import { AdminOperationsDashboard } from "./AdminOperationsDashboard";
import { DirectorOperationsDashboard } from "./DirectorOperationsDashboard";
import { VolunteerOperationsDashboard } from "./VolunteerOperationsDashboard";

interface FieldOpsManagerProps {
  currentUser: UserProfile;
  initialFilter?: string;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const FieldOpsManager: React.FC<FieldOpsManagerProps> = ({ currentUser, initialFilter, onUpdateProfile }) => {
  // Determine 4-tier Primary Role
  const role = currentUser.primaryRole || (
    currentUser.roleId === "SUPER_ADMIN" || currentUser.role === "super_admin" || currentUser.isPlatformAdmin
      ? "SUPER_ADMIN"
      : currentUser.roleId === "ADMIN" || currentUser.role === "admin" || currentUser.isPoliticalAdmin
      ? "POLITICAL_ADMIN"
      : currentUser.roleId === "VOLUNTEER" || currentUser.role === "volunteer"
      ? "VOLUNTEER"
      : "DIRECTOR"
  );

  if (role === "VOLUNTEER") {
    return <VolunteerOperationsDashboard currentUser={currentUser} initialFilterStatus={initialFilter} />;
  }

  if (role === "DIRECTOR") {
    return <DirectorOperationsDashboard currentUser={currentUser} initialFilterStatus={initialFilter} />;
  }

  // Renders for both Level 1 Platform Super Admin and Level 2 Political / Constituency Admin
  return <AdminOperationsDashboard currentUser={currentUser} onUpdateProfile={onUpdateProfile} />;
};
