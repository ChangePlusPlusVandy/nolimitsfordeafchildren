import { mapSummary as serverMapSummary } from "./queries";

export async function getMapData() {
  return serverMapSummary();
}
