import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { 50: "#FFF6EC", 100: "#FFE9D1", 200: "#FFD09F", 300: "#FDB066", 400: "#F99A3D", 500: "#F28C28", 600: "#DD7212", 700: "#B4570C", 800: "#8A4210", 900: "#5E2E0E" },
        leaf: { 50: "#EEF8F0", 100: "#D6EEDB", 200: "#A9DBB4", 300: "#74C186", 400: "#45A35D", 500: "#2A8A45", 600: "#1E7B3A", 700: "#18602E", 800: "#154C27", 900: "#0F361C" },
        cream: "#FFF8EC",
        earth: { 50: "#FAF3EA", 100: "#F1E2CC", 200: "#E2C6A0", 300: "#CBA170", 400: "#A9794A", 500: "#8B5A2B", 600: "#734A24", 700: "#5C3B1E", 800: "#452C17", 900: "#2F1E10" },
        ink: "#2B1B0E",
        // Royal night + antique gold, for the premium look
        royal: { 700: "#4A1A22", 800: "#36121A", 900: "#240B11", 950: "#160609" },
        gold: { 100: "#FBF0D3", 200: "#F5DEA0", 300: "#ECC86E", 400: "#DDAE4A", 500: "#C8932F", 600: "#A87522", 700: "#835A1B" },
      },
      fontFamily: {
        // Same typography as the "Zindagi with Sachin" site: Merriweather for Latin text, Mukta for Devanagari.
        sans: ["Merriweather", "Mukta", "Georgia", "Times New Roman", "serif"],
        serif: ["Merriweather", "Mukta", "Georgia", "serif"],
        hindi: ["Mukta", "Merriweather", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(69,44,23,.06), 0 10px 28px -14px rgba(69,44,23,.22)",
        glow: "0 0 0 6px rgba(242,140,40,.12)",
        luxe: "0 30px 60px -25px rgba(36,11,17,.55), 0 0 0 1px rgba(221,174,74,.25)",
        gold: "0 10px 30px -8px rgba(200,147,47,.55)",
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        spinslow: { to: { transform: "rotate(360deg)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        marquee: "marquee 45s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        spinslow: "spinslow 90s linear infinite",
        rise: "rise .8s cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
