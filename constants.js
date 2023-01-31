import dotenv from 'dotenv';
dotenv.config();

export const constants = {
  ALLOW_FILE_OVERWRITE: false, // If disabled, it will not overwrite a file that already exists if you try to fetch the same content more than once
  ARTICLE_TITLES: ['.26k'], // A list of all the article titles you want to get the content of
  AUTH_KEY: process.env.AUTH_KEY, // Your DeepL API key
  NO_TRANSLATE: true, // If enabled, skips the step where it translates and saves the article content. It will only get and save the original untranslated version of the article
  GLOSSARY_ID: '150bf192-7f95-4e2d-80d9-327c8f6e55f6', // Id of the glossary to use
  INPUT_FOLDER: 'input', // Folder for the input
  OUTPUT_FOLDER: 'output', // Folder for the output. Files will be saved here
  WIKI_URL: 'https://www.shadowiki.de/api.php', // Url of the wiki you wish to translate. Make sure to include the /api.php part
};
