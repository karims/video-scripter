// src/config/llm.ts
// Server-only config for LLM features. Reads from env with sane defaults.
import "server-only";

function bool(v: string | undefined, def: boolean) {
  if (v === undefined) return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function int(v: string | undefined, def: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : def;
}

export const LLM = {
  // Models
  IDEAS_MODEL: process.env.IDEAS_MODEL ?? "gpt-4o-mini",
  SCRIPTS_MODEL: process.env.SCRIPTS_MODEL ?? "gpt-4o-mini",

  // Generation sizes
  IDEAS_COUNT_IN: int(process.env.IDEAS_COUNT_IN, 5),   // raw candidates
  IDEAS_COUNT_OUT: int(process.env.IDEAS_COUNT_OUT, 5), // returned

  // Sampling (tweak as needed)
  TEMPERATURE_IDEAS: Number(process.env.TEMPERATURE_IDEAS ?? 0.9),
  TOP_P_IDEAS: Number(process.env.TOP_P_IDEAS ?? 0.9),
  PRESENCE_IDEAS: Number(process.env.PRESENCE_IDEAS ?? 0.3),

  TEMPERATURE_SCRIPT: Number(process.env.TEMPERATURE_SCRIPT ?? 0.7),
  TOP_P_SCRIPT: Number(process.env.TOP_P_SCRIPT ?? 0.9),

  // Durations / limits
  SCRIPT_DEFAULT_DURATION: int(process.env.SCRIPT_DEFAULT_DURATION, 45),
  IDEAS_TIMEOUT_MS: int(process.env.IDEAS_TIMEOUT_MS, 25000),
  SCRIPT_TIMEOUT_MS: int(process.env.SCRIPT_TIMEOUT_MS, 45000),

  // Feature flags
  STREAM_IDEAS: bool(process.env.STREAM_IDEAS, false),

  // Safety / guardrails (non-secret)
  MAX_QUERY_CHARS: int(process.env.MAX_QUERY_CHARS, 120),

  // Secrets: READ ONLY ON SERVER (do not re-export to client)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
} as const;

// Optional: assert critical env in non-test environments
if (process.env.NODE_ENV !== "test") {
  if (!LLM.OPENAI_API_KEY) {
    // don't throw in dev; log helps avoid silent failures on Vercel
    console.warn("[LLM] OPENAI_API_KEY is not set");
  }
}
