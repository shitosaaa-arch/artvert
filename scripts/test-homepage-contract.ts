import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const [page, hero] = await Promise.all([
    readFile("app/(public)/page.tsx", "utf8"),
    readFile("components/home/ApprovedHomepageHero.tsx", "utf8"),
  ]);

  assert.match(page, /import \{ ApprovedHomepageHero \}/);
  assert.match(page, /return <ApprovedHomepageHero \/>/);
  assert.doesNotMatch(page, /HomeHero|getProductCatalog|featuredSlugs/);
  assert.doesNotMatch(hero, /DoctorAvatarAsset|HomeHero|FloatingDoctorWidget/);
  assert.doesNotMatch(hero, /تغذي نباتك ونفهم احتياجاته/);
  assert.match(hero, /حلول زراعية متكاملة/);
  assert.match(hero, /لمستقبل أكثر إنتاجية/);
  assert.match(hero, /src="\/images\/artvert-doctor-approved\.png"/);

  for (const image of ["plant-grow.jpeg", "organic.jpeg", "artvert-19-19-19.jpeg", "root-x.jpeg"]) {
    assert.ok(hero.includes(`/products/${image}`), `homepage must use direct product file ${image}`);
  }
  assert.doesNotMatch(hero, /marketing|screenshot|data:image|https?:\/\//i);
  console.log("homepage-contract-tests:ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
