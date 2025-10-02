export interface WikiArticle {
  pageid: number;
  ns: number;
  title: string;
  index?: number;
}

export interface MediaWikiAllPagesResponse {
  query: {
    allpages: WikiArticle[];
  };
  continue?: {
    apcontinue: string;
  };
}

export interface MediaWikiParseResponse {
  parse: {
    title: string;
    wikitext: {
      '*': string;
    };
  };
  error?: {
    info: string;
  };
}
