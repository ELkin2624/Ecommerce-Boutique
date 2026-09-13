/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        input: "hsl(var(--input, 214.3 31.8% 91.4%))",
        ring: "hsl(var(--ring, 222.2 84% 4.9%))",
        background: "hsl(var(--background, 0 0% 100%))",
        foreground: "hsl(var(--foreground, 222.2 84% 4.9%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 222.2 47.4% 11.2%))",
          foreground: "hsl(var(--primary-foreground, 210 40% 98%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 210 40% 96.1%))",
          foreground: "hsl(var(--secondary-foreground, 222.2 47.4% 11.2%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 210 40% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
          foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 210 40% 96.1%))",
          foreground: "hsl(var(--accent-foreground, 222.2 47.4% 11.2%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222.2 84% 4.9%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 222.2 84% 4.9%))",
        },
        boutique: {
          // Paleta Masculina (Navy, Teal, Sky Blue, Beige, White)
          men: {
            navy: 'var(--men-navy, #2F4156)',
            teal: 'var(--men-teal, #567C8D)',
            sky: 'var(--men-sky, #C8D9E6)',
            beige: 'var(--men-beige, #F5EFEB)',
            white: 'var(--men-white, #FFFFFF)',
          },
          // Paleta Femenina (Soft Pink, Rose, Peach Cream, Dusty Mauve, Mint Mist)
          women: {
            pink: 'var(--women-pink, #FFCAD4)',
            rose: 'var(--women-rose, #F4ACB7)',
            peach: 'var(--women-peach, #FFE5D9)',
            mauve: 'var(--women-mauve, #9D8189)',
            mint: 'var(--women-mint, #D8E2DC)',
          },
        },
      },
    },
  },
  plugins: [],
}

