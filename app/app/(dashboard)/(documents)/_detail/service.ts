import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { DocumentTable } from "@/_platform/db/schema";

import type { DocumentWithMetadata } from "../_domain/types";
import type { WithMetadata } from "../_list/metadata";

export async function showDocument(
  id: string,
  addMetadata: WithMetadata,
): Promise<DocumentWithMetadata | null> {
  const result = await db.select().from(DocumentTable).where(eq(DocumentTable.id, id)).limit(1);

  if (result.length === 0) {
    return null;
  }

  return addMetadata(result[0]!);
}
