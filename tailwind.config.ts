import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ember: "var(--ember)",
        "ember-dim": "var(--ember-dim)",
        text: "var(--text)",
        muted: "var(--muted)"
      },
      boxShadow: {
        ember: "0 0 60px rgba(255, 90, 31, 0.22)",
        card: "0 20px 80px rgba(0, 0, 0, 0.28)"
      },
      fontFamily: {
        display: ["Arial Narrow", "Impact", "Haettenschweiler", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
