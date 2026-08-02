import { UserRole } from "@/lib/auth/roles";

export function canManagePlant(role: UserRole, actorId: string, plant: { createdByUserId: string; publicationState: string }) {
  return role !== UserRole.AGRONOMIST || (plant.createdByUserId === actorId && plant.publicationState === "DRAFT");
}

export const canHardDeletePlant = (role: UserRole) => role === UserRole.SUPER_ADMIN;
export const canPublishPlant = (role: UserRole) => role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
export const canCreatePlant = (role: UserRole) => Object.values(UserRole).includes(role);
export const canViewPlants = canCreatePlant;
