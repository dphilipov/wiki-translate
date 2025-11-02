import { Request } from 'express';

export interface TranslationStartRequest extends Request {
  body: {
    articles: string[];
    authKey: string;
    sourceLang: string;
    targetLang: string;
    wikiUrl: string;
    dryRun: boolean;
    allowOverwrite: boolean;
    outputFolder: string;
    chunkThreshold: number;
    useGlossary: boolean;
  };
}

export interface ValidateKeyRequest extends Request {
  body: {
    authKey: string;
  };
}

export interface FetchArticlesRequest extends Request {
  body: {
    wikiUrl: string;
    outputFolder?: string;
  };
}

export interface CreateGlossaryRequest extends Request {
  body: {
    authKey: string;
  };
}
