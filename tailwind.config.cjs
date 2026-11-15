/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,md,mdx,ts}"],
  darkMode: ["class", "[data-theme=black]"],
  theme: {
    extend: {
      colors: {
        ink: {
          1: "var(--ink-1)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        line: {
          1: "var(--line-1)",
        },
        brand: {
          1: "var(--accent-1)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: ["light", "black"],
    darkTheme: "black", // name of the included theme used for dark mode
    logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
  },
};
