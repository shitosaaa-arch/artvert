import { UserRole } from "@/lib/auth/roles";
export const canViewProducts = (role: UserRole) => [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGRONOMIST].includes(role);
export const canCreateProduct = canViewProducts;
export const canPublishProduct = (role: UserRole) => role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
export const canHardDeleteProduct = (role: UserRole) => role === UserRole.SUPER_ADMIN;
export const canManageProduct = (role: UserRole, id: string, p: { createdByUserId: string; publicationState: string }) => canPublishProduct(role) || (role === UserRole.AGRONOMIST && p.createdByUserId === id && p.publicationState === "DRAFT");
