import { copyFileSync, existsSync, mkdirSync } from "node:fs";

if (existsSync("package-lock.json")) {
  mkdirSync("public", { recursive: true });
  copyFileSync("package-lock.json", "public/package-lock.generated.json");
  console.log("Generated npm lockfile copied for repository synchronization.");
} else {
  console.warn("No package-lock.json was generated during install.");
}
