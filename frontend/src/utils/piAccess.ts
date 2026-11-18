import { UserProfile } from "../types";

const SMA_EMAILS = new Set(["sma", "sma@leaderslens.ai"]);
const SMM_EMAILS = new Set(["smm", "smm@leaderslens.ai"]);

function roleKey(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): string {
  return String(user?.primaryRole || user?.roleId || user?.role || "").toUpperCase().replace(/[\s-]+/g, "_");
}

function emailKey(user?: Pick<UserProfile, "email"> | null): string {
  return String(user?.email || "").trim().toLowerCase();
}

export function isSmAUser(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  if (!user) return false;
  const role = roleKey(user);
  return role === "SM_A" || role === "SMA" || SMA_EMAILS.has(emailKey(user));
}

export function isSmMUser(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  if (!user) return false;
  const role = roleKey(user);
  return role === "SM_M" || role === "SMM" || SMM_EMAILS.has(emailKey(user));
}

export function isPiOperatorUser(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  return isSmAUser(user) || isSmMUser(user);
}

export function isPlatformAdminUser(
  user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role" | "isPlatformAdmin"> | null
): boolean {
  if (!user) return false;
  const email = emailKey(user);
  const role = roleKey(user);
  return email === "admin" || email === "admin@leaderslens.ai" || role === "SUPER_ADMIN" || !!user.isPlatformAdmin;
}

/** @deprecated use isPiOperatorUser */
export function isSmAuditUser(user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role"> | null): boolean {
  return isPiOperatorUser(user);
}

export function canAccessPoliticalIntelligence(
  user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role" | "isPlatformAdmin"> | null
): boolean {
  return isPiOperatorUser(user);
}

export function canManagePoliticalIntelligence(
  user?: Pick<UserProfile, "email" | "primaryRole" | "roleId" | "role" | "isPlatformAdmin"> | null
): boolean {
  return isPlatformAdminUser(user);
}
