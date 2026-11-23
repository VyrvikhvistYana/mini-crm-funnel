import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SEED_LEADS } from "../src/data/seed";
import { suggestNextActionHeuristic } from "../src/lib/aiSuggest";

type Fixture = {
  leadId: string;
  expectNextAction: string;
  why: string;
};

const fixtures = JSON.parse(
  readFileSync(join(process.cwd(), "eval/fixtures.json"), "utf8"),
) as Fixture[];

let pass = 0;
for (const f of fixtures) {
  const lead = SEED_LEADS.find((l) => l.id === f.leadId);
  if (!lead) {
    console.log(`MISS ${f.leadId}`);
    continue;
  }
  const got = suggestNextActionHeuristic(lead).nextAction;
  const ok = got === f.expectNextAction;
  if (ok) pass++;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${f.leadId}: got=${got} expect=${f.expectNextAction} — ${f.why}`,
  );
}

console.log(`\n${pass}/${fixtures.length} passed`);
process.exit(pass === fixtures.length ? 0 : 1);
