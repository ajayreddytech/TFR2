import { loadEnv } from "vite";

/**
 * Reads the local secrets (.env.local, then .env) for the live tests only. Unit tests never see these,
 * so they stay offline and predictable. Missing keys make the live tests skip rather than fail.
 */
export const localEnv: Record<string, string> = loadEnv("test", process.cwd(), "");

export const has = (name: string) => Boolean(localEnv[name]);
