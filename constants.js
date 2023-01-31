import dotenv from 'dotenv';
dotenv.config();

export const constants = {
  ALLOW_FILE_OVERWRITE: false,
  ARTICLE_TITLES: ['.26k'],
  AUTH_KEY: process.env.AUTH_KEY,
  NO_TRANSLATE: true,
  GLOSSARY_ID: '150bf192-7f95-4e2d-80d9-327c8f6e55f6',
  INPUT_FOLDER: 'input',
  OUTPUT_FOLDER: 'output',
  WIKI_URL: 'https://www.shadowiki.de/api.php',
};
