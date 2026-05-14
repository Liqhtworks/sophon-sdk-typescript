// Upload from an in-memory Buffer (e.g. bytes you already have in process)
// instead of a Blob.

import { Sophon } from "@liqhtworks/sophon-sdk";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const apiKey = process.env.SOPHON_API_KEY;
const path = process.argv[2];
if (!apiKey) throw new Error("SOPHON_API_KEY is required");
if (!path) throw new Error("usage: upload-buffer.mjs <path>");

const sophon = new Sophon({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  apiKey,
});

const bytes = await readFile(path); // Buffer extends Uint8Array
const result = await sophon.uploads.uploadFile({
  source: bytes,
  fileName: basename(path),
  mimeType: "video/mp4",
});
console.log(result);
