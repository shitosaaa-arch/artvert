declare module "sharp" {
  type Metadata = { width?: number; height?: number; orientation?: number };
  type Stats = { channels: { mean: number; stdev: number }[] };
  type Sharp = { rotate(): Sharp; jpeg(options?: { quality?: number; mozjpeg?: boolean }): Sharp; png(): Sharp; webp(): Sharp; metadata(): Promise<Metadata>; stats(): Promise<Stats>; toBuffer(options?: { resolveWithObject?: boolean }): Promise<Buffer | { data: Buffer; info: { width: number; height: number } }> };
  function sharp(input: Buffer | { create: { width: number; height: number; channels: number; background: string | { r: number; g: number; b: number } } }, options?: { limitInputPixels?: number; failOn?: "none" | "warning" | "error" }): Sharp;
  export default sharp;
}
