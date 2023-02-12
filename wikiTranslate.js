import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as deepl from 'deepl-node';
import { constants } from './constants.js';

const translator = new deepl.Translator(constants.AUTH_KEY);

export async function wikiTranslate() {
  try {
    const articlesToTranslate = constants.ARTICLE_TITLES.length
      ? constants.ARTICLE_TITLES
      : constants.ARTICLE_TITLES_RANGE;

    for (let articleTitle of articlesToTranslate) {
      let [pageTitle, pageContent] = await getArticleContent(articleTitle);

      // If the page is a redirect, fetch the content of the new page
      if (pageContent.includes('redirect')) {
        const redirectPageTitle = pageContent.match(/\[\[(.*?)\]\]/)[1];
        [pageTitle, pageContent] = await getArticleContent(redirectPageTitle);
      }

      saveOriginalArticle(pageTitle, pageContent);

      // If NO_TRANSLATE is true, skip the translation and save only the original content
      if (!constants.NO_TRANSLATE) {
        translateAndSaveArticle(pageTitle, pageContent);
      }
    }
  } catch (err) {
    console.log(err);
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

  if (jsonResponse.error) {
    throw new Error(`${articleTitle} -> ${jsonResponse.error.info}`);
  }

  const pageTitle = jsonResponse.parse.title;
  const pageContent = jsonResponse.parse.wikitext['*'];

  return [pageTitle, pageContent];
}

async function saveOriginalArticle(pageTitle, pageContent) {
  await fs.mkdir(`./${constants.OUTPUT_FOLDER}/`, { recursive: true });

  if (!constants.ALLOW_FILE_OVERWRITE) {
    const files = await fs.readdir(`./${constants.OUTPUT_FOLDER}/`);

    const fileExists = files.some(file => file === `${pageTitle}-original.txt`);

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
  console.log(`File: ${pageTitle}-original.txt saved.`);
}

async function translateAndSaveArticle(pageTitle, pageContent) {
  const result = await translator.translateText(pageContent, 'de', 'en-US', {
    glossary: constants.GLOSSARY_ID,
  });

  // Save the TRANSLATED version of the page content
  await fs.writeFile(`output/${pageTitle}.txt`, result.text);
  console.log(`File: ${pageTitle}.txt saved.`);
}
