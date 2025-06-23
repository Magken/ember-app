import React, { useState } from 'react';
import { Flame } from './ui/Flame';
import { Hearth } from './ui/Hearth';
import { BurningPaperCard } from './ui/Card';
import { Heading1, Heading2, Heading3, TextBlock, SmallText, TinyText } from './ui/Typography';
import { Slider } from './ui/Slider';
import { ToggleButton } from './ui/ToggleButton';
import { Zap, Users, Heart, MessageCircle, Star, Flame as FlameIcon } from 'lucide-react';

export const FlameShowcase: React.FC = () => {
  const [customStrength, setCustomStrength] = useState(0.7);
  const [animated, setAnimated] = useState(true);
  const [interactive, setInteractive] = useState(true);

  // Sample flames for the hearth demonstration with names and increased spacing
  const sampleFlames = [
    { id: '1', x: 15, y: 20, strength: 0.95, size: 80, name: 'Alex' }, // Strong flame
    { id: '2', x: 50, y: 30, strength: 0.7, size: 60, name: 'Sarah' },  // Medium flame
    { id: '3', x: 85, y: 25, strength: 0.5, size: 50, name: 'Mike' },  // Steady flame
    { id: '4', x: 25, y: 70, strength: 0.15, size: 40, name: 'Emma' }, // Dying flame (noticeable)
    { id: '5', x: 75, y: 80, strength: 0.8, size: 70, name: 'David' },  // Strong flame
    { id: '6', x: 90, y: 60, strength: 0.25, size: 35, name: 'Lisa' }, // Another dying flame
    { id: '7', x: 10, y: 85, strength: 0.6, size: 55, name: 'Tom' },  // Medium flame
  ];

  const handleFlameClick = (flameId: string) => {
    console.log(`Clicked flame: ${flameId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Heading1 className="bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-carmine)] bg-clip-text text-transparent">
            Flame Component
          </Heading1>
          <TextBlock className="text-[var(--color-gray)] max-w-2xl mx-auto">
            Flames represent connections in Embr. Strong flames glow brightly with ember particles and flickering fire, 
            while weak flames pulse dimly as they fade away.
          </TextBlock>
        </div>

        {/* Hearth Canvas Demonstration */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <FlameIcon className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Interactive Hearth Canvas</Heading2>
          </div>
          
          <BurningPaperCard>
            <div className="space-y-6">
              <div>
                <Heading3 className="mb-4">Connection Hearth</Heading3>
                <TextBlock className="text-sm mb-6">
                  The Hearth acts as a canvas for visualizing multiple connections at once. 
                  It automatically zooms to fit all flames and highlights dying connections that need attention.
                  Use the zoom controls to explore individual flames in detail. Each flame displays the person's name below it.
                </TextBlock>
              </div>
              
              <div className="flex justify-center">
                <Hearth
                  flames={sampleFlames}
                  width={700}
                  height={500}
                  onFlameClick={handleFlameClick}
                  className="shadow-2xl"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-navy/30 rounded">
                  <div className="text-ember font-medium">Strong Flames</div>
                  <div className="text-xs text-ash">Bright, active connections</div>
                </div>
                <div className="text-center p-3 bg-navy/30 rounded">
                  <div className="text-softwhite font-medium">Steady Flames</div>
                  <div className="text-xs text-ash">Regular interactions</div>
                </div>
                <div className="text-center p-3 bg-carmine/20 rounded border border-carmine/30">
                  <div className="text-carmine font-medium">Dying Flames</div>
                  <div className="text-xs text-ash">Need attention - highlighted</div>
                </div>
              </div>
            </div>
          </BurningPaperCard>
        </section>

        {/* Flame Strength Examples */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Flame Strength Levels</Heading2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BurningPaperCard className="text-center">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Flame strength={0.1} size={80} />
                </div>
                <div>
                  <Heading3 className="text-carmine">Dying Flame</Heading3>
                  <SmallText>Strength: 0.1 - Barely glowing, needs attention</SmallText>
                  <TextBlock className="text-sm mt-2">
                    Represents a connection that hasn't been nurtured recently. 
                    The flame pulses weakly with muted colors and minimal particles.
                  </TextBlock>
                </div>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Flame strength={0.5} size={80} />
                </div>
                <div>
                  <Heading3 className="text-ember">Steady Flame</Heading3>
                  <SmallText>Strength: 0.5 - Moderate connection</SmallText>
                  <TextBlock className="text-sm mt-2">
                    A healthy connection with regular interaction. 
                    Shows warm colors with moderate ember particles and gentle flickering.
                  </TextBlock>
                </div>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Flame strength={0.9} size={80} />
                </div>
                <div>
                  <Heading3 className="text-softwhite">Blazing Flame</Heading3>
                  <SmallText>Strength: 0.9 - Strong, active connection</SmallText>
                  <TextBlock className="text-sm mt-2">
                    A vibrant, active connection with frequent interaction. 
                    Features bright core, intense glow, flame licks, and abundant particles.
                  </TextBlock>
                </div>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Interactive Flame Playground */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Interactive Flame Playground</Heading2>
          </div>
          
          <BurningPaperCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-3">
                    Flame Strength: {customStrength.toFixed(2)}
                  </label>
                  <Slider
                    value={customStrength}
                    onChange={setCustomStrength}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div className="space-y-4">
                  <ToggleButton
                    checked={animated}
                    onChange={setAnimated}
                    label="Enable animations"
                  />
                  <ToggleButton
                    checked={interactive}
                    onChange={setInteractive}
                    label="Enable hover effects"
                  />
                </div>

                <div className="space-y-2">
                  <SmallText className="font-medium">Flame Properties:</SmallText>
                  <div className="text-xs space-y-1 text-ash">
                    <div>• Core Size: {(30 + customStrength * 42).toFixed(0)}px</div>
                    <div>• Particles: {Math.floor(customStrength * 40)}</div>
                    <div>• Twinkles: {Math.floor(customStrength * 15)}</div>
                    <div>• Flame Licks: {customStrength < 0.3 ? 0 : Math.floor(customStrength * 12)}</div>
                    <div>• Type: {customStrength < 0.3 ? 'Dying' : customStrength < 0.7 ? 'Steady' : 'Blazing'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Flame 
                  strength={customStrength} 
                  size={100} 
                  animated={animated}
                  interactive={interactive}
                />
              </div>
            </div>
          </BurningPaperCard>
        </section>

        {/* Connection Scenarios */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Connection Scenarios</Heading2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Flame strength={0.95} size={60} />
                </div>
                <div className="flex items-center justify-center gap-2 text-ember">
                  <Heart className="w-4 h-4" />
                  <SmallText className="font-medium">Best Friend</SmallText>
                </div>
                <TinyText>Daily messages, strong bond</TinyText>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Flame strength={0.7} size={60} />
                </div>
                <div className="flex items-center justify-center gap-2 text-ember">
                  <MessageCircle className="w-4 h-4" />
                  <SmallText className="font-medium">Close Friend</SmallText>
                </div>
                <TinyText>Regular check-ins, good connection</TinyText>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Flame strength={0.4} size={60} />
                </div>
                <div className="flex items-center justify-center gap-2 text-ash">
                  <Users className="w-4 h-4" />
                  <SmallText className="font-medium">Acquaintance</SmallText>
                </div>
                <TinyText>Occasional messages</TinyText>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Flame strength={0.15} size={60} />
                </div>
                <div className="flex items-center justify-center gap-2 text-carmine">
                  <Zap className="w-4 h-4" />
                  <SmallText className="font-medium">Distant</SmallText>
                </div>
                <TinyText>Needs attention</TinyText>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Size Variations */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Size Variations</Heading2>
          </div>
          
          <BurningPaperCard>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center space-y-2">
                <Flame strength={0.8} size={30} />
                <SmallText>Small (30px)</SmallText>
              </div>
              <div className="text-center space-y-2">
                <Flame strength={0.8} size={50} />
                <SmallText>Medium (50px)</SmallText>
              </div>
              <div className="text-center space-y-2">
                <Flame strength={0.8} size={80} />
                <SmallText>Large (80px)</SmallText>
              </div>
              <div className="text-center space-y-2">
                <Flame strength={0.8} size={120} />
                <SmallText>Extra Large (120px)</SmallText>
              </div>
            </div>
          </BurningPaperCard>
        </section>

        {/* Usage Guidelines */}
        <section>
          <Heading2 className="mb-6">Usage Guidelines</Heading2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Strength Mapping</Heading3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>0.0 - 0.2</span>
                  <span className="text-carmine">Dying (needs attention)</span>
                </div>
                <div className="flex justify-between">
                  <span>0.3 - 0.6</span>
                  <span className="text-ash">Steady (moderate activity)</span>
                </div>
                <div className="flex justify-between">
                  <span>0.7 - 1.0</span>
                  <span className="text-ember">Blazing (very active)</span>
                </div>
              </div>
            </BurningPaperCard>

            <BurningPaperCard>
              <Heading3 className="mb-4">Best Practices</Heading3>
              <div className="space-y-2 text-sm">
                <div>• Use consistent sizing within the same context</div>
                <div>• Enable animations for better visual feedback</div>
                <div>• Consider hover effects for interactive elements</div>
                <div>• Map strength to actual connection metrics</div>
                <div>• Provide visual feedback when flames are clicked</div>
                <div>• Use Hearth for multi-flame visualizations</div>
                <div>• Names appear below flames in matching colors</div>
              </div>
            </BurningPaperCard>
          </div>
        </section>

      </div>
    </div>
  );
};