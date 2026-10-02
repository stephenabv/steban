import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  LlmError,
  StructuredLlmClient,
} from "@/server/services/coverLetter/generators/StructuredLlmClient";
import type { StructuredLlmRequest } from "@/server/services/coverLetter/generators/StructuredLlmClient";

export interface AnthropicLlmConfig {
  /** Server-side secret; never logged or sent to the browser. */
  apiKey: string;
  model: string;
  /** Per-attempt timeout. */
  timeoutMs: number;
  /** Retries on 408/409/429/5xx and connection errors, with exponential backoff (SDK built-in). */
  maxRetries: number;
}

/** Server-side fallback routing on a refusal, so a declined request is retried on another model. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Claude Messages API with structured (Zod-validated) output. */
export class AnthropicLlmClient extends StructuredLlmClient {
  private readonly client: Anthropic;

  constructor(private readonly config: AnthropicLlmConfig) {
    super();
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeoutMs,
      maxRetries: config.maxRetries,
    });
  }

  async generate<T>(request: StructuredLlmRequest<T>): Promise<T> {
    let response;
    try {
      response = await this.client.beta.messages.parse({
        model: this.config.model,
        max_tokens: request.maxTokens,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        system: request.system,
        messages: [{ role: "user", content: request.prompt }],
        output_config: { effort: "medium", format: betaZodOutputFormat(request.schema) },
      });
    } catch (error) {
      // Status only: provider messages can echo request content.
      const status = error instanceof Anthropic.APIError ? ` (status ${error.status})` : "";
      throw new LlmError(`Anthropic request failed${status}.`);
    }
    if (response.stop_reason === "refusal") throw new LlmError("The model declined the request.");
    if (response.parsed_output == null)
      throw new LlmError("The model returned no structured output.");
    return response.parsed_output as T;
  }
}
