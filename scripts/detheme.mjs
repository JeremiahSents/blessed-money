// One-off codemod: replace hardcoded Tailwind colors with semantic theme tokens.
// Run with: bun scripts/detheme.mjs
import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);

// Each rule: [regex, replacement]. Applied in order, globally.
const rules = [
  // 1. Drop dark: variants for color families that map to theme tokens
  //    (semantic tokens already adapt to dark mode).
  [/\s?dark:(bg|text|border|ring|from|via|to|shadow|fill|divide|placeholder|stroke)-(zinc|slate|gray|neutral|white|black|emerald|rose|red|amber|green)(-\d{1,3})?(\/\d{1,3})?/g, ""],

  // 2. Neutral TEXT
  [/\btext-(?:zinc|slate|gray|neutral)-(?:700|800|900|950)\b/g, "text-foreground"],
  [/\btext-black\b/g, "text-foreground"],
  [/\btext-(?:zinc|slate|gray|neutral)-(?:300|400|500|600)\b/g, "text-muted-foreground"],
  [/\btext-(?:zinc|slate|gray|neutral)-(?:50|100|200)\b/g, "text-primary-foreground"],
  [/\btext-white\b/g, "text-primary-foreground"],

  // 3. Neutral BACKGROUNDS
  [/\bbg-white(\/\d{1,3})?\b/g, "bg-card"],
  [/\bbg-(?:zinc|slate|gray|neutral)-950(\/\d{1,3})?\b/g, "bg-card"],
  [/\bbg-(?:zinc|slate|gray|neutral)-(?:50|100|200|800|900)(\/\d{1,3})?\b/g, "bg-muted"],
  [/\bbg-black\/\d{1,3}\b/g, "bg-foreground/20"],
  [/\bbg-black\b/g, "bg-foreground"],

  // 4. Borders / rings / divides
  [/\bborder-(?:zinc|slate|gray|neutral)-\d{1,3}(\/\d{1,3})?\b/g, "border-border"],
  [/\bborder-white(\/\d{1,3})?\b/g, "border-border"],
  [/\bring-(?:zinc|slate|gray|neutral)-\d{1,3}(\/\d{1,3})?\b/g, "ring-ring"],
  [/\bdivide-(?:zinc|slate|gray|neutral)-\d{1,3}(\/\d{1,3})?\b/g, "divide-border"],
  [/\sshadow-(?:zinc|slate|gray|neutral)-\d{1,3}(\/\d{1,3})?/g, ""],

  // 5. Gradient stops on neutrals (mostly bg-clip-text headings)
  [/\bfrom-(?:zinc|slate|gray|neutral)-\d{1,3}\b/g, "from-foreground"],
  [/\bto-(?:zinc|slate|gray|neutral)-\d{1,3}\b/g, "to-muted-foreground"],
  [/\bvia-(?:zinc|slate|gray|neutral)-\d{1,3}\b/g, "via-muted-foreground"],
  [/\bfrom-white\b/g, "from-primary-foreground"],

  // 6. STATUS — success (emerald/green)
  [/\b(?:text)-(?:emerald|green)-(?:300|400|500|600|700)\b/g, "text-success"],
  [/\bbg-(?:emerald|green)-(?:300|400|500|600)(\/\d{1,3})?\b/g, (m, op) => "bg-success" + (op || "")],
  [/\bbg-(?:emerald|green)-(?:50|100|900)(\/\d{1,3})?\b/g, "bg-success/15"],
  [/\bborder-(?:emerald|green)-\d{1,3}(\/\d{1,3})?\b/g, "border-success/30"],

  // 7. STATUS — warning (amber/yellow)
  [/\btext-(?:amber|yellow)-(?:300|400|500|600|700)\b/g, "text-warning"],
  [/\bbg-(?:amber|yellow)-(?:300|400|500|600)(\/\d{1,3})?\b/g, (m, op) => "bg-warning" + (op || "")],
  [/\bbg-(?:amber|yellow)-(?:50|100|900)(\/\d{1,3})?\b/g, "bg-warning/15"],
  [/\bborder-(?:amber|yellow)-\d{1,3}(\/\d{1,3})?\b/g, "border-warning/30"],

  // 8. STATUS — destructive (red/rose)
  [/\btext-(?:red|rose)-(?:400|500|600|700)\b/g, "text-destructive"],
  [/\bbg-(?:red|rose)-(?:400|500|600)(\/\d{1,3})?\b/g, (m, op) => "bg-destructive" + (op || "")],
  [/\bbg-(?:red|rose)-(?:50|100|900)(\/\d{1,3})?\b/g, "bg-destructive/10"],
  [/\bborder-(?:red|rose)-\d{1,3}(\/\d{1,3})?\b/g, "border-destructive/30"],

];

let changedCount = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const before = src;
  for (const [re, rep] of rules) {
    src = src.replace(re, rep);
  }
  if (src !== before) {
    writeFileSync(file, src);
    changedCount++;
    console.log("updated", file);
  }
}
console.log(`\nDone. ${changedCount} files changed.`);
