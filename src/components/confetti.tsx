import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

export function Confetti({ trigger, onComplete, duration = 3000, particleCount = 150 }: ConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ];

  const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

  const createConfettiPiece = (id: number): ConfettiPiece => ({
    id,
    x: Math.random() * window.innerWidth,
    y: -20,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 3 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    shape: shapes[Math.floor(Math.random() * shapes.length)]
  });

  useEffect(() => {
    if (!trigger || isAnimating) return;

    setIsAnimating(true);
    const pieces = Array.from({ length: particleCount }, (_, i) => createConfettiPiece(i));
    setConfetti(pieces);

    const animationTimer = setInterval(() => {
      setConfetti(prevConfetti => 
        prevConfetti.map(piece => ({
          ...piece,
          x: piece.x + piece.vx,
          y: piece.y + piece.vy,
          rotation: piece.rotation + piece.rotationSpeed,
          vy: piece.vy + 0.1, // gravity
          vx: piece.vx * 0.999 // air resistance
        })).filter(piece => piece.y < window.innerHeight + 50)
      );
    }, 16);

    const cleanupTimer = setTimeout(() => {
      clearInterval(animationTimer);
      setConfetti([]);
      setIsAnimating(false);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(animationTimer);
      clearTimeout(cleanupTimer);
    };
  }, [trigger, duration, particleCount, isAnimating, onComplete]);

  if (!isAnimating || confetti.length === 0) return null;

  const renderShape = (piece: ConfettiPiece) => {
    const style = {
      position: 'absolute' as const,
      left: `${piece.x}px`,
      top: `${piece.y}px`,
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.color,
      transform: `rotate(${piece.rotation}deg)`,
      pointerEvents: 'none' as const,
    };

    switch (piece.shape) {
      case 'circle':
        return (
          <div
            key={piece.id}
            style={{
              ...style,
              borderRadius: '50%',
            }}
          />
        );
      case 'square':
        return (
          <div
            key={piece.id}
            style={style}
          />
        );
      case 'triangle':
        return (
          <div
            key={piece.id}
            style={{
              ...style,
              backgroundColor: 'transparent',
              borderLeft: `${piece.size / 2}px solid transparent`,
              borderRight: `${piece.size / 2}px solid transparent`,
              borderBottom: `${piece.size}px solid ${piece.color}`,
              width: 0,
              height: 0,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    >
      {confetti.map(renderShape)}
    </div>
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [shouldTrigger, setShouldTrigger] = useState(false);

  const triggerConfetti = () => {
    setShouldTrigger(true);
  };

  const resetConfetti = () => {
    setShouldTrigger(false);
  };

  return {
    shouldTrigger,
    triggerConfetti,
    resetConfetti,
    ConfettiComponent: ({ onComplete }: { onComplete?: () => void }) => (
      <Confetti 
        trigger={shouldTrigger} 
        onComplete={() => {
          resetConfetti();
          onComplete?.();
        }}
      />
    )
  };
}