import "server-only";
import { env } from "cloudflare:workers";
export function database() {
 if (!env.DB) throw new Error("Participant database binding unavailable");
 return env.DB;
}
