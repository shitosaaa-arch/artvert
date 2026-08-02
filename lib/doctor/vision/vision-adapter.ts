import type { VisionAdapter, VisionImage, VisionObservationResult } from "@/lib/doctor/vision/vision-types";

class UnavailableVisionAdapter implements VisionAdapter {
  async analyze(_image: VisionImage): Promise<VisionObservationResult> { throw new Error("VISION_PROVIDER_UNAVAILABLE"); }
}

export function getVisionAdapter(): VisionAdapter {
  const mode = process.env.VISION_PROVIDER ?? "disabled";
  if (mode === "disabled" || mode === "internal") return new UnavailableVisionAdapter();
  throw new Error("VISION_PROVIDER_UNAVAILABLE");
}
