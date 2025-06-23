/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      imageRendering: {
        pixelated: 'pixelated',
      },
      colors: {
        ember: '#FFBF00',
        carmine: '#960018',
        golden: '#996515',
        navy: '#0B1D3A',
        deepblue: '#1F3B73',
        dark: '#0A0A0A',
        softwhite: '#F3F3F3',
        ash: '#999999',
        charcoal: '#2C1810',
        burnt: '#8B4513',
        smoke: '#696969',
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'monospace'],
        body: ['"Rubik"', 'sans-serif'],
      },
      borderRadius: {
        soft: '12px',
        round: '9999px',
      },
      boxShadow: {
        ember: '0 0 20px rgba(255,191,0,0.6)',
        glow: '0 0 12px rgba(255,191,0,0.4)',
        charred: 'inset 0 0 20px rgba(139, 69, 19, 0.8), 0 0 15px rgba(255, 140, 0, 0.4)',
      },
      animation: {
        emberPulse: 'emberPulse 2s ease-in-out infinite',
        cursorGlow: 'cursorGlow 2s ease-in-out infinite',
        flicker: 'flicker 1.5s infinite alternate',
        pixelFlame: 'pixelFlame 2s ease-in-out infinite',
        pixelFlicker: 'pixelFlicker 1.2s infinite ease-in-out',
        emberParticle: 'emberParticle 2s ease-out infinite',
        emberFromEdge: 'emberFromEdge linear forwards',
        emberExplosion: 'emberExplosion 1.2s ease-out infinite',
        ember: 'ember 2s ease-out infinite',
        burnProgress: 'burnProgress 8s ease-in-out infinite',
        charredEdge: 'charredEdge 3s ease-in-out infinite',
        ashFloat: 'ashFloat 4s ease-out infinite',
        flameFlicker: 'flameFlicker 0.8s ease-in-out infinite',
        flameLick: 'flameLick 0.8s ease-in-out infinite',
        smokeRise: 'smokeRise 6s ease-out infinite',
        paperCurl: 'paperCurl 6s ease-in-out infinite',
        burningEdgeGlow: 'burningEdgeGlow 1.5s ease-in-out infinite',
        flickeringShadows: 'flickeringShadows 2s ease-in-out infinite',
      },
      keyframes: {
        emberFromEdge: {
          '0%': {
            opacity: '1',
            transform: 'translate(0, 0) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(var(--tx), var(--ty)) scale(1.2)',
          },
        },
        emberExplosion: {
          '0%': {
            opacity: '1',
            transform: 'translate(0, 0) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(var(--tx), var(--ty)) scale(2)',
          },
        },
        emberParticle: {
          '0%': {
            opacity: '0',
            transform: 'translate(0, 0) scale(0.5)',
          },
          '30%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px) scale(1.2)',
          },
        },
        ember: {
          '0%': {
            opacity: '0',
            transform: 'translateY(0) scale(0.6)',
          },
          '20%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-20px) scale(1.2)',
          },
        },
        burnProgress: {
          '0%': {
            backgroundPosition: '0% 0%, 0% 0%, 0% 0%, 0% 0%',
            filter: 'brightness(1) contrast(1)',
          },
          '25%': {
            backgroundPosition: '25% 25%, 50% 25%, 75% 50%, 25% 75%',
            filter: 'brightness(1.1) contrast(1.1)',
          },
          '50%': {
            backgroundPosition: '50% 50%, 100% 50%, 50% 100%, 50% 50%',
            filter: 'brightness(0.9) contrast(1.2)',
          },
          '75%': {
            backgroundPosition: '75% 75%, 50% 75%, 25% 50%, 75% 25%',
            filter: 'brightness(1.05) contrast(1.05)',
          },
          '100%': {
            backgroundPosition: '100% 100%, 0% 100%, 100% 0%, 100% 100%',
            filter: 'brightness(1) contrast(1)',
          },
        },
        burningEdgeGlow: {
          '0%': {
            backgroundPosition: '0% 0%, 0% 0%, 0% 0%, 0% 0%',
            filter: 'blur(3px) brightness(1.2)',
          },
          '25%': {
            backgroundPosition: '25% 25%, 50% 75%, 75% 25%, 25% 75%',
            filter: 'blur(4px) brightness(1.4)',
          },
          '50%': {
            backgroundPosition: '50% 50%, 100% 50%, 50% 100%, 50% 50%',
            filter: 'blur(5px) brightness(1.6)',
          },
          '75%': {
            backgroundPosition: '75% 75%, 50% 25%, 25% 75%, 75% 25%',
            filter: 'blur(4px) brightness(1.4)',
          },
          '100%': {
            backgroundPosition: '100% 100%, 0% 0%, 100% 0%, 100% 100%',
            filter: 'blur(3px) brightness(1.2)',
          },
        },
        flickeringShadows: {
          '0%, 100%': {
            opacity: '0.6',
            filter: 'blur(2px)',
            backgroundPosition: '0% 0%, 0% 0%, 0% 0%, 0% 0%',
          },
          '25%': {
            opacity: '0.8',
            filter: 'blur(3px)',
            backgroundPosition: '25% 75%, 75% 25%, 50% 50%, 25% 25%',
          },
          '50%': {
            opacity: '0.4',
            filter: 'blur(1px)',
            backgroundPosition: '50% 50%, 50% 50%, 100% 100%, 50% 50%',
          },
          '75%': {
            opacity: '0.7',
            filter: 'blur(2.5px)',
            backgroundPosition: '75% 25%, 25% 75%, 50% 0%, 75% 75%',
          },
        },
        charredEdge: {
          '0%, 100%': {
            boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.8), inset 0 0 40px rgba(101, 67, 33, 0.6), 0 0 15px rgba(255, 140, 0, 0.4)',
          },
          '50%': {
            boxShadow: 'inset 0 0 25px rgba(139, 69, 19, 0.9), inset 0 0 50px rgba(101, 67, 33, 0.8), 0 0 20px rgba(255, 140, 0, 0.6)',
          },
        },
        ashFloat: {
          '0%': {
            opacity: '0',
            transform: 'translateY(0) translateX(0) rotate(0deg) scale(0.5)',
          },
          '10%': {
            opacity: '0.8',
          },
          '90%': {
            opacity: '0.3',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-60px) translateX(var(--drift-x)) rotate(360deg) scale(0.2)',
          },
        },
        flameFlicker: {
          '0%, 100%': {
            transform: 'translateY(0) scaleY(1) scaleX(1)',
            opacity: '0.8',
            filter: 'hue-rotate(0deg) brightness(1.2)',
          },
          '25%': {
            transform: 'translateY(-2px) scaleY(1.1) scaleX(0.9)',
            opacity: '1',
            filter: 'hue-rotate(10deg) brightness(1.4)',
          },
          '50%': {
            transform: 'translateY(-1px) scaleY(0.9) scaleX(1.1)',
            opacity: '0.9',
            filter: 'hue-rotate(-5deg) brightness(1.1)',
          },
          '75%': {
            transform: 'translateY(-3px) scaleY(1.2) scaleX(0.8)',
            opacity: '1',
            filter: 'hue-rotate(15deg) brightness(1.3)',
          },
        },
        flameLick: {
          '0%, 100%': {
            transform: 'translateY(0) scaleY(1) scaleX(1) rotate(0deg)',
            opacity: '0.7',
          },
          '25%': {
            transform: 'translateY(-1px) scaleY(1.2) scaleX(0.8) rotate(2deg)',
            opacity: '1',
          },
          '50%': {
            transform: 'translateY(-2px) scaleY(0.9) scaleX(1.1) rotate(-1deg)',
            opacity: '0.8',
          },
          '75%': {
            transform: 'translateY(-1px) scaleY(1.1) scaleX(0.9) rotate(1deg)',
            opacity: '0.9',
          },
        },
        smokeRise: {
          '0%': {
            opacity: '0.6',
            transform: 'translateY(0) translateX(0) scale(0.5)',
            filter: 'blur(1px)',
          },
          '50%': {
            opacity: '0.4',
            transform: 'translateY(-30px) translateX(var(--smoke-drift)) scale(1)',
            filter: 'blur(2px)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-80px) translateX(calc(var(--smoke-drift) * 2)) scale(1.5)',
            filter: 'blur(4px)',
          },
        },
        paperCurl: {
          '0%': {
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
          },
          '25%': {
            transform: 'perspective(1000px) rotateX(2deg) rotateY(-1deg)',
          },
          '50%': {
            transform: 'perspective(1000px) rotateX(-1deg) rotateY(2deg)',
          },
          '75%': {
            transform: 'perspective(1000px) rotateX(1deg) rotateY(-2deg)',
          },
          '100%': {
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
          },
        },
        emberPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,191,0,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255,191,0,0.6)' },
        },
        cursorGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        flicker: {
          '0%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
          '100%': { opacity: '1', filter: 'brightness(1.1)' },
        },
        pixelFlame: {
          '0%': {
            filter: 'drop-shadow(0 0 1px rgba(255,191,0,0.1))',
            transform: 'translateY(0) scale(1)',
            opacity: '0.6',
          },
          '50%': {
            filter: 'drop-shadow(0 0 6px rgba(255,100,0,0.5))',
            transform: 'translateY(-1px) scale(1.05)',
            opacity: '1',
          },
          '100%': {
            filter: 'drop-shadow(0 0 1px rgba(255,191,0,0.1))',
            transform: 'translateY(0) scale(1)',
            opacity: '0.6',
          },
        },
        pixelFlicker: {
          '0%': {
            opacity: '0.2',
            transform: 'translate(0, 0) scale(1)',
          },
          '50%': {
            opacity: '1',
            transform: 'translate(-1px, -1px) scale(1.2)',
          },
          '100%': {
            opacity: '0.2',
            transform: 'translate(0, 0) scale(1)',
          },
        },
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.image-rendering-pixelated': {
          imageRendering: 'pixelated',
        },
      });
    },
  ],
}