import {
  Configuration,
  JobProfile,
  JobSource,
  JobStatus,
  JobsApi,
  UploadsApi,
  uploadFile,
  waitForJob,
} from "@liqhtworks/sophon-sdk";
import { Blob } from "node:buffer";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("usage: node examples/encode-file.mjs /path/to/video.mov");
}

const apiKey = process.env.SOPHON_API_KEY;
if (!apiKey) throw new Error("SOPHON_API_KEY is required");

const basePath = process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz";
const config = new Configuration({ basePath, accessToken: apiKey });
const uploads = new UploadsApi(config);
const jobs = new JobsApi(config);

const bytes = await readFile(inputPath);
const mimeType = inputPath.endsWith(".mov") ? "video/quicktime" : "video/mp4";
const upload = await uploadFile({
  api: uploads,
  source: new Blob([bytes], { type: mimeType }),
  fileName: basename(inputPath),
  mimeType,
  concurrency: 4,
  onProgress: (p) => console.log(`upload ${p.partsDone}/${p.partsTotal}`),
});

const job = await jobs.createJob({
  idempotencyKey: randomUUID(),
  createJobRequest: {
    source: JobSource.upload(upload.uploadId),
    profile: JobProfile.SOPHON_ESPRESSO,
  },
});
console.log(`created ${job.id}`);

const final = await waitForJob({
  api: jobs,
  jobId: job.id,
  timeoutMs: 30 * 60 * 1000,
  onProgress: (j) => console.log(`job ${j.id}: ${j.status}`),
});
if (final.status !== JobStatus.COMPLETED) {
  throw new Error(`job ended in ${final.status}`);
}

const redirect = await fetch(`${basePath}/v1/jobs/${final.id}/output`, {
  headers: { authorization: `Bearer ${apiKey}` },
  redirect: "manual",
});
const location = redirect.headers.get("location");
if (!location) throw new Error("missing output redirect");

const download = await fetch(new URL(location, basePath));
if (!download.ok) throw new Error(`download failed: ${download.status}`);

await writeFile("sophon-output.mp4", Buffer.from(await download.arrayBuffer()));
console.log("wrote sophon-output.mp4");
