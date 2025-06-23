import React, { useState } from 'react';
import { ChatBox } from './ui/ChatBox';
import { BurningPaperCard } from './ui/Card';
import { Heading1, Heading2, TextBlock, SmallText } from './ui/Typography';
import { MessageCircle, Flame as FlameIcon, Send, Users, Code, Zap } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName: string;
  seen?: boolean;
}

export const ChatPage: React.FC = () => {
  const [showChat, setShowChat] = useState(true);

  // Sample initial messages (newest first since they appear at top) with seen status
  const initialMessages: Message[] = [
    {
      id: '5',
      text: 'Perfect! I can\'t wait. Our connection has been burning bright lately! ✨',
      sender: 'other',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      senderName: 'Alex',
      seen: true
    },
    {
      id: '4',
      text: 'Absolutely! I\'ve already started looking at flights. This is going to be amazing! 🔥',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      senderName: 'You',
      seen: true
    },
    {
      id: '3',
      text: 'Same here! But I\'ve been thinking about that trip we planned. Are we still on for next month?',
      sender: 'other',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      senderName: 'Alex',
      seen: true
    },
    {
      id: '2',
      text: 'I know right! I\'ve been pretty busy with work lately. How about you?',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      senderName: 'You',
      seen: false // This message hasn't been seen yet
    },
    {
      id: '1',
      text: 'Hey! How have you been? It feels like forever since we last talked.',
      sender: 'other',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      senderName: 'Alex',
      seen: true
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Main container with proper padding and spacing */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-16">
          <Heading1 className="bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-carmine)] bg-clip-text text-transparent">
            Ember Chat
          </Heading1>
          <TextBlock className="text-[var(--color-gray)] max-w-2xl mx-auto">
            Where conversations fuel the flame of connection. Each message adds warmth to your ember.
          </TextBlock>
        </div>

        {/* Main Chat Demo Section - Full Width */}
        <section className="mb-32">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Interactive Chat Demo</Heading2>
          </div>
          
          {/* Chat Interface - Centered and full width */}
          <div className="max-w-4xl mx-auto">
            {showChat ? (
              <ChatBox
                contactName="Alex"
                connectionStrength={0.85}
                onClose={() => setShowChat(false)}
                height={600}
                initialMessages={initialMessages}
              />
            ) : (
              <BurningPaperCard className="h-[600px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FlameIcon className="w-16 h-16 text-ember mx-auto" />
                  <Heading2>Chat Closed</Heading2>
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-4 py-2 bg-ember text-dark rounded-soft hover:bg-carmine transition-colors"
                  >
                    Reopen Chat
                  </button>
                </div>
              </BurningPaperCard>
            )}
          </div>
        </section>

        {/* Features Section - Completely Separate */}
        <section className="mb-32">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Chat Features</Heading2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BurningPaperCard>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-dark" />
                </div>
                <Heading2 className="text-lg">Custom Input Design</Heading2>
                <TextBlock className="text-sm">
                  Enhanced input with ember particles, auto-expansion, and beautiful gradient styling that matches our burning paper aesthetic.
                </TextBlock>
              </div>
            </BurningPaperCard>

            <BurningPaperCard>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-carmine to-deepblue rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-softwhite" />
                </div>
                <Heading2 className="text-lg">Smart Scrolling</Heading2>
                <TextBlock className="text-sm">
                  Infinite scroll to load older messages, maintains scroll position, and auto-scrolls to newest messages with hidden scrollbars.
                </TextBlock>
              </div>
            </BurningPaperCard>

            <BurningPaperCard>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-deepblue to-ember rounded-full flex items-center justify-center">
                  <FlameIcon className="w-6 h-6 text-softwhite" />
                </div>
                <Heading2 className="text-lg">Connection Strength</Heading2>
                <TextBlock className="text-sm">
                  Visual flame indicator shows relationship strength, with dynamic colors and particle effects that reflect connection quality.
                </TextBlock>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Connection Strength Example - Separate Section */}
        <section className="mb-32">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Connection Strength Example</Heading2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <ChatBox
              contactName="Sarah"
              connectionStrength={0.95}
              height={400}
              initialMessages={[
                {
                  id: '1',
                  text: 'Our connection is blazing! 🔥',
                  sender: 'other',
                  timestamp: new Date(),
                  senderName: 'Sarah',
                  seen: true
                }
              ]}
            />
          </div>
        </section>

        {/* Technical Details Section - Completely Separate */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Code className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Technical Implementation</Heading2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BurningPaperCard>
              <Heading2 className="mb-6 text-xl">Component Features</Heading2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ember rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <SmallText className="font-medium text-ember">Reusable ChatBox Component</SmallText>
                    <div className="text-ash">Configurable props for contact name, connection strength, and height</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ember rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <SmallText className="font-medium text-ember">Custom ChatInput</SmallText>
                    <div className="text-ash">Enhanced styling with ember particles and auto-expansion</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ember rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <SmallText className="font-medium text-ember">Message Status System</SmallText>
                    <div className="text-ash">Single check for sent, double check for seen messages</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ember rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <SmallText className="font-medium text-ember">Infinite Scroll</SmallText>
                    <div className="text-ash">Load older messages by scrolling to top with position maintenance</div>
                  </div>
                </div>
              </div>
            </BurningPaperCard>

            <BurningPaperCard>
              <Heading2 className="mb-6 text-xl">Usage Example</Heading2>
              <div className="bg-navy/50 p-4 rounded text-xs font-mono text-ash overflow-x-auto">
                <div className="text-ember">{'<ChatBox'}</div>
                <div className="ml-2">contactName="Alex"</div>
                <div className="ml-2">connectionStrength={'{0.85}'}</div>
                <div className="ml-2">onClose={'{() => setShowChat(false)}'}</div>
                <div className="ml-2">height={'{600}'}</div>
                <div className="ml-2">initialMessages={'{messages}'}</div>
                <div className="text-ember">{'/>'}</div>
              </div>
              
              <div className="mt-6 space-y-2 text-sm">
                <SmallText className="font-medium text-ember">Key Props:</SmallText>
                <div className="text-ash space-y-1">
                  <div>• <code className="text-ember">contactName</code>: Display name for the contact</div>
                  <div>• <code className="text-ember">connectionStrength</code>: 0-1 value for flame intensity</div>
                  <div>• <code className="text-ember">height</code>: Fixed height in pixels</div>
                  <div>• <code className="text-ember">initialMessages</code>: Array of message objects</div>
                  <div>• <code className="text-ember">onClose</code>: Optional close handler</div>
                </div>
              </div>
            </BurningPaperCard>
          </div>
        </section>

      </div>
    </div>
  );
};