import OpenAI from "openai";

const defaultBaseUrl = "https://api.openai.com/v1";

export function isLlmEnabled(): boolean {
  return process.env.LLM_ENABLED === "true" && Boolean(process.env.LLM_API_KEY);
}

export function getLlmClient(): OpenAI | null {
  if (!isLlmEnabled()) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL ?? defaultBaseUrl,
  });
}

export function getLlmModel(): string {
  return process.env.LLM_MODEL ?? "gpt-4o";
}
