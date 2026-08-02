import { UserRole } from "@/lib/auth/roles";
export const canManageDeficiency = (role: UserRole, actorId: string, deficiency: { createdByUserId: string; publicationState: string }) => role !== UserRole.AGRONOMIST || (deficiency.createdByUserId === actorId && deficiency.publicationState === "DRAFT");
export const canPublishDeficiency = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
export const canHardDeleteDeficiency = (role: UserRole) => role === UserRole.SUPER_ADMIN;
export const canCreateDeficiency = (role: UserRole) => Object.values(UserRole).includes(role);
export const canViewDeficiencies = canCreateDeficiency;
