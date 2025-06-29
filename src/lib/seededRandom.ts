// Seeded random number generator for consistent sparkle positioning
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  // Generate random number between 0 and 1
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  // Generate random integer between min and max (inclusive)
  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  // Generate random float between min and max
  randFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  // Pick random item from array
  pickRandom<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }
  
  // Generate consistent position based on index
  getPosition(index: number, elementId: string): { x: number; y: number } {
    const positionSeed = this.seed + index + elementId.charCodeAt(0);
    const tempRandom = new SeededRandom(positionSeed);
    return {
      x: tempRandom.randFloat(-100, 100),
      y: tempRandom.randFloat(-100, 100)
    };
  }
  
  // Generate radial position for flame-like effects
  getRadialPosition(index: number, elementId: string, radius: number): { x: number; y: number } {
    const positionSeed = this.seed + index + elementId.charCodeAt(0);
    const tempRandom = new SeededRandom(positionSeed);
    const angle = tempRandom.randFloat(0, Math.PI * 2);
    const distance = tempRandom.randFloat(radius * 0.3, radius);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }
}