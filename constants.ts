import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import type { WikiArticle } from './types';
import { extractWikiName } from './utils.js';
dotenv.config();

const TRANSLATE_ARTICLE_START = 0; // Start translating from this article index
const TRANSLATE_ARTICLE_END = 'all'; // End translating at this index (not including). Can be 'all' to fetch all articles.

const WIKI_URL = 'https://www.shadowhelix.de/api.php'; // Url of the wiki you wish to translate. Make sure to include the /api.php part

function loadArticles(): WikiArticle[] {
  const wikiName = extractWikiName(WIKI_URL);
  const articlesPath = path.join('.', 'input', `${wikiName}-articles.json`);

  try {
    const articlesData = fs.readFileSync(articlesPath, 'utf-8');
    return JSON.parse(articlesData);
  } catch (error) {
    console.warn(`Could not load ${articlesPath}, returning empty array`);
    return [];
  }
}

function getArticlesRange(start: number, end: number | 'all'): string[] {
  const articles = loadArticles();
  const articleTitles = articles.map(article => article.title);
  return articleTitles.slice(start, end === 'all' ? undefined : end);
}

export const constants = {
  ALLOW_FILE_OVERWRITE: false, // If disabled, it will not overwrite a file that already exists when you fetch the same content more than once
  ARTICLE_TITLES: [], // A list of all the article titles you want to get the content of. For example: ['.26k', 'Dunkelzahn', 'Toxischer Geist']. Overrides ARTICLE_TITLES_RANGE
  ARTICLE_TITLES_RANGE: getArticlesRange(
    TRANSLATE_ARTICLE_START,
    TRANSLATE_ARTICLE_END
  ), // A range of articles to translate based on article index. Has no effect if a list of titles is added to ARTICLE_TITLES. Control this via `TRANSLATE_ARTICLE_START` and `TRANSLATE_ARTICLE_END`
  AUTH_KEY: process.env.AUTH_KEY, // Your DeepL API key
  GLOSSARY_ID: '150bf192-7f95-4e2d-80d9-327c8f6e55f6', // Id of the glossary to use. You have to create your own.
  OUTPUT_FOLDER: 'output', // Folder for the output. Files will be saved here. If the folder doesn't exist, it will be created by the script
  SPLIT_TRESHOLD: 50000, // Max characters per translation request. Split large articles into chunks to stay within DeepL API limits
  TRANSLATE_FROM_LANGUAGE: 'de', // Translate from this language
  TRANSLATE_TO_LANGUAGE: 'en-US', // Translate to this language
  WIKI_URL, // Url of the wiki you wish to translate. Make sure to include the /api.php part
};
