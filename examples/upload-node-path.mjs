import {
  Configuration,
  UploadsApi,
  uploadFile,
} from "@liqhtworks/sophon-sdk";
import { Blob } from "node:buffer";
import { basename } from "node:path";
import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) {
  throw new Error("usage: node examples/upload-node-path.mjs /path/to/video.mov");
}

const config = new Configuration({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  accessToken: process.env.SOPHON_API_KEY,
});

const bytes = await readFile(path);
const source = new Blob([bytes], { type: "video/quicktime" });
const uploads = new UploadsApi(config);

const upload = await uploadFile({
  api: uploads,
  source,
  fileName: basename(path),
  mimeType: "video/quicktime",
  concurrency: 4,
});

console.log(upload.uploadId);
