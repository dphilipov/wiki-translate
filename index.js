import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as deepl from 'deepl-node';
import { constants } from './constants.js';

const translator = new deepl.Translator(constants.AUTH_KEY);
const browser = await puppeteer.launch();
const page = await browser.newPage();

(async function main() {
  for (let articleTitle of constants.ARTICLE_TITLES) {
    let [pageTitle, pageContent] = await getArticleContent(articleTitle);

    if (pageContent.includes('redirect')) {
      const redirectPageTitle = pageContent.match(/\[\[(.*?)\]\]/)[1];
      [pageTitle, pageContent] = await getArticleContent(redirectPageTitle);
    }

    translateAndSaveArticle(pageTitle, pageContent);
  }

  await browser.close();
})();

async function getArticleContent(articleTitle) {
  const response = await page.goto(
    `${constants.WIKI_URL}/api.php?action=parse&page=${articleTitle}&prop=wikitext&format=json`,
    {
      waitUntil: ['domcontentloaded', 'networkidle0'],
    }
  );

  const jsonResponse = await response.json();

  const pageTitle = jsonResponse.parse.title;
  const pageContent = jsonResponse.parse.wikitext['*'];
  return [pageTitle, pageContent];
}

async function translateAndSaveArticle(pageTitle, pageContent) {
  if (!constants.ALLOW_FILE_OVERWRITE) {
    const files = await fs.readdir('./output/');
    const fileExists = files.some(file => file === `${pageTitle}.txt`);

    if (fileExists) {
      console.log('File already exists.');
      await browser.close();
      return;
    }
  }

  // Save the ORIGINAL version of the page content
  await fs.writeFile(
    `${constants.OUTPUT_FOLDER}/${pageTitle}-de.txt`,
    pageContent
  );
  console.log(`File: ${pageTitle}-de.txt saved.`);

  const result = await translator.translateText(pageContent, 'de', 'en-US', {
    glossary: constants.GLOSSARY_ID,
  });

  // Save the TRANSLATED version of the page content
  await fs.writeFile(`output/${pageTitle}.txt`, result.text);
  console.log(`File: ${pageTitle}.txt saved.`);
}
