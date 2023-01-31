import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import { constants } from '../constants.js';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const response = await page.goto(
    'https://www.shadowiki.de/api.php?action=query&format=json&list=allpages&aplimit=500',
    {
      waitUntil: ['domcontentloaded', 'networkidle0'],
    }
  );

  const jsonResponse = await response.json();
  console.log(jsonResponse);

  const allPages = jsonResponse.query.allpages;

  await fs.writeFile(
    `${constants.INPUT_FOLDER}/articles.js`,
    JSON.stringify(allPages)
  );

  await browser.close();
})();
