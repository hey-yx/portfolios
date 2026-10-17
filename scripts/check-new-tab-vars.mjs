// new-tab 页面脚本的「未声明变量」静态检查。
//
// 背景：2026-10-16 的事故——f58d54a 重写添加站点表单时丢了三个 let 声明，ESM 严格模式下
// 赋值即 ReferenceError，整页脚本从 input 事件处静默瘫痪，用户侧表现为「添加站点无反应」。
// astro check 不查 .astro 里打包型 <script> 的函数体，页面顶部的 @ts-nocheck 又整体豁免，
// 所以这类错误此前没有任何关卡能发现。
//
// 手法：把 <script> 抠成临时 .ts（摘掉 @ts-nocheck、修掉相对 import 路径），
// 用 tsc --strict 跑，只对 TS2304（找不到名字）/ TS7023 失败——即「变量在用但没声明」。
// 隐式 any 是这份 4400 行大文件的历史存量，刻意不纳入判据，否则检查永远红着没人看。
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const astroFile = path.join(root, "src/pages/new-tab.astro");
const tempFile = path.join(root, "src/__ntab_lint__.ts");
const tscBin = path.join(root, "node_modules/.bin/tsc");

const source = readFileSync(astroFile, "utf8");
const scriptMatch = source.match(/<script(?![^>]*is:inline)[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("FAIL: 在 new-tab.astro 里找不到打包型 <script>");
  process.exit(2);
}

const code = scriptMatch[1]
  .replace(/^\s*\/\/\s*@ts-nocheck\s*$/m, "")
  .replace(/from "\.\.\/data\/meta-proxy"/, 'from "./data/meta-proxy"');

mkdirSync(path.dirname(tempFile), { recursive: true });
writeFileSync(tempFile, code);

try {
  execFileSync(
    tscBin,
    ["--noEmit", "--ignoreConfig", "--strict", "--target", "ES2022", "--module", "ESNext",
     "--moduleResolution", "bundler", "--lib", "ES2022,DOM,DOM.Iterable",
     "--skipLibCheck", tempFile],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  console.log("PASS: new-tab 页面脚本无未声明变量");
} catch (e) {
  const text = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  const relevant = text.split("\n").filter((line) => /error TS2304|error TS7023/.test(line));
  if (relevant.length) {
    console.error(`FAIL: new-tab 页面脚本引用了未声明的变量（ESM 下会整页静默瘫痪）:\n${relevant.join("\n")}`);
    process.exit(1);
  }
  console.log("PASS: 无未声明变量（其余报错为历史隐式 any 存量，本次不拦）");
} finally {
  rmSync(tempFile, { force: true });
}
