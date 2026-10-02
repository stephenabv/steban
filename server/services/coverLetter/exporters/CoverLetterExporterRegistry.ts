import type { CoverLetterExporter, ExportFormat } from "./CoverLetterExporter";

/** Looks up the exporter for a requested format. */
export class CoverLetterExporterRegistry {
  private readonly exporters: ReadonlyMap<ExportFormat, CoverLetterExporter>;

  constructor(exporters: readonly CoverLetterExporter[]) {
    this.exporters = new Map(exporters.map((exporter) => [exporter.format, exporter]));
  }

  get(format: ExportFormat): CoverLetterExporter {
    const exporter = this.exporters.get(format);
    if (!exporter) throw new Error(`No cover letter exporter registered for "${format}".`);
    return exporter;
  }
}
