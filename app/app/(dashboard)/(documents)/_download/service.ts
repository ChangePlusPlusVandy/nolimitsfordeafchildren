import { extractKeyFromUrl, getPublicUrl } from "@/_platform/storage/r2";

import type { DocumentWithMetadata } from "../_domain/types";

export async function getDownloadUrl(
  id: string,
  show: (id: string) => Promise<DocumentWithMetadata | null>,
): Promise<{ download_url: string } | null> {
  const document = await show(id);
  if (!document) {
    return null;
  }

  const fileKey = extractKeyFromUrl(document.file_url);
  if (!fileKey) {
    // Preserve external URLs; R2 downloads use the authenticated file route.
    return { download_url: document.file_url };
  }

  return { download_url: getPublicUrl(fileKey) };
}
