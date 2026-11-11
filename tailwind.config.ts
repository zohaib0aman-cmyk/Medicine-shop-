import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#0F4C3A",
          950: "#082B21",
          900: "#0B3A2C",
          800: "#0F4C3A",
          700: "#16634C",
          600: "#1E7A5E",
          100: "#E3EEE8",
          50: "#F0F6F2",
        },
        cream: { DEFAULT: "#FAF6EE", 50: "#FFFDF8", 100: "#FAF6EE", 200: "#F3ECDD", 300: "#E9DFC9" },
        gold: { DEFAULT: "#C9A24B", 300: "#E3C987", 400: "#D6B465", 500: "#C9A24B", 600: "#A9852F", 700: "#86681F" },
        charcoal: { DEFAULT: "#1F2421", 70: "#4A514D", 50: "#6B716D" },
        // admin theme tokens (light / dark are swapped via CSS variables in admin.css)
        a: {
          bg: "rgb(var(--a-bg) / <alpha-value>)",
          surface: "rgb(var(--a-surface) / <alpha-value>)",
          raised: "rgb(var(--a-raised) / <alpha-value>)",
          border: "rgb(var(--a-border) / <alpha-value>)",
          text: "rgb(var(--a-text) / <alpha-value>)",
          muted: "rgb(var(--a-muted) / <alpha-value>)",
          primary: "rgb(var(--a-primary) / <alpha-value>)",
          "on-primary": "rgb(var(--a-on-primary) / <alpha-value>)",
          gold: "rgb(var(--a-gold) / <alpha-value>)",
          danger: "rgb(var(--a-danger) / <alpha-value>)",
          "danger-bg": "rgb(var(--a-danger-bg) / <alpha-value>)",
          warn: "rgb(var(--a-warn) / <alpha-value>)",
          "warn-bg": "rgb(var(--a-warn-bg) / <alpha-value>)",
          ok: "rgb(var(--a-ok) / <alpha-value>)",
          "ok-bg": "rgb(var(--a-ok-bg) / <alpha-value>)",
          series: "rgb(var(--a-series) / <alpha-value>)",
          side: "rgb(var(--a-side) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "16px" },
      boxShadow: {
        soft: "0 1px 2px rgba(31,36,33,.04), 0 4px 12px rgba(31,36,33,.05), 0 16px 32px -12px rgba(15,76,58,.12)",
        lift: "0 2px 4px rgba(31,36,33,.05), 0 12px 24px rgba(31,36,33,.07), 0 28px 48px -16px rgba(15,76,58,.22)",
        gold: "0 0 0 1px rgba(201,162,75,.35), 0 10px 30px -10px rgba(201,162,75,.45)",
      },
      maxWidth: { site: "1200px" },
    },
  },
  plugins: [],
};
export default config;
