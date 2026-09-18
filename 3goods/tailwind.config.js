/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, friendly, trustworthy neutral palette — deliberately not
        // Carousell red or marketplace styling. One warm accent (amber/terracotta).
        // Elegant, trustworthy bluish tint neutral background palette
        cream: {
          50: "#f4f8fc",
          100: "#eaf2fa",
          200: "#d9e6f5",
        },
        ink: {
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
        good: {
          100: "#e3f2e8",
          600: "#3f7a53",
        },
      },
      borderRadius: {
        card: "1rem",
      },
    },
  },
  plugins: [],
};
