import "server-only";
import { after } from "next/server";
import { IndexNowClient } from "./IndexNowClient";

/**
 * Tells search engines that public pages changed, after the response is sent
 * so the admin never waits on a third-party API. Call it from a Server
 * Function once a save has succeeded, with the site paths it affected.
 */
export function notifySearchEngines(paths: readonly string[]): void {
  const client = IndexNowClient.fromEnv();
  if (!client || paths.length === 0) return;
  after(async () => {
    await client.submit(paths);
  });
}
