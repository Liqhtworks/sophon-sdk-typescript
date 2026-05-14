import { JobSourceType } from "../models/JobSourceType";

/**
 * Structural shape of an "upload" job source. The discriminator is the
 * generated `JobSourceType.UPLOAD` literal so consumers retain
 * discriminated-union narrowing without `any` cast tricks.
 */
export interface UploadJobSourceLike {
  type: JobSourceType.UPLOAD;
  upload_id: string;
}

export function uploadJobSource(uploadId: string): UploadJobSourceLike {
  return { type: JobSourceType.UPLOAD, upload_id: uploadId };
}

export const JobSource = Object.freeze({
  upload: uploadJobSource,
});
