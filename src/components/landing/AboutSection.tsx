import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { Hearth } from '../ui/Hearth';
import { Heading2, Heading3, TextBlock, SmallText } from '../ui/Typography';
import { Eye, MessageCircle, Users, FlameIcon } from 'lucide-react';

interface AboutSectionProps {
  // Add any props needed for the about section
}

export const AboutSection: React.FC<AboutSectionProps> = () => {
  // Sample flames for the example hearth
  const exampleFlames = [
    { id: '1', x: 15, y: 25, strength: 0.9, size: 70, name: 'Sarah' },
    { id: '2', x: 50, y: 15, strength: 0.7, size: 60, name: 'Mike' },
    { id: '3', x: 85, y: 35, strength: 0.5, size: 50, name: 'Emma' },
    { id: '4', x: 25, y: 75, strength: 0.2, size: 40, name: 'Alex' },
    { id: '5', x: 75, y: 80, strength: 0.8, size: 65, name: 'David' },
  ];

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

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Eye className="w-6 h-6 text-softwhite" />}
            title="Canvas View"
            description="A dark, ambient backdrop dotted with glowing embers, each pulsing to life as connections grow."
            expandedContent="The Canvas View is your personal constellation of connections. Each ember represents someone important in your life, positioned organically across a dark, starlit backdrop. The brighter the ember, the stronger your connection."
          />
          
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6 text-softwhite" />}
            title="Ephemeral Messages"
            description="Notes and photos that burst into view—and burn out on your terms."
            expandedContent="Ephemeral Messages reimagine how we share moments. Instead of permanent archives, your conversations flow like sparks from a fire—bright, meaningful, and naturally fading."
          />
          
          <FeatureCard
            icon={<Users className="w-6 h-6 text-softwhite" />}
            title="Glow Metrics"
            description="See at a glance which friendships need tending, thanks to dynamic brightness and gentle flickers."
            expandedContent="Glow Metrics transform relationship maintenance from a chore into an intuitive experience. Your connections naturally show their health through visual cues."
          />
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  expandedContent: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  expandedContent
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <BurningPaperCard className="text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto flex items-center justify-center">
          <IconedButton
            icon={icon}
            label={`Learn more about ${title}`}
            size="lg"
            onClick={() => setExpanded(!expanded)}
            className={`transition-all duration-300 ${
              expanded ? 'scale-110' : ''
            }`}
          />
        </div>
        
        <Heading3>{title}</Heading3>
        
        <TextBlock className="text-sm">
          {description}
        </TextBlock>
        
        {expanded && (
          <div className="mt-6 pt-6 border-t border-ember/30 text-left">
            <TextBlock className="text-sm leading-relaxed">
              {expandedContent}
            </TextBlock>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-ember hover:text-carmine transition-colors"
              >
                Show less
              </button>
            </div>
          </div>
        )}
        
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-ember hover:text-carmine transition-colors mt-2"
          >
            Learn more
          </button>
        )}
      </div>
    </BurningPaperCard>
  );
};