module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'default': "var(--customfont)",
      "display": `"irregardless-variable", sans-serif`
    },
    extend: {
      animation: {
        "start-loading": "startLoading 2s ease-in-out forwards",
        "end-loading": "endLoading 0.2s ease-in-out forwards",
        "pulsing": "pulseSlow 6s infinite ease-in-out",
      },
      keyframes: {
        startLoading: {
          "0%": { width: "0" },
          "100%": { width: "50%" },
        },
        endLoading: {
          "0%": { width: "50%" },
          "100%": { width: "100%" },
        },
        pulseSlow: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.5)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0.7" }
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
