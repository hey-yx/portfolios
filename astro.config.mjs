import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeMermaidBlocks from "./src/lib/rehype-mermaid-blocks.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://itcox.cn",
  base: "/portfolio",
  security: {
    checkOrigin: false,
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeMermaidBlocks,
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content: { type: "text", value: "#" },
          properties: {
            className: ["heading-anchor"],
            ariaLabel: "复制标题链接",
          },
        },
      ],
    ],
  },
  integrations: [
    expressiveCode({
      themes: ["github-light", "github-dark-dimmed"],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) =>
        theme.type === "dark" ? "[data-theme='black']" : "[data-theme='light']",
    }),
    mdx(),
    tailwind(),
  ],
});
