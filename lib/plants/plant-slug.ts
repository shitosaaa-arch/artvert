export function toPlantSlug(value: string) { return value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
