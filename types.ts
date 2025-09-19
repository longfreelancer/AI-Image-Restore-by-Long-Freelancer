
export type UpscaleMode = 'deblurOnly' | 'upscale2k' | 'upscale4k' | 'upscale8k';
export type NoiseReductionLevel = 'low' | 'medium' | 'high';
export type DetailEnhanceLevel = 'natural' | 'sharp' | 'ultra';

export interface ConfigOptions {
  mode: UpscaleMode;
  faceRestore: boolean;
  noiseReduction: NoiseReductionLevel;
  detailEnhance: DetailEnhanceLevel;
}
