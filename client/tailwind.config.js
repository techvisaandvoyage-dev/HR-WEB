/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        roboto: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        accent: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        sjsans: ['var(--sj-f)', 'system-ui', '-apple-system', 'sans-serif'],
        sjheading: ['var(--sj-fh)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        palette: {
          50: 'var(--palette-50, #fff5f0)',
          100: 'var(--palette-100, #ffffff)',
          200: 'var(--palette-200, #fff0ec)', 
          400: 'var(--palette-400, #ff4f2b)',
          900: 'var(--palette-900, #ff4f2b)',
        },
        sj: {
          ink: 'var(--sj-ink)',
          mute: 'var(--sj-mute)',
          line: 'var(--sj-line)',
          soft: 'var(--sj-soft)',
          acc: 'var(--sj-acc)',
          accS: 'var(--sj-accS)',
          accD: 'var(--sj-accD)',
          accL: 'var(--sj-accL)',
          onacc: 'var(--sj-onacc)',
          mk: 'var(--sj-mk)',
          bg: 'var(--sj-bg)',
          ok: 'var(--sj-ok)',
        }
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
