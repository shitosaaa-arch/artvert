import type { KnowledgeEntityEnvelope, KnowledgeEntityInput, KnowledgeEntityType } from "@/schemas/knowledge-entity-envelope";

export type KnowledgeEntityQuery = {
  type?: KnowledgeEntityType;
  publishedOnly?: boolean;
};

export interface KnowledgeEntityRepository {
  findById(id: string): Promise<KnowledgeEntityEnvelope | null>;
  findByTypeAndSlug(type: KnowledgeEntityType, slug: string): Promise<KnowledgeEntityEnvelope | null>;
  list(query?: KnowledgeEntityQuery): Promise<KnowledgeEntityEnvelope[]>;
  materializePublishedSnapshot(): Promise<KnowledgeEntityEnvelope[]>;
  create(input: KnowledgeEntityInput): Promise<KnowledgeEntityEnvelope>;
  update(id: string, input: KnowledgeEntityInput): Promise<KnowledgeEntityEnvelope>;
  delete(id: string): Promise<void>;
}

export type PlantRepository = KnowledgeEntityRepository;
export type DiseaseRepository = KnowledgeEntityRepository;
export type PestRepository = KnowledgeEntityRepository;
export type DeficiencyRepository = KnowledgeEntityRepository;
export type ProductRepository = KnowledgeEntityRepository;
