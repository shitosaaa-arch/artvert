export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGRONOMIST = "AGRONOMIST",
}

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && Object.values(UserRole).includes(value as UserRole);
