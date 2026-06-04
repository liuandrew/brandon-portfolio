import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

const dir = resolve(".lighthouseci");

let files;
try {
  files = readdirSync(dir).filter(
    (f) => f.endsWith(".json") && !f.startsWith("assertion"),
  );
} catch {
  process.exit(0);
}

console.log(`${"Score".padStart(6)}  ${"LCP".padStart(8)}  ${"FCP".padStart(8)}  ${"TBT".padStart(8)}  ${"CLS".padStart(6)}  URL`);
console.log("-".repeat(80));

for (const f of files) {
  const lhr = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  const url = lhr.finalDisplayedUrl || lhr.requestedUrl || "?";
  const perf = Math.round(lhr.categories.performance.score * 100);
  const lcp = ms(lhr.audits["largest-contentful-paint"]?.numericValue);
  const fcp = ms(lhr.audits["first-contentful-paint"]?.numericValue);
  const tbt = ms(lhr.audits["total-blocking-time"]?.numericValue);
  const cls = lhr.audits["cumulative-layout-shift"]?.numericValue?.toFixed(3) ?? "-";

  console.log(`${String(perf).padStart(5)}%  ${lcp.padStart(6)}ms  ${fcp.padStart(6)}ms  ${tbt.padStart(6)}ms  ${cls.padStart(6)}  ${url}`);
}

function ms(val) {
  if (val == null) return "-";
  return String(Math.round(val));
}
