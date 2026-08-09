import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const forbiddenBackend = ["air", "table"].join("");
const targets = [
  ".env.example",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "src",
  "supabase",
];

async function collectFiles(path) {
  const entry = await stat(path);

  if (entry.isFile()) {
    return [path];
  }

  const children = await readdir(path);
  const files = await Promise.all(
    children.map((child) => collectFiles(resolve(path, child))),
  );

  return files.flat();
}

const files = (
  await Promise.all(targets.map((target) => collectFiles(resolve(root, target))))
).flat();
const violations = [];

for (const file of files) {
  const content = await readFile(file, "utf8");

  if (content.toLowerCase().includes(forbiddenBackend)) {
    violations.push(file.replace(`${root}\\`, ""));
  }
}

if (violations.length > 0) {
  console.error(
    `El backend retirado reapareció en archivos operativos:\n${violations.join("\n")}`,
  );
  process.exit(1);
}

console.log("Backend verificado: Supabase es la única fuente operativa.");
