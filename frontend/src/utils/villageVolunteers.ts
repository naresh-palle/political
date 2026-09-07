import { UserProfile } from "../types";

export function isVolunteerUser(user: Pick<UserProfile, "primaryRole" | "roleId" | "role">): boolean {
  const role = String(user.primaryRole || user.roleId || user.role || "").toUpperCase();
  return role.includes("VOLUNTEER");
}

/** Only users who list this village on their profile — never seed/mock stamps. */
export function findVolunteerForVillage(
  users: UserProfile[],
  villageId?: string | null
): UserProfile | null {
  if (!villageId) return null;
  return (
    users.find(
      (user) => isVolunteerUser(user) && (user.assignedVillageIds || []).includes(villageId)
    ) || null
  );
}
