import { UserRole } from "@/lib/auth/roles";
export const canManageDisease = (role: UserRole, actorId: string, disease: { createdByUserId: string; publicationState: string }) => role !== UserRole.AGRONOMIST || (disease.createdByUserId === actorId && disease.publicationState === "DRAFT");
export const canPublishDisease = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
export const canHardDeleteDisease = (role: UserRole) => role === UserRole.SUPER_ADMIN;
export const canCreateDisease = (role: UserRole) => Object.values(UserRole).includes(role);
export const canViewDiseases = canCreateDisease;
