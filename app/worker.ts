import handler from "vinext/server/fetch-handler";

import { scheduled } from "./app/_jobs/cron/scheduled";

export { scheduled };

// Cloudflare reads both lifecycle handlers from the default export.
const worker = {
  ...handler,
  scheduled,
};

export default worker;
