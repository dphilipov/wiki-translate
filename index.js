import { wikiTranslate } from './wikiTranslate.js';
import { getArticles } from './input/getArticles.js';
import { createGlossary } from './glossary/createGlossary.js';

const cliArguments = process.argv.slice(2);

const commands = {
  'wiki-translate': () => wikiTranslate(),
  'get-articles': () => getArticles(),
  'create-glossary': () => createGlossary(),
};

if (cliArguments.length) {
  if (!Object.keys(commands).includes(cliArguments[0])) {
    console.log(
      `ERROR: Invalid command! Use one of: ${Object.keys(commands).join(' | ')}`
    );
    process.exit();
  }

  commands[cliArguments[0]]();
} else {
  console.log(
    `ERROR: Please input a command: ${Object.keys(commands).join(' | ')}`
  );
}
