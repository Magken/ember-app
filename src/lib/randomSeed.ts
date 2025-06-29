// Seeded random number generator for consistent sparkle positions
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Simple but effective seeded random
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Generate random integer between min and max
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Generate random float between min and max
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Pick random item from array
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// Generate consistent seed from component props
export const generateSeed = (componentId: string, props: Record<string, any>): number => {
  const seedString = componentId + JSON.stringify(props);
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};