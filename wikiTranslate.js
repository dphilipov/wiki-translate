import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as deepl from 'deepl-node';
import { constants } from './constants.js';
import { fileExists, sanitizePageTitle } from './utils.js';

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

      pageTitle = sanitizePageTitle(pageTitle);

      await fs.mkdir(constants.OUTPUT_FOLDER, { recursive: true });

      // If ALLOW_FILE_OVERWRITE is false don't overwrite the file
      if (!constants.ALLOW_FILE_OVERWRITE) {
        if (await fileExists(pageTitle)) {
          return;
        }
      }

      saveOriginalArticle(pageTitle, pageContent);

      // If NO_TRANSLATE is true, skip the translation step
      if (!constants.NO_TRANSLATE) {
        const translatedPageContent = await translateArticle(pageContent);
        saveTranslatedArticle(pageTitle, translatedPageContent);
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
  const fileName = `${pageTitle}[ORIGINAL].txt`;
  console.log(`${constants.OUTPUT_FOLDER}${fileName}`);

  // Save the ORIGINAL version of the page content
  await fs.writeFile(`${constants.OUTPUT_FOLDER}${fileName}`, pageContent);

  console.log(`File: ${fileName} saved`);
}

async function translateArticle(pageContent) {
  const result = await translator.translateText(
    pageContent,
    constants.TRANSLATE_FROM_LANGUAGE,
    constants.TRANSLATE_TO_LANGUAGE,
    {
      glossary: constants.GLOSSARY_ID,
    }
  );

  return result;
}

async function saveTranslatedArticle(pageTitle, pageContent) {
  const fileName = `${pageTitle}.txt`;

  // Save the TRANSLATED version of the page content
  await fs.writeFile(
    `${constants.OUTPUT_FOLDER}${fileName}.txt`,
    pageContent.text
  );
  console.log(`File: ${fileName} saved.`);
}
