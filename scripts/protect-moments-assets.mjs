/**
 * 图集页要做服务端密码保护，但 Astro 把图片统一输出到 /_astro。
 * 构建后把 moments 页引用的图片复制到 /moments/assets/，并改写页面里的
 * 图片路径，让 nginx 能对 /portfolio/moments/ 整段加 Basic Auth。
 *
 * 只处理图片扩展名，CSS / JS 仍留在 /_astro，不受影响。
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const HTML_PATH = path.join(DIST, "moments/index.html");
const SRC_DIR = path.join(DIST, "_astro");
const OUT_DIR = path.join(DIST, "moments/assets");

const IMAGE_PATH = /\/portfolio\/_astro\/([^"'\s,)]+\.(?:webp|jpe?g|png|avif|gif|svg))/g;

if (!existsSync(HTML_PATH)) {
  console.log("protect-moments-assets: 没有图集页，跳过");
  process.exit(0);
}

let html = await readFile(HTML_PATH, "utf8");
const fileNames = new Set();
let match;

while ((match = IMAGE_PATH.exec(html)) !== null) {
  fileNames.add(match[1]);
}

if (fileNames.size === 0) {
  console.log("protect-moments-assets: 图集页没有图片，跳过");
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });

let copied = 0;
for (const name of fileNames) {
  const src = path.join(SRC_DIR, name);
  if (!existsSync(src)) {
    continue;
  }
  await copyFile(src, path.join(OUT_DIR, name));
  copied += 1;
}

html = html.replace(IMAGE_PATH, "/portfolio/moments/assets/$1");
await writeFile(HTML_PATH, html);

console.log(`protect-moments-assets: 复制 ${copied} 张图并改写引用`);
