import React, { useState } from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { Heading2, Heading3, TextBlock, SmallText } from '../ui/Typography';
import { Hearth } from '../ui/Hearth';
import { Eye, MessageCircle, Users } from 'lucide-react';

interface FlameData {
  id: string;
  x: number;
  y: number;
  strength: number;
  size?: number;
  name?: string;
}

interface AboutSectionProps {
  exampleFlames: FlameData[];
}

export const AboutSection: React.FC<AboutSectionProps> = ({ exampleFlames }) => {
  const [expandedCanvas, setExpandedCanvas] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  return (
    <section className="py-20 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Heading2 className="text-4xl md:text-5xl mb-6 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
            A different kind of inbox
          </Heading2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <TextBlock className="text-lg leading-relaxed">
              Embr isn't another feed. It's a hearth where your relationships glow. Every message, photo, or note is kindling—fueling the warmth and brightness of each ember.
            </TextBlock>
            <TextBlock className="text-lg leading-relaxed">
              Bright embers pulse with recent, rich interaction. Fading embers drift apart, reminding you to check in. Here, you don't scroll—you spark. You don't message everyone—you ember the ones that count.
            </TextBlock>
          </div>

          {/* Example Hearth with Live Flames - Dark Background */}
          <div className="relative">
            <BurningPaperCard glowOnHover className="text-center">
              <div className="space-y-4">
                <Heading3 className="mb-4">Your connections, visualized as living embers</Heading3>
                <div className="flex justify-center bg-black rounded-soft p-4">
                  <Hearth
                    flames={exampleFlames}
                    width={400}
                    height={300}
                    onFlameClick={(flameId) => console.log(`Clicked ${flameId}`)}
                    className="shadow-2xl"
                  />
                </div>
                <SmallText className="text-ash">
                  Each flame represents a friend. Bright flames show active connections, 
                  while dim flames need your attention.
                </SmallText>
              </div>
            </BurningPaperCard>
          </div>
        </div>

        {/* Canvas View Feature - Separate Section */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                {/* Design System Style Icon Button with correct color */}
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<Eye className="w-6 h-6 text-softwhite" />}
                    label="Learn more about Canvas View"
                    size="lg"
                    onClick={() => setExpandedCanvas(!expandedCanvas)}
                    className={`transition-all duration-300 ${
                      expandedCanvas ? 'scale-110' : ''
                    }`}
                  />
                </div>
                
                <Heading3>Canvas View</Heading3>
                
                {/* Short description - always visible */}
                <TextBlock className="text-sm">
                  A dark, ambient backdrop dotted with glowing embers, each pulsing to life as connections grow.
                </TextBlock>
                
                {/* Expanded content - conditionally visible */}
                {expandedCanvas && (
                  <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                    <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                      {`The Canvas View is your personal constellation of connections. Each ember represents someone important in your life, positioned organically across a dark, starlit backdrop. The brighter the ember, the stronger your connection.

Key Features:
• Interactive zoom and pan to explore your network
• Dynamic positioning based on relationship strength
• Ambient particle effects that respond to activity
• Intuitive visual hierarchy showing connection priorities
• Smooth animations that bring your network to life

The canvas adapts to your interaction patterns, subtly repositioning embers based on recent conversations and shared moments. It's not just a contact list—it's a living map of your relationships.`}
                    </TextBlock>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setExpandedCanvas(false)}
                        className="text-xs text-ember hover:text-carmine transition-colors"
                      >
                        Show less
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Show more button when not expanded */}
                {!expandedCanvas && (
                  <button
                    onClick={() => setExpandedCanvas(true)}
                    className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                  >
                    Learn more
                  </button>
                )}
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Ephemeral Messages Feature - Separate Section */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                {/* Design System Style Icon Button */}
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<MessageCircle className="w-6 h-6 text-softwhite" />}
                    label="Learn more about Ephemeral Messages"
                    size="lg"
                    onClick={() => setExpandedMessages(!expandedMessages)}
                    className={`transition-all duration-300 ${
                      expandedMessages ? 'scale-110' : ''
                    }`}
                  />
                </div>
                
                <Heading3>Ephemeral Messages</Heading3>
                
                {/* Short description - always visible */}
                <TextBlock className="text-sm">
                  Notes and photos that burst into view—and burn out on your terms.
                </TextBlock>
                
                {/* Expanded content - conditionally visible */}
                {expandedMessages && (
                  <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                    <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                      {`Ephemeral Messages reimagine how we share moments. Instead of permanent archives, your conversations flow like sparks from a fire—bright, meaningful, and naturally fading.

Message Types:
• Text messages with ember particle effects
• Photos that glow and fade over time
• Voice notes that crackle like fire
• GIFs with flame-like animations
• Disappearing media with customizable timers

Each message adds fuel to your connection's flame. The more you interact, the brighter your ember burns. Messages don't just disappear—they transform into the warmth that keeps your relationships glowing.

Privacy by design: No permanent storage, no data mining, just authentic moments shared between people who matter.`}
                    </TextBlock>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setExpandedMessages(false)}
                        className="text-xs text-ember hover:text-carmine transition-colors"
                      >
                        Show less
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Show more button when not expanded */}
                {!expandedMessages && (
                  <button
                    onClick={() => setExpandedMessages(true)}
                    className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                  >
                    Learn more
                  </button>
                )}
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Glow Metrics Feature - Separate Section */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                {/* Design System Style Icon Button */}
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<Users className="w-6 h-6 text-softwhite" />}
                    label="Learn more about Glow Metrics"
                    size="lg"
                    onClick={() => setExpandedMetrics(!expandedMetrics)}
                    className={`transition-all duration-300 ${
                      expandedMetrics ? 'scale-110' : ''
                    }`}
                  />
                </div>
                
                <Heading3>Glow Metrics</Heading3>
                
                {/* Short description - always visible */}
                <TextBlock className="text-sm">
                  See at a glance which friendships need tending, thanks to dynamic brightness and gentle flickers.
                </TextBlock>
                
                {/* Expanded content - conditionally visible */}
                {expandedMetrics && (
                  <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                    <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                      {`Glow Metrics transform relationship maintenance from a chore into an intuitive experience. Your connections naturally show their health through visual cues.

Visual Indicators:
• Flame brightness reflects interaction frequency
• Particle density shows conversation depth
• Color temperature indicates relationship warmth
• Flickering patterns reveal communication rhythms
• Dying embers highlight neglected connections

Smart Insights:
• Gentle reminders for friends you haven't contacted
• Celebration animations for strengthening bonds
• Seasonal patterns in your social energy
• Connection quality over quantity metrics
• Personalized suggestions for meaningful outreach

No numbers, no scores, no social pressure—just beautiful, intuitive feedback that helps you nurture the relationships that matter most.`}
                    </TextBlock>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setExpandedMetrics(false)}
                        className="text-xs text-ember hover:text-carmine transition-colors"
                      >
                        Show less
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Show more button when not expanded */}
                {!expandedMetrics && (
                  <button
                    onClick={() => setExpandedMetrics(true)}
                    className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                  >
                    Learn more
                  </button>
                )}
              </div>
            </BurningPaperCard>
          </div>
        </section>
      </div>
    </section>
  );
};