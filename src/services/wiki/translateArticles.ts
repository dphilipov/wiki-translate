import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as deepl from 'deepl-node';
import { constants } from '../../lib/constants';
import { fileExists, sanitizePageTitle, validateConfig } from '../../lib/utils';
import type { MediaWikiParseResponse } from '../../types';
import { logger } from '../../lib/logger';

let translator: deepl.DeepLClient;

export async function wikiTranslate(options: { dryRun?: boolean } = {}) {
  const { dryRun = false } = options;

  validateConfig();
  translator = new deepl.DeepLClient(constants.AUTH_KEY!);

  const articlesToTranslate = constants.ARTICLE_TITLES.length
    ? constants.ARTICLE_TITLES
    : constants.ARTICLE_TITLES_RANGE;

  let successCount = 0;
  let errorCount = 0;

  for (let articleTitle of articlesToTranslate) {
    try {
      let [pageTitle, pageContent] = await getArticleContent(articleTitle);

      pageTitle = sanitizePageTitle(pageTitle);

      await fs.mkdir(constants.OUTPUT_FOLDER, { recursive: true });

      // If ALLOW_FILE_OVERWRITE is false don't overwrite the file
      if (!constants.ALLOW_FILE_OVERWRITE) {
        if (await fileExists(pageTitle)) {
          continue;
        }
      }

      await saveOriginalArticle(pageTitle, pageContent);

      // If dry-run mode is enabled, skip the translation step
      if (!dryRun) {
        const translatedPageContent = await translateArticle(pageContent);
        await saveTranslatedArticle(pageTitle, translatedPageContent);
      }

      successCount++;
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Error processing article "${articleTitle}":`, message);
    }
  }

  logger.info(
    `\nTranslation complete: ${successCount} succeeded, ${errorCount} failed`
  );
}

async function getArticleContent(
  articleTitle: string
): Promise<[string, string]> {
  const params = {
    action: 'parse',
    prop: 'wikitext',
    format: 'json',
    page: articleTitle,
    redirects: '1',
  };

  const response = await axios.get<MediaWikiParseResponse>(constants.WIKI_URL, { params });
  const jsonResponse = response.data;

  if (jsonResponse.error) {
    throw new Error(`${articleTitle} -> ${jsonResponse.error.info}`);
  }

  const pageTitle = jsonResponse.parse.title;
  const pageContent = jsonResponse.parse.wikitext['*'];

  return [pageTitle, pageContent];
}

async function saveOriginalArticle(
  pageTitle: string,
  pageContent: string
): Promise<void> {
  const fileName = `${pageTitle}[ORIGINAL].txt`;
  const filePath = path.join(constants.OUTPUT_FOLDER, fileName);
  logger.info(filePath);

  // Save the ORIGINAL version of the page content
  await fs.writeFile(filePath, pageContent);

  logger.info(`File: ${fileName} saved`);
}

async function callDeepLAPI(text: string): Promise<string> {
  const result = await translator.translateText(
    text,
    constants.TRANSLATE_FROM_LANGUAGE as deepl.SourceLanguageCode,
    constants.TRANSLATE_TO_LANGUAGE as deepl.TargetLanguageCode,
    {
      glossary: constants.GLOSSARY_ID,
    }
  );

  return Array.isArray(result) ? result[0].text : result.text;
}

async function translateArticle(
  pageContent: string
): Promise<deepl.TextResult> {
  if (pageContent.length > constants.SPLIT_TRESHOLD) {
    let translatedContent = '';

    for (let i = 0; i <= pageContent.length; i += constants.SPLIT_TRESHOLD) {
      const pageContentChunk = pageContent.slice(
        i,
        i + constants.SPLIT_TRESHOLD
      );

      try {
        const text = await callDeepLAPI(pageContentChunk);
        translatedContent += text;
      } catch (e) {
        logger.error('Translation chunk error:', e);
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Translation failed at chunk ${i}: ${message}`);
      }
    }

    return { text: translatedContent } as deepl.TextResult;
  }

  const text = await callDeepLAPI(pageContent);
  return { text } as deepl.TextResult;
}

async function saveTranslatedArticle(
  pageTitle: string,
  pageContent: deepl.TextResult
): Promise<void> {
  const fileName = `${pageTitle}.txt`;
  const filePath = path.join(constants.OUTPUT_FOLDER, fileName);

  // Save the TRANSLATED version of the page content
  await fs.writeFile(filePath, pageContent.text);
  logger.info(`File: ${fileName} saved.`);
}
