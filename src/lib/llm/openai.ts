// src/lib/llm/openai.ts
import "server-only";
import { LLM } from "@/config/llm";

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

export type JsonResult<T = any> = {
  data: T;
  rawText: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export function renderTemplate(src: string, vars: Record<string, string | number>): string {
  return src.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}

/**
 * Call OpenAI Chat Completions expecting a JSON object back.
 * Throws if the response cannot be parsed as JSON.
 */
export async function chatJson<T = any>(opts: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
}): Promise<JsonResult<T>> {
  if (!LLM.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const body = {
    model: opts.model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ] satisfies ChatMessage[],
    temperature: opts.temperature ?? 0.9,
    top_p: opts.top_p ?? 0.9,
    response_format: { type: "json_object" as const },
    max_tokens: opts.max_output_tokens ?? 1200,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LLM.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    let errDetail: any = {};
    try { errDetail = JSON.parse(text); } catch {}
    const msg = errDetail?.error?.message || `OpenAI HTTP ${res.status}`;
    const e: any = new Error(msg);
    e.status = res.status;
    e.detail = errDetail;
    throw e;
  }

  // Parse the completion text
  let raw: any;
  try {
    const j = JSON.parse(text);
    const choice = j?.choices?.[0]?.message?.content ?? "";
    raw = typeof choice === "string" ? JSON.parse(choice) : choice;
    return {
      data: raw as T,
      rawText: choice,
      usage: j?.usage,
    };
  } catch {
    // Sometimes models sneak non-JSON; try to salvage common cases
    try {
      // Remove code fences if present
      const j = JSON.parse(text);
      let choice = j?.choices?.[0]?.message?.content ?? "";
      if (typeof choice === "string") {
        choice = choice.replace(/```json\s*|\s*```/g, "");
        raw = JSON.parse(choice);
        return { data: raw as T, rawText: choice, usage: j?.usage };
      }
    } catch {}
    throw new Error("Failed to parse model output as JSON");
  }
}
