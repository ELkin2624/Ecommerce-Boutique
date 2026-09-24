/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/entities/**/*.{js,jsx,ts,tsx}",
    "./src/shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        boutique: {
          men: {
            navy: '#2F4156',
            teal: '#567C8D',
            sky: '#C8D9E6',
            beige: '#F5EFEB',
            white: '#FFFFFF',
            primary: '#2F4156',
            accent: '#567C8D',
            surface: '#F5EFEB',
            highlight: '#C8D9E6',
          },
          women: {
            pink: '#FFCAD4',
            rose: '#F4ACB7',
            peach: '#FFE5D9',
            mauve: '#9D8189',
            mint: '#D8E2DC',
            primary: '#9D8189',
            accent: '#F4ACB7',
            surface: '#FFE5D9',
            highlight: '#FFCAD4',
            secondary: '#D8E2DC',
          },
        },
      },
    },
  },
  plugins: [],
};
