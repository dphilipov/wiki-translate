import axios from 'axios';
import * as fs from 'fs/promises';
import * as deepl from 'deepl-node';
import { constants } from './constants.js';
import { fileExists, sanitizePageTitle } from './utils.js';

const translator = new deepl.Translator(constants.AUTH_KEY || '');

export async function wikiTranslate() {
  if (!constants.AUTH_KEY) {
    throw new Error(
      'AUTH_KEY is missing. Please add your DeepL API key to the .env file.'
    );
  }

  const articlesToTranslate = constants.ARTICLE_TITLES.length
    ? constants.ARTICLE_TITLES
    : constants.ARTICLE_TITLES_RANGE;

  let successCount = 0;
  let errorCount = 0;

  for (let articleTitle of articlesToTranslate) {
    try {
      let [pageTitle, pageContent] = await getArticleContent(articleTitle);

      // If the page is a redirect, fetch the content of the new page
      const redirectMatch = pageContent.match(/^#REDIRECT\s*\[\[(.*?)\]\]/i);
      if (redirectMatch) {
        const redirectPageTitle = redirectMatch[1];
        console.log(`Following redirect: ${articleTitle} -> ${redirectPageTitle}`);
        [pageTitle, pageContent] = await getArticleContent(redirectPageTitle);
      }

      pageTitle = sanitizePageTitle(pageTitle);

      await fs.mkdir(constants.OUTPUT_FOLDER, { recursive: true });

      // If ALLOW_FILE_OVERWRITE is false don't overwrite the file
      if (!constants.ALLOW_FILE_OVERWRITE) {
        if (await fileExists(pageTitle)) {
          continue;
        }
      }

      await saveOriginalArticle(pageTitle, pageContent);

      // If NO_TRANSLATE is true, skip the translation step
      if (!constants.NO_TRANSLATE) {
        const translatedPageContent = await translateArticle(pageContent);
        await saveTranslatedArticle(pageTitle, translatedPageContent);
      }

      successCount++;
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error processing article "${articleTitle}":`, message);
    }
  }

  console.log(
    `\nTranslation complete: ${successCount} succeeded, ${errorCount} failed`
  );
}

async function getArticleContent(articleTitle: string): Promise<[string, string]> {
  const params = {
    action: 'parse',
    prop: 'wikitext',
    format: 'json',
    page: articleTitle,
  };

  const response = await axios.get(constants.WIKI_URL, { params });
  const jsonResponse = response.data;

  if (jsonResponse.error) {
    throw new Error(`${articleTitle} -> ${jsonResponse.error.info}`);
  }

  const pageTitle = jsonResponse.parse.title;
  const pageContent = jsonResponse.parse.wikitext['*'];

  return [pageTitle, pageContent];
}

async function saveOriginalArticle(pageTitle: string, pageContent: string): Promise<void> {
  const fileName = `${pageTitle}[ORIGINAL].txt`;
  console.log(`${constants.OUTPUT_FOLDER}/${fileName}`);

  // Save the ORIGINAL version of the page content
  await fs.writeFile(`${constants.OUTPUT_FOLDER}/${fileName}`, pageContent);

  console.log(`File: ${fileName} saved`);
}

async function translateArticle(pageContent: string): Promise<deepl.TextResult> {
  if (pageContent.length > constants.SPLIT_TRESHOLD) {
    let translatedContent = '';

    for (let i = 0; i <= pageContent.length; i += constants.SPLIT_TRESHOLD) {
      const pageContentChunk = pageContent.slice(
        i,
        i + constants.SPLIT_TRESHOLD
      );

      try {
        const result = await translator.translateText(
          pageContentChunk,
          constants.TRANSLATE_FROM_LANGUAGE as deepl.SourceLanguageCode,
          constants.TRANSLATE_TO_LANGUAGE as deepl.TargetLanguageCode,
          {
            glossary: constants.GLOSSARY_ID,
          }
        );
        const text = Array.isArray(result) ? result[0].text : result.text;
        translatedContent += text;
      } catch (e) {
        console.log(e);
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Translation failed at chunk ${i}: ${message}`);
      }
    }

    return { text: translatedContent } as deepl.TextResult;
  }

  const result = await translator.translateText(
    pageContent,
    constants.TRANSLATE_FROM_LANGUAGE as deepl.SourceLanguageCode,
    constants.TRANSLATE_TO_LANGUAGE as deepl.TargetLanguageCode,
    {
      glossary: constants.GLOSSARY_ID,
    }
  );

  return Array.isArray(result) ? result[0] : result;
}

async function saveTranslatedArticle(pageTitle: string, pageContent: deepl.TextResult): Promise<void> {
  const fileName = `${pageTitle}.txt`;

  // Save the TRANSLATED version of the page content
  await fs.writeFile(`${constants.OUTPUT_FOLDER}/${fileName}`, pageContent.text);
  console.log(`File: ${fileName} saved.`);
}
