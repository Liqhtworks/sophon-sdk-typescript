// Resume an interrupted upload. Pass the upload session id from a prior run
// (printed by uploadFile) plus the same source bytes.
//
// Run: SOPHON_API_KEY=... node examples/upload-resume.mjs <uploadId> <path>

import { Sophon } from "@liqhtworks/sophon-sdk";

const apiKey = process.env.SOPHON_API_KEY;
const uploadId = process.argv[2];
const path = process.argv[3];
if (!apiKey) throw new Error("SOPHON_API_KEY is required");
if (!uploadId || !path) throw new Error("usage: upload-resume.mjs <uploadId> <path>");

const sophon = new Sophon({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  apiKey,
});

const result = await sophon.uploads.uploadFile({
  source: path,          // path source: helper reads via node:fs/promises
  fileName: path.split(/[\\/]/).pop(),
  mimeType: "video/mp4",
  uploadId,              // resume — getUpload(uploadId) checks which parts are present
  onProgress: (p) => console.log(`${p.partsDone}/${p.partsTotal} parts`),
});
console.log("resumed -> completed:", result);
