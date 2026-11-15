/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pure: {
          black: "#000000",
          white: "#ffffff",
          dark: "#080808",
          card: "#09090b",
          elevated: "#121214",
          border: "rgba(255, 255, 255, 0.12)",
          borderHover: "rgba(255, 255, 255, 0.28)",
          subtle: "#71717a",
          muted: "#a1a1aa",
        },
        dark: {
          950: "#000000",
          900: "#050505",
          850: "#0a0a0a",
          800: "#101010",
          750: "#18181b",
          700: "#27272a",
        },
      },
      animation: {
        slideIn: "slideIn 180ms ease-out",
        fadeIn: "fadeIn 180ms ease-out",
      },
      keyframes: {
        slideIn: {
          from: {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          to: {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        fadeIn: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
}
