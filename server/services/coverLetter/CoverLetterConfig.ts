import type { AnthropicLlmConfig } from "@/server/integrations/llm/AnthropicLlmClient";

const DEFAULT_MODEL = "claude-opus-5-5";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 2;

const positiveInt = (raw: string | undefined, fallback: number): number => {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

/**
 * Server-side configuration from environment variables. None of these are
 * NEXT_PUBLIC_, so they never reach the browser bundle.
 */
export class CoverLetterConfig {
  private constructor(readonly ai: AnthropicLlmConfig | null) {}

  /**
   * The AI generator is on only when COVER_LETTER_AI_ENABLED is "true" and an
   * API key is present; otherwise only the template generator is registered.
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): CoverLetterConfig {
    const apiKey = env.ANTHROPIC_API_KEY?.trim();
    if (env.COVER_LETTER_AI_ENABLED !== "true" || !apiKey) return new CoverLetterConfig(null);
    return new CoverLetterConfig({
      apiKey,
      model: env.COVER_LETTER_AI_MODEL?.trim() || DEFAULT_MODEL,
      timeoutMs: positiveInt(env.COVER_LETTER_AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
      maxRetries: DEFAULT_MAX_RETRIES,
    });
  }
}
