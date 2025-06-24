import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Minus, Maximize2, RefreshCw, MessageCircle } from 'lucide-react';
import { IconedButton } from './IconedButton';
import { Flame } from './Flame';

interface FlameData {
  id: string;
  x: number; // Position as percentage (0-100)
  y: number; // Position as percentage (0-100)
  strength: number; // 0-1
  size?: number;
  name?: string;
  hasUnreadMessages?: boolean; // New property for unread indicator
  unreadCount?: number; // New property for unread count
}

interface HearthProps {
  flames: FlameData[];
  className?: string;
  width?: number;
  height?: number;
  onFlameClick?: (flameId: string) => void;
  onRefresh?: () => void;
  showUnreadIndicators?: boolean; // New prop to control unread indicators
}

// Stable position generator that ensures flames are at least 50px apart
const generateStablePositions = (
  flameCount: number, 
  existingPositions?: Array<{id: string, x: number, y: number}>,
  hearthWidth: number = 800,
  hearthHeight: number = 600
): Array<{x: number, y: number}> => {
  if (flameCount === 0) return [];
  
  const positions: Array<{x: number, y: number}> = [];
  const centerX = 50;
  const centerY = 50;
  
  // Calculate minimum distance in percentage based on 50px requirement
  // Use the smaller dimension to ensure consistent spacing
  const minDimension = Math.min(hearthWidth, hearthHeight);
  const minDistancePercentage = (50 / minDimension) * 100; // Convert 50px to percentage
  const actualMinDistance = Math.max(minDistancePercentage, 8); // Ensure at least 8% spacing
  
  console.log(`Generating positions with ${actualMinDistance.toFixed(1)}% minimum distance (${minDimension}px hearth)`);
  
  // If we have existing positions and the count hasn't changed, reuse them
  if (existingPositions && existingPositions.length === flameCount) {
    return existingPositions.map(pos => ({ x: pos.x, y: pos.y }));
  }
  
  // Generate positions using improved spiral algorithm with collision detection
  for (let index = 0; index < flameCount; index++) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100; // Increased attempts for better placement
    let placed = false;
    
    // Try multiple placement strategies
    while (!placed && attempts < maxAttempts) {
      if (attempts < 50) {
        // Strategy 1: Deterministic spiral pattern (first 50 attempts)
        const spiralIndex = index + (attempts * 0.1);
        const angle = spiralIndex * 2.4; // Golden angle for even distribution
        const radius = Math.sqrt(spiralIndex + 1) * (actualMinDistance * 0.8); // Adjust radius based on min distance
        
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Strategy 2: Random placement with bias toward center (remaining attempts)
        const maxRadius = Math.min(40, 100 - actualMinDistance); // Stay within bounds
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * maxRadius;
        
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      // Keep within safe bounds (leave margin for flame size)
      const margin = actualMinDistance / 2;
      x = Math.max(margin, Math.min(100 - margin, x));
      y = Math.max(margin, Math.min(100 - margin, y));
      
      // Check collision with existing positions
      const hasCollision = positions.some(pos => {
        const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        return distance < actualMinDistance;
      });
      
      if (!hasCollision) {
        placed = true;
      }
      
      attempts++;
    }
    
    // If we couldn't place without collision, use fallback position
    if (!placed) {
      console.warn(`Could not place flame ${index} without collision after ${maxAttempts} attempts`);
      // Fallback: place in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(flameCount));
      const gridX = (index % gridSize) * (80 / gridSize) + 10;
      const gridY = Math.floor(index / gridSize) * (80 / gridSize) + 10;
      x = gridX;
      y = gridY;
    }
    
    positions.push({ x, y });
  }
  
  console.log(`Generated ${positions.length} positions with minimum ${actualMinDistance.toFixed(1)}% spacing`);
  return positions;
};

export const Hearth: React.FC<HearthProps> = ({
  flames,
  className = '',
  width = 800,
  height = 600,
  onFlameClick,
  onRefresh,
  showUnreadIndicators = false
}) => {
  const [zoom, setZoom] = useState(0.7); // Set initial zoom to 70%
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const hearthRef = useRef<HTMLDivElement>(null);
  const [autoZoomed, setAutoZoomed] = useState(false);
  
  // Store stable positions with flame IDs to maintain consistency
  const [stablePositions, setStablePositions] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [lastFlameCount, setLastFlameCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Generate stable positions only when flame count changes or on initialization
  useEffect(() => {
    const currentFlameCount = flames.length;
    const shouldRegeneratePositions = !initialized || currentFlameCount !== lastFlameCount;
    
    if (shouldRegeneratePositions) {
      console.log(`Generating positions - initialized: ${initialized}, count changed: ${lastFlameCount} -> ${currentFlameCount}`);
      
      // Pass hearth dimensions to position generator for accurate spacing calculation
      const newPositions = generateStablePositions(currentFlameCount, stablePositions, width, height);
      
      // Map positions to flame IDs to maintain consistency
      const positionsWithIds = flames.map((flame, index) => ({
        id: flame.id,
        x: newPositions[index]?.x || 50,
        y: newPositions[index]?.y || 50
      }));
      
      setStablePositions(positionsWithIds);
      setLastFlameCount(currentFlameCount);
      
      if (!initialized) {
        setInitialized(true);
      }
      
      // Reset auto-zoom when count changes
      if (currentFlameCount !== lastFlameCount) {
        setAutoZoomed(false);
      }
    }
  }, [flames.length, flames, lastFlameCount, initialized, stablePositions, width, height]);

  // Auto-zoom to fit all flames on initialization or when count changes
  useEffect(() => {
    if (flames.length > 0 && stablePositions.length > 0 && !autoZoomed) {
      autoFitFlames();
      setAutoZoomed(true);
    }
  }, [flames.length, stablePositions.length, autoZoomed]);

  const autoFitFlames = () => {
    if (stablePositions.length === 0) return;

    // Find bounds of all flame positions
    const padding = 10; // Percentage padding
    const minX = Math.min(...stablePositions.map(p => p.x)) - padding;
    const maxX = Math.max(...stablePositions.map(p => p.x)) + padding;
    const minY = Math.min(...stablePositions.map(p => p.y)) - padding;
    const maxY = Math.max(...stablePositions.map(p => p.y)) + padding;

    // Calculate required zoom to fit all flames
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const zoomX = 100 / contentWidth;
    const zoomY = 100 / contentHeight;
    const optimalZoom = Math.min(zoomX, zoomY, 2) * 0.7; // Cap at 2x zoom and apply 70% initial zoom

    // Calculate pan to center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const panOffsetX = (50 - centerX) * optimalZoom;
    const panOffsetY = (50 - centerY) * optimalZoom;

    setZoom(optimalZoom);
    setPanX(panOffsetX);
    setPanY(panOffsetY);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetView = () => {
    if (stablePositions.length > 0) {
      autoFitFlames();
    } else {
      // Reset to default view when no flames
      setZoom(0.7);
      setPanX(0);
      setPanY(0);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Mouse drag handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Allow events to reach buttons and flames
    if (target.closest('button') || target.closest('.flame-container')) {
      return;
    }

    // Only start dragging if clicking on the hearth background itself
    if (target === hearthRef.current || target.closest('[data-hearth-background]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panX, y: panY });
      e.preventDefault();
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Apply pan with zoom compensation
    setPanX(panStart.x + deltaX / zoom);
    setPanY(panStart.y + deltaY / zoom);
  }, [isDragging, dragStart, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile panning
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      
      // Allow events to reach buttons and flames
      if (target.closest('button') || target.closest('.flame-container')) {
        return;
      }

      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setPanStart({ x: panX, y: panY });
      e.preventDefault();
    }
  }, [panX, panY]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    setPanX(panStart.x + deltaX / zoom);
    setPanY(panStart.y + deltaY / zoom);
    e.preventDefault();
  }, [isDragging, dragStart, panStart, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse/touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Combine flames with stable positions - maintain position consistency
  const positionedFlames = useMemo(() => {
    if (flames.length === 0 || stablePositions.length === 0) {
      return [];
    }

    return flames.map((flame) => {
      // Find the stable position for this flame ID
      const stablePosition = stablePositions.find(pos => pos.id === flame.id);
      
      if (stablePosition) {
        return {
          ...flame,
          x: stablePosition.x,
          y: stablePosition.y
        };
      }
      
      // Fallback to first available position if flame ID not found
      const fallbackPosition = stablePositions[0] || { x: 50, y: 50 };
      return {
        ...flame,
        x: fallbackPosition.x,
        y: fallbackPosition.y
      };
    });
  }, [flames, stablePositions]);

  // Sort flames by strength so dying flames are more visible (rendered on top)
  const sortedFlames = useMemo(() => {
    return [...positionedFlames].sort((a, b) => a.strength - b.strength);
  }, [positionedFlames]);

  // Function to get flame color based on strength
  const getFlameColor = (strength: number) => {
    if (strength < 0.3) return 'text-carmine'; // Dying flames
    if (strength < 0.7) return 'text-ember'; // Medium flames
    return 'text-softwhite'; // Strong flames
  };

  return (
    <div 
      className={`relative bg-black overflow-hidden select-none ${className}`}
      style={{ 
        width, 
        height,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Control Buttons - Always enabled and clickable */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
        <IconedButton
          icon={<Plus className="w-4 h-4" />}
          label="Zoom In"
          size="sm"
          onClick={handleZoomIn}
        />
        <IconedButton
          icon={<Minus className="w-4 h-4" />}
          label="Zoom Out"
          size="sm"
          onClick={handleZoomOut}
        />
      </div>

      {/* Fit All Button - Always enabled and clickable */}
      <div className="absolute top-4 left-4 z-50 pointer-events-auto">
        <IconedButton
          icon={<Maximize2 className="w-4 h-4" />}
          label="Fit All"
          size="sm"
          onClick={resetView}
        />
      </div>

      {/* Refresh Button - Below Fit All - Always enabled and clickable */}
      <div className="absolute top-16 left-4 z-50 pointer-events-auto">
        <IconedButton
          icon={<RefreshCw className="w-4 h-4" />}
          label="Refresh"
          size="sm"
          onClick={handleRefresh}
        />
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 right-4 z-20 px-2 py-1 bg-navy/80 text-softwhite text-xs rounded border border-ember/30 pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Pan Instructions */}
      <div className="absolute bottom-4 left-4 z-20 px-2 py-1 bg-navy/80 text-ash text-xs rounded border border-ember/30 pointer-events-none">
        Drag to pan • 50px spacing
      </div>

      {/* Hearth Canvas with Pure Black Background */}
      <div
        ref={hearthRef}
        data-hearth-background="true"
        className="absolute inset-0 transition-transform duration-200 ease-out bg-black"
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center',
          transitionProperty: isDragging ? 'none' : 'transform'
        }}
      >
        {/* Background texture/pattern for the hearth - subtle on black */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" data-hearth-background="true">
          <div 
            className="w-full h-full"
            data-hearth-background="true"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(139,69,19,0.3) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(101,67,33,0.2) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(44,24,16,0.1) 0%, transparent 70%)
              `,
              backgroundSize: '200px 200px, 300px 300px, 400px 400px'
            }}
          />
        </div>

        {/* Flames positioned on the hearth with guaranteed 50px spacing */}
        {sortedFlames.map((flame) => {
          const flameSize = flame.size || 60;
          
          return (
            <div
              key={flame.id}
              className="absolute transition-all duration-500 flame-container pointer-events-auto"
              style={{
                left: `${flame.x}%`,
                top: `${flame.y}%`,
                transform: 'translate(-50%, -50%)',
                // Dying flames get a subtle highlight to make them more noticeable
                filter: flame.strength < 0.3 
                  ? 'drop-shadow(0 0 8px rgba(150,0,24,0.8))' 
                  : 'none',
                zIndex: flame.strength < 0.3 ? 10 : 5, // Dying flames on top
                cursor: 'pointer'
              }}
            >
              <Flame
                strength={flame.strength}
                size={flameSize}
                onClick={() => onFlameClick?.(flame.id)}
                interactive={true}
                animated={true}
              />
              
              {/* Flame name positioned outside the flame's brightest regions with increased distance */}
              {flame.name && (
                <div 
                  className={`absolute left-1/2 transform -translate-x-1/2 text-xs font-medium text-center whitespace-nowrap ${getFlameColor(flame.strength)} pointer-events-none flex items-center gap-2`}
                  style={{
                    top: `${flameSize * 1.6}px`, // Increased distance from flame
                    textShadow: flame.strength < 0.3 
                      ? '0 0 4px rgba(150,0,24,0.8)' 
                      : flame.strength < 0.7 
                        ? '0 0 4px rgba(255,191,0,0.6)' 
                        : '0 0 4px rgba(243,243,243,0.6)'
                  }}
                >
                  <span>{flame.name}</span>
                  
                  {/* Unread Message Indicator - positioned to the right of the name */}
                  {showUnreadIndicators && flame.hasUnreadMessages && (
                    <div className="relative">
                      {/* Green dot indicator */}
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      
                      {/* Unread count badge */}
                      {flame.unreadCount && flame.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-dark text-xs font-bold rounded-full flex items-center justify-center" style={{ fontSize: '8px' }}>
                          {flame.unreadCount > 9 ? '9+' : flame.unreadCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Dying flame indicator - positioned below name with increased distance */}
              {flame.strength < 0.3 && (
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 text-xs text-carmine font-medium animate-pulse pointer-events-none"
                  style={{
                    top: `${flameSize * 1.6 + 24}px` // Below the name with more space
                  }}
                >
                  Dying
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};