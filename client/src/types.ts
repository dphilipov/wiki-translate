export interface Config {
  wikiUrl: string;
  sourceLang: string;
  targetLang: string;
  authKey: string;
  outputFolder: string;
  chunkThreshold: number;
  allowOverwrite: boolean;
  dryRun: boolean;
  useGlossary: boolean;
}

export interface TranslationResult {
  successCount: number;
  errorCount: number;
  results: Array<{
    title: string;
    status: 'success' | 'error' | 'skipped';
    error?: string;
    reason?: string;
    dryRun?: boolean;
  }>;
  stopped?: boolean;
}
