import type { GeneratorStrategy } from "@/server/domain/coverLetter";
import { CoverLetterError } from "@/server/domain/coverLetter";
import type { CoverLetterGenerator } from "./CoverLetterGenerator";

/**
 * Picks the generator for a request. Only strategies enabled by server
 * configuration are registered, so a client cannot select a disabled one.
 */
export class CoverLetterGeneratorFactory {
  private readonly generators: ReadonlyMap<GeneratorStrategy, CoverLetterGenerator>;

  constructor(
    generators: readonly CoverLetterGenerator[],
    private readonly defaultStrategy: GeneratorStrategy = "template"
  ) {
    this.generators = new Map(generators.map((generator) => [generator.strategy, generator]));
    if (!this.generators.has(defaultStrategy)) {
      throw new Error(`Default cover letter strategy "${defaultStrategy}" is not registered.`);
    }
  }

  availableStrategies(): GeneratorStrategy[] {
    return [...this.generators.keys()];
  }

  create(choice: GeneratorStrategy = this.defaultStrategy): CoverLetterGenerator {
    const generator = this.generators.get(choice);
    if (!generator) throw new CoverLetterError("The AI generator is not enabled on this server.");
    return generator;
  }
}
