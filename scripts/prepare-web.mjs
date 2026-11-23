import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "www");
const excluded = new Set([
  ".git", ".github", "node_modules", "android", "www",
  "docs", "tests", "coverage", "dist", "build", ".idea",
]);
const allowed = new Set([
  ".html", ".js", ".mjs", ".css", ".json",
  ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".mp3", ".mp4", ".webm",
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function copyTree(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || excluded.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyTree(from, to);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!allowed.has(extension)) continue;
    if (/^(package(-lock)?|capacitor\.config)\./i.test(entry.name)) continue;
    await cp(from, to);
  }
}

await copyTree(root, output);
const indexPath = path.join(output, "index.html");
const indexStat = await stat(indexPath).catch(() => null);
if (!indexStat?.isFile()) {
  throw new Error("Android web asset preparation failed: index.html is missing.");
}
console.log("AYHEM web assets prepared in ./www");
