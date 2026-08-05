import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map all spec tokens to Tailwind utilities
        bg:             "var(--bg)",
        surface:        "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        text:           "var(--text)",
        "text-muted":   "var(--text-muted)",
        border:         "var(--border)",
        "accent-live":  "var(--accent-live)",
        "accent-good":  "var(--accent-good)",
        "accent-warn":  "var(--accent-warn)",
        "accent-bad":   "var(--accent-bad)",
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["IBM Plex Mono", "Courier New", "monospace"],
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
