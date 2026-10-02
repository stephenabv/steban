import type { z } from "zod";

export interface StructuredLlmRequest<T> {
  /** Instructions. Never contains untrusted text. */
  system: string;
  /** The task, with any untrusted text clearly delimited as data. */
  prompt: string;
  /** The response must parse against this schema or the call fails. */
  schema: z.ZodType<T>;
  maxTokens: number;
}

/** Raised for any failed, refused, timed-out or malformed model call. Its message is never shown to users. */
export class LlmError extends Error {
  override readonly name = "LlmError";
}

/** A language model that answers with schema-validated JSON. */
export abstract class StructuredLlmClient {
  abstract generate<T>(request: StructuredLlmRequest<T>): Promise<T>;
}
