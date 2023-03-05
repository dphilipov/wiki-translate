import * as fs from 'fs/promises';
import { constants } from './constants.js';

export async function fileExists(pageTitle) {
  const files = await fs.readdir(constants.OUTPUT_FOLDER);

  const filteredFiles = files.filter(file => file.includes(pageTitle));

  const fileExists = filteredFiles.length > 0;

  if (fileExists) {
    filteredFiles.forEach(file => {
      console.log(`File: ${file} already exists.`);
    });
    return true;
  }

  return false;
}
