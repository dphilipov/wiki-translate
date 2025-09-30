import * as fs from 'fs/promises';
import filenamify from 'filenamify';
import { constants } from './constants.js';

export async function fileExists(pageTitle) {
  const files = await fs.readdir(constants.OUTPUT_FOLDER);

  const filteredFiles = files.filter(file => file === pageTitle);

  const fileExists = filteredFiles.length > 0;

  if (fileExists) {
    filteredFiles.forEach(file => {
      console.log(`File: ${file} already exists.`);
    });
    return true;
  }

  return false;
}

export function sanitizePageTitle(pageTitle) {
  // Wrap the title in quotes in order to prevent dot files being hidden on Unix systems
  if (pageTitle[0] === '.') {
    pageTitle = `"${pageTitle}"`;
  }

  return filenamify(pageTitle);
}
