import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { 50: "#FFF6EC", 100: "#FFE9D1", 200: "#FFD09F", 300: "#FDB066", 400: "#F99A3D", 500: "#F28C28", 600: "#DD7212", 700: "#B4570C", 800: "#8A4210", 900: "#5E2E0E" },
        leaf: { 50: "#EEF8F0", 100: "#D6EEDB", 200: "#A9DBB4", 300: "#74C186", 400: "#45A35D", 500: "#2A8A45", 600: "#1E7B3A", 700: "#18602E", 800: "#154C27", 900: "#0F361C" },
        cream: "#FFFBF3",
        ink: "#2B1B0E",
      },
      fontFamily: {
        sans: ["Poppins", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        hindi: ["Noto Sans Devanagari", "Poppins", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(43,27,14,.06), 0 8px 24px -12px rgba(43,27,14,.18)" },
    },
  },
  plugins: [],
};
export default config;
