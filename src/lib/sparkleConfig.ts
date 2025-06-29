export interface SparkleConfig {
  elementId: string;
  sparkleCount: number;
  animationDuration: number;
  sizeRange: { min: number; max: number };
  colorPalette: string[];
  enabled: boolean;
  pattern?: 'random' | 'radial' | 'edge';
  radius?: number;
}

export const DEFAULT_SPARKLE_CONFIG: SparkleConfig = {
  elementId: '',
  sparkleCount: 8, // Reduced from 40+
  animationDuration: 2.0,
  sizeRange: { min: 1, max: 3 },
  colorPalette: ['255,191,0', '255,140,0', '255,69,0'],
  enabled: true,
  pattern: 'random'
};

// Performance-based configurations
export const PERFORMANCE_CONFIGS = {
  low: { sparkleCount: 4, animationDuration: 1.5 },
  medium: { sparkleCount: 8, animationDuration: 2.0 },
  high: { sparkleCount: 12, animationDuration: 2.5 }
};

// Predefined color palettes
export const COLOR_PALETTES = {
  ember: ['255,191,0', '255,140,0', '255,69,0'],
  weak: ['139,69,19', '105,105,105', '128,128,128'],
  carmine: ['150,0,24', '255,69,0', '255,140,0'],
  blue: ['31,59,115', '11,29,58', '255,191,0']
};