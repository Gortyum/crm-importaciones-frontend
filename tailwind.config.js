/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f7f5ec",
          100: "#f0ede2",
          200: "#e2decc",
          300: "#c9c6b4",
          400: "#9a9989",
          500: "#7f8277",
          600: "#52564c",
          700: "#383c31",
          800: "#23261d",
          900: "#151710",
        },
        blue: {
          50: "#edf3ee",
          100: "#dce8e0",
          200: "#b7d0c1",
          300: "#8dbb9d",
          400: "#699c7d",
          500: "#4f8063",
          600: "#3d6a4c",
          700: "#2c4f39",
          800: "#243f2f",
          900: "#1c3326",
        },
        pine: {
          DEFAULT: "#3d6a4c",
          hi: "#5d8a69",
          ink: "#2c4f39",
        },
        carbon: {
          DEFAULT: "#151710",
          2: "#1c1e16",
          3: "#25271e",
        },
        paper: {
          DEFAULT: "#f0ede2",
          2: "#e6e2d3",
        },
        bone: "#faf8f1",
        mist: {
          DEFAULT: "#7f8277",
          2: "#a8ab9f",
        },
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "Cascadia Mono", "monospace"],
      },
    },
  },
  plugins: [],
};