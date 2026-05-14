// Cancel an in-flight job by id.
//
// Run: SOPHON_API_KEY=... node examples/cancel-job.mjs job_abc123

import { Sophon, JobNotFoundError, SophonApiError } from "@liqhtworks/sophon-sdk";

const apiKey = process.env.SOPHON_API_KEY;
const jobId = process.argv[2];
if (!apiKey) throw new Error("SOPHON_API_KEY is required");
if (!jobId) throw new Error("usage: cancel-job.mjs <jobId>");

const sophon = new Sophon({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  apiKey,
});

try {
  await sophon.jobs.api.cancelJob({ id: jobId });
  console.log(`canceled ${jobId}`);
} catch (err) {
  if (err instanceof JobNotFoundError) {
    console.error(`job ${jobId} not found`);
    process.exit(1);
  }
  if (err instanceof SophonApiError) {
    console.error(`API error (${err.status} / ${err.code}): ${err.message}`);
    process.exit(2);
  }
  throw err;
}
