import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx,mdx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#FAFAF8",
          surface: "#F5EEEB",
          primary: "#2B2520",
          accent: "#D4A574",
          text: "#3D3935",
          muted: "#B8AFA3",
          contrast: "#FAFAF8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
