import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as deepl from 'deepl-node';
import { constants } from './constants.js';

const translator = new deepl.Translator(constants.AUTH_KEY);

export async function wikiTranslate() {
  console.log('asd');
  for (let articleTitle of constants.ARTICLE_TITLES) {
    let [pageTitle, pageContent] = await getArticleContent(articleTitle);

    if (pageContent.includes('redirect')) {
      const redirectPageTitle = pageContent.match(/\[\[(.*?)\]\]/)[1];
      [pageTitle, pageContent] = await getArticleContent(redirectPageTitle);
    }

    saveOriginalArticle(pageTitle, pageContent);

    if (constants.NO_TRANSLATE) {
      return;
    }

    translateAndSaveArticle(pageTitle, pageContent);
  }
}

async function getArticleContent(articleTitle) {
  const params = {
    action: 'parse',
    prop: 'wikitext',
    format: 'json',
    page: articleTitle,
  };

  const response = await fetch(
    `${constants.WIKI_URL}?${new URLSearchParams(params)}`
  );

  const jsonResponse = await response.json();

  const pageTitle = jsonResponse.parse.title;
  const pageContent = jsonResponse.parse.wikitext['*'];

  return [pageTitle, pageContent];
}

async function saveOriginalArticle(pageTitle, pageContent) {
  if (!constants.ALLOW_FILE_OVERWRITE) {
    const files = await fs.readdir('./output/');
    const fileExists = files.some(file => file === `${pageTitle}.txt`);

    if (fileExists) {
      console.log('File already exists.');
      return;
    }
  }

  // Save the ORIGINAL version of the page content
  await fs.writeFile(
    `${constants.OUTPUT_FOLDER}/${pageTitle}-original.txt`,
    pageContent
  );
  console.log(`File: ${pageTitle}-de.txt saved.`);
}

async function translateAndSaveArticle(pageTitle, pageContent) {
  const result = await translator.translateText(pageContent, 'de', 'en-US', {
    glossary: constants.GLOSSARY_ID,
  });

  // Save the TRANSLATED version of the page content
  await fs.writeFile(`output/${pageTitle}.txt`, result.text);
  console.log(`File: ${pageTitle}.txt saved.`);
}
