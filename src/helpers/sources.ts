export interface UploadJobSourceLike {
  // `any` keeps the helper assignable to the generated string enum type while
  // still centralizing the only valid runtime discriminator value.
  type: any;
  upload_id: string;
}

export function uploadJobSource(uploadId: string): UploadJobSourceLike {
  return { type: "upload", upload_id: uploadId };
}

export const JobSource = Object.freeze({
  upload: uploadJobSource,
});
