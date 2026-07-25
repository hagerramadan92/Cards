import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

async function findStandaloneApp(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  if (entries.some((entry) => entry.isFile() && entry.name === "server.js")) {
    return directory;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;

    const result = await findStandaloneApp(path.join(directory, entry.name));
    if (result) return result;
  }

  return null;
}

const standaloneApp = await findStandaloneApp(standaloneRoot);

if (!standaloneApp) {
  throw new Error("Could not locate the generated standalone Next.js server.");
}

await mkdir(path.join(standaloneApp, ".next", "static"), { recursive: true });
await cp(path.join(projectRoot, ".next", "static"), path.join(standaloneApp, ".next", "static"), {
  recursive: true,
  force: true,
});
await cp(path.join(projectRoot, "public"), path.join(standaloneApp, "public"), {
  recursive: true,
  force: true,
});

console.log(`Standalone assets copied to ${path.relative(projectRoot, standaloneApp)}`);
