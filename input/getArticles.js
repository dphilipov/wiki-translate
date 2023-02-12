import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import { constants } from '../constants.js';

export async function getArticles() {
  let queryContinue = '';
  let data = [];

  while (true) {
    const params = {
      action: 'query',
      list: 'allpages',
      format: 'json',
      aplimit: 'max',
      apcontinue: queryContinue,
    };

    const response = await fetch(
      `${constants.WIKI_URL}?${new URLSearchParams(params)}`
    );

    const jsonResponse = await response.json();

    const articles = jsonResponse.query.allpages;
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
