/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#07080a",
          900: "#0b0c10",
          850: "#101217",
          800: "#15171e",
          750: "#1b1e27",
          700: "#222531",
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
