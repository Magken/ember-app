import React, { useState } from 'react';
import { EmberButton } from './ui/Button';
import { BurningPaperCard } from './ui/Card';
import { IconedButton } from './ui/IconedButton';
import { CheckButton } from './ui/CheckButton';
import { ToggleButton } from './ui/ToggleButton';
import { Datepicker } from './ui/Datepicker';
import { DropdownButton } from './ui/DropdownButton';
import { InputBox } from './ui/InputBox';
import { Heading1, Heading2, Heading3, TextBlock, SmallText, TinyText } from './ui/Typography';
import { Palette, Type, Square, Zap, Heart, Settings, Play, Star, Check, ToggleLeft, Calendar, ChevronDown, Edit3 } from 'lucide-react';

export const StyleShowcase: React.FC = () => {
  const [checkboxState, setCheckboxState] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const colors = [
    { name: 'Ember', value: '#FFBF00', var: '--color-ember' },
    { name: 'Carmine', value: '#960018', var: '--color-carmine' },
    { name: 'Brown', value: '#996515', var: '--color-brown' },
    { name: 'Navy', value: '#0B1D3A', var: '--color-navy' },
    { name: 'Deep Blue', value: '#1F3B73', var: '--color-deep-blue' },
    { name: 'Dark', value: '#0A0A0A', var: '--color-dark' },
    { name: 'White', value: '#F3F3F3', var: '--color-white' },
    { name: 'Gray', value: '#999999', var: '--color-gray' },
  ];

  const dropdownOptions = ['Option One', 'Option Two', 'Option Three', 'Option Four'];

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Heading1 className="bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-carmine)] bg-clip-text text-transparent">
            Embr Design System
          </Heading1>
          <TextBlock className="text-[var(--color-gray)] max-w-2xl mx-auto">
            A poetic media platform that visualizes connection as glowing embers. 
            This showcase demonstrates our complete design system with advanced particle effects and interactive components.
          </TextBlock>
        </div>

        {/* Color Palette */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Color Palette</Heading2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colors.map((color) => (
              <BurningPaperCard key={color.name} className="text-center">
                <div 
                  className="w-full h-16 rounded-lg mb-3"
                  style={{ backgroundColor: color.value }}
                />
                <Heading3 className="text-sm">{color.name}</Heading3>
                <SmallText>{color.value}</SmallText>
              </BurningPaperCard>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Typography</Heading2>
          </div>
          <BurningPaperCard>
            <div className="space-y-6">
              <div>
                <Heading1>Heading 1 - Syne Bold</Heading1>
                <SmallText>48px, Bold, Display Font</SmallText>
              </div>
              <div>
                <Heading2>Heading 2 - Syne Semibold</Heading2>
                <SmallText>38px, Semibold, Display Font</SmallText>
              </div>
              <div>
                <Heading3>Heading 3 - Syne Medium</Heading3>
                <SmallText>31px, Medium, Display Font</SmallText>
              </div>
              <div>
                <TextBlock>Body Text - Inter Regular</TextBlock>
                <SmallText>16px, Regular, Body Font</SmallText>
              </div>
              <div>
                <SmallText>Small Text - Inter Regular (14px)</SmallText>
              </div>
              <div>
                <TinyText>Tiny Text - Inter Regular (12px)</TinyText>
              </div>
            </div>
          </BurningPaperCard>
        </section>

        {/* Enhanced Buttons with Particle Effects */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Square className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Enhanced Buttons</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Primary Buttons with Ember Effects</Heading3>
              <div className="space-y-4">
                <EmberButton size="sm">Small Ember Button</EmberButton>
                <EmberButton size="md">Medium Ember Button</EmberButton>
                <EmberButton size="lg">Large Ember Button</EmberButton>
              </div>
            </BurningPaperCard>
            <BurningPaperCard>
              <Heading3 className="mb-4">Ghost Buttons with Particles</Heading3>
              <div className="space-y-4">
                <EmberButton variant="ghost" size="sm">Small Ghost</EmberButton>
                <EmberButton variant="ghost" size="md">Medium Ghost</EmberButton>
                <EmberButton variant="ghost" size="lg">Large Ghost</EmberButton>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Icon Buttons */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Icon Buttons</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Primary Icon Buttons</Heading3>
              <div className="flex gap-4 items-center">
                <IconedButton 
                  icon={<Heart className="w-4 h-4" />} 
                  label="Like" 
                  size="sm"
                />
                <IconedButton 
                  icon={<Settings className="w-5 h-5" />} 
                  label="Settings" 
                  size="md"
                />
                <IconedButton 
                  icon={<Play className="w-6 h-6" />} 
                  label="Play" 
                  size="lg"
                />
              </div>
            </BurningPaperCard>
            <BurningPaperCard>
              <Heading3 className="mb-4">Ghost Icon Buttons</Heading3>
              <div className="flex gap-4 items-center">
                <IconedButton 
                  icon={<Heart className="w-4 h-4" />} 
                  label="Like" 
                  variant="ghost"
                  size="sm"
                />
                <IconedButton 
                  icon={<Settings className="w-5 h-5" />} 
                  label="Settings" 
                  variant="ghost"
                  size="md"
                />
                <IconedButton 
                  icon={<Play className="w-6 h-6" />} 
                  label="Play" 
                  variant="ghost"
                  size="lg"
                />
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Form Controls */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Check className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Interactive Form Controls</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Checkbox with Ember Burst</Heading3>
              <div className="space-y-4">
                <CheckButton
                  checked={checkboxState}
                  onChange={setCheckboxState}
                  label="Enable ember effects"
                />
                <SmallText>Click to see the ember particle burst effect</SmallText>
              </div>
            </BurningPaperCard>
            <BurningPaperCard>
              <Heading3 className="mb-4">Toggle Switch</Heading3>
              <div className="space-y-4">
                <ToggleButton
                  checked={toggleState}
                  onChange={setToggleState}
                  label="Dark mode"
                />
                <SmallText>Toggle to see gradient transition and ember effects</SmallText>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Enhanced Form Inputs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Edit3 className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Enhanced Form Inputs</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Text Input with Ember Stream</Heading3>
              <div className="space-y-4">
                <InputBox
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder="Enter your message..."
                />
                <SmallText>Focus to see continuous ember particles streaming from edges</SmallText>
              </div>
            </BurningPaperCard>
            <BurningPaperCard>
              <Heading3 className="mb-4">Search Input</Heading3>
              <div className="space-y-4">
                <InputBox
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search the embers..."
                />
                <SmallText>Enhanced input with focused ember effects</SmallText>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Advanced Form Controls */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Advanced Form Controls</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-4">Date Picker with Ember Portal</Heading3>
              <div className="space-y-4">
                <Datepicker
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
                <SmallText>
                  {selectedDate 
                    ? `Selected: ${selectedDate.toLocaleDateString()}` 
                    : 'Click to open calendar with ember effects'
                  }
                </SmallText>
              </div>
            </BurningPaperCard>
            <BurningPaperCard>
              <Heading3 className="mb-4">Dropdown with Ember Bursts</Heading3>
              <div className="space-y-4">
                <DropdownButton
                  label="Choose Option"
                  options={dropdownOptions}
                  onSelect={(option) => console.log('Selected:', option)}
                />
                <SmallText>Hover and click to see ember particle effects</SmallText>
              </div>
            </BurningPaperCard>
          </div>
        </section>

        {/* Enhanced Cards */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-[var(--color-ember)]" />
            <Heading2>Enhanced Cards & Effects</Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurningPaperCard>
              <Heading3 className="mb-3">Standard Jagged Card</Heading3>
              <TextBlock className="mb-4">
                This card features a randomized jagged clip-path that creates organic, flame-like edges. 
                Each card has a unique shape generated on render.
              </TextBlock>
              <SmallText>Jagged edges with subtle glow</SmallText>
            </BurningPaperCard>
            <BurningPaperCard glowOnHover>
              <Heading3 className="mb-3">Interactive Ember Card</Heading3>
              <TextBlock className="mb-4">
                This card has animated ember particles along its edges that activate on hover. 
                The particles create a living flame effect around the card border.
              </TextBlock>
              <SmallText>Hover to see animated ember particles</SmallText>
            </BurningPaperCard>
          </div>
        </section>

        {/* Spacing System */}
        <section>
          <Heading2 className="mb-6">Spacing System</Heading2>
          <BurningPaperCard>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-1 bg-[var(--color-ember)]" style={{ height: 'var(--spacing-xs)' }}></div>
                <SmallText>XS - 4px</SmallText>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 bg-[var(--color-ember)]" style={{ height: 'var(--spacing-sm)' }}></div>
                <SmallText>SM - 8px</SmallText>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 bg-[var(--color-ember)]" style={{ height: 'var(--spacing-md)' }}></div>
                <SmallText>MD - 16px</SmallText>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 bg-[var(--color-ember)]" style={{ height: 'var(--spacing-lg)' }}></div>
                <SmallText>LG - 24px</SmallText>
              </div>
            </div>
          </BurningPaperCard>
        </section>

        {/* Interactive Demo */}
        <section>
          <Heading2 className="mb-6">Complete Interactive Demo</Heading2>
          <BurningPaperCard glowOnHover className="text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[var(--color-ember)] rounded-full mx-auto animate-pulse" 
                   style={{ animation: 'emberPulse 2s ease-in-out infinite' }}></div>
              <Heading3>Complete Ember Experience</Heading3>
              <TextBlock className="max-w-md mx-auto">
                This demonstration combines all ember effects: pulsing animation, particle systems, 
                jagged card edges, interactive controls, and enhanced form elements. Experience the full burning paper aesthetic.
              </TextBlock>
              <div className="flex gap-4 justify-center items-center flex-wrap">
                <EmberButton>Primary Ember</EmberButton>
                <EmberButton variant="ghost">Ghost Ember</EmberButton>
                <IconedButton 
                  icon={<Star className="w-5 h-5" />} 
                  label="Star"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <InputBox
                  value=""
                  onChange={() => {}}
                  placeholder="Try the ember input..."
                />
                <DropdownButton
                  label="Select Theme"
                  options={['Ember', 'Carmine', 'Navy', 'Deep Blue']}
                  onSelect={() => {}}
                />
              </div>
            </div>
          </BurningPaperCard>
        </section>

      </div>
    </div>
  );
};