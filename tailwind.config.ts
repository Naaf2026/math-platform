import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#071B3A",
        teal: "#0D666B",
        gold: "#C9952E",
        ivory: "#FAF8F2",
      },
    },
  },
  plugins: [],
};

export default config;
