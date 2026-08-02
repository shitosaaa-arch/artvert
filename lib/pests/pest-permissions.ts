import { UserRole } from "@/lib/auth/roles";
export const canManagePest = (role: UserRole, actorId: string, pest: { createdByUserId: string; publicationState: string }) => role !== UserRole.AGRONOMIST || (pest.createdByUserId === actorId && pest.publicationState === "DRAFT");
export const canPublishPest = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
export const canHardDeletePest = (role: UserRole) => role === UserRole.SUPER_ADMIN;
export const canCreatePest = (role: UserRole) => Object.values(UserRole).includes(role);
export const canViewPests = canCreatePest;
