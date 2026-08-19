/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark:  '#0A1128',
          navy:  '#0F172A',
          blue:  '#0052FF',
          hover: '#0043D0',
          light: '#EFF6FF',
        },
        accent: {
          green:     '#22C55E',
          greenSoft: '#DCFCE7',
          sky:       '#38BDF8',
          gold:      '#F59E0B',
          amber:     '#D97706',
          goldSoft:  '#FEF3C7',
        },
        brand: {
          tealSoft: '#E0F2FE',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '24px',
      },
      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'brand-md': '0 4px 6px -1px rgba(10,17,40,0.08), 0 2px 4px -1px rgba(10,17,40,0.04)',
        'brand-lg': '0 10px 15px -3px rgba(10,17,40,0.1), 0 4px 6px -2px rgba(10,17,40,0.05)',
        'brand-xl': '0 20px 25px -5px rgba(10,17,40,0.12), 0 10px 10px -5px rgba(10,17,40,0.04)',
      },
    },
  },
  plugins: [],
}
