export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 24px 60px rgba(4, 18, 40, 0.08)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 36%)",
      },
      colors: {
        brand: {
          50: "#ebf5ff",
          100: "#dbeafe",
          500: "#0b5ed7",
          600: "#0a53b6",
          700: "#0a4a9d",
        },
      },
    },
  },
  plugins: [],
};
