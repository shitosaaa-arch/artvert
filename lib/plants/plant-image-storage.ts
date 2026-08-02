import { FilesystemEntityImageStorage, getEntityImageStorage, type EntityImageStorage, type StoredEntityImage } from "@/lib/storage/entity-image-storage";
export type StoredPlantImage = StoredEntityImage;
export type PlantImageStorage = EntityImageStorage;
export class FilesystemPlantImageStorage extends FilesystemEntityImageStorage { constructor() { super("plants"); } }
export const getPlantImageStorage = () => getEntityImageStorage("plants");
