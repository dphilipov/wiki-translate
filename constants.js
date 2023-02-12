import articles from './input/articles.json' assert { type: 'json' };
import dotenv from 'dotenv';
dotenv.config();

const TRANSLATE_ARTICLE_START = 0; // Start translating from this article index
const TRANSLATE_ARTICLE_END = 10; // End translating at this index (not including). Can be 'all' to fetch all articles.

export const constants = {
  ALLOW_FILE_OVERWRITE: false, // If disabled, it will not overwrite a file that already exists when you fetch the same content more than once
  ARTICLE_TITLES: [], // A list of all the article titles you want to get the content of. For example: ['.26k', 'Dunkelzahn', 'Toxischer Geist']. Overrides ARTICLE_TITLES_RANGE
  ARTICLE_TITLES_RANGE: getArticlesRange(
    TRANSLATE_ARTICLE_START,
    TRANSLATE_ARTICLE_END
  ), // A range of articles to translate based on article index. Has no effect if a list of titles is added to ARTICLE_TITLES
  AUTH_KEY: process.env.AUTH_KEY, // Your DeepL API key
  NO_TRANSLATE: true, // If enabled, skips the step where it translates and saves the article content. It will only get and save the original untranslated version of the article. Use this if you only want to do a test run without wasting your DeepL usage.
  GLOSSARY_ID: '150bf192-7f95-4e2d-80d9-327c8f6e55f6', // Id of the glossary to use
  OUTPUT_FOLDER: 'test', // Folder for the output. Files will be saved here. If the folder doesn't exist, it will be created by the script
  WIKI_URL: 'https://www.shadowiki.de/api.php', // Url of the wiki you wish to translate. Make sure to include the /api.php part
};

function getArticlesRange(start, end) {
  const articleTitles = articles.map(article => article.title);

  return articleTitles.slice(start, end === 'all' ? undefined : end);
}
