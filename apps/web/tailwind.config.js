/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de Luxo Minimalista: Branco, Preto e Dourado
        'pure-white': '#FFFFFF',
        cream: '#FAFAF9', // Branco quente sofisticado
        'deep-black': '#0A0A0A', // Preto absoluto nobre
        gold: {
          DEFAULT: '#D4AF37', // Dourado metalizado clássico
          light: '#F5E6B3', // Champanhe claro suave
          dark: '#B38F24', // Dourado fosco profundo
        },
        // Fallbacks mapeados para harmonia
        'solar-orange': '#D4AF37', // Unificado para ouro luxo
        'leaf-green': '#0A0A0A', // Unificado para preto/monocromático
        'hot-pink': '#D4AF37',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.2em',
        ultra: '.28em',
      },
      boxShadow: {
        luxury: '0 20px 40px -15px rgba(10, 10, 10, 0.08)',
        gold: '0 10px 30px -5px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
}
