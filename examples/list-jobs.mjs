// List jobs with cursor pagination using the Sophon facade.
//
// Run: SOPHON_API_KEY=... node examples/list-jobs.mjs

import { Sophon } from "@liqhtworks/sophon-sdk";

const apiKey = process.env.SOPHON_API_KEY;
if (!apiKey) throw new Error("SOPHON_API_KEY is required");

const sophon = new Sophon({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  apiKey,
});

let cursor;
let total = 0;
do {
  const page = await sophon.jobs.api.listJobs({ limit: 50, cursor });
  for (const job of page.jobs ?? []) {
    console.log(`${job.id}\t${job.status}\t${job.profile}`);
    total += 1;
  }
  cursor = page.next_cursor ?? undefined;
} while (cursor);

console.log(`total: ${total}`);
