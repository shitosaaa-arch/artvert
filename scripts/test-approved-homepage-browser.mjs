import assert from "node:assert/strict";

const url = process.env.HOMEPAGE_URL ?? "http://localhost:3000/";
const response = await fetch(url);
assert.equal(response.status, 200, `homepage returned ${response.status}`);

const html = (await response.text()).replaceAll("%2F", "/").replaceAll("%2f", "/");
assert.ok(!html.includes("تغذي نباتك ونفهم احتياجاته"), "legacy homepage headline is still rendered");
assert.ok(html.includes("حلول زراعية متكاملة"), "approved headline opening is missing");
assert.ok(html.includes("لمستقبل أكثر إنتاجية"), "approved headline continuation is missing");

for (const image of ["plant-grow.jpeg", "organic.jpeg", "artvert-19-19-19.jpeg", "root-x.jpeg"]) {
  assert.ok(html.includes(`/products/${image}`), `live homepage is missing direct product image ${image}`);
}
assert.ok(!/marketing|screenshot/i.test(html), "live homepage contains a marketing-post screenshot source");
console.log("approved-homepage-browser-tests:ok");
