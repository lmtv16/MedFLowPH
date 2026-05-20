import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Semantic + MedFlow legacy palette — values come from `index.css` and follow `html.dark`
         * (no `prefers-color-scheme`; toggle only via `class="dark"` on `document.documentElement`).
         */
        mf: {
          primary: 'rgb(var(--mf-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--mf-secondary-rgb) / <alpha-value>)',
          bg: 'rgb(var(--mf-bg-rgb) / <alpha-value>)',
          card: 'rgb(var(--mf-card-rgb) / <alpha-value>)',
          'sidebar-bg': 'rgb(var(--mf-sidebar-bg-rgb) / <alpha-value>)',
          'sidebar-text': 'rgb(var(--mf-sidebar-text-rgb) / <alpha-value>)',
          'sidebar-active': 'rgb(var(--mf-sidebar-active-rgb) / <alpha-value>)',
          ink: 'rgb(var(--mf-ink-rgb) / <alpha-value>)',
          muted: 'rgb(var(--mf-muted-rgb) / <alpha-value>)',
          border: 'rgb(var(--mf-border-rgb) / <alpha-value>)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      fontSize: {
        /** Body / long-form: ~16–17px, comfortable line height */
        'mf-body': [
          'clamp(1rem, 0.9725rem + 0.14vw, 1.0625rem)',
          { lineHeight: '1.65' },
        ],
        /** Landing hero wordmark — ~40px mobile → ~56px desktop */
        'mf-hero': [
          'clamp(2.5rem, 1.65rem + 4.25vw, 3.5rem)',
          { lineHeight: '1.08', letterSpacing: '-0.02em' },
        ],
        /** Hero subtitle — ~16–18px mobile → ~18–22px desktop */
        'mf-hero-subtitle': [
          'clamp(1rem, 0.93rem + 0.42vw, 1.375rem)',
          { lineHeight: '1.45' },
        ],
        /** Inner page `<h1>` — ~32–44px */
        'mf-page-title': [
          'clamp(2rem, 1.48rem + 1.7vw, 2.75rem)',
          { lineHeight: '1.15', letterSpacing: '-0.02em' },
        ],
        /** Colored lead under page title */
        'mf-page-lead': [
          'clamp(1.0625rem, 1rem + 0.22vw, 1.375rem)',
          { lineHeight: '1.45' },
        ],
        /** Section `<h2>` in content — targets ~28px on large screens */
        'mf-section': [
          'clamp(1.375rem, 1.15rem + 1vw, 1.75rem)',
          { lineHeight: '1.28' },
        ],
        /** Card / panel titles — ~16–18px */
        'mf-card-title': [
          'clamp(1rem, 0.97rem + 0.16vw, 1.125rem)',
          { lineHeight: '1.38' },
        ],
        /** Captions, helper text, chart notes — ~13–14px */
        'mf-caption': [
          'clamp(0.8125rem, 0.78rem + 0.14vw, 0.875rem)',
          { lineHeight: '1.45' },
        ],
        /** Top nav pills — ~14–15px */
        'mf-nav': [
          'clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem)',
          { lineHeight: '1.35' },
        ],
        /** Right TOC rows — ~13–14px */
        'mf-toc': [
          'clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)',
          { lineHeight: '1.4' },
        ],
        /** Metric card primary value — ~24–36px */
        'mf-metric': [
          'clamp(1.5rem, 1.22rem + 1.05vw, 2.25rem)',
          { lineHeight: '1.12' },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
