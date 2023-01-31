import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import { constants } from '../constants.js';

(async () => {
  const params = {
    action: 'query',
    list: 'allpages',
    format: 'json',
    aplimit: 'max',
  };

  const response = await fetch(
    `${constants.WIKI_URL}?${new URLSearchParams(params)}`
  );

  const jsonResponse = await response.json();
  console.log(jsonResponse);

  const allPages = jsonResponse.query.allpages;

  await fs.writeFile(
    `${constants.INPUT_FOLDER}/articles.js`,
    JSON.stringify(allPages)
  );
})();
