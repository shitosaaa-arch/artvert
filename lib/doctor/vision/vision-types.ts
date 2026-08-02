export type ImageQualityState = "ACCEPTABLE" | "BLURRY" | "TOO_DARK" | "OVEREXPOSED" | "TOO_SMALL" | "POOR_FRAMING" | "MULTIPLE_PLANTS" | "NO_PLANT_DETECTED" | "UNSUPPORTED_CONTENT" | "PROCESSING_FAILED";
export type VisionProviderStatus = "image_ready" | "image_invalid" | "image_quality_insufficient" | "vision_provider_unavailable" | "vision_processing_failed";
export type VisionObservationResult = {
  plantPresence: "CONFIRMED" | "POSSIBLE" | "NOT_DETECTED" | "UNKNOWN";
  multiplePlants: "TRUE" | "FALSE" | "UNKNOWN";
  visibleSymptoms: string[];
  affectedParts: string[];
  visualPatterns: string[];
  confidence: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  qualityFindings: ImageQualityState[];
  recaptureGuidance: string[];
  safeRationale: string[];
};
export type VisionImage = { id: string; bytes: Buffer; mimeType: "image/jpeg" | "image/png" | "image/webp"; width: number; height: number };
export interface VisionAdapter { analyze(image: VisionImage, context: { message?: string }): Promise<VisionObservationResult>; }
