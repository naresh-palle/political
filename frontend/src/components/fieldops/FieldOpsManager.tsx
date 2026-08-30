import React from "react";
import { UserProfile } from "../../types";
import { AdminOperationsDashboard } from "./AdminOperationsDashboard";
import { DirectorOperationsDashboard } from "./DirectorOperationsDashboard";
import { VolunteerOperationsDashboard } from "./VolunteerOperationsDashboard";

interface FieldOpsManagerProps {
  currentUser: UserProfile;
}

export const FieldOpsManager: React.FC<FieldOpsManagerProps> = ({ currentUser }) => {
  // Determine Primary Role
  const role = currentUser.primaryRole || (
    currentUser.roleId === "SUPER_ADMIN" || currentUser.roleId === "ADMIN" || currentUser.role === "super_admin" || currentUser.role === "admin"
      ? "ADMIN"
      : currentUser.roleId === "VOLUNTEER" || currentUser.role === "volunteer"
      ? "VOLUNTEER"
      : "DIRECTOR"
  );

  if (role === "VOLUNTEER") {
    return <VolunteerOperationsDashboard currentUser={currentUser} />;
  }

  if (role === "DIRECTOR") {
    return <DirectorOperationsDashboard currentUser={currentUser} />;
  }

  return <AdminOperationsDashboard currentUser={currentUser} />;
};
