export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10141B",
        panel: "#1A2130",
        panelAlt: "#212A3C",
        line: "#2C3648",
        cream: "#E9E5DA",
        muted: "#8A93A6",
        go: "#3ECF8E",
        accent: "#3ECF8E",
        caution: "#F2A93B",
        warn: "#E5555A",
        info: "#5EA8C7",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
