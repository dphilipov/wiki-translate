import * as fs from 'fs/promises';
import filenamify from 'filenamify';
import { constants } from './constants.js';

export async function fileExists(pageTitle: string): Promise<boolean> {
  try {
    const files = await fs.readdir(constants.OUTPUT_FOLDER);

    const originalFileName = `${pageTitle}[ORIGINAL].txt`;
    const translatedFileName = `${pageTitle}.txt`;

    const existingFiles = files.filter(
      file => file === originalFileName || file === translatedFileName
    );

    if (existingFiles.length > 0) {
      existingFiles.forEach(file => {
        console.log(`File: ${file} already exists.`);
      });
      return true;
    }

    return false;
  } catch (err) {
    // If output folder doesn't exist yet, no files exist
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

export function sanitizePageTitle(pageTitle: string): string {
  // Wrap the title in quotes in order to prevent dot files being hidden on Unix systems
  if (pageTitle[0] === '.') {
    pageTitle = `"${pageTitle}"`;
  }

  return filenamify(pageTitle);
}
