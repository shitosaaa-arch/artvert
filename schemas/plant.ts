import { knowledgePublicationStates, type KnowledgePublicationState } from "@/schemas/knowledge-entity-envelope";

export const plantCategories = ["CROP", "HOME_PLANT", "ORNAMENTAL"] as const;
export type PlantCategory = (typeof plantCategories)[number];
export type PlantInput = { name: string; slug?: string; category: PlantCategory; scientificName?: string; description?: string; aliases?: { value: string; locale?: string }[]; publicationState?: KnowledgePublicationState };
export const normalizePlantSearch = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
export const normalizePlantAlias = normalizePlantSearch;
export function validatePlantInput(input: PlantInput) {
  if (!input.name.trim()) throw new Error("Plant name is required.");
  if (!plantCategories.includes(input.category)) throw new Error("Plant category is invalid.");
  if (input.publicationState && !knowledgePublicationStates.includes(input.publicationState)) throw new Error("Publication state is invalid.");
  if (input.aliases?.some((alias) => !normalizePlantAlias(alias.value))) throw new Error("Plant alias is invalid.");
}
