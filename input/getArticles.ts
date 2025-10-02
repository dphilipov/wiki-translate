import axios from 'axios';
import * as fs from 'fs/promises';
import { constants } from '../constants.js';
import type { WikiArticle } from '../types';

export async function getArticles(): Promise<void> {
  let queryContinue = '';
  let data: WikiArticle[] = [];

  while (true) {
    const params = {
      action: 'query',
      list: 'allpages',
      format: 'json',
      aplimit: 'max',
      apcontinue: queryContinue,
    };

    const response = await axios.get(constants.WIKI_URL, { params });
    const jsonResponse: any = response.data;

    const articles: WikiArticle[] = jsonResponse.query.allpages;
    data = [...data, ...articles];

    if (!jsonResponse['query-continue']) {
      break;
    }

    queryContinue = jsonResponse['query-continue'].allpages.apcontinue;
  }

  // Adds an index to each article
  data = data.map((x, i) => {
    x.index = i;

    return x;
  });

  await fs.writeFile('input/articles.json', JSON.stringify(data));

  console.log(`${data.length} articles saved to input/articles.json`);
}
