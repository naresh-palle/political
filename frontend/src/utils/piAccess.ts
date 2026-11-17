import { UserProfile } from "../types";

const SM_AUDIT_EMAILS = new Set(["sm.audit@leaderslens.ai"]);

export function isSmAuditUser(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  if (!user) return false;
  const role = String(user.primaryRole || user.roleId || user.role || "").toUpperCase().replace(/[\s-]+/g, "_");
  const email = String(user.email || "").trim().toLowerCase();
  return role === "SM_AUDIT" || role === "SOCIAL_MEDIA_AUDIT" || SM_AUDIT_EMAILS.has(email);
}

export function canAccessPoliticalIntelligence(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  return isSmAuditUser(user);
}
