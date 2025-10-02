import { wikiTranslate } from './wikiTranslate.js';
import { getArticles } from './input/getArticles.js';
import { createGlossary } from './glossary/createGlossary.js';

const cliArguments = process.argv.slice(2);

const commandsList: Record<string, () => Promise<void>> = {
  'wiki-translate': () => wikiTranslate(),
  'get-articles': () => getArticles(),
  'create-glossary': () => createGlossary(),
};

if (cliArguments.length) {
  const command = cliArguments[0];
  if (!Object.keys(commandsList).includes(command)) {
    console.log(
      `ERROR: Invalid command! Use one of: ${Object.keys(commandsList).join(' | ')}`
    );
    process.exit();
  }

  commandsList[command]();
} else {
  console.log(
    `ERROR: Please input a command: ${Object.keys(commandsList).join(' | ')}`
  );
}
