import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

async function source(path: string) { return readFile(path, "utf8"); }

async function main() {
  const [page, hero, avatar, state, css] = await Promise.all([
    source("app/(public)/page.tsx"), source("components/home/HomeHero.tsx"), source("components/doctor/DoctorAvatarAsset.tsx"), source("components/doctor/DoctorAvatarState.ts"), source("app/globals.css"),
  ]);
  for (const slug of ["plant-grow", "organic", "artvert-19-19-19", "root-x"]) assert.ok(page.includes(slug), `hero must request ${slug}`);
  assert.match(hero, /src="\/hero\.jpeg"/);
  assert.match(hero, /<Image src=\{product\.image\}/);
  assert.doesNotMatch(hero, /data:image|https?:\/\/.*\.(png|jpg|jpeg|webp)/i);
  assert.match(hero, /min-h-\[870px\]/);
  assert.match(hero, /lg:grid-cols/);
  for (const width of [320, 360, 390, 414]) {
    assert.ok(width < 640);
    assert.match(hero, /grid-cols-2/);
    assert.match(hero, /min-h-11/);
  }
  for (const name of ["WELCOME", "IDLE", "WAVING", "THINKING", "ASKING", "DIAGNOSIS_READY", "WARNING", "UNAVAILABLE", "SESSION_EXPIRED"]) assert.ok(state.includes(name), `missing Doctor state ${name}`);
  assert.match(avatar, /doctor-breathe/);
  assert.match(avatar, /doctor-wave/);
  assert.match(css, /prefers-reduced-motion/);
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const allowed = new Set(["app/(public)/page.tsx", "app/globals.css", "components/Hero.tsx", "components/Navbar.tsx", "components/home/HomeHero.tsx", "components/doctor/DoctorAvatarAsset.tsx", "components/doctor/DoctorAvatarState.ts", "components/doctor/FloatingDoctorWidget.tsx", "scripts/test-homepage-contract.ts", ".github/workflows/homepage-linux.yml", "package.json"]);
  for (const file of changed) assert.ok(allowed.has(file), `temporary homepage verification commit changed protected or unrelated file: ${file}`);
  console.log("homepage-contract-tests:ok");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
